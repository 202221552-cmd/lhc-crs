import React, { useState, useEffect, useCallback } from 'react';
import { MessageSquare, Send, Settings, History, CheckCircle, XCircle, Clock, Phone, User, RefreshCw, ExternalLink, ChevronLeft, Bot, Globe, Lock, Key, Eye, EyeOff } from 'lucide-react';
import { PermissionGuard } from '../components/PermissionGuard';
import { useApi } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import { useTheme } from '../context/ThemeContext';

const STATUS_MAP: Record<string, { label: string; color: string; icon: any }> = {
  PENDING: { label: 'قيد الإرسال', color: '#f59e0b', icon: Clock },
  SENT: { label: 'تم الإرسال', color: '#25D366', icon: CheckCircle },
  FAILED: { label: 'فشل', color: '#ef4444', icon: XCircle },
};

const WA_COLORS = {
  green: '#25D366',
  greenDark: '#128C7E',
  teal: '#075E54',
  tealDark: '#0B3328',
  bgDark: '#111b21',
  bgLight: '#ffffff',
  cardDark: '#1f2c33',
  cardLight: '#ffffff',
  bubbleOutDark: '#005c4b',
  bubbleOutLight: '#d9fdd3',
  bubbleInDark: '#1f2c33',
  bubbleInLight: '#ffffff',
  textDark: '#e9edef',
  textLight: '#111b21',
  mutedDark: '#8696a0',
  mutedLight: '#667781',
  borderDark: '#313d45',
  borderLight: '#e9edef',
  headerDark: '#1f2c33',
  headerLight: '#f0f2f5',
};

