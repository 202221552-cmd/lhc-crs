import React, { useState, useEffect } from 'react';
import { UserCheck, Users, ChevronLeft, Search } from 'lucide-react';
import { useApi } from '../context/AuthContext';

export const AddToSectionPage = () => {
  const { apiFetch } = useApi();
  const [sections, setSections] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [selectedSection, setSelectedSection] = useState('');
  const [query, setQuery] = useState('');
  const [adding, setAdding] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      apiFetch('/sections'),
      apiFetch('/students?limit=200')
    ]).then(([secs, stds]) => {
      setSections(Array.isArray(secs) ? secs : []);
      const arr = Array.isArray(stds) ? stds : (stds.data || []);
      setStudents(arr);
    }).catch(console.error);
  }, []);

  const getPhone = (phones: any) => {
    try { return (typeof phones === 'string' ? JSON.parse(phones) : phones)?.[0] || ''; } catch { return ''; }
  };

  const handleAdd = async (studentId: string) => {
    if (!selectedSection) return alert('الرجاء اختيار الشعبة أولاً');
    setAdding(studentId);
    try {
      await apiFetch(`/sections/${selectedSection}/students`, {
        method: 'POST',
        body: JSON.stringify({ studentId })
      });
      alert('✓ تم إضافة الطالب للشعبة بنجاح');
    } catch (e: any) {
      alert(e.message || 'حدث خطأ');
    } finally {
      setAdding(null);
    }
  };

  const activeSection = sections.find(s => s.id === selectedSection);
  const filtered = students.filter(s =>
    !query || s.fullNameAr?.includes(query) || getPhone(s.phones)?.includes(query)
  );

  return (
    <div className="grid-2 fade-in" style={{ gap: 28, alignItems: 'start' }}>
      {/* Section selector */}
      <div className="glass-panel">
        <h3 style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
          <Users size={20} color="var(--primary-color)" /> اختيار الشعبة
        </h3>
        <div className="form-group">
          <label className="form-label">الشعبة المستهدفة</label>
          <select className="glass-input" value={selectedSection} onChange={e => setSelectedSection(e.target.value)}>
            <option value="">-- اختر الشعبة --</option>
            {sections.map(s => (
              <option key={s.id} value={s.id}>
                {s.course?.name || s.diploma?.name || 'شعبة'} — {s.instructor?.name || '—'} ({s.room?.name || '—'})
              </option>
            ))}
          </select>
        </div>
        {activeSection && (
          <div style={{ marginTop: 16, padding: '14px 16px', background: 'var(--card-bg)', borderRadius: 10, fontSize: '0.88rem' }}>
            <div style={{ fontWeight: 700, marginBottom: 8 }}>تفاصيل الشعبة</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, color: 'var(--text-muted)' }}>
              <div>الاستيعاب: <strong style={{ color: 'var(--text-primary)' }}>{activeSection.capacity} مقعد</strong></div>
              <div>المواعيد: <strong style={{ color: 'var(--text-primary)' }}>{activeSection.startTime} — {activeSection.endTime}</strong></div>
              {activeSection.days && <div>الأيام: <strong style={{ color: 'var(--text-primary)' }}>{activeSection.days}</strong></div>}
            </div>
          </div>
        )}
      </div>

      {/* Students list */}
      <div className="glass-panel" style={{ opacity: selectedSection ? 1 : 0.6, pointerEvents: selectedSection ? 'auto' : 'none' }}>
        <h3 style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
          <UserCheck size={20} color="var(--secondary-color)" /> إضافة طلاب للشعبة
        </h3>
        <div style={{ position: 'relative', marginBottom: 16 }}>
          <Search size={15} style={{ position: 'absolute', right: 12, top: 13, color: 'var(--text-muted)' }} />
          <input type="text" className="glass-input" style={{ paddingRight: 36 }}
            placeholder="ابحث عن طالب..." value={query} onChange={e => setQuery(e.target.value)} />
        </div>
        <div className="glass-table-container">
          <table className="glass-table">
            <thead><tr><th>الطالب</th><th>الهاتف</th><th>الحالة</th><th>إضافة</th></tr></thead>
            <tbody>
              {filtered.slice(0, 20).map(s => (
                <tr key={s.id}>
                  <td style={{ fontWeight: 600 }}>{s.fullNameAr}</td>
                  <td dir="ltr" style={{ fontSize: '0.85rem', textAlign: 'right' }}>+962 {getPhone(s.phones)}</td>
                  <td><span className={`badge ${s.status === 'ACTIVE' ? 'success' : 'warning'}`} style={{ fontSize: '0.72rem' }}>{s.status === 'ACTIVE' ? 'نشط' : s.status}</span></td>
                  <td>
                    <button className="glass-btn sm" onClick={() => handleAdd(s.id)} disabled={adding === s.id}>
                      {adding === s.id ? '...' : 'إضافة'} <ChevronLeft size={13} />
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={4} style={{ textAlign: 'center', padding: 24, opacity: 0.5 }}>لا يوجد طلاب</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
