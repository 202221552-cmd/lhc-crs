import React, { useState } from 'react';
import { Search, User, FileText, Calendar, CreditCard, BookOpen, GraduationCap } from 'lucide-react';
import { useApi } from '../context/AuthContext';

export const StudentProfilePage = () => {
  const { apiFetch } = useApi();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const handleSearch = async (q: string) => {
    setSearchQuery(q);
    if (q.length < 2) { setShowDropdown(false); return; }
    try {
      const res = await apiFetch(`/students?query=${encodeURIComponent(q)}&limit=8`);
      setSearchResults(Array.isArray(res) ? res : (res.data || []));
      setShowDropdown(true);
    } catch {}
  };

  const selectStudent = async (s: any) => {
    setSelectedStudent(s);
    setSearchQuery(s.fullNameAr);
    setShowDropdown(false);
    setIsLoading(true);
    try {
      const fin = await apiFetch(`/finances/student/${s.id}`);
      setProfile(fin);
    } catch { setProfile(null); }
    finally { setIsLoading(false); }
  };

  const getPhone = (phones: any) => {
    try { return (typeof phones === 'string' ? JSON.parse(phones) : phones)?.[0] || '—'; } catch { return '—'; }
  };

  const ins = profile?.installments || [];
  const paid = ins.filter((i: any) => i.status === 'PAID').reduce((s: number, i: any) => s + i.paidAmount, 0);
  const remaining = ins.filter((i: any) => i.status !== 'PAID').reduce((s: number, i: any) => s + i.remainingAmount, 0);

  return (
    <div className="grid-2" style={{ gap: 28 }}>
      {/* Search Column */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div className="glass-panel">
          <h3 style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
            <Search size={20} color="var(--secondary-color)" /> البحث عن طالب
          </h3>
          <div style={{ position: 'relative' }}>
            <input type="text" className="glass-input"
              placeholder="ابحث بالاسم أو الهاتف..."
              value={searchQuery}
              onChange={e => handleSearch(e.target.value)}
            />
            {showDropdown && searchResults.length > 0 && (
              <div style={{ position: 'absolute', top: '100%', right: 0, left: 0, zIndex: 100, background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: 10, maxHeight: 220, overflowY: 'auto', backdropFilter: 'blur(20px)', marginTop: 4 }}>
                {searchResults.map(s => (
                  <div key={s.id} onClick={() => selectStudent(s)}
                    style={{ padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', gap: 10 }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--primary-light)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    <User size={14} color="var(--primary-color)" />
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{s.fullNameAr}</div>
                      <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>+962 {getPhone(s.phones)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {selectedStudent && (
            <div style={{ marginTop: 16, padding: '14px 16px', background: 'var(--primary-light)', border: '1px solid var(--primary-color)', borderRadius: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary-color), var(--secondary-color))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem' }}>
                  👤
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '1rem' }}>{selectedStudent.fullNameAr}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>+962 {getPhone(selectedStudent.phones)}</div>
                  <span className={`badge ${selectedStudent.status === 'ACTIVE' ? 'success' : 'danger'}`} style={{ fontSize: '0.72rem' }}>
                    {selectedStudent.status === 'ACTIVE' ? 'مستمر' : selectedStudent.status}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Financial Summary */}
        {profile && (
          <div className="glass-panel" style={{ padding: '18px 22px' }}>
            <h4 style={{ marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
              <CreditCard size={16} color="var(--success)" /> الملخص المالي
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>إجمالي المدفوع:</span>
                <strong style={{ color: 'var(--success)' }}>{paid.toFixed(3)} د</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>المتبقي:</span>
                <strong style={{ color: remaining > 0 ? 'var(--danger)' : 'var(--success)' }}>{remaining.toFixed(3)} د</strong>
              </div>
              <div style={{ height: 1, background: 'var(--glass-border)', margin: '4px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>عدد الأقساط:</span>
                <strong>{ins.length}</strong>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Profile Column */}
      <div className="glass-panel" style={{ opacity: selectedStudent ? 1 : 0.5, pointerEvents: selectedStudent ? 'auto' : 'none' }}>
        <h3 style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
          <FileText size={22} color="var(--primary-color)" /> الملف الكامل للطالب
        </h3>

        {isLoading ? (
          <div style={{ textAlign: 'center', padding: 40, opacity: 0.5 }}>جارٍ تحميل البيانات...</div>
        ) : !selectedStudent ? (
          <div style={{ textAlign: 'center', padding: 40, opacity: 0.4 }}>
            <Search size={40} style={{ marginBottom: 10 }} />
            <p>ابحث عن طالب لعرض ملفه</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Subscriptions */}
            <div style={{ background: 'var(--card-bg)', padding: '14px 16px', borderRadius: 10 }}>
              <h4 style={{ marginBottom: 10, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                <GraduationCap size={15} color="var(--secondary-color)" /> الاشتراكات
              </h4>
              {profile?.subscriptions?.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {profile.subscriptions.map((sub: any) => (
                    <div key={sub.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', padding: '6px 0', borderBottom: '1px solid var(--glass-border)' }}>
                      <span>{sub.diploma?.name || sub.course?.name || 'اشتراك'}</span>
                      <span style={{ color: 'var(--success)' }}>{sub.totalCost?.toFixed(3)} د</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>لا توجد اشتراكات بعد</p>
              )}
            </div>

            {/* Installments */}
            <div style={{ background: 'var(--card-bg)', padding: '14px 16px', borderRadius: 10 }}>
              <h4 style={{ marginBottom: 10, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                <CreditCard size={15} color="var(--warning)" /> جدول الأقساط
              </h4>
              {ins.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {ins.slice(0, 8).map((inst: any) => (
                    <div key={inst.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.82rem', padding: '5px 0', borderBottom: '1px solid var(--glass-border)' }}>
                      <span style={{ color: 'var(--text-muted)' }}>قسط {inst.installmentNumber}</span>
                      <span>{inst.amount?.toFixed(3)} د</span>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{new Date(inst.dueDate).toLocaleDateString('ar-JO')}</span>
                      <span className={`badge ${inst.status === 'PAID' ? 'success' : inst.status === 'OVERDUE' ? 'danger' : 'warning'}`} style={{ fontSize: '0.7rem' }}>
                        {inst.status === 'PAID' ? 'مدفوع' : inst.status === 'OVERDUE' ? 'متأخر' : 'معلق'}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>لا توجد أقساط</p>
              )}
            </div>

            {/* Notes */}
            {selectedStudent.notes && (
              <div style={{ background: 'var(--card-bg)', padding: '14px 16px', borderRadius: 10 }}>
                <h4 style={{ marginBottom: 8, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <FileText size={15} color="var(--text-muted)" /> ملاحظات
                </h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>{selectedStudent.notes}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
