import React, { useState, useEffect } from 'react';
import { Search, Save, BookOpen, DollarSign, CreditCard, User } from 'lucide-react';
import { useApi } from '../context/AuthContext';

export const CourseSubscriptionPage = () => {
  const { apiFetch } = useApi();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [courses, setCourses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const [form, setForm] = useState({
    courseId: '',
    studyType: 'FACE_TO_FACE',
    date: new Date().toISOString().split('T')[0],
    status: 'ACTIVE',
    paymentType: 'FULL',
    installmentsCount: 1,
    firstInstallmentDate: new Date().toISOString().split('T')[0],
    notes: '',
  });

  const [financials, setFinancials] = useState({
    baseFee: 150,
    hasTransport: false,
    transportFee: 50,
    hasSupplies: false,
    suppliesFee: 30,
    discountType: 'NONE' as 'NONE' | 'FIXED' | 'PERCENTAGE',
    discountValue: 0,
  });

  const [totalCost, setTotalCost] = useState(0);

  useEffect(() => {
    apiFetch('/courses').then(setCourses).catch(console.error);
  }, []);

  useEffect(() => {
    let total = financials.baseFee;
    if (financials.hasTransport) total += financials.transportFee;
    if (financials.hasSupplies) total += financials.suppliesFee;
    if (financials.discountType === 'FIXED') total -= financials.discountValue;
    else if (financials.discountType === 'PERCENTAGE') total -= (total * financials.discountValue) / 100;
    setTotalCost(total > 0 ? total : 0);
  }, [financials]);

  const searchStudents = async (q: string) => {
    setSearchQuery(q);
    if (q.length < 2) { setShowDropdown(false); return; }
    try {
      const res = await apiFetch(`/students?query=${encodeURIComponent(q)}&limit=10`);
      setStudents(Array.isArray(res) ? res : (res.data || []));
      setShowDropdown(true);
    } catch {}
  };

  const selectStudent = (s: any) => {
    setSelectedStudent(s);
    setSearchQuery(s.fullNameAr);
    setShowDropdown(false);
  };

  const getPhone = (phones: any) => {
    try { return (typeof phones === 'string' ? JSON.parse(phones) : phones)?.[0] || ''; } catch { return ''; }
  };

  const handleSave = async () => {
    if (!selectedStudent) return alert('الرجاء اختيار طالب أولاً');
    if (!form.courseId) return alert('يرجى اختيار الدورة');
    if (totalCost <= 0) return alert('التكلفة يجب أن تكون أكبر من صفر');

    setIsLoading(true);
    try {
      await apiFetch('/subscriptions/course', {
        method: 'POST',
        body: JSON.stringify({
          studentId: selectedStudent.id,
          courseId: form.courseId,
          studyType: form.studyType,
          baseFee: financials.baseFee,
          hasTransport: financials.hasTransport,
          transportFee: financials.transportFee,
          hasSupplies: financials.hasSupplies,
          suppliesFee: financials.suppliesFee,
          discountType: financials.discountType,
          discountValue: financials.discountValue,
          totalCost,
          paymentType: form.paymentType,
          installmentsCount: form.paymentType === 'INSTALLMENTS' ? form.installmentsCount : 1,
          firstInstallmentDate: form.firstInstallmentDate,
          status: form.status,
          notes: form.notes,
        })
      });
      alert(`✅ تم تسجيل ${selectedStudent.fullNameAr} في الدورة بنجاح!\nالتكلفة: ${totalCost.toFixed(3)} دينار${form.paymentType === 'INSTALLMENTS' ? `\nعدد الأقساط: ${form.installmentsCount}` : ''}`);
      setSelectedStudent(null);
      setSearchQuery('');
      setForm({ courseId: '', studyType: 'FACE_TO_FACE', date: new Date().toISOString().split('T')[0], status: 'ACTIVE', paymentType: 'FULL', installmentsCount: 1, firstInstallmentDate: new Date().toISOString().split('T')[0], notes: '' });
      setFinancials({ baseFee: 150, hasTransport: false, transportFee: 50, hasSupplies: false, suppliesFee: 30, discountType: 'NONE', discountValue: 0 });
    } catch (e: any) {
      alert(e.message || 'تعذر الاتصال بالخادم');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grid-2" style={{ gap: 28 }}>

      {/* Student Search Panel */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div className="glass-panel">
          <h3 style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
            <Search size={20} color="var(--secondary-color)" /> البحث عن طالب
          </h3>
          <div style={{ position: 'relative' }}>
            <input type="text" className="glass-input"
              placeholder="ابحث بالاسم أو الهاتف..."
              value={searchQuery}
              onChange={e => searchStudents(e.target.value)}
            />
            {showDropdown && students.length > 0 && (
              <div style={{ position: 'absolute', top: '100%', right: 0, left: 0, zIndex: 100, background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: 10, maxHeight: 220, overflowY: 'auto', backdropFilter: 'blur(20px)', marginTop: 4 }}>
                {students.map(s => (
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
              <div style={{ fontWeight: 700 }}>{selectedStudent.fullNameAr}</div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: 4 }}>
                +962 {getPhone(selectedStudent.phones)} •{' '}
                <span className={`badge ${selectedStudent.status === 'ACTIVE' ? 'success' : 'danger'}`} style={{ fontSize: '0.72rem' }}>
                  {selectedStudent.status === 'ACTIVE' ? 'نشط' : selectedStudent.status}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Course Quick Info */}
        {form.courseId && (
          <div className="glass-panel" style={{ padding: '16px 20px' }}>
            <h4 style={{ marginBottom: 12, fontSize: '0.9rem' }}>📘 تفاصيل الدورة المختارة</h4>
            {courses.filter(c => c.id === form.courseId).map(c => (
              <div key={c.id} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ fontWeight: 700 }}>{c.name}</div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{c.description || 'لا يوجد وصف'}</div>
                <div style={{ color: 'var(--success)', fontWeight: 600 }}>{c.price?.toFixed(3)} دينار</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Subscription Form */}
      <div className="glass-panel" style={{ opacity: selectedStudent ? 1 : 0.6, pointerEvents: selectedStudent ? 'auto' : 'none' }}>
        <h3 style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
          <BookOpen size={22} color="var(--secondary-color)" /> الاشتراك في دورة
        </h3>

        <div className="form-group">
          <label className="form-label">الدورة <span className="required-star">*</span></label>
          <select className="glass-input" value={form.courseId}
            onChange={e => {
              const c = courses.find(c => c.id === e.target.value);
              setForm({ ...form, courseId: e.target.value });
              if (c) setFinancials({ ...financials, baseFee: c.price || 150 });
            }}>
            <option value="">-- اختر الدورة --</option>
            {courses.map(c => <option key={c.id} value={c.id}>{c.name} — {c.price?.toFixed(3)} د</option>)}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">نوع الدراسة</label>
          <select className="glass-input" value={form.studyType} onChange={e => setForm({ ...form, studyType: e.target.value })}>
            <option value="FACE_TO_FACE">وجاهي</option>
            <option value="HYBRID">مدمج</option>
            <option value="ONLINE">إلكتروني</option>
          </select>
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid var(--glass-border)', margin: '16px 0' }} />
        <h4 style={{ marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
          <DollarSign size={16} color="var(--success)" /> الرسوم المالية
        </h4>

        <div className="grid-2" style={{ gap: 12 }}>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">رسوم الدورة الأساسية</label>
            <input type="number" className="glass-input" value={financials.baseFee}
              onChange={e => setFinancials({ ...financials, baseFee: Number(e.target.value) })} />
          </div>
          <div className="form-group" style={{ margin: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 8 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem' }}>
              <input type="checkbox" checked={financials.hasTransport} onChange={e => setFinancials({ ...financials, hasTransport: e.target.checked })} />
              مواصلات (+{financials.transportFee})
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem' }}>
              <input type="checkbox" checked={financials.hasSupplies} onChange={e => setFinancials({ ...financials, hasSupplies: e.target.checked })} />
              مستلزمات (+{financials.suppliesFee})
            </label>
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">نوع الخصم</label>
            <select className="glass-input" value={financials.discountType} onChange={e => setFinancials({ ...financials, discountType: e.target.value as any })}>
              <option value="NONE">بدون خصم</option>
              <option value="FIXED">قيمة ثابتة</option>
              <option value="PERCENTAGE">نسبة مئوية (%)</option>
            </select>
          </div>
          {financials.discountType !== 'NONE' && (
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">قيمة الخصم</label>
              <input type="number" className="glass-input" value={financials.discountValue}
                onChange={e => setFinancials({ ...financials, discountValue: Number(e.target.value) })} />
            </div>
          )}
        </div>

        <div style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid var(--success)', borderRadius: 10, padding: '14px 20px', textAlign: 'center', marginTop: 12, fontSize: '1.2rem', fontWeight: 800, color: 'var(--success)' }}>
          التكلفة الإجمالية: {totalCost.toFixed(3)} دينار
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid var(--glass-border)', margin: '16px 0' }} />

        {/* Payment Type */}
        <div className="form-group">
          <label className="form-label"><CreditCard size={14} style={{ display: 'inline', marginLeft: 4 }} />طريقة الدفع</label>
          <select className="glass-input" value={form.paymentType} onChange={e => setForm({ ...form, paymentType: e.target.value })}>
            <option value="FULL">دفعة واحدة كاملة</option>
            <option value="INSTALLMENTS">أقساط</option>
          </select>
        </div>
        {form.paymentType === 'INSTALLMENTS' && (
          <div className="grid-2" style={{ gap: 12 }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">عدد الأقساط</label>
              <input type="number" min="2" max="12" className="glass-input" value={form.installmentsCount}
                onChange={e => setForm({ ...form, installmentsCount: parseInt(e.target.value) || 1 })} />
              <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: 4 }}>
                كل قسط: {(totalCost / form.installmentsCount).toFixed(3)} دينار
              </div>
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">تاريخ القسط الأول</label>
              <input type="date" className="glass-input" value={form.firstInstallmentDate}
                onChange={e => setForm({ ...form, firstInstallmentDate: e.target.value })} />
            </div>
          </div>
        )}

        <div className="grid-2" style={{ gap: 12, marginTop: 4 }}>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">تاريخ الاشتراك</label>
            <input type="date" className="glass-input" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">حالة الاشتراك</label>
            <select className="glass-input" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
              <option value="ACTIVE">فعال</option>
              <option value="PENDING">قيد الانتظار</option>
              <option value="CANCELED">ملغي</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">ملاحظات</label>
          <textarea className="glass-input" rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
        </div>

        <button className="glass-btn" style={{ width: '100%', marginTop: 8 }} onClick={handleSave} disabled={isLoading}>
          <Save size={16} /> {isLoading ? 'جارٍ التسجيل...' : 'حفظ اشتراك الدورة'}
        </button>
      </div>
    </div>
  );
};
