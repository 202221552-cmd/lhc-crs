import React, { useState, useEffect, useCallback } from 'react';
import { ArrowUpCircle, FileText, Plus, RefreshCw, Search, Printer } from 'lucide-react';
import { useApi } from '../context/AuthContext';
import { PermissionGuard } from '../components/PermissionGuard';

interface Transaction {
  id: string; receiptNumber: number; type: string; amount: number;
  paymentMethod: string; status: string; date: string; notes?: string;
}

const PAYMENT_METHODS = [
  { value: 'CASH', label: 'نقدي (كاش)' },
  { value: 'BANK', label: 'حوالة بنكية' },
  { value: 'CARD', label: 'فيزا / ماستركارد' },
  { value: 'TRANSFER', label: 'تحويل إلكتروني' },
];

export const FinPaymentsPage = () => {
  const { apiFetch } = useApi();
  const [payments, setPayments] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const [form, setForm] = useState({
    amount: '',
    paymentMethod: 'CASH',
    beneficiary: '',
    notes: '',
  });

  const fetchPayments = useCallback(async () => {
    try {
      const data = await apiFetch('/finances?type=PAYMENT');
      setPayments(data);
    } catch {}
  }, []);

  useEffect(() => { fetchPayments(); }, []);

  const handleSubmit = async () => {
    if (!form.amount || parseFloat(form.amount) <= 0) return alert('يرجى إدخال مبلغ صحيح');
    if (!form.beneficiary) return alert('يرجى إدخال اسم المستفيد');
    setIsLoading(true);
    try {
      await apiFetch('/finances/payment', {
        method: 'POST',
        body: JSON.stringify({
          amount: parseFloat(form.amount),
          paymentMethod: form.paymentMethod,
          beneficiary: form.beneficiary,
          notes: form.notes
        })
      });
      await fetchPayments();
      setForm({ amount: '', paymentMethod: 'CASH', beneficiary: '', notes: '' });
    } catch (e: any) { alert(e.message); }
    finally { setIsLoading(false); }
  };

  return (
    <PermissionGuard perm="finance.payments">
      <div className="grid-2" style={{ gap: 24 }}>

        {/* Create Payment Form */}
        <div className="glass-panel">
          <h3 style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
            <Plus size={20} color="var(--danger)" /> إنشاء سند صرف (مصاريف)
          </h3>

          <div className="form-group">
            <label className="form-label">المستفيد / الجهة <span className="required-star">*</span></label>
            <input type="text" className="glass-input" placeholder="اسم الشخص أو الجهة المستفيدة"
              value={form.beneficiary} onChange={e => setForm({ ...form, beneficiary: e.target.value })} />
          </div>

          <div className="form-group">
            <label className="form-label">المبلغ (دينار) <span className="required-star">*</span></label>
            <input type="number" min="0" step="0.001" className="glass-input" placeholder="0.000"
              value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} />
          </div>

          <div className="form-group">
            <label className="form-label">طريقة الصرف</label>
            <select className="glass-input" value={form.paymentMethod} onChange={e => setForm({ ...form, paymentMethod: e.target.value })}>
              {PAYMENT_METHODS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">البيان / الملاحظات</label>
            <textarea className="glass-input" rows={3} placeholder="وصف المصروف..."
              value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
          </div>

          <button className="glass-btn" style={{ width: '100%', background: 'var(--danger)', boxShadow: '0 4px 16px rgba(239,68,68,0.25)' }}
            onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? <RefreshCw size={16} className="spin" /> : <><ArrowUpCircle size={16} /> حفظ سند الصرف</>}
          </button>
        </div>

        {/* Recent Payments */}
        <div className="glass-panel">
          <h3 style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'space-between' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <FileText size={20} color="var(--danger)" /> آخر سندات الصرف
            </span>
            <button className="glass-btn secondary sm" onClick={fetchPayments}><RefreshCw size={14} /></button>
          </h3>

          <div className="glass-table-container">
            <table className="glass-table">
              <thead>
                <tr>
                  <th>رقم السند</th>
                  <th>البيان</th>
                  <th>المبلغ</th>
                  <th>الطريقة</th>
                  <th>التاريخ</th>
                  <th>الحالة</th>
                </tr>
              </thead>
              <tbody>
                {payments.slice(0, 20).map(tx => (
                  <tr key={tx.id}>
                    <td><strong>#{tx.receiptNumber}</strong></td>
                    <td style={{ fontSize: '0.85rem', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tx.notes || '—'}</td>
                    <td><strong style={{ color: 'var(--danger)' }}>{tx.amount.toFixed(3)}</strong></td>
                    <td style={{ fontSize: '0.8rem' }}>{PAYMENT_METHODS.find(m => m.value === tx.paymentMethod)?.label || tx.paymentMethod}</td>
                    <td style={{ fontSize: '0.8rem' }}>{new Date(tx.date).toLocaleDateString('ar-JO')}</td>
                    <td>
                      <span className={`badge ${tx.status === 'COMPLETED' ? 'success' : 'danger'}`}>
                        {tx.status === 'COMPLETED' ? 'مكتمل' : 'ملغاة'}
                      </span>
                    </td>
                  </tr>
                ))}
                {payments.length === 0 && (
                  <tr><td colSpan={6} style={{ textAlign: 'center', padding: 24, opacity: 0.5 }}>لا توجد سندات صرف</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </PermissionGuard>
  );
};
