import React, { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

/* ───────── sound / vibration (global, always available) ───────── */
let audioCtx: AudioContext | null = null;
let audioReady = false;

// Init audio on first user gesture (click, keypress, etc.)
export function initAudio() {
  if (audioReady) return;
  try {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    audioReady = true;
  } catch {}
}
if (typeof document !== 'undefined') {
  const handler = () => { initAudio(); document.removeEventListener('click', handler); document.removeEventListener('keydown', handler); };
  document.addEventListener('click', handler);
  document.addEventListener('keydown', handler);
}

async function ensureAudio() {
  if (!audioCtx) return null;
  if (audioCtx.state === 'suspended') {
    try { await audioCtx.resume(); } catch { return null; }
  }
  return audioCtx;
}

function beep(freq = 660, duration = 140, vol = 0.18) {
  if (!audioCtx) { try { audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)(); audioReady = true; } catch {} }
  if (!audioCtx) return;
  ensureAudio().then(ctx => {
    if (!ctx) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.frequency.value = freq; osc.type = 'sine';
      gain.gain.setValueAtTime(vol, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration / 1000);
      osc.start(); osc.stop(ctx.currentTime + duration / 1000);
    } catch {}
  });
}

export function playMsgSound() {
  beep(880, 100, 0.12);
  setTimeout(() => beep(1100, 160, 0.14), 120);
}

export function playBizzSound() {
  beep(520, 200, 0.18);
  setTimeout(() => beep(660, 220, 0.20), 220);
  setTimeout(() => beep(780, 260, 0.22), 460);
  setTimeout(() => beep(880, 300, 0.24), 740);
}

export function vibrate(ms = 120) { try { navigator.vibrate?.(ms); } catch {} }

interface ChatUser {
  id: number;
  fullName: string;
  username: string;
  role: string;
  lastSeenAt?: string;
}

interface MessageSender {
  id: number;
  fullName: string;
}

interface MessageStatus {
  id: number;
  messageId: number;
  userId: number;
  fullName?: string;
  status: 'SENT' | 'DELIVERED' | 'READ';
  readAt: string | null;
}

interface Message {
  id: number;
  conversationId: number;
  senderId: number;
  content: string | null;
  imageUrl: string | null;
  createdAt: string;
  sender: MessageSender;
  statuses?: MessageStatus[];
}

interface ConversationParticipant {
  id: number;
  conversationId: number;
  userId: number;
  lastReadAt: string | null;
  user: ChatUser;
}

interface Conversation {
  id: number;
  type: 'PRIVATE' | 'GROUP';
  name: string | null;
  participants: ConversationParticipant[];
  lastMessage: Message | null;
  unread: number;
  updatedAt: string;
}

interface ChatContextType {
  socket: Socket | null;
  conversations: Conversation[];
  onlineUsers: Set<number>;
  lastSeenMap: Map<number, string>;
  typingUsers: Map<number, { userId: number; fullName: string }[]>;
  connected: boolean;
  open: boolean;
  setOpen: (v: boolean) => void;
  activeConv: number | null;
  setActiveConv: (id: number | null) => void;
  messages: Message[];
  loadMessages: (convId: number, page?: number) => Promise<void>;
  sendMessage: (convId: number, content: string) => void;
  deleteMessage: (convId: number, msgId: number) => void;
  startConversation: (userId: number) => Promise<any>;
  createGroup: (name: string, userIds: number[]) => Promise<any>;
  updateGroup: (convId: number, name: string) => Promise<any>;
  deleteGroup: (convId: number) => Promise<any>;
  availableUsers: ChatUser[];
  loadAvailableUsers: () => Promise<void>;
  hasMoreMessages: boolean;
  unreadTotal: number;
  unreadPeople: number; // unique conversations with unread messages
  bizzAlert: number; // count of unread bizz notifications (global badge)
  bizzFromName: string;
  bizzLimitMsg: string;
  resetBizzAlert: () => void;
  pendingShareStudent: any;
  setPendingShareStudent: (s: any) => void;
  bizzTimerRef: React.MutableRefObject<any>;
}

