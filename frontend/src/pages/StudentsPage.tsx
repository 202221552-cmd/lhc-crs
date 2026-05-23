import React, { useState, useEffect } from 'react';
import { Search, Save, RefreshCw, Users, Trash2 } from 'lucide-react';
import { useApi } from '../context/AuthContext';

interface Student {
  id: string;
  fullNameAr: string;
  fullNameEn?: string;
  dob: string;
  nationality: 'JO' | 'OTHER';
  nationalId?: string;
  passportId?: string;
  phones: any;
  whatsappOnly?: any;
  address?: string;
  studentType: 'UNIVERSITY' | 'HIGH_SCHOOL' | 'EMPLOYEE' | 'OTHER';
  universityName?: string;
  universityId?: string;
  status: 'ACTIVE' | 'POSTPONED' | 'WITHDRAWN' | 'CANCELED' | 'FINISHED';
  marketerName?: string;
  notes?: string;
}

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  ACTIVE: { label: 'مستمر', cls: 'success' },
  POSTPONED: { label: 'مؤجل', cls: 'warning' },
  WITHDRAWN: { label: 'منسحب', cls: 'danger' },
  CANCELED: { label: 'ملغي', cls: 'danger' },
  FINISHED: { label: 'أنهى', cls: 'secondary' },
};

