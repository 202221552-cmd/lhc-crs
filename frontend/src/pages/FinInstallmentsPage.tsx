import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, CreditCard, CheckCircle, AlertTriangle, Clock, RefreshCw, Search, Filter, DollarSign, XCircle } from 'lucide-react';
import { useApi } from '../context/AuthContext';
import { PermissionGuard } from '../components/PermissionGuard';

interface Installment {
  id: string; studentId: string; subscriptionId: string; subscriptionType: string;
  installmentNumber: number; totalInstallments: number;
  dueDate: string; amount: number; paidAmount: number; remainingAmount: number;
  status: string; paymentDate?: string; paymentMethod?: string; notes?: string;
  student?: { id: string; fullNameAr: string; phones: string };
}

interface Summary {
  pending: { _sum: { amount: number }; _count: number };
  overdue: { _sum: { amount: number }; _count: number };
  paidToday: { _sum: { paidAmount: number }; _count: number };
  total: { _sum: { amount: number }; _count: number };
}

const STATUS_MAP: Record<string, { label: string; color: string; icon: any }> = {
  PENDING:  { label: 'معلّق',   color: 'var(--warning)',  icon: Clock },
  PAID:     { label: 'مدفوع',   color: 'var(--success)',  icon: CheckCircle },
  PARTIAL:  { label: 'جزئي',    color: 'var(--info)',     icon: CreditCard },
  OVERDUE:  { label: 'متأخر',   color: 'var(--danger)',   icon: AlertTriangle },
};

const PAYMENT_METHODS = [
  { value: 'CASH', label: 'نقدي' },
  { value: 'BANK', label: 'حوالة بنكية' },
  { value: 'CARD', label: 'بطاقة' },
  { value: 'TRANSFER', label: 'تحويل' },
];