const ChatContext = createContext<ChatContextType>(null!);

let tempIdCounter = 0;

export const ChatProvider = ({ children }: { children: ReactNode }) => {
  const { user, token, centerName } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [open, setOpen] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<Set<number>>(new Set());
  const [lastSeenMap, setLastSeenMap] = useState<Map<number, string>>(new Map());
  const [typingUsers, setTypingUsers] = useState<Map<number, { userId: number; fullName: string }[]>>(new Map());
  const [activeConv, setActiveConv] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [hasMoreMessages, setHasMoreMessages] = useState(false);
  const [availableUsers, setAvailableUsers] = useState<ChatUser[]>([]);
  const [bizzAlert, setBizzAlert] = useState(0);
  const [bizzFromName, setBizzFromName] = useState('');
  const [bizzLimitMsg, setBizzLimitMsg] = useState('');
  const bizzTimerRef = useRef<any>(null);
  const bizzLimitTimerRef = useRef<any>(null);
  const convJoinedRef = useRef<Set<number>>(new Set());
  const activeConvRef = useRef<number | null>(null);
  const messagesPageRef = useRef(1);
  const [pendingShareStudent, setPendingShareStudent] = useState<any>(null);
  const resetBizzAlert = useCallback(() => setBizzAlert(0), []);
  const api = useCallback(async (path: string, options?: RequestInit) => {
    const token = localStorage.getItem('ems_token');
    const res = await fetch(`${API_BASE}/api${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...options?.headers,
      },
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  }, []);

  // Mark conversation as read in DB when opening it
  useEffect(() => {
    if (activeConv) {
      setConversations(prev => prev.map(c => c.id === activeConv ? { ...c, unread: 0 } : c));
      api(`/chat/conversations/${activeConv}/read`, { method: 'POST' }).catch(() => {});
    }
  }, [activeConv, api]);

  // Keep refs in sync for socket handlers
  useEffect(() => { activeConvRef.current = activeConv; }, [activeConv]);
  const userRef = useRef(user);
  userRef.current = user;
  const conversationsRef = useRef(conversations);
  conversationsRef.current = conversations;

  // Connect socket
  useEffect(() => {
    if (!user || !token) return;
    const s = io(API_BASE, {
      auth: { token },
    });
    s.on('connect', () => {
      setConnected(true);
      if (user) setOnlineUsers(prev => new Set(prev).add(user.id));
    });
    s.on('disconnect', () => setConnected(false));

    s.on('user:online', (data: { userId: number; online: boolean; lastSeen?: string }) => {
      setOnlineUsers(prev => {
        const next = new Set(prev);
        if (data.online) next.add(data.userId);
        else next.delete(data.userId);
        return next;
      });
      // always update lastSeenMap whether online or offline
      if (data.lastSeen) {
        setLastSeenMap(prev => new Map(prev).set(data.userId, data.lastSeen!));
      }
    });

    s.on('online:status-all', (allStatus: { userId: number; online: boolean; lastSeen?: string }[]) => {
      setOnlineUsers(prev => {
        const next = new Set(prev);
        for (const st of allStatus) {
          if (st.online) next.add(st.userId);
          else next.delete(st.userId);
        }
        return next;
      });
      const lastSeen = new Map<number, string>();
      for (const st of allStatus) { if (st.lastSeen) lastSeen.set(st.userId, st.lastSeen); }
      if (lastSeen.size > 0) setLastSeenMap(prev => new Map([...prev, ...lastSeen]));
    });

    s.on('message:new', (msg: Message & { _clientId?: number }) => {
      setConversations(prev => {
        const idx = prev.findIndex(c => c.id === msg.conversationId);
        if (idx === -1) return prev;
        const next = [...prev];
        const isViewing = activeConvRef.current === msg.conversationId;
        const isOwn = msg.senderId === userRef.current?.id;
        next[idx] = {
          ...next[idx],
          lastMessage: msg,
          updatedAt: msg.createdAt,
          unread: isViewing || isOwn ? next[idx].unread : next[idx].unread + 1,
        };
        next.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
        return next;
      });

      if (msg.senderId !== userRef.current?.id) {
        s.emit('message:delivered', { messageId: msg.id, conversationId: msg.conversationId });
        if (activeConvRef.current === msg.conversationId) {
          s.emit('message:read', { conversationId: msg.conversationId, messageIds: [msg.id] });
        }
        // Notifications only when NOT viewing this conversation
        if (activeConvRef.current !== msg.conversationId) {
          playMsgSound();
          vibrate(60);
          // Browser notification (only when tab is hidden)
          if ('Notification' in window && Notification.permission === 'granted' && document.hidden) {
            const convs = conversationsRef.current;
            const conv = convs.find(c => c.id === msg.conversationId);
            const sender = msg.sender?.fullName || 'رسالة جديدة';
            const convName = conv?.type === 'GROUP' ? (conv.name || 'المجموعة') : sender;
            const body = conv?.type === 'GROUP' ? `${sender}: ${msg.content || '🖼'}` : (msg.content || '🖼');
            try { new Notification(convName, { body, icon: '/favicon.ico' }); } catch {}
          }
        }
      }

      if (activeConvRef.current === msg.conversationId) {
        setMessages(prev => {
          if (prev.some(m => m.id === msg.id)) return prev;
          const filtered = prev.filter(m => !(m.id < 0 && m.conversationId === msg.conversationId));
          return [...filtered, msg];
        });
      }
    });

    s.on('message:delivered-receipt', (data: { messageId: number; conversationId: number; userId: number }) => {
      if (activeConvRef.current !== data.conversationId) return;
      setMessages(prev => prev.map(m => {
        if (m.id !== data.messageId) return m;
        const existing = m.statuses || [];
        if (existing.some(s => s.userId === data.userId)) return m;
        return {
          ...m,
          statuses: [...existing, { id: 0, messageId: m.id, userId: data.userId, status: 'DELIVERED' as const, readAt: null }],
        };
      }));
    });

    s.on('message:read-receipt', (data: { conversationId: number; userId: number; fullName?: string; messageIds: number[] }) => {
      if (activeConvRef.current !== data.conversationId) return;
      setMessages(prev => prev.map(m => {
        if (!data.messageIds.includes(m.id)) return m;
        const existing = m.statuses || [];
        if (existing.some(s => s.userId === data.userId && s.status === 'READ')) return m;
        return {
          ...m,
          statuses: [...existing, { id: 0, messageId: m.id, userId: data.userId, fullName: data.fullName, status: 'READ' as const, readAt: new Date().toISOString() }],
        };
      }));
    });

    s.on('typing:update', (data: { conversationId: number; userId: number; fullName: string; typing: boolean }) => {
      setTypingUsers(prev => {
        const next = new Map(prev);
        const arr = (next.get(data.conversationId) || []).filter(t => t.userId !== data.userId);
        if (data.typing) arr.push({ userId: data.userId, fullName: data.fullName });
        next.set(data.conversationId, arr);
        return next;
      });
    });

    s.on('conversation:created', () => {
      loadConversations();
    });

    s.on('message:deleted', (data: { messageId: number; conversationId: number }) => {
      if (activeConvRef.current !== data.conversationId) return;
      setMessages(prev => prev.map(m =>
        m.id === data.messageId ? { ...m, content: null, imageUrl: null } : m
      ));
    });

    s.on('conversation:updated', (data: { conversationId: number; name: string }) => {
      setConversations(prev => prev.map(c =>
        c.id === data.conversationId ? { ...c, name: data.name } : c
      ));
    });

    s.on('conversation:deleted', (data: { conversationId: number }) => {
      setConversations(prev => prev.filter(c => c.id !== data.conversationId));
      if (activeConvRef.current === data.conversationId) setActiveConv(null);
    });

    // ── Bizz / nudge ──
    const bizzSoundTimeoutRef = { current: 0 };

    s.on('bizz:received', (data: { conversationId: number; fromUserId: number; fromFullName: string }) => {
      playBizzSound();
      vibrate(300);
      setBizzAlert(prev => prev + 1);
      setBizzFromName(data.fromFullName);
      clearTimeout(bizzTimerRef.current);
      bizzTimerRef.current = setTimeout(() => setBizzFromName(''), 3000);
      setOpen(true);
      // Browser notification (always when hidden)
      if ('Notification' in window && Notification.permission === 'granted' && document.hidden) {
        try { new Notification(`🔔 ${data.fromFullName} نكزك`, { body: 'اضغط لفتح المحادثة', icon: '/favicon.ico' }); } catch {}
      }
    });

    s.on('bizz:limit', (data: { message: string }) => {
      setBizzLimitMsg(data.message);
      clearTimeout(bizzTimerRef.current);
      bizzTimerRef.current = setTimeout(() => setBizzLimitMsg(''), 3500);
    });

    setSocket(s);
    return () => { s.close(); };
  }, [user?.id, token]);

  // Load conversations
  const loadConversations = useCallback(async () => {
    try {
      const data = await api('/chat/conversations');
      // Populate lastSeenMap from participant data
      const ls = new Map<number, string>();
      for (const c of data) {
        for (const p of (c.participants || [])) {
          if (p.user?.lastSeenAt) ls.set(p.user.id, p.user.lastSeenAt);
        }
      }
      if (ls.size > 0) setLastSeenMap(prev => new Map([...prev, ...ls]));
      setConversations(data);
    } catch {}
  }, [api]);

  useEffect(() => {
    if (user && connected) loadConversations();
  }, [user, connected, loadConversations]);

  // Joining conversation rooms
  useEffect(() => {
    if (!socket || !connected) return;
    for (const c of conversations) {
      if (!convJoinedRef.current.has(c.id)) {
        convJoinedRef.current.add(c.id);
        socket.emit('conversation:join', c.id);
      }
    }
  }, [socket, connected, conversations]);

  // Load messages
  const loadMessages = useCallback(async (convId: number, page = 1) => {
    try {
      const data = await api(`/chat/conversations/${convId}/messages?page=${page}`);
      const mapped = data.messages.map((m: any) => ({
        ...m,
        statuses: (m.statuses || []).map((s: any) => ({
          id: s.id,
          messageId: s.messageId,
          userId: s.userId,
          fullName: s.fullName || s.user?.fullName,
          status: s.status,
          readAt: s.readAt,
        })),
      }));
      if (page === 1) {
        setMessages(mapped);
      } else {
        setMessages((prev: any) => [...mapped, ...prev]);
      }
      messagesPageRef.current = page;
      setHasMoreMessages(data.hasMore);
    } catch {}
  }, [api]);

  // Send message with optimistic update
  const sendMessage = useCallback((convId: number, content: string) => {
    if (!socket || !connected || !user) return;

    const tempId = --tempIdCounter;

    const optimistic: Message = {
      id: tempId,
      conversationId: convId,
      senderId: user.id,
      content,
      imageUrl: null,
      createdAt: new Date().toISOString(),
      sender: { id: user.id, fullName: user.fullName },
      statuses: [{ id: 0, messageId: tempId, userId: user.id, status: 'SENT' as const, readAt: null }],
    };

    setMessages(prev => [...prev, optimistic]);

    setConversations(prev => {
      const idx = prev.findIndex(c => c.id === convId);
      if (idx === -1) return prev;
      const next = [...prev];
      next[idx] = { ...next[idx], lastMessage: optimistic, updatedAt: optimistic.createdAt };
      next.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      return next;
    });

    socket.emit('message:send', { conversationId: convId, content, clientId: tempId });
    socket.emit('typing:stop', { conversationId: convId });
  }, [socket, connected, user]);

  // Delete message (sender only)
  const deleteMessage = useCallback((convId: number, msgId: number) => {
    if (!socket || !connected) return;
    socket.emit('message:delete', { messageId: msgId, conversationId: convId });
    setMessages(prev => prev.map(m =>
      m.id === msgId ? { ...m, content: null, imageUrl: null } : m
    ));
  }, [socket, connected]);

  // Start private conversation
  const startConversation = useCallback(async (targetUserId: number) => {
    const data = await api('/chat/conversations', {
      method: 'POST',
      body: JSON.stringify({ type: 'PRIVATE', participantIds: [targetUserId] }),
    });
    loadConversations();
    if (socket && connected) {
      socket.emit('conversation:join', data.conversation.id);
      convJoinedRef.current.add(data.conversation.id);
    }
    setActiveConv(data.conversation.id);
    loadMessages(data.conversation.id);
    setOpen(true);
    return data;
  }, [api, loadConversations, socket, connected, loadMessages]);

  // Create group (admin only)
  const createGroup = useCallback(async (name: string, userIds: number[]) => {
    const data = await api('/chat/conversations', {
      method: 'POST',
      body: JSON.stringify({ type: 'GROUP', name, participantIds: userIds }),
    });
    loadConversations();
    if (socket && connected) {
      socket.emit('conversation:join', data.conversation.id);
      convJoinedRef.current.add(data.conversation.id);
    }
    setActiveConv(data.conversation.id);
    loadMessages(data.conversation.id);
    return data;
  }, [api, loadConversations, socket, connected, loadMessages]);

  // Update group name (admin)
  const updateGroup = useCallback(async (convId: number, name: string) => {
    const data = await api(`/chat/conversations/${convId}`, {
      method: 'PUT',
      body: JSON.stringify({ name }),
    });
    setConversations(prev => prev.map(c => c.id === convId ? { ...c, name } : c));
    return data;
  }, [api]);

  // Delete group (admin)
  const deleteGroup = useCallback(async (convId: number) => {
    await api(`/chat/conversations/${convId}`, { method: 'DELETE' });
    setConversations(prev => prev.filter(c => c.id !== convId));
    if (activeConv === convId) setActiveConv(null);
    setOpen(false);
  }, [api, activeConv]);

  // Load available users
  const loadAvailableUsers = useCallback(async () => {
    try {
      const data = await api('/chat/users');
      setAvailableUsers(data);
    } catch {}
  }, [api]);

  // Unread totals
  const unreadTotal = conversations.reduce((sum, c) => sum + c.unread, 0);
  const unreadPeople = conversations.reduce((sum, c) => sum + (c.unread > 0 ? 1 : 0), 0);

  // Browser notification + title badge
  // Request notification permission + init audio when user first opens chat
  const notifiedRef = useRef(false);
  useEffect(() => {
    if (open && !notifiedRef.current) {
      notifiedRef.current = true;
      initAudio();
      if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission().catch(() => {});
      }
    }
  }, [open]);

  useEffect(() => {
    const baseTitle = centerNameRef.current || 'المركز';
    if (unreadTotal > 0) {
      document.title = `(${unreadTotal}) ${baseTitle}`;
    } else {
      const pageName = document.title.replace(/^\(\d+\) /, '');
      if (!document.title.startsWith('(')) return;
      document.title = pageName;
    }
  }, [unreadTotal]);

  // Keep ref in sync for title
  const centerNameRef = useRef(centerName);
  centerNameRef.current = centerName;

  return (
    <ChatContext.Provider value={{
      socket, conversations, onlineUsers, lastSeenMap, typingUsers, connected,
      open, setOpen, activeConv, setActiveConv,
      messages, loadMessages, sendMessage, deleteMessage,
      startConversation, createGroup, updateGroup, deleteGroup,
      availableUsers, loadAvailableUsers,
      hasMoreMessages, unreadTotal, unreadPeople, bizzAlert, bizzFromName,
      bizzLimitMsg, bizzTimerRef, resetBizzAlert,
      pendingShareStudent, setPendingShareStudent,
    }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => useContext(ChatContext);
