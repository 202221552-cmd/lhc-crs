import React, { useState, useCallback } from 'react';
import { Search, User, CreditCard, CheckCircle, Clock, AlertTriangle, DollarSign, BookOpen, GraduationCap } from 'lucide-react';
import { useApi } from '../context/AuthContext';
import { PermissionGuard } from '../components/PermissionGuard';

interface StudentFinancialProfile {
  student: any;
  transactions: any[];
  installments: any[];
  summary: { totalCost: number; totalPaid: number; totalRemaining: number };
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'var(--warning)', PAID: 'var(--success)', PARTIAL: 'var(--info)', OVERDUE: 'var(--danger)'
};
const STATUS_LABELS: Record<string, string> = {
  PENDING: 'معلّق', PAID: 'مدفوع', PARTIAL: 'جزئي', OVERDUE: 'متأخر'
};

export const FinStudentPage = () => {
  const { apiFetch } = useApi();
  const [searchQuery, setSearchQuery] = useState('');
  const [students, setStudents] = useState<any[]>([]);
  const [showList, setShowList] = useState(false);
  const [profile, setProfile] = useState<StudentFinancialProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSearch = useCallback(async () => {
    if (searchQuery.length < 2) return;
    try {
      const res = await apiFetch(`/students?query=${encodeURIComponent(searchQuery)}`);
      setStudents(res.data || res);
      setShowList(true);
    } catch {}
  }, [searchQuery]);

  const loadProfile = async (studentId: string) => {
    setIsLoading(true);
    setShowList(false);
    try {
      const data = await apiFetch(`/finances/student/${studentId}`);
      setProfile(data);
    } catch (e: any) { alert(e.message); }
    finally { setIsLoading(false); }
  };

  const getPhone = (phones: any) => {
    try { const p = typeof phones === 'string' ? JSON.parse(phones) : phones; return p?.[0] || ''; }
    catch { return ''; }
  };

  return (
    <PermissionGuard perm="finance.view">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

        {/* Search */}
        <div className="glass-panel" style={{ padding: '20px 24px' }}>
          <h3 style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
            <User size={20} color="var(--primary-color)" /> الملف المالي للطالب
          </h3>
          <div style={{ position: 'relative', maxWidth: 500 }}>
            <Search size={16} style={{ position: 'absolute', right: 12, top: 14, color: 'var(--text-muted)' }} />
            <input type="text" className="glass-input" style={{ paddingRight: 38 }}
              placeholder="ابحث بالاسم أو الهاتف أو الرقم الوطني..."
              value={searchQuery}
              onChange={e => { setSearchQuery(e.target.value); if (e.target.value.length >= 2) handleSearch(); }}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
            />
            {showList && students.length > 0 && (
              <div style={{ position: 'absolute', top: '100%', right: 0, left: 0, zIndex: 100, background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: 10, maxHeight: 250, overflowY: 'auto', backdropFilter: 'blur(20px)', marginTop: 4 }}>
                {students.slice(0, 10).map(s => (
                  <div key={s.id} onClick={() => { loadProfile(s.id); setSearchQuery(s.fullNameAr); }}
                    style={{ padding: '12px 16px', cursor: 'pointer', borderBottom: '1px solid var(--glass-border)' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--primary-light)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <div style={{ fontWeight: 600 }}>{s.fullNameAr}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>+962 {getPhone(s.phones)}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {isLoading && (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>جارٍ التحميل...</div>
        )}

        {profile && !isLoading && (
          <>
            {/* Summary Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
              {[
                { label: 'إجمالي التكلفة', value: profile.summary.totalCost, color: 'var(--text-primary)', icon: BookOpen },
                { label: 'المدفوع', value: profile.summary.totalPaid, color: 'var(--success)', icon: CheckCircle },
                { label: 'المتبقي', value: profile.summary.totalRemaining, color: profile.summary.totalRemaining > 0 ? 'var(--danger)' : 'var(--success)', icon: CreditCard },
              ].map(card => (
                <div key={card.label} className="glass-panel" style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <card.icon size={22} color={card.color} />
                  </div>
                  <div style={{ fontSize: '1.6rem', fontWeight: 800, color: card.color }}>
                    {card.value.toFixed(3)} <span style={{ fontSize: '0.8rem', fontWeight: 400 }}>دينار</span>
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{card.label}</div>
                </div>
              ))}
            </div>

            {/* Student Info */}
            <div className="glass-panel" style={{ padding: '20px 24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>{profile.student?.fullNameAr}</h3>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: 4 }}>
                    {profile.student?.fullNameEn} • +962 {getPhone(profile.student?.phones)}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {(profile.student?.diplomaSubscriptions || []).map((ds: any) => (
                    <span key={ds.id} className="badge primary" style={{ fontSize: '0.78rem' }}>
                      <GraduationCap size={11} /> {ds.diploma?.name}
                    </span>
                  ))}
                  {(profile.student?.courseSubscriptions || []).map((cs: any) => (
                    <span key={cs.id} className="badge" style={{ fontSize: '0.78rem', background: 'rgba(0,200,100,0.12)', color: 'var(--success)' }}>
                      <BookOpen size={11} /> {cs.course?.name}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid-2" style={{ gap: 24 }}>
              {/* Installment Schedule */}
              <div className="glass-panel">
                <h4 style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Clock size={18} color="var(--primary-color)" /> جدول الأقساط
                </h4>
                <div className="glass-table-container">
                  <table className="glass-table" style={{ fontSize: '0.85rem' }}>
                    <thead>
                      <tr><th>القسط</th><th>الاستحقاق</th><th>الكلي</th><th>المدفوع</th><th>المتبقي</th><th>الحالة</th></tr>
                    </thead>
                    <tbody>
                      {profile.installments.map(inst => (
                        <tr key={inst.id}>
                          <td>{inst.installmentNumber}/{inst.totalInstallments}</td>
                          <td style={{ color: inst.status === 'OVERDUE' ? 'var(--danger)' : undefined }}>
                            {new Date(inst.dueDate).toLocaleDateString('ar-JO')}
                          </td>
                          <td>{inst.amount.toFixed(3)}</td>
                          <td style={{ color: 'var(--success)' }}>{inst.paidAmount.toFixed(3)}</td>
                          <td style={{ color: inst.remainingAmount > 0 ? 'var(--danger)' : 'var(--success)', fontWeight: 600 }}>{inst.remainingAmount.toFixed(3)}</td>
                          <td>
                            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: STATUS_COLORS[inst.status] || '#fff' }}>
                              {STATUS_LABELS[inst.status] || inst.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                      {profile.installments.length === 0 && (
                        <tr><td colSpan={6} style={{ textAlign: 'center', opacity: 0.5, padding: 16 }}>لا توجد أقساط</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Transaction History */}
              <div className="glass-panel">
                <h4 style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <DollarSign size={18} color="var(--success)" /> سجل المدفوعات
                </h4>
                <div className="glass-table-container">
                  <table className="glass-table" style={{ fontSize: '0.85rem' }}>
                    <thead>
                      <tr><th>#سند</th><th>المبلغ</th><th>الطريقة</th><th>التاريخ</th><th>البيان</th></tr>
                    </thead>
                    <tbody>
                      {profile.transactions.map(tx => (
                        <tr key={tx.id}>
                          <td><strong>#{tx.receiptNumber}</strong></td>
                          <td style={{ color: tx.type === 'RECEIPT' ? 'var(--success)' : 'var(--danger)', fontWeight: 600 }}>
                            {tx.type === 'RECEIPT' ? '+' : '-'}{tx.amount.toFixed(3)}
                          </td>
                          <td>{tx.paymentMethod}</td>
                          <td>{new Date(tx.date).toLocaleDateString('ar-JO')}</td>
                          <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tx.notes || '—'}</td>
                        </tr>
                      ))}
                      {profile.transactions.length === 0 && (
                        <tr><td colSpan={5} style={{ textAlign: 'center', opacity: 0.5, padding: 16 }}>لا توجد معاملات</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </>
        )}

        {!profile && !isLoading && (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
            <User size={52} style={{ opacity: 0.3, marginBottom: 12 }} />
            <p>ابحث عن طالب لعرض ملفّه المالي</p>
          </div>
        )}

      </div>
    </PermissionGuard>
  );
};
