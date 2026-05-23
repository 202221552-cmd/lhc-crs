import React, { useState, useEffect, useCallback } from 'react';
import { FileText, Printer, Plus, Search, RefreshCw, CheckCircle, XCircle, DollarSign } from 'lucide-react';
import { useAuth, useApi } from '../context/AuthContext';
import { PermissionGuard } from '../components/PermissionGuard';

interface Student { id: string; fullNameAr: string; fullNameEn?: string; phones: string[] | string; }
interface Transaction {
  id: string; receiptNumber: number; studentId: string; amount: number;
  paymentMethod: string; type: string; status: string; date: string; notes?: string;
  student?: Student;
}

const PAYMENT_METHODS = [
  { value: 'CASH', label: 'نقدي (كاش)' },
  { value: 'BANK', label: 'حوالة بنكية' },
  { value: 'CARD', label: 'فيزا / ماستركارد' },
  { value: 'TRANSFER', label: 'تحويل إلكتروني' },
];

export const FinReceiptsPage = () => {
  const { token } = useAuth();
  const { apiFetch } = useApi();

  const [students, setStudents] = useState<Student[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [studentSearch, setStudentSearch] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showStudentList, setShowStudentList] = useState(false);
  const [printMode, setPrintMode] = useState<Transaction | null>(null);

  const [form, setForm] = useState({
    amount: '',
    paymentMethod: 'CASH',
    notes: '',
  });

  const fetchStudents = useCallback(async () => {
    try {
      const res = await apiFetch(`/students?query=${encodeURIComponent(studentSearch)}`);
      setStudents(res.data || res);
    } catch {}
  }, [studentSearch]);

  const fetchReceipts = useCallback(async () => {
    try {
      const data = await apiFetch('/finances?type=RECEIPT');
      setTransactions(data);
    } catch {}
  }, []);

  useEffect(() => { fetchReceipts(); }, []);
  useEffect(() => {
    if (studentSearch.length >= 2) { fetchStudents(); setShowStudentList(true); }
    else { setShowStudentList(false); }
  }, [studentSearch]);

  const handleSubmit = async () => {
    if (!selectedStudent) return alert('يرجى اختيار الطالب');
    if (!form.amount || parseFloat(form.amount) <= 0) return alert('يرجى إدخال مبلغ صحيح');
    setIsLoading(true);
    try {
      const tx = await apiFetch('/finances/receipt', {
        method: 'POST',
        body: JSON.stringify({ studentId: selectedStudent.id, amount: parseFloat(form.amount), paymentMethod: form.paymentMethod, notes: form.notes })
      });
      await fetchReceipts();
      setPrintMode(tx);
      setForm({ amount: '', paymentMethod: 'CASH', notes: '' });
      setSelectedStudent(null);
      setStudentSearch('');
    } catch (e: any) { alert(e.message); }
    finally { setIsLoading(false); }
  };

  const handleVoid = async (id: string) => {
    if (!confirm('هل أنت متأكد من إلغاء هذا السند؟')) return;
    try { await apiFetch(`/finances/${id}/void`, { method: 'PUT', body: JSON.stringify({ reason: 'إلغاء يدوي' }) }); await fetchReceipts(); }
    catch (e: any) { alert(e.message); }
  };

  const getStudentPhone = (s: Student) => {
    try { const phones = typeof s.phones === 'string' ? JSON.parse(s.phones) : s.phones; return phones?.[0] || ''; }
    catch { return ''; }
  };

  return (
    <PermissionGuard perm="finance.receipts">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

        {/* Print Receipt Modal */}
        {printMode && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
            <div className="glass-panel" style={{ width: 480, direction: 'rtl' }} id="receipt-print">
              <div style={{ textAlign: 'center', marginBottom: 24 }}>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>🧾 سند قبض</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>رقم السند: #{printMode.receiptNumber}</p>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
                {[
                  ['المبلغ', `${printMode.amount.toFixed(3)} دينار`],
                  ['طريقة الدفع', PAYMENT_METHODS.find(m => m.value === printMode.paymentMethod)?.label || printMode.paymentMethod],
                  ['التاريخ', new Date(printMode.date).toLocaleDateString('ar-JO')],
                  ['الحالة', printMode.status === 'COMPLETED' ? 'مكتمل' : 'ملغاة'],
                  ...(printMode.notes ? [['البيان', printMode.notes]] : [])
                ].map(([k, v]) => (
                  <div key={k} style={{ background: 'var(--card-bg)', borderRadius: 8, padding: '10px 14px' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{k}</div>
                    <div style={{ fontWeight: 600 }}>{v}</div>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="glass-btn" onClick={() => window.print()} style={{ flex: 1 }}>
                  <Printer size={16} /> طباعة
                </button>
                <button className="glass-btn secondary" onClick={() => setPrintMode(null)} style={{ flex: 1 }}>
                  إغلاق
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="grid-2" style={{ gap: 24 }}>
          {/* Create Receipt Form */}
          <div className="glass-panel">
            <h3 style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
              <Plus size={20} color="var(--primary-color)" /> إنشاء سند قبض
            </h3>

            {/* Student Search */}
            <div className="form-group" style={{ position: 'relative' }}>
              <label className="form-label">الطالب <span className="required-star">*</span></label>
              <div style={{ position: 'relative' }}>
                <Search size={16} style={{ position: 'absolute', right: 12, top: 14, color: 'var(--text-muted)' }} />
                <input
                  type="text" className="glass-input" style={{ paddingRight: 38 }}
                  placeholder="ابحث بالاسم أو الهاتف..."
                  value={selectedStudent ? selectedStudent.fullNameAr : studentSearch}
                  onChange={e => { setSelectedStudent(null); setStudentSearch(e.target.value); }}
                  onFocus={() => studentSearch.length >= 2 && setShowStudentList(true)}
                />
              </div>
              {showStudentList && students.length > 0 && (
                <div style={{ position: 'absolute', top: '100%', right: 0, left: 0, zIndex: 100, background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: 10, maxHeight: 200, overflowY: 'auto', backdropFilter: 'blur(20px)' }}>
                  {students.slice(0, 10).map(s => (
                    <div key={s.id} onClick={() => { setSelectedStudent(s); setShowStudentList(false); setStudentSearch(''); }}
                      style={{ padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid var(--glass-border)', fontSize: '0.9rem' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'var(--primary-light)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      <div style={{ fontWeight: 600 }}>{s.fullNameAr}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', direction: 'ltr', textAlign: 'right' }}>
                        +962 {getStudentPhone(s)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {selectedStudent && (
              <div style={{ background: 'var(--primary-light)', borderRadius: 8, padding: '10px 14px', marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 600, color: 'var(--primary-color)' }}>{selectedStudent.fullNameAr}</span>
                <button onClick={() => setSelectedStudent(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)' }}>✕</button>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">المبلغ (دينار) <span className="required-star">*</span></label>
              <input type="number" min="0" step="0.001" className="glass-input" placeholder="0.000"
                value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} />
            </div>

            <div className="form-group">
              <label className="form-label">طريقة الدفع</label>
              <select className="glass-input" value={form.paymentMethod} onChange={e => setForm({ ...form, paymentMethod: e.target.value })}>
                {PAYMENT_METHODS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">البيان / الملاحظات</label>
              <textarea className="glass-input" rows={3} placeholder="سبب الدفع أو ملاحظات..."
                value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
            </div>

            <button className="glass-btn" style={{ width: '100%' }} onClick={handleSubmit} disabled={isLoading}>
              {isLoading ? <RefreshCw size={16} className="spin" /> : <><DollarSign size={16} /> حفظ وطباعة السند</>}
            </button>
          </div>

          {/* Recent Receipts */}
          <div className="glass-panel">
            <h3 style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'space-between' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <FileText size={20} color="var(--secondary-color)" /> آخر سندات القبض
              </span>
              <button className="glass-btn secondary sm" onClick={fetchReceipts}><RefreshCw size={14} /></button>
            </h3>
            <div className="glass-table-container">
              <table className="glass-table">
                <thead>
                  <tr>
                    <th>رقم السند</th>
                    <th>الطالب</th>
                    <th>المبلغ</th>
                    <th>الطريقة</th>
                    <th>التاريخ</th>
                    <th>الحالة</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.slice(0, 20).map(tx => (
                    <tr key={tx.id}>
                      <td><strong>#{tx.receiptNumber}</strong></td>
                      <td style={{ fontSize: '0.85rem' }}>{(tx.student as any)?.fullNameAr || '—'}</td>
                      <td><strong style={{ color: 'var(--success)' }}>{tx.amount.toFixed(3)}</strong></td>
                      <td style={{ fontSize: '0.8rem' }}>{PAYMENT_METHODS.find(m => m.value === tx.paymentMethod)?.label || tx.paymentMethod}</td>
                      <td style={{ fontSize: '0.8rem' }}>{new Date(tx.date).toLocaleDateString('ar-JO')}</td>
                      <td>
                        <span className={`badge ${tx.status === 'COMPLETED' ? 'success' : 'danger'}`}>
                          {tx.status === 'COMPLETED' ? <><CheckCircle size={11} /> مكتمل</> : <><XCircle size={11} /> ملغاة</>}
                        </span>
                      </td>
                      <td>
                        {tx.status === 'COMPLETED' && (
                          <button className="glass-btn secondary sm" onClick={() => setPrintMode(tx)} title="طباعة">
                            <Printer size={13} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {transactions.length === 0 && (
                    <tr><td colSpan={7} style={{ textAlign: 'center', opacity: 0.5, padding: 24 }}>لا توجد سندات</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </PermissionGuard>
  );
};
