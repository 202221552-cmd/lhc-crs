import React, { useState, useEffect } from 'react';
import { Search, Save, BookOpen, GraduationCap, DollarSign, Calendar, CreditCard } from 'lucide-react';
import { useApi } from '../context/AuthContext';

export const DiplomaSubscriptionPage = () => {
  const { apiFetch } = useApi();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [diplomas, setDiplomas] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const [entities, setEntities] = useState<any[]>([]);
  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [studentsRes, diplomasRes, entitiesRes] = await Promise.all([
        apiFetch('/students?limit=500'),
        apiFetch('/diplomas'),
        apiFetch('/educational-entities')
      ]);
      setStudents(Array.isArray(studentsRes) ? studentsRes : (studentsRes.data || []));
      setDiplomas(diplomasRes);
      setEntities(entitiesRes);
    } catch (err) { console.error('Failed to fetch data', err); }
  };

  // Form State
  const [formData, setFormData] = useState({
    entityId: '',
    studyType: 'FACE_TO_FACE',
    diplomaId: '',
    date: new Date().toISOString().split('T')[0],
    status: 'ACTIVE',
    paymentType: 'FULL',
    installmentsCount: 1,
    firstInstallmentDate: new Date().toISOString().split('T')[0],
    notes: ''
  });

  // Financial State
  const [financials, setFinancials] = useState({
    baseFee: 500,
    hasTransport: false,
    transportFee: 50,
    hasSupplies: false,
    suppliesFee: 30,
    discountType: 'NONE' as 'NONE' | 'FIXED' | 'PERCENTAGE',
    discountValue: 0
  });

  const [totalCost, setTotalCost] = useState(0);

  // Calculate Total Cost
  useEffect(() => {
    let total = financials.baseFee;
    if (financials.hasTransport) total += financials.transportFee;
    if (financials.hasSupplies) total += financials.suppliesFee;

    if (financials.discountType === 'FIXED') {
      total -= financials.discountValue;
    } else if (financials.discountType === 'PERCENTAGE') {
      total -= (total * financials.discountValue) / 100;
    }

    setTotalCost(total > 0 ? total : 0);
  }, [financials]);

  const handleSave = async () => {
    if (!selectedStudent) { alert('الرجاء اختيار طالب أولاً'); return; }
    if (!formData.diplomaId) { alert('يرجى اختيار الدبلوم'); return; }
    if (totalCost <= 0) { alert('التكلفة الإجمالية يجب أن تكون أكبر من صفر'); return; }

    setIsLoading(true);
    try {
      await apiFetch('/subscriptions/diploma', {
        method: 'POST',
        body: JSON.stringify({
          studentId: selectedStudent.id,
          diplomaId: formData.diplomaId,
          entityId: formData.entityId || null,
          studyType: formData.studyType,
          baseFee: financials.baseFee,
          hasTransport: financials.hasTransport,
          transportFee: financials.transportFee,
          hasSupplies: financials.hasSupplies,
          suppliesFee: financials.suppliesFee,
          discountType: financials.discountType,
          discountValue: financials.discountValue,
          totalCost,
          paymentType: formData.paymentType,
          installmentsCount: formData.paymentType === 'INSTALLMENTS' ? formData.installmentsCount : 1,
          firstInstallmentDate: formData.firstInstallmentDate,
          status: formData.status,
          notes: formData.notes
        })
      });
      alert(`✅ تم تسجيل ${selectedStudent.fullNameAr} في الدبلوم بنجاح!\nالتكلفة: ${totalCost.toFixed(3)} دينار${formData.paymentType === 'INSTALLMENTS' ? `\nعدد الأقساط: ${formData.installmentsCount}` : ''}`);
      setSelectedStudent(null);
      setFormData({ entityId: '', diplomaId: '', studyType: 'FACE_TO_FACE', date: new Date().toISOString().split('T')[0], status: 'ACTIVE', paymentType: 'FULL', installmentsCount: 1, firstInstallmentDate: new Date().toISOString().split('T')[0], notes: '' });
      setFinancials({ baseFee: 500, hasTransport: false, transportFee: 50, hasSupplies: false, suppliesFee: 30, discountType: 'NONE', discountValue: 0 });
    } catch (err: any) {
      alert(err.message || 'تعذر الاتصال بالخادم');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grid-2" style={{ gap: '30px' }}>
      
      {/* Right Column: Student Search & Info & Schedule */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div className="glass-panel">
          <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Search size={20} color="var(--secondary-color)" />
            البحث عن طالب
          </h3>
          <div className="form-group">
            <input 
              type="text" 
              className="glass-input" 
              placeholder="ابحث برقم الطالب، الاسم، أو الهاتف..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          
          {searchQuery && (
            <div style={{ background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '8px' }}>
              {students.filter(s => s.fullNameAr?.includes(searchQuery) || s.phones?.some((p: string) => p.includes(searchQuery))).map(s => (
                <div 
                  key={s.id} 
                  style={{ padding: '10px', borderBottom: '1px solid var(--glass-border)', cursor: 'pointer' }}
                  onClick={() => { setSelectedStudent(s); setSearchQuery(''); }}
                >
                  <strong>{s.fullNameAr}</strong> - 0{s.phones?.[0]}
                </div>
              ))}
            </div>
          )}

          {selectedStudent && (
            <div style={{ marginTop: '20px', padding: '15px', background: 'rgba(74, 144, 226, 0.1)', border: '1px solid var(--primary-color)', borderRadius: '8px' }}>
              <h4 style={{ marginBottom: '10px' }}>معلومات الطالب المحدد:</h4>
              <p>الاسم: {selectedStudent.fullNameAr}</p>
              <p>رقم النظام: {selectedStudent.id}</p>
              <p>الحالة: {selectedStudent.status === 'ACTIVE' ? 'مستمر' : selectedStudent.status}</p>
            </div>
          )}
        </div>

        {/* Schedule */}
        <div className="glass-panel" style={{ flex: 1 }}>
          <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Calendar size={20} color="var(--primary-color)" />
            جدول الطالب
          </h3>
          {!selectedStudent ? (
            <p style={{ color: 'rgba(255,255,255,0.5)' }}>يرجى اختيار طالب لعرض جدوله.</p>
          ) : (
            <div className="glass-table-container">
              <table className="glass-table" style={{ fontSize: '0.9rem' }}>
                <thead>
                  <tr>
                    <th>المادة/الدورة</th>
                    <th>الأيام</th>
                    <th>الوقت</th>
                    <th>القاعة</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>لا يوجد مواد مسجلة حالياً</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Left Column: Subscription Form */}
      <div className="glass-panel" style={{ opacity: selectedStudent ? 1 : 0.5, pointerEvents: selectedStudent ? 'auto' : 'none' }}>
        <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <GraduationCap size={24} color="var(--secondary-color)" />
          الاشتراك في دبلوم
        </h3>

        <div className="form-group">
          <label className="form-label">الجهة التعليمية / الجامعة</label>
          <select className="glass-input" value={formData.entityId} onChange={e => setFormData({...formData, entityId: e.target.value})}>
            <option value="">-- بدون جهة --</option>
            {entities.map(en => <option key={en.id} value={en.id}>{en.name}</option>)}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">نوع الدراسة</label>
          <select 
            className="glass-input" 
            value={formData.studyType} 
            onChange={e => setFormData({...formData, studyType: e.target.value})}
          >
            <option value="FACE_TO_FACE">وجاهي</option>
            <option value="HYBRID">مدمج</option>
            <option value="ONLINE">إلكتروني</option>
          </select>
        </div>

        <div className="form-group">
          <label className="form-label"><span className="required-star">*</span>نوع البرنامج (الدبلوم)</label>
          <select 
            className="glass-input" 
            value={formData.diplomaId} 
            onChange={e => {
              const selectedId = e.target.value;
              setFormData({...formData, diplomaId: selectedId});
              const selectedDiploma = diplomas.find(d => d.id === selectedId);
              if (selectedDiploma) {
                setFinancials({...financials, baseFee: selectedDiploma.price});
              }
            }}
          >
            <option value="">-- اختر الدبلوم --</option>
            {diplomas.map(d => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid var(--glass-border)', margin: '20px 0' }} />
        
        <h4 style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <DollarSign size={18} color="var(--success)" />
          المالية والرسوم
        </h4>

        <div className="grid-2">
          <div className="form-group">
            <label className="form-label">رسوم الدبلوم الأساسية</label>
            <input 
              type="number" 
              className="glass-input" 
              value={financials.baseFee} 
              onChange={e => setFinancials({...financials, baseFee: Number(e.target.value)})}
            />
          </div>
          
          <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '10px', justifyContent: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <input 
                type="checkbox" 
                checked={financials.hasTransport} 
                onChange={e => setFinancials({...financials, hasTransport: e.target.checked})} 
                id="transport" 
              />
              <label htmlFor="transport">مواصلات</label>
              {financials.hasTransport && (
                <input 
                  type="number" 
                  className="glass-input" 
                  style={{ width: '80px', padding: '5px' }} 
                  value={financials.transportFee} 
                  onChange={e => setFinancials({...financials, transportFee: Number(e.target.value)})} 
                />
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <input 
                type="checkbox" 
                checked={financials.hasSupplies} 
                onChange={e => setFinancials({...financials, hasSupplies: e.target.checked})} 
                id="supplies" 
              />
              <label htmlFor="supplies">مستلزمات</label>
              {financials.hasSupplies && (
                <input 
                  type="number" 
                  className="glass-input" 
                  style={{ width: '80px', padding: '5px' }} 
                  value={financials.suppliesFee} 
                  onChange={e => setFinancials({...financials, suppliesFee: Number(e.target.value)})} 
                />
              )}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">نوع الخصم</label>
            <select 
              className="glass-input" 
              value={financials.discountType} 
              onChange={e => setFinancials({...financials, discountType: e.target.value as any})}
            >
              <option value="NONE">بدون خصم</option>
              <option value="FIXED">قيمة ثابتة</option>
              <option value="PERCENTAGE">نسبة مئوية (%)</option>
            </select>
          </div>

          {financials.discountType !== 'NONE' && (
            <div className="form-group">
              <label className="form-label">قيمة الخصم</label>
              <input 
                type="number" 
                className="glass-input" 
                value={financials.discountValue} 
                onChange={e => setFinancials({...financials, discountValue: Number(e.target.value)})}
              />
            </div>
          )}
        </div>

        <div className="form-group" style={{ background: 'rgba(46, 204, 113, 0.2)', padding: '15px', borderRadius: '8px', border: '1px solid var(--success)', textAlign: 'center', fontSize: '1.2rem', fontWeight: 'bold' }}>
          التكلفة الإجمالية: {totalCost.toFixed(2)} دينار
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid var(--glass-border)', margin: '20px 0' }} />

        <div className="grid-2">
          <div className="form-group">
            <label className="form-label">تاريخ الاشتراك</label>
            <input 
              type="date" 
              className="glass-input" 
              value={formData.date} 
              onChange={e => setFormData({...formData, date: e.target.value})}
            />
          </div>
          <div className="form-group">
            <label className="form-label">حالة الاشتراك</label>
            <select 
              className="glass-input" 
              value={formData.status} 
              onChange={e => setFormData({...formData, status: e.target.value})}
            >
              <option value="ACTIVE">فعال</option>
              <option value="PENDING">قيد الانتظار</option>
              <option value="CANCELED">ملغي</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">ملاحظات</label>
          <textarea 
            className="glass-input" 
            rows={3} 
            value={formData.notes} 
            onChange={e => setFormData({...formData, notes: e.target.value})}
          />
        </div>

        <button className="glass-btn" style={{ width: '100%', marginTop: '10px' }} onClick={handleSave} disabled={isLoading}>
          <Save size={18} /> {isLoading ? 'جاري التسجيل...' : 'حفظ اشتراك الدبلوم'}
        </button>

      </div>
    </div>
  );
};
