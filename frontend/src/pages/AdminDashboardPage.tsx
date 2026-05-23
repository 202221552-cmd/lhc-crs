import React, { useState, useEffect } from 'react';
import { Users, DollarSign, AlertTriangle, CheckCircle, BookOpen, GraduationCap, TrendingUp, Activity, RefreshCw } from 'lucide-react';
import { useApi, useAuth } from '../context/AuthContext';

interface DashStats {
  totalStudents: number;
  activeStudents: number;
  totalRevenue: number;
  monthlyRevenue: number;
  overdueInstallments: { count: number; amount: number };
  pendingInstallments: { count: number; amount: number };
  totalCourses: number;
  totalDiplomas: number;
  openSections: number;
  recentActivity: any[];
}

export const AdminDashboardPage = () => {
  const { apiFetch } = useApi();
  const { user } = useAuth();
  const [stats, setStats] = useState<DashStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStats = async () => {
    setIsLoading(true);
    try {
      const [students, financeSummary, courses, diplomas, sections, audit] = await Promise.all([
        apiFetch('/students?limit=9999'),
        apiFetch('/finances/summary'),
        apiFetch('/courses'),
        apiFetch('/diplomas'),
        apiFetch('/sections'),
        apiFetch('/audit?limit=8')
      ]);

      const allStudents = students.data || students;
      setStats({
        totalStudents: students.total || allStudents.length,
        activeStudents: allStudents.filter((s: any) => s.status === 'ACTIVE').length,
        totalRevenue: financeSummary.totalReceived || 0,
        monthlyRevenue: financeSummary.monthlyReceipts?.amount || 0,
        overdueInstallments: {
          count: financeSummary.overdueInstallments?.count || 0,
          amount: financeSummary.overdueInstallments?.amount || 0
        },
        pendingInstallments: {
          count: financeSummary.pendingInstallments?.count || 0,
          amount: financeSummary.pendingInstallments?.amount || 0
        },
        totalCourses: courses.length,
        totalDiplomas: diplomas.length,
        openSections: sections.filter((s: any) => s.status === 'OPEN').length,
        recentActivity: audit
      });
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchStats(); }, []);

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px' }}>
        <RefreshCw size={32} className="spin" style={{ color: 'var(--primary-color)' }} />
        <p style={{ color: 'var(--text-muted)', marginTop: 12 }}>جارٍ تحميل الإحصائيات...</p>
      </div>
    );
  }

  const mainCards = [
    { label: 'إجمالي الطلاب', value: stats?.totalStudents || 0, sub: `${stats?.activeStudents || 0} نشط`, color: 'var(--primary-color)', icon: Users, gradient: 'linear-gradient(135deg,#6366f1,#818cf8)' },
    { label: 'الإيرادات الكلية', value: `${(stats?.totalRevenue || 0).toFixed(3)}`, sub: 'دينار', color: 'var(--success)', icon: DollarSign, gradient: 'linear-gradient(135deg,#10b981,#34d399)' },
    { label: 'إيرادات هذا الشهر', value: `${(stats?.monthlyRevenue || 0).toFixed(3)}`, sub: 'دينار', color: 'var(--info)', icon: TrendingUp, gradient: 'linear-gradient(135deg,#06b6d4,#38bdf8)' },
    { label: 'أقساط متأخرة', value: stats?.overdueInstallments.count || 0, sub: `${(stats?.overdueInstallments.amount || 0).toFixed(3)} دينار`, color: 'var(--danger)', icon: AlertTriangle, gradient: 'linear-gradient(135deg,#ef4444,#f87171)' },
    { label: 'أقساط معلّقة', value: stats?.pendingInstallments.count || 0, sub: `${(stats?.pendingInstallments.amount || 0).toFixed(3)} دينار`, color: 'var(--warning)', icon: CheckCircle, gradient: 'linear-gradient(135deg,#f59e0b,#fbbf24)' },
    { label: 'الدورات المتاحة', value: stats?.totalCourses || 0, sub: `${stats?.totalDiplomas || 0} دبلوم • ${stats?.openSections || 0} شعبة مفتوحة`, color: '#a78bfa', icon: BookOpen, gradient: 'linear-gradient(135deg,#7c3aed,#a78bfa)' },
  ];

  const actionItems = [
    { label: 'الأقساط المتأخرة', badge: stats?.overdueInstallments.count, badgeColor: 'var(--danger)', href: '/fin-installments' },
    { label: 'تقرير الإيرادات', badge: null, badgeColor: '', href: '/fin-revenues' },
    { label: 'إدارة المستخدمين', badge: null, badgeColor: '', href: '/admin-users' },
    { label: 'سجل النشاط', badge: null, badgeColor: '', href: '/admin-activity' },
  ];

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800 }}>🏠 لوحة تحكم المدير</h2>
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: 4 }}>
            مرحباً {user?.fullName} — {new Date().toLocaleDateString('ar-JO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <button className="glass-btn secondary" onClick={fetchStats}>
          <RefreshCw size={16} /> تحديث
        </button>
      </div>

      {/* Main Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        {mainCards.map((card, i) => (
          <div key={i} className="glass-panel" style={{ padding: '22px 24px', position: 'relative', overflow: 'hidden' }}>
            <div style={{
              position: 'absolute', top: -20, left: -20, width: 100, height: 100,
              borderRadius: '50%', background: card.gradient, opacity: 0.08
            }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 6 }}>{card.label}</div>
                <div style={{ fontSize: '2rem', fontWeight: 900, color: card.color, lineHeight: 1 }}>{card.value}</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 6 }}>{card.sub}</div>
              </div>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: card.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 4px 16px ${card.color}44` }}>
                <card.icon size={22} color="#fff" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid-2" style={{ gap: 24 }}>

        {/* Recent Activity */}
        <div className="glass-panel">
          <h4 style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Activity size={18} color="var(--primary-color)" /> آخر النشاطات
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {(stats?.recentActivity || []).map((log: any, i: number) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: 'var(--card-bg)', borderRadius: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary-color)' }}>
                    {log.action?.charAt(0) || '?'}
                  </span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {log.action} — {log.entity}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {new Date(log.createdAt).toLocaleString('ar-JO')}
                  </div>
                </div>
              </div>
            ))}
            {!stats?.recentActivity?.length && (
              <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 24 }}>لا توجد نشاطات حديثة</p>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="glass-panel">
          <h4 style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <GraduationCap size={18} color="var(--secondary-color)" /> روابط سريعة
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {actionItems.map((item, i) => (
              <a key={i} href={item.href} style={{ textDecoration: 'none' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px', background: 'var(--card-bg)', borderRadius: 10, cursor: 'pointer', transition: 'all 0.2s' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--primary-light)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'var(--card-bg)')}>
                  <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{item.label}</span>
                  {item.badge ? (
                    <span style={{ background: item.badgeColor, color: '#fff', borderRadius: 20, padding: '2px 10px', fontSize: '0.8rem', fontWeight: 700 }}>
                      {item.badge}
                    </span>
                  ) : (
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>←</span>
                  )}
                </div>
              </a>
            ))}

            {/* Progress Bar: Students Coverage */}
            <div style={{ padding: '14px 18px', background: 'var(--card-bg)', borderRadius: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: 8 }}>
                <span>الطلاب النشطون</span>
                <span style={{ color: 'var(--primary-color)', fontWeight: 600 }}>
                  {stats?.activeStudents || 0} / {stats?.totalStudents || 0}
                </span>
              </div>
              <div style={{ background: 'var(--glass-border)', borderRadius: 100, height: 8, overflow: 'hidden' }}>
                <div style={{
                  height: '100%', borderRadius: 100,
                  background: 'linear-gradient(90deg, var(--primary-color), var(--secondary-color))',
                  width: `${stats?.totalStudents ? ((stats.activeStudents / stats.totalStudents) * 100) : 0}%`,
                  transition: 'width 0.8s ease'
                }} />
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};