export const FinInstallmentsPage = () => {
  const { apiFetch } = useApi();

  const [installments, setInstallments] = useState<Installment[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Filters
  const [filterStatus, setFilterStatus] = useState('');
  const [filterSearch, setFilterSearch] = useState('');
  const [filterOverdue, setFilterOverdue] = useState(false);
  const [filterUpcoming, setFilterUpcoming] = useState(false);

  // Pay modal
  const [payModal, setPayModal] = useState<Installment | null>(null);
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('CASH');
  const [payNotes, setPayNotes] = useState('');
  const [isPaying, setIsPaying] = useState(false);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      let url = '/installments?';
      if (filterStatus) url += `status=${filterStatus}&`;
      if (filterOverdue) url += 'overdueOnly=true&';
      if (filterUpcoming) url += 'upcomingDays=30&';

      const [data, sum] = await Promise.all([
        apiFetch(url),
        apiFetch('/installments/summary')
      ]);
      let filtered = data;
      if (filterSearch) {
        const q = filterSearch.toLowerCase();
        filtered = data.filter((i: Installment) =>
          i.student?.fullNameAr?.includes(filterSearch) ||
          i.subscriptionId?.toLowerCase().includes(q)
        );
      }
      setInstallments(filtered);
      setSummary(sum);
    } catch (e: any) { console.error(e); }
    finally { setIsLoading(false); }
  }, [filterStatus, filterOverdue, filterUpcoming, filterSearch]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handlePay = async () => {
    if (!payModal) return;
    const amount = parseFloat(payAmount);
    if (isNaN(amount) || amount <= 0) return alert('أدخل مبلغاً صحيحاً');
    if (amount > payModal.remainingAmount + 0.001) return alert(`المبلغ أكبر من المتبقي (${payModal.remainingAmount.toFixed(3)} دينار)`);

    setIsPaying(true);
    try {
      await apiFetch(`/installments/${payModal.id}/pay`, {
        method: 'POST',
        body: JSON.stringify({ amount, paymentMethod: payMethod, notes: payNotes })
      });
      setPayModal(null);
      setPayAmount('');
      setPayNotes('');
      await fetchData();
    } catch (e: any) { alert(e.message); }
    finally { setIsPaying(false); }
  };

  const getStudentPhone = (phones: string) => {
    try { return JSON.parse(phones)?.[0] || ''; } catch { return phones || ''; }
  };

  return (
    <PermissionGuard perm="finance.installments">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

        {/* Summary Cards */}
        {summary && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
            {[
              { label: 'إجمالي المستحق', value: summary.pending._sum?.amount || 0, count: summary.pending._count, color: 'var(--warning)', icon: Clock },
              { label: 'متأخرة الدفع', value: summary.overdue._sum?.amount || 0, count: summary.overdue._count, color: 'var(--danger)', icon: AlertTriangle },
              { label: 'مدفوع اليوم', value: summary.paidToday._sum?.paidAmount || 0, count: summary.paidToday._count, color: 'var(--success)', icon: CheckCircle },
              { label: 'إجمالي الأقساط', value: summary.total._sum?.amount || 0, count: summary.total._count, color: 'var(--primary-color)', icon: CreditCard },
            ].map(card => (
              <div key={card.label} className="glass-panel" style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <card.icon size={22} color={card.color} />
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{card.count} قسط</span>
                </div>
                <div style={{ fontSize: '1.35rem', fontWeight: 800, color: card.color }}>
                  {card.value.toFixed(3)} <span style={{ fontSize: '0.75rem', fontWeight: 500 }}>دينار</span>
                </div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{card.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Filters */}
        <div className="glass-panel" style={{ padding: '16px 20px' }}>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: '1 1 220px' }}>
              <Search size={16} style={{ position: 'absolute', right: 12, top: 13, color: 'var(--text-muted)' }} />
              <input type="text" className="glass-input" style={{ paddingRight: 38 }}
                placeholder="بحث بالاسم..."
                value={filterSearch} onChange={e => setFilterSearch(e.target.value)} />
            </div>
            <select className="glass-input" style={{ flex: '0 1 160px' }}
              value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
              <option value="">جميع الحالات</option>
              <option value="PENDING">معلّق</option>
              <option value="OVERDUE">متأخر</option>
              <option value="PARTIAL">جزئي</option>
              <option value="PAID">مدفوع</option>
            </select>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.88rem', cursor: 'pointer', whiteSpace: 'nowrap' }}>
              <input type="checkbox" checked={filterOverdue} onChange={e => setFilterOverdue(e.target.checked)} />
              المتأخرة فقط
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.88rem', cursor: 'pointer', whiteSpace: 'nowrap' }}>
              <input type="checkbox" checked={filterUpcoming} onChange={e => setFilterUpcoming(e.target.checked)} />
              خلال 30 يوم
            </label>
            <button className="glass-btn secondary sm" onClick={fetchData}>
              <RefreshCw size={14} className={isLoading ? 'spin' : ''} /> تحديث
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="glass-panel">
          <div className="glass-table-container">
            <table className="glass-table">
              <thead>
                <tr>
                  <th>الطالب</th>
                  <th>الهاتف</th>
                  <th>النوع</th>
                  <th>القسط</th>
                  <th>تاريخ الاستحقاق</th>
                  <th>المبلغ الكلي</th>
                  <th>المدفوع</th>
                  <th>المتبقي</th>
                  <th>الحالة</th>
                  <th>إجراء</th>
                </tr>
              </thead>
              <tbody>
                {installments.map(inst => {
                  const st = STATUS_MAP[inst.status] || STATUS_MAP['PENDING'];
                  const isOverdue = inst.status === 'OVERDUE';
                  const isPaid = inst.status === 'PAID';
                  return (
                    <tr key={inst.id} style={{ opacity: isPaid ? 0.6 : 1 }}>
                      <td style={{ fontWeight: 600 }}>{inst.student?.fullNameAr || '—'}</td>
                      <td style={{ direction: 'ltr', textAlign: 'right', fontSize: '0.82rem' }}>
                        {inst.student ? `+962 ${getStudentPhone(inst.student.phones)}` : '—'}
                      </td>
                      <td>
                        <span className="badge" style={{ background: inst.subscriptionType === 'DIPLOMA' ? 'var(--primary-light)' : 'rgba(0,200,100,0.12)', color: inst.subscriptionType === 'DIPLOMA' ? 'var(--primary-color)' : 'var(--success)', fontSize: '0.75rem' }}>
                          {inst.subscriptionType === 'DIPLOMA' ? 'دبلوم' : 'دورة'}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
                        {inst.installmentNumber} / {inst.totalInstallments}
                      </td>
                      <td style={{ fontSize: '0.85rem', color: isOverdue ? 'var(--danger)' : undefined, fontWeight: isOverdue ? 600 : undefined }}>
                        {new Date(inst.dueDate).toLocaleDateString('ar-JO')}
                        {isOverdue && <span style={{ marginRight: 4, fontSize: '0.75rem' }}>⚠️</span>}
                      </td>
                      <td><strong>{inst.amount.toFixed(3)}</strong></td>
                      <td style={{ color: 'var(--success)' }}>{inst.paidAmount.toFixed(3)}</td>
                      <td style={{ color: inst.remainingAmount > 0 ? 'var(--danger)' : 'var(--success)', fontWeight: 600 }}>
                        {inst.remainingAmount.toFixed(3)}
                      </td>
                      <td>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.82rem', fontWeight: 600, color: st.color }}>
                          <st.icon size={13} /> {st.label}
                        </span>
                      </td>
                      <td>
                        {!isPaid && (
                          <button className="glass-btn sm" onClick={() => { setPayModal(inst); setPayAmount(inst.remainingAmount.toFixed(3)); }}>
                            <DollarSign size={13} /> دفع
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {installments.length === 0 && (
                  <tr><td colSpan={10} style={{ textAlign: 'center', padding: 32, opacity: 0.5 }}>
                    {isLoading ? 'جارٍ التحميل...' : 'لا توجد أقساط مطابقة'}
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pay Modal */}
        {payModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
            <div className="glass-panel slide-in" style={{ width: 420, direction: 'rtl' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <DollarSign size={18} color="var(--primary-color)" /> تسجيل دفعة
                </h3>
                <button onClick={() => setPayModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 20 }}>×</button>
              </div>

              <div style={{ background: 'var(--card-bg)', borderRadius: 10, padding: 14, marginBottom: 16 }}>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>{payModal.student?.fullNameAr}</div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  قسط {payModal.installmentNumber}/{payModal.totalInstallments} — متأخر: {payModal.remainingAmount.toFixed(3)} دينار
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">المبلغ المدفوع (دينار) <span className="required-star">*</span></label>
                <input type="number" min="0.001" step="0.001" max={payModal.remainingAmount} className="glass-input"
                  value={payAmount} onChange={e => setPayAmount(e.target.value)} />
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 4 }}>
                  الحد الأقصى: {payModal.remainingAmount.toFixed(3)} دينار
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">طريقة الدفع</label>
                <select className="glass-input" value={payMethod} onChange={e => setPayMethod(e.target.value)}>
                  {PAYMENT_METHODS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">ملاحظات (اختياري)</label>
                <input type="text" className="glass-input" value={payNotes} onChange={e => setPayNotes(e.target.value)} />
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button className="glass-btn" style={{ flex: 1 }} onClick={handlePay} disabled={isPaying}>
                  {isPaying ? <RefreshCw size={16} className="spin" /> : <><CheckCircle size={16} /> تأكيد الدفع</>}
                </button>
                <button className="glass-btn secondary" onClick={() => setPayModal(null)}>إلغاء</button>
              </div>
            </div>
          </div>
        )}

      </div>
    </PermissionGuard>
  );
};
