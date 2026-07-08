import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  Save, Plus, Layers, Search, Trash2, Calendar,
  Clock, MapPin, User, X, Users, Eye, AlertCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import { ConfirmModal } from '../components/ConfirmModal';

const API = 'http://localhost:5000/api';

interface Section {
  id: string;
  name?: string;
  course?: { id: string; name: string };
  room?: { id: string; name: string; entity?: { name: string } };
  instructor?: { id: string; name: string };
  days: string;
  startTime: string;
  endTime: string;
  startDate?: string;
  endDate?: string;
  capacity: number;
  maxAbsences: number;
  status: string;
  students?: any[];
}

const dayLabels: Record<string, string> = {
  SUN: 'الأحد', MON: 'الاثنين', TUE: 'الثلاثاء',
  WED: 'الأربعاء', THU: 'الخميس', FRI: 'الجمعة', SAT: 'السبت'
};

const formatDays = (daysStr: string) => {
  try { return (JSON.parse(daysStr) as string[]).map(d => dayLabels[d]).join('، '); }
  catch { return daysStr; }
};

export const ManageSectionsPage = () => {
  const { token, hasPermission } = useAuth();
  const toast = useToast();
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  const [sections,    setSections]    = useState<Section[]>([]);
  const [courses,     setCourses]     = useState<any[]>([]);
  const [categories,  setCategories]  = useState<any[]>([]);
  const [diplomas,    setDiplomas]    = useState<any[]>([]);
  const [rooms,       setRooms]       = useState<any[]>([]);
  const [instructors, setInstructors] = useState<any[]>([]);

  // Filters
  const [filterDiplomaId, setFilterDiplomaId] = useState('');
  const [filterCategoryId, setFilterCategoryId] = useState('');
  const [filterCourseId, setFilterCourseId] = useState('');

  const [query, setQuery]         = useState('');
  const [showModal, setShowModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [fetching, setFetching]   = useState(true);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  /* ─── Students in section drawer ─── */
  const [viewSection, setViewSection] = useState<Section | null>(null);
  const [sectionStudents, setSectionStudents] = useState<any[]>([]);
  const [conflicts, setConflicts] = useState<any[]>([]);
  const [showConflictsFor, setShowConflictsFor] = useState<Section | null>(null);

  const [formData, setFormData] = useState({
    courseId: '', roomId: '', instructorId: '',
    days: [] as string[],
    startTime: '', endTime: '', startDate: '', endDate: '', capacity: 30, maxAbsences: 3
  });

  /* ─────────────── Fetch ─────────────── */
  const fetchData = async () => {
    setFetching(true);
    try {
      const [secRes, crsRes, catRes, dipRes, rmRes, instRes] = await Promise.all([
        fetch(`${API}/sections`, { headers }),
        fetch(`${API}/courses`,  { headers }),
        fetch(`${API}/courses/categories`, { headers }),
        fetch(`${API}/diplomas`, { headers }),
        fetch(`${API}/rooms`,    { headers }),
        fetch(`${API}/instructors`, { headers }),
      ]);
      if (secRes.ok)  setSections(await secRes.json());
      if (crsRes.ok)  setCourses(await crsRes.json());
      if (catRes.ok)  setCategories(await catRes.json());
      if (dipRes.ok)  setDiplomas(await dipRes.json());
      if (rmRes.ok)   setRooms(await rmRes.json());
      if (instRes.ok) setInstructors(await instRes.json());
    } catch (err) { console.error(err); }
    finally { setFetching(false); }
  };

  useEffect(() => { fetchData(); }, []);

  /* ─────────────── Handlers ─────────────── */
  const handleDayToggle = (day: string) => {
    setFormData(prev => ({
      ...prev,
      days: prev.days.includes(day)
        ? prev.days.filter(d => d !== day)
        : [...prev.days, day]
    }));
  };

  const resetForm = () => {
    setFormData({ courseId: '', roomId: '', instructorId: '', days: [], startTime: '', endTime: '', startDate: '', endDate: '', capacity: 30, maxAbsences: 3 });
  };

  const handleOpen = () => { resetForm(); setShowModal(true); };
  const handleClose = () => { setShowModal(false); resetForm(); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.courseId || !formData.roomId || !formData.instructorId || formData.days.length === 0 || !formData.startTime || !formData.endTime) {
      toast.error('يرجى تعبئة جميع الحقول الأساسية وتحديد الأيام.');
      return;
    }
    setIsLoading(true);

    try {
      const payload = { ...formData, days: JSON.stringify(formData.days) };
      const res = await fetch(`${API}/sections`, {
        method: 'POST', headers,
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('تم إنشاء الشعبة بنجاح');
        handleClose();
        fetchData();
      } else {
        toast.error(data.error || 'حدث خطأ غير معروف');
      }
    } catch { toast.error('تعذر الاتصال بالخادم'); }
    finally   { setIsLoading(false); }
  };

  const handleDelete = (id: string) => {
    setConfirmDeleteId(id);
  };

  const handleConfirmDelete = async () => {
    if (!confirmDeleteId) return;
    try {
      const res = await fetch(`${API}/sections/${confirmDeleteId}`, { method: 'DELETE', headers });
      const data = await res.json();
      if (res.ok) {
        toast.success('تم حذف الشعبة بنجاح');
        fetchData();
      } else {
        toast.error(data.error || 'فشل الحذف');
      }
    } catch { toast.error('تعذر الاتصال بالخادم'); }
    finally { setConfirmDeleteId(null); }
  };

  const handleViewStudents = async (sec: Section) => {
    setViewSection(sec);
    try {
      const res = await fetch(`${API}/attendance/section/${sec.id}`, { headers });
      const data = await res.json();
      setSectionStudents(data.students || []);
    } catch {
      setSectionStudents([]);
    }
  };

  const handleCheckConflicts = async (sec: Section) => {
    setShowConflictsFor(sec);
    try {
      const res = await fetch(`${API}/sections/${sec.id}/conflicts`, { headers });
      if (res.ok) setConflicts(await res.json());
      else setConflicts([]);
    } catch {
      setConflicts([]);
    }
  };

  /* ── Course IDs for the selected diploma ── */
  const diplomaCourseIds = useMemo(() => {
    const dip = diplomas.find((d: any) => d.id === filterDiplomaId);
    return new Set((dip?.courses || []).map((dc: any) => dc.courseId));
  }, [filterDiplomaId, diplomas]);

  /* ── Diploma-filtered courses for the creation form ── */
  const filteredFormCourses = useMemo(() => {
    let list = courses;
    if (filterDiplomaId) list = list.filter(c => diplomaCourseIds.has(c.id));
    if (filterCategoryId) list = list.filter(c => c.categoryId === Number(filterCategoryId));
    return list;
  }, [courses, filterDiplomaId, filterCategoryId, diplomaCourseIds]);

  /* ─────────────── Filter ─────────────── */
  const filtered = sections.filter(s =>
    (!query ||
      (s.course?.name || '').includes(query) ||
      (s.instructor?.name || '').includes(query) ||
      (s.room?.name || '').includes(query)) &&
    (!filterCourseId || s.courseId === filterCourseId) &&
    (!filterCategoryId || s.course?.categoryId === Number(filterCategoryId)) &&
    (!filterDiplomaId || diplomaCourseIds.has(s.courseId))
  );

  /* ── Auto-set section name when course changes ── */
  const handleCourseChange = (courseId: string) => {
    setFormData({ ...formData, courseId });
  };

  /* ─────────────── Render ─────────────── */
  return (
    <div className="fade-in">
      <div className="page-header">
        <h2><Layers className="text-primary" size={22}/> إدارة الشعب</h2>
        <div className="actions">
          {hasPermission('sections.add') && (
            <button className="glass-btn" onClick={handleOpen}>
              <Plus size={18}/> فتح شعبة جديدة
            </button>
          )}
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '14px 18px', marginBottom: 18 }}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div className="form-group" style={{ margin: 0, minWidth: 160, flex: 1 }}>
            <label className="form-label" style={{ fontSize: '0.72rem' }}>دبلوم</label>
            <select className="glass-input" value={filterDiplomaId}
              onChange={e => { setFilterDiplomaId(e.target.value); setFilterCategoryId(''); setFilterCourseId(''); }}>
              <option value="">— الكل —</option>
              {diplomas.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
          <div className="form-group" style={{ margin: 0, minWidth: 160, flex: 1 }}>
            <label className="form-label" style={{ fontSize: '0.72rem' }}>تصنيف</label>
            <select className="glass-input" value={filterCategoryId}
              onChange={e => { setFilterCategoryId(e.target.value); setFilterCourseId(''); }}>
              <option value="">— الكل —</option>
              {categories.map((c: any) => <option key={c.id} value={c.id}>{c.nameAr || c.name}</option>)}
            </select>
          </div>
          <div className="form-group" style={{ margin: 0, minWidth: 160, flex: 1 }}>
            <label className="form-label" style={{ fontSize: '0.72rem' }}>دورة</label>
            <select className="glass-input" value={filterCourseId}
              onChange={e => setFilterCourseId(e.target.value)}>
              <option value="">— الكل —</option>
              {courses
                .filter(c => !filterCategoryId || c.categoryId === Number(filterCategoryId))
                .filter(c => !filterDiplomaId || diplomaCourseIds.has(c.id))
                .map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="search-bar" style={{ flex: 2, minWidth: 200 }}>
            <Search className="search-icon" size={17}/>
            <input type="text" className="glass-input" placeholder="بحث بالدورة أو المحاضر أو القاعة..."
              value={query} onChange={e => setQuery(e.target.value)} />
          </div>
        </div>
      </div>

      <div className="glass-table-container">
        <table className="glass-table">
          <thead>
            <tr>
              <th>الدورة / الشعبة</th>
              <th>المحاضر</th>
              <th>القاعة</th>
              <th>الأيام / الوقت</th>
              <th>التواريخ</th>
              <th>الطلاب</th>
              <th>الحالة</th>
              <th>إجراء</th>
            </tr>
          </thead>
          <tbody>
            {fetching && (
              <tr><td colSpan={8} style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>جارٍ التحميل...</td></tr>
            )}
            {!fetching && filtered.length === 0 && (
              <tr><td colSpan={8} style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>لا توجد شعب مطابقة</td></tr>
            )}
            {filtered.map(s => (
              <tr key={s.id}>
                <td>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{s.course?.name}</div>
                  {s.name && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{s.name}</div>}
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>
                    <Users size={11} className="inline-icon"/> {s.capacity} مقعد
                  </div>
                </td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <User size={13} className="text-muted"/>
                    {s.instructor?.name}
                  </div>
                </td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <MapPin size={13} className="text-muted"/>
                    {s.room?.name}
                  </div>
                  {s.room?.entity && (
                    <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)' }}>{s.room.entity.name}</div>
                  )}
                </td>
                <td>
                  <div style={{ fontSize: '0.83rem' }}>
                    <Calendar size={12} className="inline-icon text-muted"/> {formatDays(s.days)}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--primary)', marginTop: 3 }}>
                    <Clock size={12} className="inline-icon"/> {s.startTime} – {s.endTime}
                  </div>
                </td>
                <td style={{ fontSize: '0.82rem' }}>
                  {s.startDate ? new Date(s.startDate).toLocaleDateString('ar') : '—'}
                  <br/>
                  <span style={{ color: 'var(--text-muted)' }}>إلى </span>
                  {s.endDate ? new Date(s.endDate).toLocaleDateString('ar') : '—'}
                </td>
                <td>
                  <button
                    className="glass-btn secondary sm"
                    onClick={() => handleViewStudents(s)}
                    style={{ fontSize: '0.78rem' }}
                  >
                    <Eye size={13}/> عرض ({s.students?.length ?? 0})
                  </button>
                </td>
                <td>
                  <span className={`badge ${s.status === 'OPEN' ? 'success' : s.status === 'CLOSED' ? 'danger' : 'secondary'}`}>
                    {s.status === 'OPEN' ? 'مفتوحة' : s.status === 'CLOSED' ? 'مغلقة' : 'مكتملة'}
                  </span>
                </td>
                <td>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      className="glass-btn icon-only secondary"
                      style={{ color: 'var(--warning)', borderColor: 'var(--warning-light)' }}
                      onClick={() => handleCheckConflicts(s)}
                      title="كشف التعارضات"
                    >
                      <AlertCircle size={15}/>
                    </button>
                    {hasPermission('sections.delete') && (
                      <button
                        className="glass-btn icon-only secondary"
                        style={{ color: 'var(--danger)', borderColor: 'var(--danger-light)' }}
                        onClick={() => handleDelete(s.id)}
                        title="حذف الشعبة"
                      >
                        <Trash2 size={15}/>
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ═══════════════════ ADD SECTION MODAL ═══════════════════ */}
      {showModal && createPortal(
        <div
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            zIndex: 99999,
            background: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(10px)',
            display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
            overflowY: 'auto',
            paddingTop: '40px', paddingBottom: '40px',
          }}
          onClick={e => { if (e.target === e.currentTarget) handleClose(); }}
        >
          <div style={{
            width: '100%', maxWidth: 760,
            margin: '0 20px',
            background: 'var(--modal-bg)',
            backdropFilter: 'blur(32px) saturate(200%)',
            border: '1px solid var(--glass-border)',
            borderRadius: 24,
            boxShadow: '0 32px 80px rgba(0,0,0,0.4)',
            animation: 'modalIn 0.3s cubic-bezier(0.34,1.56,0.64,1)',
            direction: 'rtl',
            flexShrink: 0,
          }}>
            {/* Header */}
            <div style={{
              padding: '20px 28px',
              borderBottom: '1px solid var(--glass-border)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              borderRadius: '24px 24px 0 0',
              background: 'var(--primary-light)',
            }}>
              <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8, fontSize: '1.05rem', fontWeight: 800 }}>
                <Layers size={18}/> فتح شعبة دراسية جديدة
              </h3>
              <button className="modal-close" onClick={handleClose}><X size={18}/></button>
            </div>

            <form onSubmit={handleSubmit} style={{ padding: '24px 28px' }}>
              <div className="grid-2">
                {/* Diploma filter */}
                <div className="form-group">
                  <label className="form-label">دبلوم</label>
                  <select className="glass-input" value={filterDiplomaId}
                    onChange={e => {
                      setFilterDiplomaId(e.target.value);
                      setFormData({ ...formData, courseId: '' });
                    }}>
                    <option value="">-- جميع الدبلومات --</option>
                    {diplomas.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>

                {/* Category filter */}
                <div className="form-group">
                  <label className="form-label">التصنيف</label>
                  <select className="glass-input" value={filterCategoryId}
                    onChange={e => {
                      setFilterCategoryId(e.target.value);
                      setFormData({ ...formData, courseId: '' });
                    }}>
                    <option value="">-- جميع التصنيفات --</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.nameAr || c.name}</option>)}
                  </select>
                </div>

                {/* Course */}
                <div className="form-group">
                  <label className="form-label">الدورة <span className="required-star">*</span></label>
                  <select required className="glass-input" value={formData.courseId}
                    onChange={e => handleCourseChange(e.target.value)}>
                    <option value="">-- اختر الدورة --</option>
                    {filteredFormCourses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  {formData.courseId && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
                      سيتم إنشاء الشعبة باسم: {courses.find(c => c.id === formData.courseId)?.name} + الرقم التالي
                    </div>
                  )}
                </div>

                {/* Room */}
                <div className="form-group">
                  <label className="form-label">القاعة / المختبر <span className="required-star">*</span></label>
                  <select required className="glass-input" value={formData.roomId}
                    onChange={e => setFormData({ ...formData, roomId: e.target.value })}>
                    <option value="">-- اختر القاعة --</option>
                    {rooms.map(r => <option key={r.id} value={r.id}>{r.name}{r.entity ? ` — ${r.entity.name}` : ''}</option>)}
                  </select>
                </div>

                {/* Instructor */}
                <div className="form-group">
                  <label className="form-label">المحاضر <span className="required-star">*</span></label>
                  <select required className="glass-input" value={formData.instructorId}
                    onChange={e => setFormData({ ...formData, instructorId: e.target.value })}>
                    <option value="">-- اختر المحاضر --</option>
                    {instructors.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                  </select>
                </div>

                {/* Capacity */}
                <div className="form-group">
                  <label className="form-label">السعة القصوى</label>
                  <input type="number" className="glass-input" min={1} max={200}
                    value={formData.capacity}
                    onChange={e => setFormData({ ...formData, capacity: Number(e.target.value) })}/>
                </div>

                {/* Max Absences */}
                <div className="form-group">
                  <label className="form-label">حد الغياب المسموح</label>
                  <input type="number" className="glass-input" min={1} max={50}
                    value={formData.maxAbsences}
                    onChange={e => setFormData({ ...formData, maxAbsences: Number(e.target.value) })}/>
                </div>
              </div>

              {/* Days selector */}
              <div className="form-group" style={{
                background: 'var(--card-bg)', padding: '18px 20px',
                borderRadius: 14, border: '1px solid var(--glass-border)'
              }}>
                <label className="form-label" style={{ marginBottom: 14 }}>
                  أيام الانعقاد <span className="required-star">*</span>
                </label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 18 }}>
                  {Object.entries(dayLabels).map(([key, label]) => {
                    const active = formData.days.includes(key);
                    return (
                      <button
                        type="button" key={key}
                        onClick={() => handleDayToggle(key)}
                        style={{
                          padding: '7px 18px', borderRadius: 20, fontSize: '0.85rem',
                          cursor: 'pointer', border: '1.5px solid var(--primary)',
                          background: active ? 'var(--primary)' : 'transparent',
                          color: active ? '#fff' : 'var(--primary)',
                          fontFamily: 'Cairo, sans-serif', fontWeight: 600,
                          transition: 'all 0.2s ease',
                          transform: active ? 'scale(1.05)' : 'scale(1)',
                          boxShadow: active ? '0 3px 10px rgba(59,130,246,0.3)' : 'none',
                        }}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>

                {/* Time */}
                <div className="grid-2">
                  <div>
                    <label className="form-label" style={{ fontSize: '0.82rem' }}>
                      وقت البداية <span className="required-star">*</span>
                    </label>
                    <input type="time" required className="glass-input" value={formData.startTime}
                      onChange={e => setFormData({ ...formData, startTime: e.target.value })}/>
                  </div>
                  <div>
                    <label className="form-label" style={{ fontSize: '0.82rem' }}>
                      وقت النهاية <span className="required-star">*</span>
                    </label>
                    <input type="time" required className="glass-input" value={formData.endTime}
                      onChange={e => setFormData({ ...formData, endTime: e.target.value })}/>
                  </div>
                </div>
              </div>

              {/* Optional dates */}
              <div className="grid-2" style={{ marginTop: 16 }}>
                <div className="form-group">
                  <label className="form-label">تاريخ البداية (اختياري)</label>
                  <input type="date" className="glass-input" value={formData.startDate}
                    onChange={e => setFormData({ ...formData, startDate: e.target.value })}/>
                </div>
                <div className="form-group">
                  <label className="form-label">تاريخ النهاية (اختياري)</label>
                  <input type="date" className="glass-input" value={formData.endDate}
                    onChange={e => setFormData({ ...formData, endDate: e.target.value })}/>
                </div>
              </div>

              <div style={{
                padding: '18px 0 4px',
                display: 'flex', gap: 12, justifyContent: 'flex-start',
                borderTop: '1px solid var(--glass-border)', marginTop: 20,
              }}>
                <button type="submit" className="glass-btn" disabled={isLoading}>
                  {isLoading ? 'جارٍ الإنشاء...' : <><Save size={16}/> إنشاء وحفظ</>}
                </button>
                <button type="button" className="glass-btn secondary" onClick={handleClose}>إلغاء</button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* ═══════════════════ VIEW STUDENTS DRAWER ═══════════════════ */}
      {viewSection && createPortal(
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setViewSection(null); }}>
          <div className="modal-card" style={{ maxWidth: 560 }}>
            <div className="modal-header">
              <h3><Users size={18} style={{ marginLeft: 8 }}/> طلاب شعبة: {viewSection.course?.name}</h3>
              <button className="modal-close" onClick={() => setViewSection(null)}><X size={18}/></button>
            </div>

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 20 }}>
              <span className="badge primary">{viewSection.instructor?.name}</span>
              <span className="badge secondary">{viewSection.room?.name}</span>
              <span className="badge teal">{formatDays(viewSection.days)}</span>
              <span className="badge warning">{viewSection.startTime} – {viewSection.endTime}</span>
            </div>

            {sectionStudents.length === 0 ? (
              <div className="empty-state"><Users size={36}/><p>لا يوجد طلاب مسجّلون في هذه الشعبة</p></div>
            ) : (
              <div className="glass-table-container">
                <table className="glass-table">
                  <thead><tr><th>#</th><th>الطالب</th><th>الرقم</th></tr></thead>
                  <tbody>
                    {sectionStudents.map((st, i) => (
                      <tr key={st.id}>
                        <td style={{ color: 'var(--text-muted)' }}>{i + 1}</td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div className="profile-avatar" style={{ width: 32, height: 32, fontSize: '0.85rem' }}>
                              {st.fullName?.charAt(0)}
                            </div>
                            {st.fullName}
                          </div>
                        </td>
                        <td style={{ direction: 'ltr', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                          {st.studentCode || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="modal-footer">
              <button className="glass-btn secondary" onClick={() => setViewSection(null)}>إغلاق</button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ═══════════════════ CONFLICTS DRAWER ═══════════════════ */}
      {showConflictsFor && createPortal(
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setShowConflictsFor(null); }}>
          <div className="modal-card" style={{ maxWidth: 600 }}>
            <div className="modal-header">
              <h3><AlertCircle size={18} style={{ marginLeft: 8 }}/> تعارضات الشعبة: {showConflictsFor.course?.name}</h3>
              <button className="modal-close" onClick={() => setShowConflictsFor(null)}><X size={18}/></button>
            </div>

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 20 }}>
              <span className="badge primary">{showConflictsFor.instructor?.name}</span>
              <span className="badge secondary">{showConflictsFor.room?.name}</span>
              <span className="badge teal">{formatDays(showConflictsFor.days)}</span>
              <span className="badge warning">{showConflictsFor.startTime} – {showConflictsFor.endTime}</span>
            </div>

            {conflicts.length === 0 ? (
              <div className="empty-state">
                <AlertCircle size={36}/>
                <p>لا توجد تعارضات مع هذه الشعبة ✓</p>
              </div>
            ) : (
              <>
                <p style={{ color: 'var(--danger)', fontWeight: 700, marginBottom: 12 }}>
                  تم العثور على {conflicts.length} تعارض
                </p>
                <div className="glass-table-container">
                  <table className="glass-table">
                    <thead><tr><th>الدورة</th><th>نوع التعارض</th><th>الأيام</th><th>الوقت</th><th>الطلاب</th></tr></thead>
                    <tbody>
                      {conflicts.map(c => (
                        <tr key={c.id}>
                          <td style={{ fontWeight: 600 }}>{c.courseName}{c.name ? ` (${c.name})` : ''}</td>
                          <td>
                            <span className={`badge ${c.conflictType === 'ROOM' ? 'danger' : 'warning'}`}>
                              {c.conflictType === 'ROOM' ? 'قاعة' : 'محاضر'}
                            </span>
                          </td>
                          <td style={{ fontSize: '0.82rem' }}>{c.days?.map((d: string) => dayLabels[d]).join('، ')}</td>
                          <td style={{ fontSize: '0.82rem' }}>{c.startTime} – {c.endTime}</td>
                          <td>{c.studentCount}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            <div className="modal-footer">
              <button className="glass-btn secondary" onClick={() => setShowConflictsFor(null)}>إغلاق</button>
            </div>
          </div>
        </div>,
        document.body
      )}

      <ConfirmModal
        isOpen={confirmDeleteId !== null}
        message="هل أنت متأكد من حذف هذه الشعبة؟"
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmDeleteId(null)}
      />
    </div>
  );
};
