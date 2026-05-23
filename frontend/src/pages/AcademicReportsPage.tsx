import React, { useState, useEffect } from 'react';
import { BarChart2, RefreshCw, GraduationCap, BookOpen, Users, Award } from 'lucide-react';
import { useApi } from '../context/AuthContext';
import { PermissionGuard } from '../components/PermissionGuard';

export const AcademicReportsPage = () => {
  const { apiFetch } = useApi();
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const load = async () => {
    setIsLoading(true);
    try {
      const [studentsRes, diplomasRes, coursesRes] = await Promise.all([
        apiFetch('/students?limit=1'),
        apiFetch('/diplomas'),
        apiFetch('/courses'),
      ]);
      setStats({
        totalStudents: studentsRes.total || (Array.isArray(studentsRes) ? studentsRes.length : 0),
        totalDiplomas: (Array.isArray(diplomasRes) ? diplomasRes : []).length,
        totalCourses: (Array.isArray(coursesRes) ? coursesRes : []).length,
        diplomas: Array.isArray(diplomasRes) ? diplomasRes : [],
        courses: Array.isArray(coursesRes) ? coursesRes : [],
      });
    } catch (e) { console.error(e); }
    finally { setIsLoading(false); }
  };

  useEffect(() => { load(); }, []);

  return (
    <PermissionGuard perm="reports.academic">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
            <BarChart2 size={22} color="var(--primary-color)" /> التقارير الأكاديمية
          </h2>
          <button className="glass-btn secondary" onClick={load} disabled={isLoading}>
            <RefreshCw size={16} className={isLoading ? 'spin' : ''} /> تحديث
          </button>
        </div>

        {stats && (
          <>
            {/* KPI Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
              {[
                { label: 'إجمالي الطلاب', value: stats.totalStudents, color: 'var(--primary-color)', icon: Users },
                { label: 'الدبلومات', value: stats.totalDiplomas, color: 'var(--secondary-color)', icon: GraduationCap },
                { label: 'الدورات', value: stats.totalCourses, color: 'var(--success)', icon: BookOpen },
                { label: 'الشعب النشطة', value: '—', color: 'var(--warning)', icon: Award },
              ].map(c => (
                <div key={c.label} className="glass-panel" style={{ padding: '18px 20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{c.label}</div>
                    <c.icon size={18} color={c.color} />
                  </div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 800, color: c.color }}>{c.value}</div>
                </div>
              ))}
            </div>

            {/* Diplomas Table */}
            <div className="glass-panel">
              <h4 style={{ marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                <GraduationCap size={16} /> الدبلومات المتاحة
              </h4>
              <div className="glass-table-container">
                <table className="glass-table">
                  <thead><tr><th>اسم الدبلوم</th><th>الرسوم</th><th>المدة</th><th>الحالة</th></tr></thead>
                  <tbody>
                    {stats.diplomas.map((d: any) => (
                      <tr key={d.id}>
                        <td style={{ fontWeight: 600 }}>{d.name}</td>
                        <td style={{ color: 'var(--success)', fontWeight: 600 }}>{(d.price || 0).toFixed(3)} د</td>
                        <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{d.duration || '—'}</td>
                        <td><span className={`badge ${d.isActive !== false ? 'success' : 'danger'}`} style={{ fontSize: '0.75rem' }}>{d.isActive !== false ? 'نشط' : 'موقف'}</span></td>
                      </tr>
                    ))}
                    {stats.diplomas.length === 0 && <tr><td colSpan={4} style={{ textAlign: 'center', padding: 20, opacity: 0.5 }}>لا توجد دبلومات</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Courses Table */}
            <div className="glass-panel">
              <h4 style={{ marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                <BookOpen size={16} /> الدورات المتاحة
              </h4>
              <div className="glass-table-container">
                <table className="glass-table">
                  <thead><tr><th>اسم الدورة</th><th>الرسوم</th><th>الوصف</th></tr></thead>
                  <tbody>
                    {stats.courses.map((c: any) => (
                      <tr key={c.id}>
                        <td style={{ fontWeight: 600 }}>{c.name}</td>
                        <td style={{ color: 'var(--success)', fontWeight: 600 }}>{(c.price || 0).toFixed(3)} د</td>
                        <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)', maxWidth: 300 }}>{c.description || '—'}</td>
                      </tr>
                    ))}
                    {stats.courses.length === 0 && <tr><td colSpan={3} style={{ textAlign: 'center', padding: 20, opacity: 0.5 }}>لا توجد دورات</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </PermissionGuard>
  );
};
