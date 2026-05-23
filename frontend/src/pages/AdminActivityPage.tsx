import React, { useState, useEffect, useCallback } from 'react';
import { Activity, RefreshCw, Filter, Trash2 } from 'lucide-react';
import { useApi } from '../context/AuthContext';
import { PermissionGuard } from '../components/PermissionGuard';

interface AuditLog {
  id: string; action: string; entity: string; details?: string;
  ipAddress?: string; deviceType?: string; createdAt: string;
  user?: { username: string; fullName: string };
}

const ACTION_COLORS: Record<string, string> = {
  CREATE: 'var(--success)', UPDATE: 'var(--warning)', DELETE: 'var(--danger)',
  LOGIN: 'var(--primary-color)', LOGOUT: 'var(--text-muted)',
  PAY: '#a78bfa', VIEW: 'var(--info)'
};

export const AdminActivityPage = () => {
  const { apiFetch } = useApi();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filterAction, setFilterAction] = useState('');
  const [filterEntity, setFilterEntity] = useState('');

  const fetchLogs = useCallback(async () => {
    setIsLoading(true);
    try {
      let url = '/audit?limit=300';
      if (filterAction) url += `&action=${filterAction}`;
      if (filterEntity) url += `&entity=${filterEntity}`;
      setLogs(await apiFetch(url));
    } catch (e: any) { console.error(e); }
    finally { setIsLoading(false); }
  }, [filterAction, filterEntity]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const clearLogs = async () => {
    if (!confirm('هل أنت متأكد من مسح جميع سجلات النشاط؟ لا يمكن التراجع.')) return;
    try { await apiFetch('/audit', { method: 'DELETE' }); await fetchLogs(); }
    catch (e: any) { alert(e.message); }
  };

  const parseDetails = (details?: string) => {
    if (!details) return null;
    try { return JSON.parse(details); } catch { return details; }
  };

  const uniqueEntities = [...new Set(logs.map(l => l.entity))];
  const uniqueActions = [...new Set(logs.map(l => l.action))];

  return (
    <PermissionGuard perm="admin.audit">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
            <Activity size={22} color="var(--primary-color)" /> سجل النشاط
            <span style={{ fontSize: '0.8rem', fontWeight: 400, color: 'var(--text-muted)', marginRight: 4 }}>
              ({logs.length} سجل)
            </span>
          </h2>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="glass-btn secondary" onClick={fetchLogs} disabled={isLoading}>
              <RefreshCw size={16} className={isLoading ? 'spin' : ''} /> تحديث
            </button>
            <button className="glass-btn secondary" onClick={clearLogs} style={{ color: 'var(--danger)' }}>
              <Trash2 size={16} /> مسح الكل
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="glass-panel" style={{ padding: '14px 18px' }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <Filter size={16} style={{ color: 'var(--text-muted)' }} />
            <select className="glass-input" style={{ flex: '0 1 180px' }}
              value={filterAction} onChange={e => setFilterAction(e.target.value)}>
              <option value="">جميع الإجراءات</option>
              {uniqueActions.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
            <select className="glass-input" style={{ flex: '0 1 180px' }}
              value={filterEntity} onChange={e => setFilterEntity(e.target.value)}>
              <option value="">جميع الكيانات</option>
              {uniqueEntities.map(e => <option key={e} value={e}>{e}</option>)}
            </select>
            <button className="glass-btn secondary sm" onClick={() => { setFilterAction(''); setFilterEntity(''); }}>
              إعادة ضبط
            </button>
          </div>
        </div>

        <div className="glass-panel">
          <div className="glass-table-container">
            <table className="glass-table">
              <thead>
                <tr>
                  <th>الإجراء</th>
                  <th>الكيان</th>
                  <th>المستخدم</th>
                  <th>التفاصيل</th>
                  <th>العنوان IP</th>
                  <th>التاريخ والوقت</th>
                </tr>
              </thead>
              <tbody>
                {logs.map(log => {
                  const details = parseDetails(log.details);
                  return (
                    <tr key={log.id}>
                      <td>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 700, fontSize: '0.8rem', color: ACTION_COLORS[log.action] || '#fff', background: `${ACTION_COLORS[log.action]}20`, padding: '3px 10px', borderRadius: 20 }}>
                          {log.action}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.85rem', fontWeight: 600 }}>{log.entity}</td>
                      <td>
                        <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{log.user?.fullName || '—'}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>@{log.user?.username}</div>
                      </td>
                      <td style={{ fontSize: '0.78rem', maxWidth: 200 }}>
                        {typeof details === 'object' && details !== null ? (
                          <div style={{ color: 'var(--text-muted)' }}>
                            {Object.entries(details).slice(0, 2).map(([k, v]) => (
                              <div key={k}><strong>{k}:</strong> {String(v).slice(0, 30)}</div>
                            ))}
                          </div>
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>{String(details || '—').slice(0, 60)}</span>
                        )}
                      </td>
                      <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)', direction: 'ltr' }}>
                        {log.ipAddress || '—'}
                      </td>
                      <td style={{ fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                        <div>{new Date(log.createdAt).toLocaleDateString('ar-JO')}</div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                          {new Date(log.createdAt).toLocaleTimeString('ar-JO')}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {logs.length === 0 && (
                  <tr><td colSpan={6} style={{ textAlign: 'center', padding: 32, opacity: 0.5 }}>
                    {isLoading ? 'جارٍ التحميل...' : 'لا توجد سجلات'}
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </PermissionGuard>
  );
};
