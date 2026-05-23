import React, { useState, useEffect } from 'react';
import { PieChart, RefreshCw, Users, DollarSign } from 'lucide-react';
import { useApi } from '../context/AuthContext';
import { PermissionGuard } from '../components/PermissionGuard';

export const FinDistributionPage = () => {
  const { apiFetch } = useApi();
  const [summary, setSummary] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const load = async () => {
    setIsLoading(true);
    try { setSummary(await apiFetch('/finances/summary')); }
    catch (e) { console.error(e); }
    finally { setIsLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const total = summary?.totalReceived || 0;
  const expenses = summary?.totalPayments || 0;
  const net = total - expenses;

  const rows = [
    { label: 'مصروفات إدارية', pct: 10, color: 'var(--danger)' },
    { label: 'حصة المحاضرين', pct: 40, color: 'var(--warning)' },
    { label: 'احتياطي المركز', pct: 20, color: 'var(--info)' },
    { label: 'صافي الأرباح', pct: 30, color: 'var(--success)' },
  ];

  return (
    <PermissionGuard perm="finance.settlements">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
            <PieChart size={22} color="var(--primary-color)" /> توزيع الإيرادات
          </h2>
          <button className="glass-btn secondary" onClick={load} disabled={isLoading}>
            <RefreshCw size={16} className={isLoading ? 'spin' : ''} />
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {[
            { label: 'إجمالي الإيرادات', value: total, color: 'var(--success)' },
            { label: 'إجمالي المصروفات', value: expenses, color: 'var(--danger)' },
            { label: 'الصافي القابل للتوزيع', value: net, color: net >= 0 ? 'var(--primary-color)' : 'var(--danger)' },
          ].map(c => (
            <div key={c.label} className="glass-panel" style={{ padding: '20px 22px' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 8 }}>{c.label}</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: c.color }}>{c.value.toFixed(3)}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>دينار</div>
            </div>
          ))}
        </div>

        <div className="glass-panel">
          <h4 style={{ marginBottom: 16 }}>توزيع الصافي</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {rows.map(row => (
              <div key={row.label}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: '0.88rem' }}>
                  <span>{row.label}</span>
                  <span style={{ fontWeight: 700, color: row.color }}>
                    {(net * row.pct / 100).toFixed(3)} د ({row.pct}%)
                  </span>
                </div>
                <div style={{ height: 8, background: 'var(--glass-border)', borderRadius: 100, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${row.pct}%`, background: row.color, borderRadius: 100, transition: 'width 0.8s ease' }} />
                </div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 16, padding: 12, background: 'var(--card-bg)', borderRadius: 10, fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            ⚠️ هذه النسب تقديرية. يمكن تعديلها من إعدادات النظام.
          </div>
        </div>
      </div>
    </PermissionGuard>
  );
};
