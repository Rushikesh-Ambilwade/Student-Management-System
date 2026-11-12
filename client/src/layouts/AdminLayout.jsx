import { useState } from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';

export default function AdminLayout() {
  const { isAuthenticated, role, loading } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (role !== 'admin') {
    return <Navigate to="/student/dashboard" replace />;
  }

  // Derive page title from pathname
  const pathMap = {
    '/admin/dashboard': 'Executive Dashboard',
    '/admin/students': 'Student Registry',
    '/admin/students/new': 'Register New Student',
    '/admin/departments': 'Academic Departments & Programs',
    '/admin/subjects': 'Curriculum & Subjects',
    '/admin/attendance': 'Attendance Management',
    '/admin/examinations': 'Examinations & Marks',
    '/admin/fees': 'Fee Structures & Accounts',
    '/admin/timetable': 'Class Timetables',
    '/admin/announcements': 'Announcements & Notices',
    '/admin/audit-logs': 'Security Audit Trail',
    '/admin/settings': 'System Settings'
  };

  const currentTitle = pathMap[location.pathname] || 'Admin Portal';

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <Sidebar
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out ${
          collapsed ? 'lg:pl-20' : 'lg:pl-64'
        }`}
      >
        <Navbar setMobileOpen={setMobileOpen} pageTitle={currentTitle} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
