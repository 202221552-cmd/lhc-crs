import React, { useState, useEffect } from 'react';
import { Save, Plus, Layers, Search, Filter, Trash2, Calendar, Clock, MapPin, User, AlertTriangle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const ManageSectionsPage = () => {
  const { token } = useAuth();
  const [sections, setSections] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [instructors, setInstructors] = useState<any[]>([]);
  
  const [query, setQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    courseId: '', roomId: '', instructorId: '', days: [] as string[],
    startTime: '', endTime: '', startDate: '', endDate: '', capacity: 30
  });

  const fetchData = async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [secRes, crsRes, rmRes, instRes] = await Promise.all([
        fetch('http://localhost:5000/api/sections', { headers }),
        fetch('http://localhost:5000/api/courses', { headers }),
        fetch('http://localhost:5000/api/rooms', { headers }),
        fetch('http://localhost:5000/api/instructors', { headers })
      ]);
      if (secRes.ok) setSections(await secRes.json());
      if (crsRes.ok) setCourses(await crsRes.json());
      if (rmRes.ok) setRooms(await rmRes.json());
      if (instRes.ok) setInstructors(await instRes.json());
    } catch (err) { console.error(err); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleDayToggle = (day: string) => {
    setFormData(prev => ({
      ...prev,
      days: prev.days.includes(day) ? prev.days.filter(d => d !== day) : [...prev.days, day]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.courseId || !formData.roomId || !formData.instructorId || formData.days.length === 0 || !formData.startTime || !formData.endTime) {
      return setErrorMsg('يرجى تعبئة جميع الحقول الأساسية وتحديد الأيام.');
    }
    setErrorMsg('');
    setIsLoading(true);

    try {
      const payload = { ...formData, days: JSON.stringify(formData.days) };
      const res = await fetch('http://localhost:5000/api/sections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      
      const data = await res.json();
      if (res.ok) {
        setShowModal(false);
        fetchData();
        setFormData({ courseId: '', roomId: '', instructorId: '', days: [], startTime: '', endTime: '', startDate: '', endDate: '', capacity: 30 });
      } else {
        setErrorMsg(data.error || 'حدث خطأ غير معروف');
        const card = document.querySelector('.modal-card');
        if (card) {
          card.classList.remove('shake-error');
          void (card as HTMLElement).offsetWidth; // trigger reflow
          card.classList.add('shake-error');
        }
      }
    } catch (err) { setErrorMsg('تعذر الاتصال بالخادم'); }
    finally { setIsLoading(false); }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('هل أنت متأكد من الحذف؟')) return;
    try {
      await fetch(`http://localhost:5000/api/sections/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      fetchData();
    } catch (err) { console.error(err); }
  };

  const dayLabels: Record<string, string> = { SUN: 'الأحد', MON: 'الاثنين', TUE: 'الثلاثاء', WED: 'الأربعاء', THU: 'الخميس', FRI: 'الجمعة', SAT: 'السبت' };

  const formatDays = (daysStr: string) => {
    try {
      const days = JSON.parse(daysStr) as string[];
      return days.map(d => dayLabels[d]).join('، ');
    } catch { return daysStr; }
  };

  const filtered = sections.filter(s => s.course?.name.includes(query) || s.instructor?.name.includes(query));

  return (
    <div className="fade-in">
      <div className="page-header">
        <h2><Layers className="text-primary" /> إدارة الشعب (المساقات المفتوحة)</h2>
        <div className="actions">
          <div className="search-bar">
            <Search className="search-icon" size={18} />
            <input type="text" className="glass-input" placeholder="بحث بالدورة أو المحاضر..." value={query} onChange={e => setQuery(e.target.value)} />
            <button className="glass-btn secondary sm" style={{ position: 'absolute', left: 4, top: 4 }}><Filter size={16} /></button>
          </div>
          <button className="glass-btn" onClick={() => setShowModal(true)}><Plus size={18} /> فتح شعبة جديدة</button>
        </div>
      </div>

      <div className="glass-table-container">
        <table className="glass-table">
          <thead>
            <tr>
              <th>الدورة</th>
              <th>المحاضر</th>
              <th>القاعة</th>
              <th>المواعيد (الأيام / الوقت)</th>
              <th>البداية والنهاية</th>
              <th>حالة الشعبة</th>
              <th>إجراء</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(s => (
              <tr key={s.id}>
                <td>
                  <div style={{ fontWeight: 600 }}>{s.course?.name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{s.capacity} مقعد</div>
                </td>
                <td><User size={14} className="inline-icon text-muted" /> {s.instructor?.name}</td>
                <td><MapPin size={14} className="inline-icon text-muted" /> {s.room?.name}</td>
                <td>
                  <div style={{ fontSize: '0.85rem' }}><Calendar size={12} className="inline-icon text-muted" /> {formatDays(s.days)}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--primary)', marginTop: 4 }}><Clock size={12} className="inline-icon" /> {s.startTime} - {s.endTime}</div>
                </td>
                <td style={{ fontSize: '0.85rem' }}>
                  {s.startDate ? new Date(s.startDate).toLocaleDateString() : '-'} <br/>
                  <span style={{ color: 'var(--text-muted)' }}>إلى</span> {s.endDate ? new Date(s.endDate).toLocaleDateString() : '-'}
                </td>
                <td>
                  <span className={`badge ${s.status === 'OPEN' ? 'success' : 'secondary'}`}>
                    {s.status === 'OPEN' ? 'مفتوحة للتسجيل' : s.status === 'CLOSED' ? 'مغلقة' : 'مكتملة'}
                  </span>
                </td>
                <td>
                  <button className="glass-btn icon-only secondary" style={{ color: 'var(--danger)' }} onClick={() => handleDelete(s.id)}>
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={7} style={{ textAlign: 'center', padding: 20 }}>لا توجد شعب مفتوحة</td></tr>}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
          <div className="glass-panel slide-in modal-card" style={{ width: '100%', maxWidth: 700, maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ marginBottom: 20 }}>فتح شعبة دراسية جديدة</h3>
            {errorMsg && (
              <div style={{ background: 'var(--danger-light)', color: 'var(--danger)', padding: 12, borderRadius: 8, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.9rem' }}>
                <AlertTriangle size={18} /> {errorMsg}
              </div>
            )}
            <form onSubmit={handleSubmit}>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">الدورة <span className="required-star">*</span></label>
                  <select required className="glass-input" value={formData.courseId} onChange={e => setFormData({...formData, courseId: e.target.value})}>
                    <option value="">-- اختر الدورة --</option>
                    {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">القاعة / المختبر <span className="required-star">*</span></label>
                  <select required className="glass-input" value={formData.roomId} onChange={e => setFormData({...formData, roomId: e.target.value})}>
                    <option value="">-- اختر القاعة --</option>
                    {rooms.map(r => <option key={r.id} value={r.id}>{r.name} - {r.entity?.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">المحاضر <span className="required-star">*</span></label>
                  <select required className="glass-input" value={formData.instructorId} onChange={e => setFormData({...formData, instructorId: e.target.value})}>
                    <option value="">-- اختر المحاضر --</option>
                    {instructors.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">السعة القصوى للمقاعد</label>
                  <input type="number" className="glass-input" value={formData.capacity} onChange={e => setFormData({...formData, capacity: Number(e.target.value)})} />
                </div>
              </div>

              <div className="form-group" style={{ background: 'var(--card-bg)', padding: '16px', borderRadius: '12px', border: '1px solid var(--glass-border)', marginTop: 10 }}>
                <label className="form-label" style={{ marginBottom: 12 }}>أيام الانعقاد <span className="required-star">*</span></label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
                  {Object.entries(dayLabels).map(([key, label]) => (
                    <button type="button" key={key}
                      onClick={() => handleDayToggle(key)}
                      style={{
                        padding: '6px 16px', borderRadius: 20, fontSize: '0.85rem', cursor: 'pointer', border: '1px solid var(--primary)',
                        background: formData.days.includes(key) ? 'var(--primary)' : 'transparent',
                        color: formData.days.includes(key) ? '#fff' : 'var(--primary)',
                        transition: 'all 0.2s'
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                <div className="grid-2">
                  <div>
                    <label className="form-label" style={{ fontSize: '0.8rem' }}>وقت البداية <span className="required-star">*</span></label>
                    <input type="time" required className="glass-input" value={formData.startTime} onChange={e => setFormData({...formData, startTime: e.target.value})} />
                  </div>
                  <div>
                    <label className="form-label" style={{ fontSize: '0.8rem' }}>وقت النهاية <span className="required-star">*</span></label>
                    <input type="time" required className="glass-input" value={formData.endTime} onChange={e => setFormData({...formData, endTime: e.target.value})} />
                  </div>
                </div>
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">تاريخ البداية (اختياري)</label>
                  <input type="date" className="glass-input" value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">تاريخ النهاية (اختياري)</label>
                  <input type="date" className="glass-input" value={formData.endDate} onChange={e => setFormData({...formData, endDate: e.target.value})} />
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
                <button type="submit" className="glass-btn" disabled={isLoading}>{isLoading ? 'جاري التحقق...' : 'إنشاء وحفظ'}</button>
                <button type="button" className="glass-btn secondary" onClick={() => setShowModal(false)}>إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