export const StudentsPage = () => {
  const { apiFetch } = useApi();
  const [students, setStudents] = useState<Student[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);

  const [form, setForm] = useState<Partial<Student>>({
    nationality: 'JO', studentType: 'UNIVERSITY', status: 'ACTIVE',
    phones: [''], whatsappOnly: [false],
  });

  useEffect(() => { loadStudents(); }, []);

  const loadStudents = async (q = '') => {
    try {
      const res = await apiFetch(`/students?query=${encodeURIComponent(q)}&limit=200`);
      if (Array.isArray(res)) { setStudents(res); setTotalCount(res.length); }
      else { setStudents(res.data || []); setTotalCount(res.total || 0); }
    } catch (err) { console.error(err); }
  };

  const getPhone = (phones: any): string => {
    try {
      const arr = typeof phones === 'string' ? JSON.parse(phones) : phones;
      return arr?.[0] || '—';
    } catch { return '—'; }
  };

  const getPhoneArr = (phones: any): string[] => {
    try {
      return typeof phones === 'string' ? JSON.parse(phones) : (phones || ['']);
    } catch { return ['']; }
  };

  const getWaArr = (wa: any): boolean[] => {
    try {
      return typeof wa === 'string' ? JSON.parse(wa) : (wa || [false]);
    } catch { return [false]; }
  };

  const handleSelect = (s: Student) => {
    setSelectedStudent(s);
    setForm({
      ...s,
      phones: getPhoneArr(s.phones),
      whatsappOnly: getWaArr(s.whatsappOnly),
    });
  };

  const handleNew = () => {
    setSelectedStudent(null);
    setForm({ nationality: 'JO', studentType: 'UNIVERSITY', status: 'ACTIVE', phones: [''], whatsappOnly: [false] });
  };

  const handlePhoneChange = (i: number, val: string) => {
    const phones = [...getPhoneArr(form.phones)];
    phones[i] = val.replace(/^0/, '');
    setForm({ ...form, phones });
  };

  const handleWaChange = (i: number, val: boolean) => {
    const wa = [...getWaArr(form.whatsappOnly)];
    wa[i] = val;
    setForm({ ...form, whatsappOnly: wa });
  };

  const addPhone = () => {
    const phones = getPhoneArr(form.phones);
    if (phones.length < 3) {
      setForm({ ...form, phones: [...phones, ''], whatsappOnly: [...getWaArr(form.whatsappOnly), false] });
    }
  };

  const handleSave = async () => {
    if (!form.fullNameAr || !form.dob) return alert('يرجى تعبئة الاسم بالعربي وتاريخ الميلاد');
    if (form.nationality === 'JO' && (!form.nationalId || !/^\d{10}$/.test(form.nationalId))) {
      return alert('الرقم الوطني يجب أن يكون 10 أرقام');
    }
    const phones = getPhoneArr(form.phones);
    if (!phones[0]) return alert('يرجى إدخال رقم هاتف واحد على الأقل');

    setIsLoading(true);
    try {
      const payload = { ...form, phones: getPhoneArr(form.phones), whatsappOnly: getWaArr(form.whatsappOnly) };
      if (selectedStudent) {
        await apiFetch(`/students/${selectedStudent.id}`, { method: 'PUT', body: JSON.stringify(payload) });
        alert('تم التعديل بنجاح ✓');
      } else {
        await apiFetch('/students', { method: 'POST', body: JSON.stringify(payload) });
        alert('تمت إضافة الطالب بنجاح ✓');
      }
      await loadStudents(searchQuery);
      handleNew();
    } catch (e: any) {
      alert(e.message || 'تعذر الاتصال بالخادم');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (s: Student) => {
    if (!confirm('هل أنت متأكد من حذف هذا الطالب؟')) return;
    try {
      await apiFetch(`/students/${s.id}`, { method: 'DELETE' });
      await loadStudents(searchQuery);
      if (selectedStudent?.id === s.id) handleNew();
    } catch (e: any) { alert(e.message); }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* Form */}
      <div className="glass-panel">
        <h3 style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
          <Users size={22} color="var(--secondary-color)" />
          {selectedStudent ? 'تعديل بيانات الطالب' : 'إضافة طالب جديد'}
        </h3>

        <div className="grid-3">
          <div className="form-group">
            <label className="form-label"><span className="required-star">*</span>الاسم كامل بالعربي</label>
            <input type="text" className="glass-input" value={form.fullNameAr || ''}
              onChange={e => setForm({ ...form, fullNameAr: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">الاسم كامل بالإنجليزي</label>
            <input type="text" className="glass-input" value={form.fullNameEn || ''}
              onChange={e => setForm({ ...form, fullNameEn: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label"><span className="required-star">*</span>تاريخ الميلاد</label>
            <input type="date" className="glass-input" value={form.dob || ''}
              onChange={e => setForm({ ...form, dob: e.target.value })} />
          </div>

          <div className="form-group">
            <label className="form-label">الجنسية</label>
            <select className="glass-input" value={form.nationality}
              onChange={e => setForm({ ...form, nationality: e.target.value as any })}>
              <option value="JO">أردني 🇯🇴</option>
              <option value="OTHER">غير أردني 🌍</option>
            </select>
          </div>

          {form.nationality === 'JO' ? (
            <div className="form-group">
              <label className="form-label"><span className="required-star">*</span>الرقم الوطني (10 أرقام)</label>
              <input type="text" maxLength={10} className="glass-input" value={form.nationalId || ''}
                onChange={e => setForm({ ...form, nationalId: e.target.value.replace(/\D/g, '') })} />
            </div>
          ) : (
            <>
              <div className="form-group">
                <label className="form-label">الرقم الشخصي</label>
                <input type="text" className="glass-input" value={form.nationalId || ''}
                  onChange={e => setForm({ ...form, nationalId: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">رقم الجواز</label>
                <input type="text" className="glass-input" value={form.passportId || ''}
                  onChange={e => setForm({ ...form, passportId: e.target.value })} />
              </div>
            </>
          )}

          <div className="form-group">
            <label className="form-label"><span className="required-star">*</span>الهاتف (بدون 0 — رمز 962)</label>
            {getPhoneArr(form.phones).map((phone, i) => (
              <div key={i} style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', gap: 8, marginBottom: 4 }}>
                  <span style={{ padding: '12px 10px', background: 'rgba(255,255,255,0.08)', borderRadius: 8, border: '1px solid var(--glass-border)', fontSize: '0.85rem' }}>+962</span>
                  <input type="text" className="glass-input" value={phone}
                    onChange={e => handlePhoneChange(i, e.target.value)} placeholder="7XXXXXXXX" />
                  {i === getPhoneArr(form.phones).length - 1 && i < 2 && (
                    <button type="button" className="glass-btn secondary sm" onClick={addPhone}>+</button>
                  )}
                </div>
                <label style={{ fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <input type="checkbox" checked={getWaArr(form.whatsappOnly)[i] || false}
                    onChange={e => handleWaChange(i, e.target.checked)} />
                  واتساب فقط
                </label>
              </div>
            ))}
          </div>

          <div className="form-group">
            <label className="form-label">العنوان</label>
            <input type="text" maxLength={200} className="glass-input" value={form.address || ''}
              onChange={e => setForm({ ...form, address: e.target.value })} />
          </div>

          <div className="form-group">
            <label className="form-label">صفة الطالب</label>
            <select className="glass-input" value={form.studentType}
              onChange={e => setForm({ ...form, studentType: e.target.value as any })}>
              <option value="UNIVERSITY">طالب جامعة</option>
              <option value="HIGH_SCHOOL">طالب ثانوي</option>
              <option value="EMPLOYEE">موظف</option>
              <option value="OTHER">غير ذلك</option>
            </select>
          </div>

          {form.studentType === 'UNIVERSITY' && (
            <>
              <div className="form-group">
                <label className="form-label">اسم الجامعة</label>
                <input type="text" className="glass-input" value={form.universityName || ''}
                  onChange={e => setForm({ ...form, universityName: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">الرقم الجامعي</label>
                <input type="text" className="glass-input" value={form.universityId || ''}
                  onChange={e => setForm({ ...form, universityId: e.target.value })} />
              </div>
            </>
          )}

          <div className="form-group">
            <label className="form-label">حالة المشترك</label>
            <select className="glass-input" value={form.status}
              onChange={e => setForm({ ...form, status: e.target.value as any })}>
              <option value="ACTIVE">مستمر</option>
              <option value="POSTPONED">مؤجل</option>
              <option value="WITHDRAWN">منسحب</option>
              <option value="CANCELED">ملغي</option>
              <option value="FINISHED">أنهى الدورة</option>
            </select>
          </div>
        </div>

        <div className="form-group" style={{ marginTop: 10 }}>
          <label className="form-label">ملاحظات (حد أقصى 1000 حرف)</label>
          <textarea className="glass-input" rows={3} maxLength={1000} value={form.notes || ''}
            onChange={e => setForm({ ...form, notes: e.target.value })} />
        </div>

        <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
          <button className="glass-btn" onClick={handleSave} disabled={isLoading}>
            <Save size={16} /> {isLoading ? 'جارٍ الحفظ...' : (selectedStudent ? 'حفظ التعديلات' : 'إضافة الطالب')}
          </button>
          <button className="glass-btn secondary" onClick={handleNew} disabled={isLoading}>
            <RefreshCw size={16} /> جديد
          </button>
        </div>
      </div>

      {/* Students Table */}
      <div className="glass-panel">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ margin: 0 }}>
            قائمة الطلاب{' '}
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 400 }}>({totalCount} طالب)</span>
          </h3>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <Search size={18} color="var(--text-muted)" />
            <input type="text" className="glass-input" placeholder="بحث بالاسم أو الهاتف..."
              style={{ width: 260 }} value={searchQuery}
              onChange={e => { setSearchQuery(e.target.value); loadStudents(e.target.value); }} />
          </div>
        </div>

        <div className="glass-table-container">
          <table className="glass-table">
            <thead>
              <tr>
                <th>الطالب</th>
                <th>الهاتف</th>
                <th>الجنسية</th>
                <th>صفة الطالب</th>
                <th>الحالة</th>
                <th>إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {students.map(s => {
                const st = STATUS_MAP[s.status] || { label: s.status, cls: 'secondary' };
                return (
                  <tr key={s.id}
                    onClick={() => handleSelect(s)}
                    className={selectedStudent?.id === s.id ? 'active' : ''}
                    style={{ cursor: 'pointer' }}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{s.fullNameAr}</div>
                      {s.fullNameEn && <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>{s.fullNameEn}</div>}
                    </td>
                    <td dir="ltr" style={{ textAlign: 'right', fontSize: '0.88rem' }}>+962 {getPhone(s.phones)}</td>
                    <td style={{ fontSize: '0.85rem' }}>{s.nationality === 'JO' ? '🇯🇴 أردني' : '🌍 غير أردني'}</td>
                    <td style={{ fontSize: '0.85rem' }}>
                      {s.studentType === 'UNIVERSITY' ? '🎓 جامعة' : s.studentType === 'HIGH_SCHOOL' ? '📚 ثانوي' : s.studentType === 'EMPLOYEE' ? '💼 موظف' : 'غير ذلك'}
                    </td>
                    <td>
                      <span className={`badge ${st.cls}`} style={{ fontSize: '0.78rem' }}>{st.label}</span>
                    </td>
                    <td onClick={e => e.stopPropagation()}>
                      <button className="glass-btn secondary sm" onClick={() => handleDelete(s)} style={{ color: 'var(--danger)' }}>
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {students.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: 32, opacity: 0.5 }}>
                    لا يوجد طلاب مضافون بعد
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
