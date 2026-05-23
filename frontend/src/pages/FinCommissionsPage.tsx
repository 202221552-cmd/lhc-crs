import React, { useState, useEffect } from 'react';
import { Percent, RefreshCw, Users, TrendingUp } from 'lucide-react';
import { useApi } from '../context/AuthContext';
import { PermissionGuard } from '../components/PermissionGuard';

export const FinCommissionsPage = () => {
  const { apiFetch } = useApi();
  const [receipts, setReceipts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [commissionRate, setCommissionRate] = useState(5);

  const load = async () => {
    setIsLoading(true);
    try { setReceipts(await apiFetch('/finances?type=RECEIPT&limit=100')); }
    catch (e) { console.error(e); }
    finally { setIsLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const totalRevenue = receipts.reduce((s, r) => s + r.amount, 0);
  const totalCommission = (totalRevenue * commissionRate) / 100;

  // Group by marketer (from notes field as placeholder)
  const byMarketer: Record<string, number> = {};
  receipts.forEach(r => {
    const name = r.marketerName || 'مباشر (بدون مسوّق)';
    byMarketer[name] = (byMarketer[name] || 0) + r.amount;
  });

  return (
    <PermissionGuard perm="finance.settlements">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
            <Percent size={22} color="var(--warning)" /> العمولات والتسويق
          </h2>
          <button className="glass-btn secondary" onClick={load} disabled={isLoading}>
            <RefreshCw size={16} className={isLoading ? 'spin' : ''} />
          </button>
        </div>

        <div className="glass-panel" style={{ padding: '16px 20px' }}>
          <div style={{ display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
            <label style={{ fontSize: '0.88rem', fontWeight: 600 }}>نسبة العمولة:</label>
            <input type="range" min="1" max="20" value={commissionRate} onChange={e => setCommissionRate(parseInt(e.target.value))}
              style={{ flex: '0 1 200px' }} />
            <span style={{ fontWeight: 700, color: 'var(--warning)', fontSize: '1.1rem' }}>{commissionRate}%</span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
          {[
            { label: 'إجمالي المبيعات', value: totalRevenue, color: 'var(--primary-color)', icon: TrendingUp },
            { label: `إجمالي العمولات (${commissionRate}%)`, value: totalCommission, color: 'var(--warning)', icon: Percent },
            { label: 'عدد المسوّقين', value: Object.keys(byMarketer).length, color: 'var(--success)', icon: Users, isCount: true },
          ].map((c: any) => (
            <div key={c.label} className="glass-panel" style={{ padding: '18px 20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{c.label}</div>
                <c.icon size={18} color={c.color} />
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: c.color }}>
                {c.isCount ? c.value : c.value.toFixed(3)}
              </div>
              {!c.isCount && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>دينار</div>}
            </div>
          ))}
        </div>

        <div className="glass-panel">
          <h4 style={{ marginBottom: 14 }}>توزيع المبيعات حسب المسوّق</h4>
          <div className="glass-table-container">
            <table className="glass-table">
              <thead><tr><th>المسوّق</th><th>مجموع المبيعات</th><th>العمولة المستحقة</th></tr></thead>
              <tbody>
                {Object.entries(byMarketer).map(([name, amount]) => (
                  <tr key={name}>
                    <td style={{ fontWeight: 600 }}>{name}</td>
                    <td style={{ color: 'var(--primary-color)', fontWeight: 600 }}>{amount.toFixed(3)} د</td>
                    <td style={{ color: 'var(--warning)', fontWeight: 700 }}>{(amount * commissionRate / 100).toFixed(3)} د</td>
                  </tr>
                ))}
                {Object.keys(byMarketer).length === 0 && (
                  <tr><td colSpan={3} style={{ textAlign: 'center', padding: 24, opacity: 0.5 }}>لا توجد بيانات</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </PermissionGuard>
  );
};
