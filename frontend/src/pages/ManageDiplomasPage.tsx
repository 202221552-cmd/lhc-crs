import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Save, Plus, GraduationCap, Search, Trash2, X, Pencil, BookOpen, DollarSign, Clock, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';
import { ConfirmModal } from '../components/ConfirmModal';
import { DIPLOMA_CATEGORIES, normalizeDigits } from '../utils/constants';

interface Course { id: string; name: string; price: number; hours: number; categoryId: number; }
interface CourseCategory { id: number; name: string; nameAr: string | null; }
interface EducationalEntity { id: number; name: string; }
interface Diploma {
  id: string;
  name: string;
  category: string;
  totalHours: number;
  totalPrice: number;
  minPayment: number;
  status: string;
  entity: { id: number; name: string } | null;
  entityId: number | null;
  courses: { course: Course; order: number }[];
  description?: string;
}

const statusOpts = [
  { value: 'ACTIVE', label: '🟢 فعالة' },
  { value: 'COMPLETED', label: '🔵 منتهية' },
  { value: 'SUSPENDED', label: '🟡 معلقة' },
];

export const ManageDiplomasPage = () => {
  const { token, hasPermission } = useAuth();
  const toast = useToast();
  const containerRef = useRef<HTMLDivElement>(null);
  const [diplomas, setDiplomas] = useState<Diploma[]>([]);
  const [allCourses, setAllCourses] = useState<Course[]>([]);
  const [categories, setCategories] = useState<CourseCategory[]>([]);
  const [entities, setEntities] = useState<EducationalEntity[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterEntity, setFilterEntity] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingStatus, setEditingStatus] = useState('');
  const [splitPos, setSplitPos] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [courseCatFilter, setCourseCatFilter] = useState('');

  const [editingDiploma, setEditingDiploma] = useState<Diploma | null>(null);
  const [formData, setFormData] = useState({ name: '', category: '', totalHours: 0, totalPrice: 0, minPayment: 0, description: '', entityId: '' });
  const [selectedCourses, setSelectedCourses] = useState<Course[]>([]);

  const fetchData = async () => {
    try {
      const [dipRes, crsRes, entRes, catRes] = await Promise.all([
        fetch(API_BASE + '/api/diplomas', { headers: { Authorization: `Bearer ${token}` } }),
        fetch(API_BASE + '/api/courses', { headers: { Authorization: `Bearer ${token}` } }),
        fetch(API_BASE + '/api/educational-entities', { headers: { Authorization: `Bearer ${token}` } }),
        fetch(API_BASE + '/api/courses/categories', { headers: { Authorization: `Bearer ${token}` } })
      ]);
      if (dipRes.ok) setDiplomas(await dipRes.json());
      if (crsRes.ok) setAllCourses(await crsRes.json());
      if (entRes.ok) setEntities(await entRes.json());
      if (catRes.ok) setCategories(await catRes.json());
    } catch (err) { console.error(err); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleAddCourse = (courseId: string) => {
    if (!courseId) return;
    const course = allCourses.find(c => c.id === courseId);
    if (course && !selectedCourses.find(c => c.id === course.id)) {
      setSelectedCourses([...selectedCourses, course]);
      setFormData(prev => ({ ...prev, totalHours: prev.totalHours + course.hours, totalPrice: prev.totalPrice + course.price }));
    }
  };

  const handleRemoveCourse = (courseId: string) => {
    const course = selectedCourses.find(c => c.id === courseId);
    if (course) {
      setSelectedCourses(selectedCourses.filter(c => c.id !== courseId));
      setFormData(prev => ({ ...prev, totalHours: Math.max(0, prev.totalHours - course.hours), totalPrice: Math.max(0, prev.totalPrice - course.price) }));
    }
  };

  const resetForm = () => {
    setFormData({ name: '', category: '', totalHours: 0, totalPrice: 0, minPayment: 0, description: '', entityId: '' });
    setSelectedCourses([]);
    setEditingDiploma(null);
  };

  const handleEditDiploma = (d: Diploma) => {
    setEditingDiploma(d);
    setFormData({
      name: d.name,
      category: d.category,
      totalHours: d.totalHours,
      totalPrice: d.totalPrice,
      minPayment: d.minPayment,
      description: d.description || '',
      entityId: String(d.entityId || '')
    });
    setSelectedCourses(d.courses.map(dc => dc.course));
    setCourseCatFilter('');
  };

  const handleSave = async () => {
    if (!formData.name) return toast.error('تنبيه', 'يرجى إدخال اسم الدبلوم');
    if (!formData.category) return toast.error('تنبيه', 'يرجى اختيار تصنيف الدبلوم');
    if (!formData.entityId) return toast.error('تنبيه', 'يرجى اختيار الجهة التعليمية');
    if (selectedCourses.length === 0) return toast.error('تنبيه', 'يرجى اختيار دورة واحدة على الأقل');
    if (formData.totalHours < 0) return toast.error('تنبيه', 'يرجى إدخال إجمالي الساعات');
    if (formData.totalPrice < 0) return toast.error('تنبيه', 'يرجى إدخال إجمالي السعر');
    if (formData.minPayment < 0) return toast.error('تنبيه', 'يرجى إدخال الحد الأدنى للدفع');

    const exists = diplomas.some(d => d.name === formData.name && (!editingDiploma || d.id !== editingDiploma.id));
    if (exists) return toast.error('خطأ', 'يوجد دبلوم بنفس الاسم بالفعل');

    setIsLoading(true);
    try {
      const isEdit = !!editingDiploma;
      const url = isEdit ? `${API_BASE}/api/diplomas/${editingDiploma!.id}` : API_BASE + '/api/diplomas';
      const method = isEdit ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...formData, courseIds: selectedCourses.map(c => c.id) })
      });
      if (res.ok) {
        toast.success(isEdit ? 'تم التعديل' : 'تمت الإضافة', isEdit ? 'تم تحديث الدبلوم بنجاح' : 'تم إضافة الدبلوم بنجاح');
        fetchData();
        resetForm();
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error('خطأ', err.error || 'حدث خطأ أثناء الحفظ');
      }
    } catch { toast.error('خطأ', 'تعذر الاتصال بالخادم'); }
    finally { setIsLoading(false); }
  };

  const handleStatusUpdate = async (id: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/diplomas/${id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: editingStatus })
      });
      if (res.ok) { toast.success('تم التحديث', 'تم تغيير الحالة بنجاح'); fetchData(); }
      else toast.error('خطأ', 'فشل تحديث الحالة');
    } catch { toast.error('خطأ', 'تعذر الاتصال بالخادم'); }
    finally { setEditingId(null); }
  };

  const handleDelete = (id: string) => setConfirmDeleteId(id);
  const handleConfirmDelete = async () => {
    if (!confirmDeleteId) return;
    try { await fetch(`${API_BASE}/api/diplomas/${confirmDeleteId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }); fetchData(); }
    catch (err) { console.error(err); }
    finally { setConfirmDeleteId(null); }
  };

  const handleResetFilters = () => { setSearchQuery(''); setFilterEntity(''); setFilterCategory(''); setFilterStatus(''); };

  const filtered = useMemo(() => diplomas.filter(d => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!d.name.toLowerCase().includes(q) && !d.id.toLowerCase().includes(q)) return false;
    }
    if (filterEntity && d.entityId !== Number(filterEntity)) return false;
    if (filterCategory && d.category !== filterCategory) return false;
    if (filterStatus && d.status !== filterStatus) return false;
    return true;
  }), [diplomas, searchQuery, filterEntity, filterCategory, filterStatus]);

  const getCategoryName = (catId: string) => {
    const cat = DIPLOMA_CATEGORIES.find(c => c.value === catId);
    return cat ? cat.label : catId;
  };

  const uniqueEntities = useMemo(() => {
    const map = new Map<number, string>();
    diplomas.forEach(d => { if (d.entity) map.set(d.entity.id, d.entity.name); });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [diplomas]);

  const uniqueCategories = useMemo(() => {
    const set = new Set(diplomas.map(d => d.category).filter(Boolean));
    return Array.from(set);
  }, [diplomas]);

  const anyFilterActive = searchQuery || filterEntity || filterCategory || filterStatus;

  /* ── Resizable splitter ── */
  const handleSplitMouseDown = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  useEffect(() => {
    if (!isDragging) return;
    const el = containerRef.current;
    if (!el) return;
    const onMove = (e: MouseEvent | TouchEvent) => {
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const rect = el.getBoundingClientRect();
      let pct = ((rect.right - clientX) / rect.width) * 100;
      pct = Math.max(25, Math.min(75, pct));
      setSplitPos(pct);
    };
    const onUp = () => setIsDragging(false);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('touchmove', onMove, { passive: true });
    window.addEventListener('touchend', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onUp);
    };
  }, [isDragging]);

  const diplomaCategoryName = (v: string) => DIPLOMA_CATEGORIES.find(c => c.value === v)?.label || v;

  return (
    <div className="fade-in">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2><GraduationCap className="text-primary" size={22} /> إدارة الدبلومات التدريبية</h2>
        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <GraduationCap size={16} style={{ opacity: 0.5 }} />
          إجمالي <strong style={{ color: 'var(--primary)' }}>{diplomas.length}</strong>
        </div>
      </div>

      <div ref={containerRef} style={{
        display: 'flex', gap: 0, alignItems: 'flex-start', position: 'relative',
        userSelect: isDragging ? 'none' : undefined,
        cursor: isDragging ? 'col-resize' : undefined
      }}>
        {/* ═══ RIGHT: Form ═══ */}
        <div style={{ width: `${splitPos}%`, flexShrink: 0, paddingLeft: '12px' }}>
          <div className="glass-panel">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Plus size={22} className="text-primary" /> {editingDiploma ? 'تعديل الدبلوم' : 'إضافة دبلوم تدريبي'}
              </h3>
              {editingDiploma && (
                <button className="glass-btn secondary sm" onClick={resetForm} style={{ fontSize: '0.72rem' }}>
                  <X size={12} /> إلغاء
                </button>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">اسم الدبلوم <span className="required-star">*</span></label>
              <input type="text" className="glass-input" value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                placeholder="مثال: دبلوم البرمجة المتقدمة" />
            </div>

            <div className="form-group">
              <label className="form-label">تصنيف الدبلوم <span className="required-star">*</span></label>
              <select className="glass-input" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })}>
                <option value="">-- اختر تصنيف الدبلوم --</option>
                {DIPLOMA_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">جهة التعليم <span className="required-star">*</span></label>
              <select className="glass-input" value={formData.entityId} onChange={e => setFormData({ ...formData, entityId: e.target.value })}>
                <option value="">-- اختر جهة تعليمية --</option>
                {entities.map(en => <option key={en.id} value={en.id}>{en.name}</option>)}
              </select>
            </div>

            <div className="divider" />

            <h4 style={{ marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
              <BookOpen size={16} className="text-secondary" /> إضافة دورات للدبلوم
              <span className="badge primary" style={{ marginRight: 'auto', fontSize: '0.72rem' }}>{selectedCourses.length} دورة</span>
            </h4>

            <div className="form-group" style={{ marginBottom: 8 }}>
              <label className="form-label" style={{ fontSize: '0.78rem' }}>تصفية الدورات حسب التصنيف</label>
              <select className="glass-input" value={courseCatFilter} onChange={e => setCourseCatFilter(e.target.value)}>
                <option value="">جميع التصنيفات</option>
                {categories.map(c => <option key={c.id} value={String(c.id)}>{c.nameAr || c.name}</option>)}
              </select>
            </div>

            <div className="form-group">
              <select className="glass-input" id="courseSelect"
                onChange={e => { if (e.target.value) { handleAddCourse(e.target.value); e.target.value = ''; } }}>
                <option value="">-- اختر دورة للإضافة --</option>
                {allCourses.filter(c => !courseCatFilter || c.categoryId === Number(courseCatFilter)).map(c => (
                  <option key={c.id} value={c.id}>[{c.id}] {c.name} ({c.price} د.أ)</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
              {selectedCourses.map((c, i) => (
                <div key={c.id} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  background: 'var(--glass-bg)', padding: '8px 12px', borderRadius: 8, fontSize: '0.85rem',
                  border: '1px solid var(--glass-border)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 22, height: 22, borderRadius: '50%', background: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.68rem', fontWeight: 700, flexShrink: 0 }}>{i + 1}</span>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.82rem' }}>{c.name}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{c.hours} س • {c.price} د.أ</div>
                    </div>
                  </div>
                  <button type="button" className="glass-btn icon-only secondary sm" style={{ padding: 4, color: 'var(--danger)' }} onClick={() => handleRemoveCourse(c.id)}><X size={13} /></button>
                </div>
              ))}
              {selectedCourses.length === 0 && (
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', padding: 14, border: '1px dashed var(--glass-border)', borderRadius: 8 }}>
                  <AlertCircle size={16} style={{ verticalAlign: 'middle', marginLeft: 5 }} />
                  لم يتم اختيار دورات بعد
                </div>
              )}
            </div>

            <div className="divider" />

            <h4 style={{ marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
              <DollarSign size={16} className="text-success" /> البيانات المالية
            </h4>

            <div className="grid-3" style={{ gap: 12 }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">الساعات</label>
                <input type="text" inputMode="numeric" className="glass-input" value={formData.totalHours || ''}
                  onChange={e => { const v = normalizeDigits(e.target.value).replace(/\D/g, ''); setFormData({ ...formData, totalHours: v ? parseInt(v) : 0 }); }}
                  placeholder="0" />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">السعر (د.أ)</label>
                <input type="text" inputMode="decimal" className="glass-input" value={formData.totalPrice || ''}
                  onChange={e => { const v = normalizeDigits(e.target.value).replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1'); setFormData({ ...formData, totalPrice: v ? parseFloat(v) : 0 }); }}
                  placeholder="0.00" />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">الحد الأدنى</label>
                <input type="text" inputMode="decimal" className="glass-input" value={formData.minPayment || ''}
                  onChange={e => { const v = normalizeDigits(e.target.value).replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1'); setFormData({ ...formData, minPayment: v ? parseFloat(v) : 0 }); }}
                  placeholder="0.00" />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">الوصف (اختياري)</label>
              <textarea className="glass-input" rows={3} value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="وصف مختصر لمحتوى الدبلوم..." />
            </div>

            {(hasPermission('diplomas.add') || hasPermission('diplomas.edit')) && (
              <button className="glass-btn" style={{ width: '100%' }} onClick={handleSave} disabled={isLoading}>
                <Save size={18} /> {isLoading ? 'جاري الحفظ...' : editingDiploma ? 'تحديث الدبلوم' : 'حفظ الدبلوم'}
              </button>
            )}
          </div>
        </div>

        {/* ═══ Draggable Divider ═══ */}
        <div onMouseDown={handleSplitMouseDown} onTouchStart={handleSplitMouseDown} style={{
          width: '10px', flexShrink: 0, cursor: 'col-resize',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          position: 'relative', zIndex: 10, margin: '0 -1px',
        }}>
          <div style={{
            width: '3px', height: '100%', minHeight: '300px', borderRadius: '2px',
            background: isDragging ? 'var(--primary)' : 'var(--glass-border)',
            transition: isDragging ? 'none' : 'background 0.2s',
            position: 'relative'
          }}>
            <div style={{
              position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
              width: 20, height: 32, borderRadius: 4,
              background: isDragging ? 'var(--primary)' : 'var(--card-bg)',
              border: `1px solid ${isDragging ? 'var(--primary)' : 'var(--glass-border)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, transition: 'all 0.15s',
              boxShadow: isDragging ? '0 0 12px rgba(99,102,241,0.3)' : '0 2px 6px rgba(0,0,0,0.08)'
            }}>
              <div style={{ width: 2, height: 12, borderRadius: 1, background: isDragging ? '#fff' : 'var(--text-muted)' }} />
              <div style={{ width: 2, height: 12, borderRadius: 1, background: isDragging ? '#fff' : 'var(--text-muted)' }} />
            </div>
          </div>
        </div>

        {/* ═══ LEFT: Search & List ═══ */}
        <div style={{ flex: 1, minWidth: 0, paddingRight: '12px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div className="glass-panel">
              <h3 style={{ marginBottom: 18, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Search size={18} className="text-secondary" /> الدبلومات المسجلة
                <span className="badge primary" style={{ marginRight: 'auto', fontSize: '0.75rem' }}>{diplomas.length}</span>
              </h3>

              <div style={{ position: 'relative', marginBottom: 12 }}>
                <Search size={15} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', zIndex: 1 }} />
                <input type="text" className="glass-input" style={{ paddingRight: 38, paddingLeft: searchQuery ? 32 : 12 }}
                  placeholder="ابحث باسم الدبلوم أو الرمز..." value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  onKeyDown={e => e.key === 'Escape' && setSearchQuery('')} />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} style={{
                    position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4, display: 'flex', zIndex: 2
                  }}><X size={14} /></button>
                )}
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <select className="glass-input" value={filterEntity} onChange={e => setFilterEntity(e.target.value)} style={{ fontSize: '0.82rem', flex: 1 }}>
                  <option value="">جهة التعليم: الكل</option>
                  {uniqueEntities.map(en => <option key={en.id} value={en.id}>{en.name}</option>)}
                </select>
                <select className="glass-input" value={filterCategory} onChange={e => setFilterCategory(e.target.value)} style={{ fontSize: '0.82rem', flex: 1 }}>
                  <option value="">التصنيف: الكل</option>
                  {uniqueCategories.map((cat, i) => <option key={i} value={cat}>{getCategoryName(cat)}</option>)}
                </select>
                <select className="glass-input" value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ fontSize: '0.82rem', flex: 1 }}>
                  <option value="">الحالة: الكل</option>
                  {statusOpts.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>

              {anyFilterActive && (
                <div style={{ marginTop: 12, display: 'flex', justifyContent: 'flex-end' }}>
                  <button className="glass-btn secondary sm" onClick={handleResetFilters} style={{ fontSize: '0.78rem' }}><X size={13} /> إلغاء التصفية</button>
                </div>
              )}
            </div>

            <div className="glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
              {filtered.length === 0 ? (
                <div className="empty-state" style={{ padding: '48px 0' }}>
                  <GraduationCap size={42} />
                  <p style={{ margin: '12px 0 4px', fontWeight: 600 }}>لا توجد دبلومات</p>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{diplomas.length === 0 ? 'لم يتم إضافة أي دبلوم بعد' : 'لا توجد نتائج تطابق البحث'}</p>
                </div>
              ) : (
                <div className="glass-table-container" style={{ border: 'none' }}>
                  <table className="glass-table">
                    <thead>
                      <tr>
                        <th style={{ width: 60 }}>الرمز</th>
                        <th>الاسم</th>
                        <th style={{ width: 100 }}>الجهة</th>
                        <th style={{ width: 80 }}>التصنيف</th>
                        <th style={{ width: 70 }}>الدورات</th>
                        <th style={{ width: 80 }}>السعر</th>
                        <th style={{ width: 80 }}>الحالة</th>
                        <th style={{ width: 55 }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map(d => (
                         <tr key={d.id} onClick={() => hasPermission('diplomas.edit') && handleEditDiploma(d)}
                           style={{ cursor: hasPermission('diplomas.edit') ? 'pointer' : undefined }}>
                           <td style={{ fontFamily: 'monospace', fontSize: '0.82rem', fontWeight: 700, color: 'var(--primary)' }}>{d.id}</td>
                           <td>
                             <div style={{ fontWeight: 700 }}>{d.name}</div>
                             <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 1, display: 'flex', alignItems: 'center', gap: 3 }}>
                               <Clock size={10} /> {d.totalHours} ساعة
                             </div>
                           </td>
                           <td style={{ fontSize: '0.78rem' }}>{d.entity?.name ? d.entity.name : '—'}</td>
                           <td style={{ fontSize: '0.75rem' }}><span className="badge secondary" style={{ fontSize: '0.68rem' }}>{diplomaCategoryName(d.category)}</span></td>
                           <td><span className="badge primary" style={{ fontSize: '0.68rem' }}>{d.courses.length}</span></td>
                           <td style={{ fontWeight: 700, color: 'var(--success)', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>{Number(d.totalPrice).toLocaleString()} د.أ</td>
                           <td onClick={e => e.stopPropagation()}>
                             {editingId === d.id ? (
                               <div style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
                                 <select className="glass-input" style={{ fontSize: '0.72rem', padding: '3px 5px', width: 85 }} value={editingStatus} onChange={e => setEditingStatus(e.target.value)}>
                                   {statusOpts.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                                 </select>
                                 <button className="glass-btn sm" style={{ padding: '2px 7px', fontSize: '0.68rem' }} onClick={() => handleStatusUpdate(d.id)}>حفظ</button>
                                 <button className="glass-btn sm secondary" style={{ padding: '2px 7px', fontSize: '0.68rem' }} onClick={() => setEditingId(null)}>X</button>
                               </div>
                             ) : (
                               <span className={`badge ${d.status === 'ACTIVE' ? 'success' : d.status === 'COMPLETED' ? 'secondary' : 'warning'}`}
                                 style={{ fontSize: '0.68rem', cursor: 'pointer' }}
                                 onClick={(e) => { e.stopPropagation(); if (hasPermission('diplomas.edit')) { setEditingId(d.id); setEditingStatus(d.status); } }}>
                                 {d.status === 'ACTIVE' ? 'فعالة' : d.status === 'COMPLETED' ? 'منتهية' : 'معلقة'}
                               </span>
                             )}
                           </td>
                           <td onClick={e => e.stopPropagation()}>
                             <div style={{ display: 'flex', gap: 3 }}>
                               {editingId !== d.id && hasPermission('diplomas.edit') && (
                                 <button className="glass-btn icon-only sm secondary" style={{ padding: 4 }} onClick={() => { setEditingId(d.id); setEditingStatus(d.status); }} title="تغيير الحالة"><Pencil size={12} /></button>
                               )}
                               {hasPermission('diplomas.delete') && (
                                 <button className="glass-btn icon-only sm secondary" style={{ padding: 4, color: 'var(--danger)' }} onClick={() => handleDelete(d.id)} title="حذف"><Trash2 size={12} /></button>
                               )}
                             </div>
                           </td>
                         </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <ConfirmModal isOpen={confirmDeleteId !== null} message="هل أنت متأكد من حذف هذا الدبلوم؟" confirmText="حذف" danger onConfirm={handleConfirmDelete} onCancel={() => setConfirmDeleteId(null)} />
    </div>
  );
};
