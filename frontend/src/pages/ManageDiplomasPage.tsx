import React, { useState, useEffect } from 'react';
import { Save, Plus, GraduationCap, Search, Filter, Trash2, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface Course { id: string; name: string; price: number; hours: number; }
interface Diploma {
  id: string;
  name: string;
  category: string;
  totalHours: number;
  totalPrice: number;
  courses: { course: Course; order: number }[];
}

export const ManageDiplomasPage = () => {
  const { token } = useAuth();
  const [diplomas, setDiplomas] = useState<Diploma[]>([]);
  const [allCourses, setAllCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [query, setQuery] = useState('');

  const [formData, setFormData] = useState({ name: '', category: 'COMPUTER', totalHours: 0, totalPrice: 0, description: '' });
  const [selectedCourses, setSelectedCourses] = useState<Course[]>([]);

  const fetchData = async () => {
    try {
      const [dipRes, crsRes] = await Promise.all([
        fetch('http://localhost:5000/api/diplomas', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('http://localhost:5000/api/courses', { headers: { Authorization: `Bearer ${token}` } })
      ]);
      if (dipRes.ok) setDiplomas(await dipRes.json());
      if (crsRes.ok) setAllCourses(await crsRes.json());
    } catch (err) { console.error(err); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleAddCourse = (courseId: string) => {
    if (!courseId) return;
    const course = allCourses.find(c => c.id === courseId);
    if (course && !selectedCourses.find(c => c.id === course.id)) {
      setSelectedCourses([...selectedCourses, course]);
      setFormData(prev => ({
        ...prev,
        totalHours: prev.totalHours + course.hours,
        totalPrice: prev.totalPrice + course.price
      }));
    }
  };

  const handleRemoveCourse = (courseId: string) => {
    const course = selectedCourses.find(c => c.id === courseId);
    if (course) {
      setSelectedCourses(selectedCourses.filter(c => c.id !== courseId));
      setFormData(prev => ({
        ...prev,
        totalHours: Math.max(0, prev.totalHours - course.hours),
        totalPrice: Math.max(0, prev.totalPrice - course.price)
      }));
    }
  };

  const handleSave = async () => {
    if (!formData.name) return alert('يرجى إدخال اسم الدبلوم');
    if (selectedCourses.length === 0) return alert('يرجى اختيار دورة واحدة على الأقل');

    setIsLoading(true);
    try {
      const payload = {
        ...formData,
        courseIds: selectedCourses.map(c => c.id)
      };

      const res = await fetch('http://localhost:5000/api/diplomas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      
      if (res.ok) {
        fetchData();
        setFormData({ name: '', category: 'COMPUTER', totalHours: 0, totalPrice: 0, description: '' });
        setSelectedCourses([]);
      } else {
        alert('حدث خطأ');
      }
    } catch (err) { alert('تعذر الاتصال بالخادم'); } 
    finally { setIsLoading(false); }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('هل أنت متأكد من الحذف؟')) return;
    try {
      await fetch(`http://localhost:5000/api/diplomas/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      fetchData();
    } catch (err) { console.error(err); }
  };

  const filtered = diplomas.filter(d => d.name.includes(query));

  return (
    <div className="grid-2 fade-in" style={{ gap: '30px', alignItems: 'start' }}>
      <div className="glass-panel">
        <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Plus size={20} className="text-primary" /> بناء دبلوم جديد
        </h3>
        
        <div className="form-group">
          <label className="form-label">اسم الدبلوم التدريبي <span className="required-star">*</span></label>
          <input type="text" className="glass-input" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
        </div>

        <div className="form-group">
          <label className="form-label">التصنيف</label>
          <select className="glass-input" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
            <option value="COMPUTER">حاسوب</option>
            <option value="MANAGEMENT">إدارية</option>
            <option value="LANGUAGES">لغات</option>
          </select>
        </div>

        <div className="form-group" style={{ background: 'var(--card-bg)', padding: '16px', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
          <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>الدورات المكونة للدبلوم (بالترتيب)</span>
            <span className="badge primary">{selectedCourses.length} دورات</span>
          </label>
          
          <div style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
            <select className="glass-input" id="courseSelect">
              <option value="">-- اختر دورة للإضافة --</option>
              {allCourses.map(c => <option key={c.id} value={c.id}>{c.name} ({c.price} د.أ)</option>)}
            </select>
            <button type="button" className="glass-btn sm" onClick={() => {
              const sel = document.getElementById('courseSelect') as HTMLSelectElement;
              handleAddCourse(sel.value);
              sel.value = '';
            }}>إضافة</button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {selectedCourses.map((c, index) => (
              <div key={c.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--glass-bg)', padding: '8px 12px', borderRadius: '8px', fontSize: '0.85rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem' }}>{index + 1}</span>
                  {c.name}
                </div>
                <button type="button" className="glass-btn icon-only secondary sm" style={{ padding: '4px', color: 'var(--danger)' }} onClick={() => handleRemoveCourse(c.id)}>
                  <X size={14} />
                </button>
              </div>
            ))}
            {selectedCourses.length === 0 && <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', padding: '10px' }}>لم يتم اختيار دورات بعد</div>}
          </div>
        </div>

        <div className="grid-2">
          <div className="form-group">
            <label className="form-label">إجمالي الساعات</label>
            <input type="number" className="glass-input" value={formData.totalHours} onChange={e => setFormData({...formData, totalHours: Number(e.target.value)})} />
          </div>
          <div className="form-group">
            <label className="form-label">إجمالي السعر (دينار)</label>
            <input type="number" className="glass-input" value={formData.totalPrice} onChange={e => setFormData({...formData, totalPrice: Number(e.target.value)})} />
          </div>
        </div>

        <button className="glass-btn" style={{ width: '100%', marginTop: '10px' }} onClick={handleSave} disabled={isLoading}>
          <Save size={18} /> {isLoading ? 'جاري الحفظ...' : 'حفظ الدبلوم'}
        </button>
      </div>

      <div className="glass-panel">
        <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><GraduationCap size={20} className="text-secondary" /> قائمة الدبلومات</span>
          <div className="search-bar" style={{ maxWidth: 200 }}>
            <Search className="search-icon" size={16} />
            <input type="text" className="glass-input" style={{ fontSize: '0.85rem', padding: '6px 36px 6px 12px' }} placeholder="بحث..." value={query} onChange={e => setQuery(e.target.value)} />
            <button className="glass-btn secondary sm icon-only" style={{ position: 'absolute', left: 2, top: 2 }} title="بحث عميق">
              <Filter size={14} />
            </button>
          </div>
        </h3>
        
        <div className="glass-table-container">
          <table className="glass-table">
            <thead>
              <tr>
                <th>اسم الدبلوم</th>
                <th>الدورات</th>
                <th>إجمالي السعر</th>
                <th>إجراء</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(d => (
                <tr key={d.id}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{d.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{d.totalHours} ساعة</div>
                  </td>
                  <td style={{ fontSize: '0.8rem' }}>
                    {d.courses.length} دورات
                  </td>
                  <td style={{ fontWeight: 600, color: 'var(--primary)' }}>{d.totalPrice} د.أ</td>
                  <td>
                    <button className="glass-btn icon-only secondary" style={{ color: 'var(--danger)' }} onClick={() => handleDelete(d.id)}>
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={4} style={{ textAlign: 'center', padding: 20 }}>لا توجد بيانات</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
