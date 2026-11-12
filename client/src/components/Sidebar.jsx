import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  CalendarCheck,
  Award,
  CreditCard,
  Clock,
  Megaphone,
  ShieldAlert,
  Settings,
  ChevronLeft,
  ChevronRight,
  School
} from 'lucide-react';

const adminNavItems = [
  { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
  { name: 'Students', path: '/admin/students', icon: Users },
  { name: 'Departments & Courses', path: '/admin/departments', icon: GraduationCap },
  { name: 'Subjects', path: '/admin/subjects', icon: BookOpen },
  { name: 'Attendance', path: '/admin/attendance', icon: CalendarCheck },
  { name: 'Examinations & Marks', path: '/admin/examinations', icon: Award },
  { name: 'Fees Management', path: '/admin/fees', icon: CreditCard },
  { name: 'Timetable', path: '/admin/timetable', icon: Clock },
  { name: 'Announcements', path: '/admin/announcements', icon: Megaphone },
  { name: 'Audit Logs', path: '/admin/audit-logs', icon: ShieldAlert },
  { name: 'Settings', path: '/admin/settings', icon: Settings }
];

export default function Sidebar({ collapsed, setCollapsed, mobileOpen, setMobileOpen }) {
  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col bg-slate-900 text-slate-300 transition-all duration-300 ease-in-out border-r border-slate-800 ${
          collapsed ? 'w-20' : 'w-64'
        } ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-slate-800">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-400 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 shrink-0">
              <School className="w-6 h-6" />
            </div>
            {!collapsed && (
              <div className="flex flex-col truncate">
                <span className="font-bold text-white tracking-tight leading-none text-base">CampusCore</span>
                <span className="text-xs text-indigo-400 font-medium tracking-wide mt-1">ADMIN PORTAL</span>
              </div>
            )}
          </div>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex items-center justify-center w-7 h-7 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {adminNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.name}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 group relative ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                  } ${collapsed ? 'justify-center' : ''}`
                }
                title={collapsed ? item.name : undefined}
              >
                <Icon className="w-5 h-5 shrink-0 transition-transform group-hover:scale-105" />
                {!collapsed && <span className="truncate">{item.name}</span>}
              </NavLink>
            );
          })}
        </nav>

        {/* Bottom Footer Details */}
        {!collapsed && (
          <div className="p-4 border-t border-slate-800 text-xs text-slate-500">
            <div className="font-medium text-slate-400">CampusCore SMS v1.0</div>
            <div className="mt-0.5">Production MySQL Stack</div>
          </div>
        )}
      </aside>
    </>
  );
}
