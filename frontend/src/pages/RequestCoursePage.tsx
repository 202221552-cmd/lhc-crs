import React, { useState, useEffect } from 'react';
import { Book, Plus, User, Search, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import { ConfirmModal } from '../components/ConfirmModal';

export const RequestCoursePage = () => {
  const { token } = useAuth();
  const toast = useToast();
  const [requests, setRequests] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({ studentId: '', courseId: '', priority: 'عادي' });
  const [searchStudent, setSearchStudent] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [reqRes, stdRes, crsRes] = await Promise.all([
        fetch('http://localhost:5000/api/request-course', { headers }),
        fetch('http://localhost:5000/api/students', { headers }),
        fetch('http://localhost:5000/api/courses', { headers })
      ]);
      if (reqRes.ok) setRequests(await reqRes.json());
      if (stdRes.ok) setStudents(await stdRes.json());
      if (crsRes.ok) setCourses(await crsRes.json());
    } catch (err) { console.error(err); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async () => {
    if (!selectedStudent || !formData.courseId) return toast.error('تنبيه', 'يرجى اختيار الطالب والدورة');
    
    try {
      const res = await fetch('http://localhost:5000/api/request-course', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          studentId: selectedStudent.id,
          courseId: formData.courseId
        })
      });
      if (res.ok) {
        toast.success('تم التسجيل', 'تم تسجيل طلب الدورة بنجاح');
        fetchData();
        setSelectedStudent(null);
        setFormData({ studentId: '', courseId: '', priority: 'عادي' });
      } else {
        toast.error('خطأ', 'حدث خطأ أثناء التسجيل');
      }
    } catch (err) { toast.error('خطأ', 'تعذر الاتصال بالخادم'); }
  };

  const handleDelete = (id: string) => {
    setConfirmDeleteId(id);
  };

  const handleConfirmDelete = async () => {
    if (!confirmDeleteId) return;
    try {
      await fetch(`http://localhost:5000/api/request-course/${confirmDeleteId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      fetchData();
    } catch (err) { console.error(err); }
    finally { setConfirmDeleteId(null); }
  };

  // Group requests by course
  const groupedRequests = requests.reduce((acc: any, req: any) => {
    const cName = req.course?.name || 'غير معروف';
    if (!acc[cName]) acc[cName] = { count: 0, status: req.status };
    acc[cName].count += 1;
    return acc;
  }, {});

  return (
    <div className="grid-2 fade-in" style={{ gap: '30px' }}>
      <div className="glass-panel">
        <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Plus size={20} color="var(--primary-color)" /> تسجيل طلب دورة (Waiting List)
        </h3>
        
        <p style={{ opacity: 0.8, marginBottom: '20px' }}>في حال رغب الطالب بدورة غير مطروحة حالياً، يمكنك تسجيل طلبه هنا ليتم فتحها لاحقاً عند اكتمال العدد.</p>

        <div className="form-group">
          <label className="form-label">البحث عن طالب <span className="required-star">*</span></label>
          <div style={{ position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', right: '15px', top: '15px', color: 'rgba(255,255,255,0.5)' }} />
            <input type="text" className="glass-input" style={{ paddingRight: '40px' }} placeholder="ابحث بالاسم أو الهاتف" value={searchStudent} onChange={e => setSearchStudent(e.target.value)} />
          </div>
          {searchStudent && (
            <div style={{ background: 'var(--card-bg)', padding: '10px', borderRadius: '8px', marginTop: 5 }}>
              {students.filter(s => s.fullNameAr?.includes(searchStudent) || s.phones?.some((p: string) => p.includes(searchStudent) || (searchStudent.startsWith('0') && p.includes(searchStudent.slice(1))))).map(s => (
                <div key={s.id} style={{ padding: '8px', borderBottom: '1px solid var(--glass-border)', cursor: 'pointer' }} onClick={() => { setSelectedStudent(s); setSearchStudent(''); }}>
                  {s.fullNameAr} - 0{s.phones?.[0]}
                </div>
              ))}
            </div>
          )}
        </div>

        {selectedStudent && (
          <div style={{ padding: 12, background: 'var(--primary-light)', borderRadius: 8, marginBottom: 16 }}>
            الطالب المحدد: <strong>{selectedStudent.fullNameAr}</strong>
            <button className="glass-btn sm secondary" style={{ float: 'left' }} onClick={() => setSelectedStudent(null)}>إلغاء</button>
          </div>
        )}

        <div className="form-group">
          <label className="form-label">الدورة المطلوبة <span className="required-star">*</span></label>
          <select className="glass-input" value={formData.courseId} onChange={e => setFormData({...formData, courseId: e.target.value})}>
            <option value="">-- اختر الدورة --</option>
            {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">الأهمية</label>
          <select className="glass-input" value={formData.priority} onChange={e => setFormData({...formData, priority: e.target.value})}>
            <option value="عادي">عادي</option>
            <option value="مرتفع">مرتفع (الطالب مستعجل)</option>
          </select>
        </div>

        <button className="glass-btn" style={{ width: '100%' }} onClick={handleSubmit}>
          تسجيل الطلب
        </button>
      </div>

      <div className="glass-panel">
        <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Book size={20} color="var(--secondary-color)" /> الطلبات الحالية للدورات
        </h3>
        
        <div className="glass-table-container">
          <table className="glass-table">
            <thead>
              <tr>
                <th>الدورة المطلوبة</th>
                <th>عدد الطلبات</th>
                <th>الحالة</th>
              </tr>
            </thead>
            <tbody>
              {Object.keys(groupedRequests).map((courseName, idx) => (
                <tr key={idx}>
                  <td>{courseName}</td>
                  <td><strong style={{ color: groupedRequests[courseName].count >= 10 ? 'var(--danger)' : 'var(--primary)' }}>{groupedRequests[courseName].count}</strong> طلاب</td>
                  <td>
                    <span className={`badge ${groupedRequests[courseName].count >= 10 ? 'danger' : 'secondary'}`}>
                      {groupedRequests[courseName].count >= 10 ? 'جاهزة للفتح' : 'قيد الانتظار'}
                    </span>
                  </td>
                </tr>
              ))}
              {Object.keys(groupedRequests).length === 0 && (
                <tr><td colSpan={3} style={{ textAlign: 'center', padding: 20 }}>لا توجد طلبات</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <h4 style={{ marginTop: 30, marginBottom: 15 }}>سجل طلبات الطلاب:</h4>
        <div className="glass-table-container">
          <table className="glass-table">
            <thead>
              <tr>
                <th>الطالب</th>
                <th>الدورة</th>
                <th>إجراء</th>
              </tr>
            </thead>
            <tbody>
              {requests.map(req => (
                <tr key={req.id}>
                  <td>{req.student?.fullNameAr}</td>
                  <td>{req.course?.name}</td>
                  <td>
                    <button className="glass-btn icon-only secondary" style={{ color: 'var(--danger)' }} onClick={() => handleDelete(req.id)}>
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

        <ConfirmModal
          isOpen={confirmDeleteId !== null}
          message="هل أنت متأكد من حذف هذا الطلب؟"
          confirmText="حذف"
          danger
          onConfirm={handleConfirmDelete}
          onCancel={() => setConfirmDeleteId(null)}
        />
    </div>
  );
};
