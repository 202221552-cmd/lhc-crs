import React, { useState, useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Users, GraduationCap, DollarSign, Settings, LayoutDashboard, BookOpen,
  Layers, ChevronDown, ChevronUp, UserCheck, Search, BarChart,
  FileText, CreditCard, Shield, Bell, Moon, Sun, LogOut, Activity, Building2
} from 'lucide-react';

// ========== SIDEBAR MENU CONFIG ==========
interface MenuItem {
  path: string;
  name: string;
  icon: React.ReactNode;
  permission?: string;
}

interface MenuGroup {
  key: string;
  label: string;
  icon: React.ReactNode;
  items: MenuItem[];
}

const MENU_GROUPS: MenuGroup[] = [
  {
    key: 'registration',
    label: 'شؤون الطلبة والتسجيل',
    icon: <GraduationCap size={18} />,
    items: [
      { path: '/students', name: 'إدارة الطلاب', icon: <Users size={16} />, permission: 'students.view' },
      { path: '/diploma-subscription', name: 'تسجيل دبلوم', icon: <GraduationCap size={16} />, permission: 'subscriptions.add' },
      { path: '/course-subscription', name: 'تسجيل دورة', icon: <BookOpen size={16} />, permission: 'subscriptions.add' },
      { path: '/request-course', name: 'طلب دورة غير مطروحة', icon: <BookOpen size={16} />, permission: 'subscriptions.add' },
      { path: '/manage-courses', name: 'إدارة الدورات', icon: <BookOpen size={16} />, permission: 'courses.manage' },
      { path: '/manage-diplomas', name: 'إدارة الدبلومات', icon: <GraduationCap size={16} />, permission: 'diplomas.manage' },
      { path: '/manage-sections', name: 'إدارة الشعب', icon: <Layers size={16} />, permission: 'sections.manage' },
      { path: '/add-to-section', name: 'الفرز وإضافة لشعبة', icon: <UserCheck size={16} />, permission: 'sections.manage' },
      { path: '/attendance', name: 'الحضور والغياب', icon: <UserCheck size={16} />, permission: 'attendance.manage' },
      { path: '/student-profile', name: 'ملف الطالب', icon: <Search size={16} />, permission: 'students.view' },
      { path: '/academic-reports', name: 'التقارير الأكاديمية', icon: <BarChart size={16} />, permission: 'reports.academic' },
    ],
  },
  {
    key: 'financial',
    label: 'الإدارة المالية',
    icon: <DollarSign size={18} />,
    items: [
      { path: '/fin-student', name: 'مالية الطلاب', icon: <CreditCard size={16} />, permission: 'finance.view' },
      { path: '/fin-receipts', name: 'سندات القبض', icon: <FileText size={16} />, permission: 'finance.receipts' },
      { path: '/fin-payments', name: 'سندات الصرف', icon: <FileText size={16} />, permission: 'finance.payments' },
      { path: '/fin-reports', name: 'التقارير المالية', icon: <BarChart size={16} />, permission: 'finance.reports' },
    ],
  },
  {
    key: 'admin',
    label: 'إدارة النظام',
    icon: <Settings size={18} />,
    items: [
      { path: '/admin-dashboard', name: 'لوحة التحكم', icon: <LayoutDashboard size={16} />, permission: 'admin.users' },
      { path: '/admin-entities', name: 'جهات التعليم', icon: <Building2 size={16} />, permission: 'admin.settings' },
      { path: '/admin-rooms', name: 'القاعات والمختبرات', icon: <Layers size={16} />, permission: 'admin.settings' },
      { path: '/admin-instructors', name: 'المحاضرين', icon: <GraduationCap size={16} />, permission: 'admin.settings' },
      { path: '/admin-users', name: 'المستخدمون والصلاحيات', icon: <Users size={16} />, permission: 'admin.users' },
      { path: '/admin-activity', name: 'تتبع النشاطات', icon: <Activity size={16} />, permission: 'admin.audit' },
      { path: '/admin-settings', name: 'إعدادات المركز', icon: <Settings size={16} />, permission: 'admin.settings' },
      { path: '/admin-alerts', name: 'الإعلانات', icon: <Bell size={16} />, permission: 'admin.settings' },
    ],
  },
];

// ========== SIDEBAR ==========
const Sidebar = () => {
  const location = useLocation();
  const { hasPermission, centerName, centerLogo } = useAuth();
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({ registration: true });

  const toggleMenu = (key: string) => {
    setOpenMenus(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <aside className="sidebar">
      <div className="logo-area">
        <div style={{
          width: 40, height: 40, borderRadius: 10,
          background: centerLogo ? 'none' : 'var(--primary-light)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--primary)', flexShrink: 0, overflow: 'hidden',
        }}>
          {centerLogo ? (
            <img src={centerLogo} alt="logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <GraduationCap size={22} />
          )}
        </div>
        <div>
          <div className="logo-text">{centerName}</div>
          <div className="logo-sub">نظام إدارة الدورات</div>
        </div>
      </div>

      <nav style={{ flex: 1, padding: '4px 0' }}>
        <Link to="/" className={`menu-item ${location.pathname === '/' ? 'active' : ''}`} style={{ margin: '0 8px', borderRadius: 8 }}>
          <LayoutDashboard size={18} />
          <span>الرئيسية</span>
        </Link>

        {MENU_GROUPS.map(group => {
          const visibleItems = group.items.filter(item => !item.permission || hasPermission(item.permission));
          if (visibleItems.length === 0) return null;

          return (
            <div className="menu-group" key={group.key}>
              <div className="menu-header" onClick={() => toggleMenu(group.key)}>
                <div className="menu-header-label">{group.icon}<span>{group.label}</span></div>
                {openMenus[group.key] ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </div>
              {openMenus[group.key] && (
                <div className="submenu slide-in">
                  {visibleItems.map(item => (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`menu-item sub-item ${location.pathname === item.path ? 'active' : ''}`}
                    >
                      {item.icon}
                      <span>{item.name}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>
    </aside>
  );
};

// ========== TOPBAR ==========
const Topbar = () => {
  const { user, logout, centerName } = useAuth();
  const navigate = useNavigate();
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="topbar">
      <div>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)' }}>{centerName}</h2>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <button onClick={toggleTheme} className="glass-btn secondary icon-only" title={theme === 'light' ? 'الوضع الداكن' : 'الوضع الفاتح'}>
          {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
        </button>

        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          padding: '6px 14px', borderRadius: '10px',
          background: 'var(--card-bg)', border: '1px solid var(--glass-border)',
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            background: 'var(--primary-light)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', color: 'var(--primary)',
          }}>
            <Users size={16} />
          </div>
          <div style={{ lineHeight: 1.2 }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>{user?.fullName}</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{user?.role}</div>
          </div>
        </div>

        <button onClick={handleLogout} className="glass-btn secondary icon-only" title="تسجيل الخروج" style={{ color: 'var(--danger)' }}>
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
};

// ========== MAIN LAYOUT ==========
export const Layout = () => {
  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <Topbar />
        <div className="page-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
