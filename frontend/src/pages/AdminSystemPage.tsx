import React, { useState } from 'react';
import { Bell, Plus, Send, Trash2, Clock } from 'lucide-react';

export const AdminAlertsPage = () => {
  const [alerts, setAlerts] = useState([
    { id: '1', title: 'تذكير: بدء التسجيل للفصل الثاني', date: '2026-05-01', type: 'info' },
    { id: '2', title: 'تم تحديث النظام إلى الإصدار 1.0', date: '2026-05-05', type: 'success' },
  ]);
  const [form, setForm] = useState({ title: '', type: 'info' });

  const addAlert = () => {
    if (!form.title.trim()) return alert('يرجى إدخال نص الإعلان');
    setAlerts(prev => [{
      id: Date.now().toString(),
      title: form.title,
      date: new Date().toISOString().split('T')[0],
      type: form.type,
    }, ...prev]);
    setForm({ title: '', type: 'info' });
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <h2><Bell size={22} /> الإعلانات والتنبيهات</h2>
      </div>

      <div className="glass-panel" style={{ marginBottom: 24 }}>
        <h3 style={{ marginBottom: 16, fontWeight: 700, fontSize: '0.95rem' }}>إضافة إعلان جديد</h3>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <input
            className="glass-input"
            style={{ flex: 1, minWidth: 200 }}
            placeholder="نص الإعلان..."
            value={form.title}
            onChange={e => setForm({ ...form, title: e.target.value })}
          />
          <select className="glass-input" style={{ width: 140 }} value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
            <option value="info">إعلام</option>
            <option value="success">نجاح</option>
            <option value="warning">تحذير</option>
          </select>
          <button className="glass-btn" onClick={addAlert}><Send size={16} /> نشر</button>
        </div>
      </div>

      <div className="glass-panel">
        {alerts.length === 0 ? (
          <div className="empty-state"><Bell size={40} /><p>لا توجد إعلانات</p></div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {alerts.map(a => (
              <div key={a.id} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '12px 16px', borderRadius: 10,
                background: 'var(--card-bg)', border: '1px solid var(--glass-border)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span className={`badge ${a.type === 'success' ? 'success' : a.type === 'warning' ? 'warning' : 'primary'}`}>
                    {a.type === 'success' ? 'نجاح' : a.type === 'warning' ? 'تحذير' : 'إعلام'}
                  </span>
                  <span style={{ fontWeight: 500 }}>{a.title}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}><Clock size={12} style={{ marginLeft: 3 }} />{a.date}</span>
                  <button className="glass-btn danger sm" style={{ padding: '4px 8px' }} onClick={() => setAlerts(prev => prev.filter(x => x.id !== a.id))}><Trash2 size={12} /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