export const WhatsAppPage = () => {
  const { apiFetch } = useApi();
  const { theme } = useTheme();
  const toast = useToast();
  const isDark = theme === 'dark';
  const [tab, setTab] = useState<'send' | 'history' | 'settings'>('send');
  const [showToken, setShowToken] = useState(false);

  // Send
  const [recipientPhone, setRecipientPhone] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  // History
  const [messages, setMessages] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Settings
  const [settings, setSettings] = useState({ api_url: '', api_token: '' });
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);

  const c = (dark: string, light: string) => isDark ? dark : light;

  const loadSettings = useCallback(async () => {
    try {
      const data = await apiFetch('/whatsapp/settings');
      if (data) setSettings({ api_url: data.api_url || '', api_token: data.api_token || '' });
    } catch {}
    finally { setSettingsLoading(false); }
  }, [apiFetch]);

  const loadMessages = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const data = await apiFetch('/whatsapp/messages');
      setMessages(Array.isArray(data) ? data : []);
    } catch {}
    finally { setHistoryLoading(false); }
  }, [apiFetch]);

  useEffect(() => { loadSettings(); }, [loadSettings]);
  useEffect(() => { if (tab === 'history') loadMessages(); }, [tab, loadMessages]);

  const handleSend = async () => {
    if (!recipientPhone.trim()) return toast.error('رقم الهاتف مطلوب');
    if (!message.trim()) return toast.error('الرسالة مطلوبة');
    setSending(true);
    try {
      const res = await apiFetch('/whatsapp/send', {
        method: 'POST',
        body: JSON.stringify({
          recipientPhone: recipientPhone.trim(),
          recipientName: recipientName.trim(),
          message: message.trim(),
        }),
      });
      if (res.status === 'SENT') toast.success('تم الإرسال', 'تم إرسال الرسالة بنجاح');
      else if (res.status === 'FAILED') toast.error('فشل الإرسال', res.errorMessage || 'خطأ في الاتصال بالـ API');
      else toast.success('تم الحفظ', 'تم حفظ الرسالة في قائمة الانتظار');
      setMessage('');
      setRecipientPhone('');
      setRecipientName('');
    } catch (e: any) {
      toast.error('فشل الإرسال', e.message);
    } finally { setSending(false); }
  };

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    try {
      await apiFetch('/whatsapp/settings', {
        method: 'PUT',
        body: JSON.stringify(settings),
      });
      toast.success('تم الحفظ', 'تم حفظ إعدادات الواتساب');
    } catch (e: any) {
      toast.error('فشل الحفظ', e.message);
    } finally { setSavingSettings(false); }
  };

  const tabs = [
    { key: 'send' as const, label: 'إرسال', icon: Send },
    { key: 'history' as const, label: 'السجل', icon: History },
    { key: 'settings' as const, label: 'الإعدادات', icon: Settings },
  ];

  const containerStyle: React.CSSProperties = {
    maxWidth: 720, margin: '0 auto',
    fontFamily: "'Cairo', 'Segoe UI', sans-serif",
  };

  const headerStyle: React.CSSProperties = {
    background: c(WA_COLORS.headerDark, WA_COLORS.headerLight),
    borderBottom: `1px solid ${c(WA_COLORS.borderDark, WA_COLORS.borderLight)}`,
    padding: '16px 24px',
    borderRadius: '16px 16px 0 0',
    display: 'flex', alignItems: 'center', gap: 12,
  };

  const cardStyle: React.CSSProperties = {
    background: c(WA_COLORS.cardDark, WA_COLORS.cardLight),
    borderRadius: 12,
    border: `1px solid ${c(WA_COLORS.borderDark, WA_COLORS.borderLight)}`,
    overflow: 'hidden',
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '12px 14px',
    background: c('rgba(255,255,255,0.05)', '#f0f2f5'),
    border: `1.5px solid ${c(WA_COLORS.borderDark, '#e0e0e0')}`,
    borderRadius: 10, outline: 'none',
    color: c(WA_COLORS.textDark, WA_COLORS.textLight),
    fontSize: '0.88rem', fontFamily: "'Cairo', sans-serif",
    transition: 'border-color 0.2s, background 0.2s',
    boxSizing: 'border-box',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: '0.75rem', fontWeight: 600,
    color: c(WA_COLORS.mutedDark, WA_COLORS.mutedLight),
    marginBottom: 6, display: 'flex', alignItems: 'center', gap: 5,
  };

  return (
    <PermissionGuard perm="admin.settings.view">
      <div style={containerStyle}>
        {/* WhatsApp-style Header */}
        <div style={headerStyle}>
          <div style={{
            width: 40, height: 40, borderRadius: 10,
            background: WA_COLORS.green, display: 'flex',
            alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <MessageSquare size={20} color="#fff" />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: c(WA_COLORS.textDark, WA_COLORS.textLight) }}>
              رسائل الواتساب
            </h2>
            <p style={{ margin: '1px 0 0', fontSize: '0.7rem', color: c(WA_COLORS.mutedDark, WA_COLORS.mutedLight) }}>
              إدارة وإرسال رسائل واتساب
            </p>
          </div>
        </div>

        {/* WhatsApp-style Segmented Tabs */}
        <div style={{
          display: 'flex', gap: 0,
          background: c(WA_COLORS.cardDark, '#f0f2f5'),
          border: `1px solid ${c(WA_COLORS.borderDark, WA_COLORS.borderLight)}`,
          borderTop: 'none', borderRadius: '0 0 12px 12px',
          overflow: 'hidden', marginBottom: 20,
        }}>
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              style={{
                flex: 1, padding: '10px 0', cursor: 'pointer', border: 'none',
                background: tab === t.key
                  ? WA_COLORS.green
                  : 'transparent',
                color: tab === t.key ? '#fff' : c(WA_COLORS.mutedDark, WA_COLORS.mutedLight),
                fontWeight: tab === t.key ? 700 : 500,
                fontSize: '0.82rem',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                transition: 'all 0.2s',
              }}>
              <t.icon size={15} /> {t.label}
            </button>
          ))}
        </div>

        {/* Send Tab — WhatsApp Chat Style */}
        {tab === 'send' && (
          <div style={cardStyle}>
            {/* Chat header */}
            <div style={{
              padding: '14px 18px',
              background: c(WA_COLORS.teal, WA_COLORS.green),
              color: '#fff',
              display: 'flex', alignItems: 'center', gap: 10,
            }}>
              <Bot size={18} />
              <span style={{ fontWeight: 600, fontSize: '0.88rem' }}>إرسال رسالة جديدة</span>
            </div>

            <div style={{ padding: 18 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                <div>
                  <label style={labelStyle}><Phone size={11} /> رقم الهاتف</label>
                  <input style={inputStyle} dir="ltr" placeholder="9627XXXXXXXX"
                    value={recipientPhone} onChange={e => setRecipientPhone(e.target.value)} />
                </div>
                <div>
                  <label style={labelStyle}><User size={11} /> الاسم (اختياري)</label>
                  <input style={inputStyle} placeholder="اسم المستلم"
                    value={recipientName} onChange={e => setRecipientName(e.target.value)} />
                </div>
              </div>

              {/* WhatsApp chat bubble preview */}
              <div style={labelStyle}><MessageSquare size={11} /> نص الرسالة</div>
              {message && (
                <div style={{
                  display: 'flex', justifyContent: 'flex-end', marginBottom: 10,
                }}>
                  <div style={{
                    background: c(WA_COLORS.bubbleOutDark, WA_COLORS.bubbleOutLight),
                    color: c(WA_COLORS.textDark, WA_COLORS.textLight),
                    padding: '10px 14px', borderRadius: '12px 12px 4px 12px',
                    maxWidth: '80%', fontSize: '0.88rem', lineHeight: 1.5,
                    boxShadow: '0 1px 2px rgba(0,0,0,0.08)',
                    wordBreak: 'break-word',
                  }}>
                    {message}
                    <div style={{
                      fontSize: '0.6rem', opacity: 0.6, textAlign: 'left', marginTop: 4, direction: 'ltr',
                    }}>
                      {new Date().toLocaleTimeString('ar-JO', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              )}
              <textarea style={{
                ...inputStyle, resize: 'vertical', minHeight: 100, lineHeight: 1.6, marginBottom: 0,
              }} rows={4} placeholder="اكتب رسالتك هنا..."
                value={message} onChange={e => setMessage(e.target.value)} />

              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12,
              }}>
                <span style={{ fontSize: '0.72rem', color: c(WA_COLORS.mutedDark, WA_COLORS.mutedLight) }}>
                  {message.length} حرف {message.length > 0 && `| ${Math.ceil(message.length / 160)} رسالة`}
                </span>
                <button onClick={handleSend} disabled={sending}
                  style={{
                    padding: '10px 28px', borderRadius: 24, border: 'none',
                    background: WA_COLORS.green, color: '#fff',
                    fontWeight: 700, fontSize: '0.85rem', cursor: sending ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', gap: 6,
                    opacity: sending ? 0.6 : 1,
                    transition: 'all 0.2s',
                    fontFamily: "'Cairo', sans-serif",
                  }}>
                  <Send size={14} /> {sending ? 'جاري الإرسال...' : 'إرسال'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* History Tab */}
        {tab === 'history' && (
          <div style={cardStyle}>
            <div style={{
              padding: '14px 18px',
              background: c(WA_COLORS.teal, WA_COLORS.green),
              color: '#fff',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <History size={18} />
                <span style={{ fontWeight: 600, fontSize: '0.88rem' }}>سجل الرسائل</span>
              </div>
              <button onClick={loadMessages}
                style={{
                  background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff',
                  borderRadius: 20, padding: '5px 14px', cursor: 'pointer',
                  fontSize: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5,
                  fontFamily: "'Cairo', sans-serif",
                }}>
                <RefreshCw size={12} /> تحديث
              </button>
            </div>

            {historyLoading ? (
              <div style={{ padding: 50, textAlign: 'center', color: c(WA_COLORS.mutedDark, WA_COLORS.mutedLight) }}>
                جاري التحميل...
              </div>
            ) : messages.length === 0 ? (
              <div style={{
                padding: 50, textAlign: 'center',
                color: c(WA_COLORS.mutedDark, WA_COLORS.mutedLight),
              }}>
                <MessageSquare size={36} style={{ marginBottom: 10, opacity: 0.3 }} />
                <p style={{ margin: 0, fontSize: '0.9rem', opacity: 0.6 }}>لا توجد رسائل مرسلة</p>
              </div>
            ) : (
              <div style={{ maxHeight: 420, overflowY: 'auto' }}>
                {messages.map((msg: any) => {
                  const st = STATUS_MAP[msg.status] || STATUS_MAP.PENDING;
                  const isSent = msg.status === 'SENT';
                  return (
                    <div key={msg.id} style={{
                      padding: '12px 18px',
                      borderBottom: `1px solid ${c(WA_COLORS.borderDark, WA_COLORS.borderLight)}`,
                      display: 'flex', gap: 12,
                      background: isSent ? c('rgba(37,211,102,0.04)', 'rgba(37,211,102,0.04)') : 'transparent',
                    }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                        background: isSent ? `${WA_COLORS.green}22` : c('rgba(255,255,255,0.05)', 'rgba(0,0,0,0.04)'),
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <st.icon size={16} color={st.color} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                          <span style={{
                            fontSize: '0.68rem', padding: '2px 8px', borderRadius: 10,
                            background: `${st.color}18`, color: st.color, fontWeight: 600,
                          }}>{st.label}</span>
                          {msg.recipientName && (
                            <span style={{ fontWeight: 600, fontSize: '0.82rem', color: c(WA_COLORS.textDark, WA_COLORS.textLight) }}>
                              {msg.recipientName}
                            </span>
                          )}
                          <span style={{
                            fontSize: '0.7rem', color: c(WA_COLORS.mutedDark, WA_COLORS.mutedLight), direction: 'ltr',
                          }}>{msg.recipientPhone}</span>
                        </div>
                        <div style={{
                          fontSize: '0.82rem', color: c(WA_COLORS.textDark, WA_COLORS.textLight),
                          lineHeight: 1.5, wordBreak: 'break-word',
                        }}>
                          {msg.message}
                        </div>
                        {msg.errorMessage && (
                          <div style={{ fontSize: '0.68rem', color: '#ef4444', marginTop: 4 }}>
                            {msg.errorMessage}
                          </div>
                        )}
                        <div style={{
                          fontSize: '0.62rem', color: c(WA_COLORS.mutedDark, WA_COLORS.mutedLight),
                          marginTop: 4, direction: 'ltr', textAlign: 'left',
                        }}>
                          {msg.createdAt && new Date(msg.createdAt).toLocaleString('ar-JO')}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Settings Tab — WhatsApp Settings Style */}
        {tab === 'settings' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* API Connection */}
            <div style={cardStyle}>
              <div style={{
                padding: '14px 18px',
                background: c(WA_COLORS.teal, WA_COLORS.green),
                color: '#fff',
                display: 'flex', alignItems: 'center', gap: 10,
              }}>
                <Globe size={18} />
                <span style={{ fontWeight: 600, fontSize: '0.88rem' }}>ربط API</span>
              </div>

              {settingsLoading ? (
                <div style={{ padding: 40, textAlign: 'center', color: c(WA_COLORS.mutedDark, WA_COLORS.mutedLight) }}>
                  جاري التحميل...
                </div>
              ) : (
                <div style={{ padding: 18 }}>
                  <p style={{
                    margin: '0 0 16px', fontSize: '0.78rem',
                    color: c(WA_COLORS.mutedDark, WA_COLORS.mutedLight), lineHeight: 1.6,
                  }}>
                    أدخل بيانات API الخاص بواتساب للاتصال بخدمة الإرسال.
                    يمكنك استخدام <strong>UltraMsg</strong>، <strong>WATI</strong>، أو أي خدمة واتساب API.
                  </p>

                  <div style={{ marginBottom: 14 }}>
                    <label style={labelStyle}><Globe size={11} /> رابط API</label>
                    <input style={inputStyle} dir="ltr"
                      placeholder="https://api.ultramsg.com/instanceXXXX/messages/chat"
                      value={settings.api_url}
                      onChange={e => setSettings({ ...settings, api_url: e.target.value })} />
                  </div>

                  <div style={{ marginBottom: 18 }}>
                    <label style={labelStyle}><Key size={11} /> رمز التوثيق (Token)</label>
                    <div style={{ position: 'relative' }}>
                      <input style={{ ...inputStyle, paddingLeft: 40 }} dir="ltr"
                        type={showToken ? 'text' : 'password'}
                        placeholder="xxxxxx"
                        value={settings.api_token}
                        onChange={e => setSettings({ ...settings, api_token: e.target.value })} />
                      <button onClick={() => setShowToken(!showToken)}
                        style={{
                          position: 'absolute', left: 10, top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'none', border: 'none',
                          color: c(WA_COLORS.mutedDark, WA_COLORS.mutedLight),
                          cursor: 'pointer', padding: 4,
                        }}>
                        {showToken ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                    <button onClick={handleSaveSettings} disabled={savingSettings}
                      style={{
                        padding: '10px 24px', borderRadius: 24, border: 'none',
                        background: WA_COLORS.green, color: '#fff',
                        fontWeight: 700, fontSize: '0.85rem',
                        cursor: savingSettings ? 'not-allowed' : 'pointer',
                        display: 'flex', alignItems: 'center', gap: 6,
                        opacity: savingSettings ? 0.6 : 1,
                        transition: 'all 0.2s',
                        fontFamily: "'Cairo', sans-serif",
                      }}>
                      <Lock size={14} /> {savingSettings ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
                    </button>
                    <a href="https://www.ultramsg.com/" target="_blank" rel="noopener noreferrer"
                      style={{
                        fontSize: '0.78rem', color: WA_COLORS.green,
                        display: 'flex', alignItems: 'center', gap: 4,
                        textDecoration: 'none', fontWeight: 500,
                      }}>
                      <ExternalLink size={12} /> معلومات عن API
                    </a>
                  </div>
                </div>
              )}
            </div>

            {/* Connection status card */}
            <div style={{
              ...cardStyle,
              display: 'flex', alignItems: 'center', gap: 14,
              padding: '14px 18px',
            }}>
              <div style={{
                width: 40, height: 40, borderRadius: 10,
                background: settings.api_url ? WA_COLORS.green + '22' : c('rgba(255,255,255,0.05)', 'rgba(0,0,0,0.04)'),
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Bot size={20} color={settings.api_url ? WA_COLORS.green : c(WA_COLORS.mutedDark, WA_COLORS.mutedLight)} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{
                  fontSize: '0.85rem', fontWeight: 600,
                  color: c(WA_COLORS.textDark, WA_COLORS.textLight),
                }}>
                  {settings.api_url ? 'API متصل' : 'API غير متصل'}
                </div>
                <div style={{
                  fontSize: '0.7rem',
                  color: c(WA_COLORS.mutedDark, WA_COLORS.mutedLight),
                  marginTop: 1,
                }}>
                  {settings.api_url
                    ? `${settings.api_url.substring(0, 40)}...`
                    : 'قم بإعداد API للبدء بالإرسال'}
                </div>
              </div>
              <div style={{
                width: 10, height: 10, borderRadius: '50%',
                background: settings.api_url ? WA_COLORS.green : '#ef4444',
                flexShrink: 0,
              }} />
            </div>
          </div>
        )}
      </div>
    </PermissionGuard>
  );
};
