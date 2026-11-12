import { Outlet, Navigate, useLocation } from 'react-router-dom';
import StudentNavbar from '../components/StudentNavbar';
import { useAuth } from '../context/AuthContext';

export default function StudentLayout() {
  const { isAuthenticated, role, loading } = useAuth();
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

  if (role !== 'student') {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <StudentNavbar />
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        <Outlet />
      </main>
      <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4">
          <p>© 2026 CampusCore Student Management System. All rights reserved.</p>
          <p className="mt-1 text-[11px] text-slate-400">Secure Student Portal • Version 1.0 Production Release</p>
        </div>
      </footer>
    </div>
  );
}
