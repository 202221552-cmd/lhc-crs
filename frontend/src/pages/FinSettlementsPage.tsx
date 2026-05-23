import React, { useState, useEffect } from 'react';
import { Handshake, RefreshCw, CheckCircle, Clock, DollarSign } from 'lucide-react';
import { useApi } from '../context/AuthContext';
import { PermissionGuard } from '../components/PermissionGuard';

export const FinSettlementsPage = () => {
  const { apiFetch } = useApi();
  const [instructors, setInstructors] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const load = async () => {
    setIsLoading(true);
    try { setInstructors(await apiFetch('/instructors')); }
    catch (e) { console.error(e); }
    finally { setIsLoading(false); }
  };

  useEffect(() => { load(); }, []);

  return (
    <PermissionGuard perm="finance.settlements">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
            <Handshake size={22} color="var(--primary-color)" /> التسويات المالية
          </h2>
          <button className="glass-btn secondary" onClick={load} disabled={isLoading}>
            <RefreshCw size={16} className={isLoading ? 'spin' : ''} /> تحديث
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
          {[
            { label: 'مستحقات المحاضرين', value: instructors.reduce((s, i) => s + (i.hourlyRate || 0) * 20, 0), color: 'var(--warning)', icon: Clock },
            { label: 'تسويات مكتملة هذا الشهر', value: 0, color: 'var(--success)', icon: CheckCircle },
            { label: 'إجمالي المستحقات', value: instructors.reduce((s, i) => s + (i.hourlyRate || 0) * 20, 0), color: 'var(--primary-color)', icon: DollarSign },
          ].map(c => (
            <div key={c.label} className="glass-panel" style={{ padding: '18px 20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{c.label}</div>
                <c.icon size={18} color={c.color} />
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: c.color }}>{c.value.toFixed(3)}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>دينار</div>
            </div>
          ))}
        </div>

        <div className="glass-panel">
          <h4 style={{ marginBottom: 14 }}>المحاضرون وتسوياتهم</h4>
          <div className="glass-table-container">
            <table className="glass-table">
              <thead>
                <tr><th>المحاضر</th><th>التخصص</th><th>الأجر بالساعة</th><th>الساعات المقدّرة</th><th>المستحق</th><th>الحالة</th></tr>
              </thead>
              <tbody>
                {instructors.map(inst => (
                  <tr key={inst.id}>
                    <td style={{ fontWeight: 600 }}>{inst.name}</td>
                    <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{inst.specialization || '—'}</td>
                    <td>{(inst.hourlyRate || 0).toFixed(3)} د</td>
                    <td>20 ساعة</td>
                    <td style={{ color: 'var(--warning)', fontWeight: 600 }}>{((inst.hourlyRate || 0) * 20).toFixed(3)} د</td>
                    <td><span className="badge warning" style={{ fontSize: '0.75rem' }}>معلّق</span></td>
                  </tr>
                ))}
                {instructors.length === 0 && (
                  <tr><td colSpan={6} style={{ textAlign: 'center', padding: 24, opacity: 0.5 }}>لا يوجد محاضرون مسجلون</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <div style={{ marginTop: 12, padding: 12, background: 'var(--card-bg)', borderRadius: 10, fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            💡 الساعات مقدّرة تلقائياً. ميزة إدارة الجلسات الفعلية قيد التطوير.
          </div>
        </div>
      </div>
    </PermissionGuard>
  );
};
