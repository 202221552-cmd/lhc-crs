import React, { useState, useEffect, useCallback } from 'react';
import { TrendingUp, RefreshCw, Calendar, DollarSign, BarChart2 } from 'lucide-react';
import { useApi } from '../context/AuthContext';
import { PermissionGuard } from '../components/PermissionGuard';

export const FinRevenuesPage = () => {
  const { apiFetch } = useApi();
  const [summary, setSummary] = useState<any>(null);
  const [receipts, setReceipts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [dateFrom, setDateFrom] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]);
  const [dateTo, setDateTo] = useState(new Date().toISOString().split('T')[0]);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const [sum, txs] = await Promise.all([
        apiFetch('/finances/summary'),
        apiFetch(`/finances?type=RECEIPT&dateFrom=${dateFrom}&dateTo=${dateTo}`)
      ]);
      setSummary(sum);
      setReceipts(txs);
    } catch (e) { console.error(e); }
    finally { setIsLoading(false); }
  }, [dateFrom, dateTo]);

  useEffect(() => { load(); }, [load]);

  const PM_LABELS: Record<string, string> = { CASH: 'نقدي', BANK: 'بنكي', CARD: 'بطاقة', TRANSFER: 'تحويل' };

  const byMethod: Record<string, number> = {};
  receipts.forEach(r => { byMethod[r.paymentMethod] = (byMethod[r.paymentMethod] || 0) + r.amount; });

  return (
    <PermissionGuard perm="finance.reports">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
            <TrendingUp size={22} color="var(--success)" /> تقرير الإيرادات
          </h2>
          <button className="glass-btn secondary" onClick={load} disabled={isLoading}>
            <RefreshCw size={16} className={isLoading ? 'spin' : ''} /> تحديث
          </button>
        </div>

        {/* Date Filters */}
        <div className="glass-panel" style={{ padding: '14px 20px' }}>
          <div style={{ display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
            <Calendar size={16} style={{ color: 'var(--text-muted)' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>من:</label>
              <input type="date" className="glass-input" style={{ flex: '0 1 160px' }} value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>إلى:</label>
              <input type="date" className="glass-input" style={{ flex: '0 1 160px' }} value={dateTo} onChange={e => setDateTo(e.target.value)} />
            </div>
            <button className="glass-btn sm" onClick={load}>عرض</button>
          </div>
        </div>

        {/* Summary Row */}
        {summary && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
            {[
              { label: 'إيرادات الشهر الحالي', value: summary.monthlyReceipts?.amount || 0, color: 'var(--success)' },
              { label: 'إجمالي الإيرادات', value: summary.totalReceived || 0, color: 'var(--primary-color)' },
              { label: 'إجمالي المصروفات', value: summary.totalPayments || 0, color: 'var(--danger)' },
              { label: 'صافي الربح', value: (summary.totalReceived || 0) - (summary.totalPayments || 0), color: (summary.totalReceived || 0) > (summary.totalPayments || 0) ? 'var(--success)' : 'var(--danger)' },
            ].map(card => (
              <div key={card.label} className="glass-panel" style={{ padding: '18px 20px' }}>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 6 }}>{card.label}</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: card.color }}>{card.value.toFixed(3)}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>دينار</div>
              </div>
            ))}
          </div>
        )}

        {/* By Payment Method */}
        {Object.keys(byMethod).length > 0 && (
          <div className="glass-panel" style={{ padding: '18px 22px' }}>
            <h4 style={{ marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
              <BarChart2 size={16} color="var(--primary-color)" /> توزيع حسب طريقة الدفع
            </h4>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {Object.entries(byMethod).map(([method, amount]) => (
                <div key={method} style={{ padding: '10px 18px', background: 'var(--card-bg)', borderRadius: 10, minWidth: 130 }}>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{PM_LABELS[method] || method}</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--success)', marginTop: 4 }}>{amount.toFixed(3)} د</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Receipts Table */}
        <div className="glass-panel">
          <h4 style={{ marginBottom: 14 }}>سندات القبض ({receipts.length})</h4>
          <div className="glass-table-container">
            <table className="glass-table">
              <thead><tr><th>#</th><th>الطالب</th><th>المبلغ</th><th>الطريقة</th><th>التاريخ</th><th>الحالة</th></tr></thead>
              <tbody>
                {receipts.slice(0, 50).map(tx => (
                  <tr key={tx.id}>
                    <td><strong>#{tx.receiptNumber}</strong></td>
                    <td style={{ fontSize: '0.85rem' }}>{tx.student?.fullNameAr || tx.notes || '—'}</td>
                    <td style={{ color: 'var(--success)', fontWeight: 600 }}>{tx.amount.toFixed(3)}</td>
                    <td style={{ fontSize: '0.82rem' }}>{PM_LABELS[tx.paymentMethod] || tx.paymentMethod}</td>
                    <td style={{ fontSize: '0.82rem' }}>{new Date(tx.date).toLocaleDateString('ar-JO')}</td>
                    <td><span className={`badge ${tx.status === 'COMPLETED' ? 'success' : 'danger'}`} style={{ fontSize: '0.75rem' }}>{tx.status === 'COMPLETED' ? 'مكتمل' : 'ملغي'}</span></td>
                  </tr>
                ))}
                {receipts.length === 0 && <tr><td colSpan={6} style={{ textAlign: 'center', padding: 24, opacity: 0.5 }}>لا توجد إيرادات في هذه الفترة</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </PermissionGuard>
  );
};
