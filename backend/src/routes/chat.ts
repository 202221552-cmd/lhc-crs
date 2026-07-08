import express from 'express';
import { prisma } from '../index';
import { io } from '../index';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();

// List users available for chat (exclude STUDENT, INSTRUCTOR)
router.get('/users', authMiddleware, async (req, res) => {
  try {
    const me = (req as any).user;
    const users = await prisma.user.findMany({
      where: {
        status: 'ACTIVE',
        id: { not: me.id },
        role: { notIn: ['STUDENT', 'INSTRUCTOR'] },
      },
      select: {
        id: true,
        fullName: true,
        username: true,
        role: true,
        profileImage: true,
        aboutStatus: true,
      },
      orderBy: { fullName: 'asc' },
    });
    res.json(users);
  } catch (e) {
    console.error('chat/users error', e);
    res.status(500).json({ error: 'خطأ في تحميل المستخدمين' });
  }
});

// List my conversations (with last message + unread count)
router.get('/conversations', authMiddleware, async (req, res) => {
  try {
    const me = (req as any).user;
    const participants = await prisma.conversationParticipant.findMany({
      where: { userId: me.id },
      include: {
        conversation: {
          include: {
            participants: {
              include: { user: { select: { id: true, fullName: true, username: true, role: true, lastSeenAt: true, profileImage: true, aboutStatus: true } } },
            },
            messages: {
              orderBy: { createdAt: 'desc' },
              take: 1,
              include: {
                sender: { select: { id: true, fullName: true } },
                statuses: { where: { userId: me.id } },
              },
            },
          },
        },
      },
      orderBy: { conversation: { updatedAt: 'desc' } },
    });

    const result = await Promise.all(participants.map(async p => {
      const conv = p.conversation;
      const lastMsg = conv.messages[0] || null;
      // Count unread messages (by others, without READ status from me)
      const unreadCount = await prisma.message.count({
        where: {
          conversationId: conv.id,
          senderId: { not: me.id },
          statuses: { none: { userId: me.id, status: 'READ' } },
        },
      });
      return {
        id: conv.id,
        type: conv.type,
        name: conv.name,
        participants: conv.participants,
        lastMessage: lastMsg,
        unread: unreadCount,
        updatedAt: conv.updatedAt,
      };
    }));

    res.json(result);
  } catch (e) {
    console.error('chat/conversations error', e);
    res.status(500).json({ error: 'خطأ في تحميل المحادثات' });
  }
});

// Create conversation (PRIVATE or GROUP)
router.post('/conversations', authMiddleware, async (req, res) => {
  try {
    const me = (req as any).user;
    const { type, name, participantIds } = req.body;

    if (!participantIds || !Array.isArray(participantIds) || participantIds.length === 0) {
      return res.status(400).json({ error: 'يجب اختيار مشاركين على الأقل' });
    }

    if (type === 'GROUP') {
      if (me.role !== 'ADMIN') {
        return res.status(403).json({ error: 'فقط المشرف يمكنه إنشاء مجموعات' });
      }
    }

    if (type === 'PRIVATE') {
      const existing = await prisma.conversation.findFirst({
        where: {
          type: 'PRIVATE',
          AND: [
            { participants: { some: { userId: me.id } } },
            { participants: { some: { userId: participantIds[0] } } },
          ],
        },
        include: { participants: true },
      });
      if (existing) {
        return res.json({ conversation: existing, existing: true });
      }
    }

    const allIds = [me.id, ...participantIds];
    const conv = await prisma.conversation.create({
      data: {
        type: type || 'PRIVATE',
        name: name || null,
        createdById: me.id,
        participants: {
          create: allIds.map((userId: number) => ({ userId })),
        },
      },
      include: {
        participants: {
          include: { user: { select: { id: true, fullName: true, username: true, role: true, profileImage: true, aboutStatus: true } } },
        },
      },
    });

    // Notify other participants about new conversation via socket
    if (type === 'GROUP') {
      for (const pid of participantIds) {
        io.to(`user:${pid}`).emit('conversation:created', { conversationId: conv.id });
      }
    }

    res.json({ conversation: conv });
  } catch (e) {
    console.error('chat/conversations create error', e);
    res.status(500).json({ error: 'خطأ في إنشاء المحادثة' });
  }
});

// Get messages for a conversation (paginated)
router.get('/conversations/:id/messages', authMiddleware, async (req, res) => {
  try {
    const me = (req as any).user;
    const convId = parseInt(String(req.params.id));
    const page = parseInt(req.query.page as string) || 1;
    const limit = 50;
    const skip = (page - 1) * limit;

    const msgs = await prisma.message.findMany({
      where: { conversationId: convId },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      include: {
        sender: { select: { id: true, fullName: true } },
        statuses: {
          include: { user: { select: { id: true, fullName: true } } },
        },
      },
    });

    const total = await prisma.message.count({ where: { conversationId: convId } });

    res.json({ messages: msgs.reverse(), total, page, hasMore: skip + limit < total });
  } catch (e) {
    console.error('chat/messages error', e);
    res.status(500).json({ error: 'خطأ في تحميل الرسائل' });
  }
});

