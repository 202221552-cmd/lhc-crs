import React, { useState, useEffect } from 'react';
import { Save, Plus, BookOpen, Search, Filter, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface Course {
  id: string;
  name: string;
  category: string;
  hours: number;
  price: number;
  duration: string;
  description: string;
}

export const ManageCoursesPage = () => {
  const { token } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [query, setQuery] = useState('');

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/courses', { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setCourses(await res.json());
    } catch (err) { console.error(err); }
  };

  const [formData, setFormData] = useState({ name: '', category: 'COMPUTER', hours: 0, price: 0, duration: '', description: '' });

  const handleSave = async () => {
    if (!formData.name) return alert('يرجى إدخال اسم الدورة');
    
    setIsLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        fetchCourses();
        setFormData({ name: '', category: 'COMPUTER', hours: 0, price: 0, duration: '', description: '' });
      } else {
        alert('حدث خطأ');
      }
    } catch (err) {
      alert('تعذر الاتصال بالخادم');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('هل أنت متأكد من الحذف؟')) return;
    try {
      await fetch(`http://localhost:5000/api/courses/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchCourses();
    } catch (err) { console.error(err); }
  };

  const filtered = courses.filter(c => c.name.includes(query));

  return (
    <div className="grid-2 fade-in" style={{ gap: '30px', alignItems: 'start' }}>
      <div className="glass-panel">
        <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Plus size={20} className="text-primary" /> إضافة دورة جديدة
        </h3>
        
        <div className="form-group">
          <label className="form-label">اسم الدورة <span className="required-star">*</span></label>
          <input type="text" className="glass-input" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
        </div>

        <div className="grid-2">
          <div className="form-group">
            <label className="form-label">التصنيف</label>
            <select className="glass-input" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
              <option value="COMPUTER">حاسوب</option>
              <option value="MANAGEMENT">إدارية</option>
              <option value="LANGUAGES">لغات</option>
              <option value="FINANCE">مالية</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">السعر الأساسي</label>
            <input type="number" className="glass-input" value={formData.price} onChange={e => setFormData({...formData, price: Number(e.target.value)})} />
          </div>
        </div>

        <div className="grid-2">
          <div className="form-group">
            <label className="form-label">عدد الساعات</label>
            <input type="number" className="glass-input" value={formData.hours} onChange={e => setFormData({...formData, hours: Number(e.target.value)})} />
          </div>
          <div className="form-group">
            <label className="form-label">المدة الزمنية</label>
            <input type="text" className="glass-input" placeholder="مثال: شهرين" value={formData.duration} onChange={e => setFormData({...formData, duration: e.target.value})} />
          </div>
        </div>
        
        <div className="form-group">
          <label className="form-label">الوصف التفصيلي</label>
          <textarea className="glass-input" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}></textarea>
        </div>

        <button className="glass-btn" style={{ width: '100%' }} onClick={handleSave} disabled={isLoading}>
          <Save size={18} /> {isLoading ? 'جاري الحفظ...' : 'حفظ الدورة'}
        </button>
      </div>

      <div className="glass-panel">
        <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><BookOpen size={20} className="text-secondary" /> قائمة الدورات</span>
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
                <th>اسم الدورة</th>
                <th>السعر</th>
                <th>الساعات</th>
                <th>إجراء</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.id}>
                  <td>
                    <div>{c.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {c.category === 'COMPUTER' ? 'حاسوب' : c.category === 'MANAGEMENT' ? 'إدارية' : c.category === 'LANGUAGES' ? 'لغات' : 'مالية'}
                    </div>
                  </td>
                  <td>{c.price} د.أ</td>
                  <td>{c.hours} س</td>
                  <td>
                    <button className="glass-btn icon-only secondary" style={{ color: 'var(--danger)' }} onClick={() => handleDelete(c.id)}>
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
