import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Layout } from './components/Layout';
import { PermissionGuard } from './components/PermissionGuard';
import { LoginPage } from './pages/LoginPage';
import { StudentsPage } from './pages/StudentsPage';
import { DiplomaSubscriptionPage } from './pages/DiplomaSubscriptionPage';
import { CourseSubscriptionPage } from './pages/CourseSubscriptionPage';
import { ManageCoursesPage } from './pages/ManageCoursesPage';
import { StudentProfilePage } from './pages/StudentProfilePage';
import { ManageDiplomasPage } from './pages/ManageDiplomasPage';
import { ManageSectionsPage } from './pages/ManageSectionsPage';
import { AddToSectionPage } from './pages/AddToSectionPage';
import { RequestCoursePage } from './pages/RequestCoursePage';
import { AttendancePage } from './pages/AttendancePage';
import { ReportsPage } from './pages/ReportsPage';
import { AcademicReportsPage } from './pages/AcademicReportsPage';
import { FinStudentPage } from './pages/FinStudentPage';
import { FinReceiptsPage } from './pages/FinReceiptsPage';
import { FinPaymentsPage } from './pages/FinPaymentsPage';
import { FinInstallmentsPage } from './pages/FinInstallmentsPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { AdminUsersPage } from './pages/AdminUsersPage';
import { AdminSettingsPage } from './pages/AdminSettingsPage';
import { AdminActivityPage } from './pages/AdminActivityPage';
import { AdminAlertsPage } from './pages/AdminSystemPage';
import { AdminEntitiesPage } from './pages/AdminEntitiesPage';
import { AdminRoomsPage } from './pages/AdminRoomsPage';
import { AdminInstructorsPage } from './pages/AdminInstructorsPage';
import { FinRevenuesPage } from './pages/FinRevenuesPage';
import { FinExpensesPage } from './pages/FinExpensesPage';
import { FinDistributionPage } from './pages/FinDistributionPage';
import { FinSettlementsPage } from './pages/FinSettlementsPage';
import { FinCommissionsPage } from './pages/FinCommissionsPage';
import { SmartQueriesPage } from './pages/SmartQueriesPage';
import { ImportExcelPage } from './pages/ImportExcelPage';

// ===== Loading Screen =====
const LoadingScreen = () => (
  <div style={{
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    height: '100vh', flexDirection: 'column', gap: 16
  }}>
    <div style={{
      width: 52, height: 52, borderRadius: '50%',
      border: '3px solid var(--glass-border)',
      borderTop: '3px solid var(--primary-color)',
      animation: 'spin 0.8s linear infinite'
    }} />
    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>جارٍ التحقق من الجلسة...</p>
  </div>
);