// Send message
router.post('/conversations/:id/messages', authMiddleware, async (req, res) => {
  try {
    const me = (req as any).user;
    const convId = parseInt(String(req.params.id));
    const { content, imageUrl } = req.body;

    const msg = await prisma.message.create({
      data: {
        conversationId: convId,
        senderId: me.id,
        content: content || null,
        imageUrl: imageUrl || null,
      },
      include: {
        sender: { select: { id: true, fullName: true } },
      },
    });

    await prisma.conversation.update({
      where: { id: convId },
      data: { updatedAt: new Date() },
    });

    // Create SENT status
    await prisma.messageStatus.create({
      data: { messageId: msg.id, userId: me.id, status: 'SENT' },
    });

    // Emit to conversation room
    const payload = {
      ...msg,
      statuses: [{ id: 0, messageId: msg.id, userId: me.id, status: 'SENT', readAt: null }],
    };
    io.to(`conv:${convId}`).emit('message:new', payload);

    res.json(msg);
  } catch (e) {
    console.error('chat/messages send error', e);
    res.status(500).json({ error: 'خطأ في إرسال الرسالة' });
  }
});

// Mark messages as read
router.post('/conversations/:id/read', authMiddleware, async (req, res) => {
  try {
    const me = (req as any).user;
    const convId = parseInt(String(req.params.id));

    const unreadMessages = await prisma.message.findMany({
      where: {
        conversationId: convId,
        senderId: { not: me.id },
        statuses: { none: { userId: me.id, status: 'READ' } },
      },
    });

    for (const msg of unreadMessages) {
      await prisma.messageStatus.upsert({
        where: { messageId_userId: { messageId: msg.id, userId: me.id } },
        create: { messageId: msg.id, userId: me.id, status: 'READ', readAt: new Date() },
        update: { status: 'READ', readAt: new Date() },
      });
    }

    await prisma.conversationParticipant.updateMany({
      where: { conversationId: convId, userId: me.id },
      data: { lastReadAt: new Date() },
    });

    res.json({ success: true });
  } catch (e) {
    console.error('chat/read error', e);
    res.status(500).json({ error: 'خطأ في تحديث القراءة' });
  }
});

// Delete a message (soft-delete for everyone — sender only)
router.delete('/conversations/:conversationId/messages/:messageId', authMiddleware, async (req, res) => {
  try {
    const me = (req as any).user;
    const messageId = parseInt(String(req.params.messageId));
    const conversationId = parseInt(String(req.params.conversationId));

    const msg = await prisma.message.findUnique({ where: { id: messageId } });
    if (!msg) return res.status(404).json({ error: 'الرسالة غير موجودة' });
    if (msg.senderId !== me.id) return res.status(403).json({ error: 'لا يمكنك حذف رسالة الآخرين' });

    await prisma.message.update({
      where: { id: messageId },
      data: { content: null, imageUrl: null },
    });

    io.to(`conv:${conversationId}`).emit('message:deleted', { messageId, conversationId });

    res.json({ success: true });
  } catch (e) {
    console.error('chat/messages delete error', e);
    res.status(500).json({ error: 'خطأ في حذف الرسالة' });
  }
});

// Update group (admin only — name)
router.put('/conversations/:id', authMiddleware, async (req, res) => {
  try {
    const me = (req as any).user;
    const convId = parseInt(String(req.params.id));
    const { name } = req.body;

    const conv = await prisma.conversation.findUnique({ where: { id: convId } });
    if (!conv) return res.status(404).json({ error: 'المجموعة غير موجودة' });
    if (conv.createdById !== me.id) return res.status(403).json({ error: 'فقط منشئ المجموعة يمكنه التعديل' });

    const updated = await prisma.conversation.update({
      where: { id: convId },
      data: { name },
      include: { participants: { include: { user: { select: { id: true, fullName: true, username: true, role: true, profileImage: true, aboutStatus: true } } } } },
    });

    io.to(`conv:${convId}`).emit('conversation:updated', { conversationId: convId, name });

    res.json({ conversation: updated });
  } catch (e) {
    console.error('chat/conversations update error', e);
    res.status(500).json({ error: 'خطأ في تحديث المجموعة' });
  }
});

// Delete group (admin only)
router.delete('/conversations/:id', authMiddleware, async (req, res) => {
  try {
    const me = (req as any).user;
    const convId = parseInt(String(req.params.id));

    const conv = await prisma.conversation.findUnique({ where: { id: convId } });
    if (!conv) return res.status(404).json({ error: 'المجموعة غير موجودة' });
    if (conv.createdById !== me.id) return res.status(403).json({ error: 'فقط منشئ المجموعة يمكنه الحذف' });

    await prisma.conversation.delete({ where: { id: convId } });

    io.to(`conv:${convId}`).emit('conversation:deleted', { conversationId: convId });

    res.json({ success: true });
  } catch (e) {
    console.error('chat/conversations delete error', e);
    res.status(500).json({ error: 'خطأ في حذف المجموعة' });
  }
});

export default router;