// ===== Protected Route =====
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading } = useAuth();
  if (isLoading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

// ===== Home Dashboard =====
const HomePage = () => {
  const { user, centerName } = useAuth();
  return (
    <div className="fade-in" style={{ textAlign: 'center', marginTop: '6%' }}>
      <div className="glass-panel" style={{ maxWidth: 520, margin: '0 auto', padding: '48px 40px' }}>
        <div style={{
          width: 72, height: 72, borderRadius: '50%', margin: '0 auto 20px',
          background: 'linear-gradient(135deg, var(--primary-color), var(--secondary-color))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '2rem', boxShadow: '0 8px 32px rgba(99,102,241,0.4)'
        }}>
          🎓
        </div>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: 8 }}>
          مرحباً، {user?.fullName} 👋
        </h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: 20, fontSize: '0.95rem' }}>
          أهلاً بك في {centerName}
        </p>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
          <span className="badge primary" style={{ fontSize: '0.85rem', padding: '6px 16px' }}>
            {user?.role === 'ADMIN' ? '👑 مسؤول النظام' : `👤 ${user?.role}`}
          </span>
          {user?.isAdmin && (
            <span className="badge success" style={{ fontSize: '0.85rem', padding: '6px 16px' }}>
              ✅ صلاحيات كاملة
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}

const AppRoutes = () => {
  const { user } = useAuth();

  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage />} />

      {/* Protected */}
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<HomePage />} />

        {/* Registration */}
        <Route path="students" element={<PermissionGuard perm="students.view"><StudentsPage /></PermissionGuard>} />
        <Route path="student-profile" element={<PermissionGuard perm="students.view"><StudentProfilePage /></PermissionGuard>} />
        <Route path="diploma-subscription" element={<PermissionGuard perm="subscriptions.add"><DiplomaSubscriptionPage /></PermissionGuard>} />
        <Route path="course-subscription" element={<PermissionGuard perm="subscriptions.add"><CourseSubscriptionPage /></PermissionGuard>} />
        <Route path="manage-courses" element={<PermissionGuard perm="courses.manage"><ManageCoursesPage /></PermissionGuard>} />
        <Route path="manage-diplomas" element={<PermissionGuard perm="diplomas.manage"><ManageDiplomasPage /></PermissionGuard>} />
        <Route path="manage-sections" element={<PermissionGuard perm="sections.manage"><ManageSectionsPage /></PermissionGuard>} />
        <Route path="add-to-section" element={<PermissionGuard perm="sections.assign"><AddToSectionPage /></PermissionGuard>} />
        <Route path="request-course" element={<PermissionGuard perm="students.view"><RequestCoursePage /></PermissionGuard>} />
        <Route path="attendance" element={<PermissionGuard perm="attendance.manage"><AttendancePage /></PermissionGuard>} />
        <Route path="academic-reports" element={<PermissionGuard perm="reports.academic"><AcademicReportsPage /></PermissionGuard>} />
        <Route path="smart-queries" element={<PermissionGuard perm="reports.academic"><SmartQueriesPage /></PermissionGuard>} />
        <Route path="import-excel" element={<PermissionGuard perm="students.add"><ImportExcelPage /></PermissionGuard>} />

        {/* Financial */}
        <Route path="fin-student" element={<PermissionGuard perm="finance.view"><FinStudentPage /></PermissionGuard>} />
        <Route path="fin-receipts" element={<PermissionGuard perm="finance.receipts"><FinReceiptsPage /></PermissionGuard>} />
        <Route path="fin-payments" element={<PermissionGuard perm="finance.payments"><FinPaymentsPage /></PermissionGuard>} />
        <Route path="fin-installments" element={<PermissionGuard perm="finance.installments"><FinInstallmentsPage /></PermissionGuard>} />
        <Route path="fin-revenues" element={<PermissionGuard perm="finance.reports"><FinRevenuesPage /></PermissionGuard>} />
        <Route path="fin-expenses" element={<PermissionGuard perm="finance.reports"><FinExpensesPage /></PermissionGuard>} />
        <Route path="fin-distribution" element={<PermissionGuard perm="finance.settlements"><FinDistributionPage /></PermissionGuard>} />
        <Route path="fin-settlements" element={<PermissionGuard perm="finance.settlements"><FinSettlementsPage /></PermissionGuard>} />
        <Route path="fin-commissions" element={<PermissionGuard perm="finance.settlements"><FinCommissionsPage /></PermissionGuard>} />

        {/* Admin */}
        <Route path="admin-dashboard" element={<PermissionGuard perm="admin.settings"><AdminDashboardPage /></PermissionGuard>} />
        <Route path="admin-entities" element={<PermissionGuard perm="admin.entities"><AdminEntitiesPage /></PermissionGuard>} />
        <Route path="admin-rooms" element={<PermissionGuard perm="admin.rooms"><AdminRoomsPage /></PermissionGuard>} />
        <Route path="admin-instructors" element={<PermissionGuard perm="admin.instructors"><AdminInstructorsPage /></PermissionGuard>} />
        <Route path="admin-users" element={<PermissionGuard perm="admin.users"><AdminUsersPage /></PermissionGuard>} />
        <Route path="admin-activity" element={<PermissionGuard perm="admin.audit"><AdminActivityPage /></PermissionGuard>} />
        <Route path="admin-settings" element={<PermissionGuard perm="admin.settings"><AdminSettingsPage /></PermissionGuard>} />
        <Route path="admin-alerts" element={<PermissionGuard perm="admin.settings"><AdminAlertsPage /></PermissionGuard>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
};

export default App;
