import { useState, useEffect, useRef } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  School,
  LayoutDashboard,
  User,
  BookOpen,
  CalendarCheck,
  Award,
  CreditCard,
  Clock,
  Megaphone,
  KeyRound,
  Bell,
  LogOut,
  Menu,
  X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../services/api';

const studentNavLinks = [
  { name: 'Dashboard', path: '/student/dashboard', icon: LayoutDashboard },
  { name: 'My Profile', path: '/student/profile', icon: User },
  { name: 'My Subjects', path: '/student/subjects', icon: BookOpen },
  { name: 'My Attendance', path: '/student/attendance', icon: CalendarCheck },
  { name: 'My Marks', path: '/student/marks', icon: Award },
  { name: 'My Fees', path: '/student/fees', icon: CreditCard },
  { name: 'My Timetable', path: '/student/timetable', icon: Clock },
  { name: 'Announcements', path: '/student/announcements', icon: Megaphone },
  { name: 'Change Password', path: '/student/change-password', icon: KeyRound }
];

export default function StudentNavbar() {
  const { user, logout } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifOpen, setNotifOpen] = useState(false);

  const notifRef = useRef(null);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      if (res.data.success) {
        setNotifications(res.data.notifications || []);
        setUnreadCount(res.data.unreadCount || 0);
      }
    } catch {
      // Ignore background notification fetch errors
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  const handleMarkAsRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch {
      toast.error('Failed to update notification');
    }
  };

  const handleLogout = () => {
    logout();
    toast.info('Signed out successfully.');
    navigate('/login');
  };

  const studentProfile = user?.studentProfile;

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      {/* Top Banner Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
            <School className="w-6 h-6" />
          </div>
          <div>
            <div className="font-bold text-slate-900 leading-tight text-base flex items-center gap-2">
              CampusCore
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                STUDENT
              </span>
            </div>
            <div className="text-xs text-slate-500">Academic Portal</div>
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-3">
          {/* Notifications */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setNotifOpen(!notifOpen)}
              className="relative p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {notifOpen && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200 py-3 z-50 animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center justify-between px-4 pb-2 border-b border-slate-100">
                  <div className="font-semibold text-slate-800 text-sm">Alerts & Notices</div>
                  <span className="text-xs text-slate-400">{unreadCount} unread</span>
                </div>
                <div className="max-h-72 overflow-y-auto px-2 divide-y divide-slate-100">
                  {notifications.length === 0 ? (
                    <div className="py-6 text-center text-xs text-slate-400">No new notices.</div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => !n.is_read && handleMarkAsRead(n.id)}
                        className={`p-3 rounded-xl transition-colors cursor-pointer ${
                          n.is_read ? 'opacity-70 hover:bg-slate-50' : 'bg-indigo-50/40 hover:bg-indigo-50/70 font-medium'
                        }`}
                      >
                        <div className="text-xs font-semibold text-slate-900">{n.title}</div>
                        <div className="text-xs text-slate-600 mt-0.5 line-clamp-2">{n.message}</div>
                        <div className="text-[10px] text-slate-400 mt-1">
                          {new Date(n.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Student Profile Info */}
          <div className="hidden sm:flex items-center gap-2.5 pl-2 border-l border-slate-200">
            <img
              src={studentProfile?.profile_photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(studentProfile?.first_name || 'Student')}&background=4f46e5&color=fff`}
              alt="Avatar"
              className="w-9 h-9 rounded-xl object-cover border border-slate-200 shadow-sm"
            />
            <div className="flex flex-col text-left">
              <span className="text-xs font-bold text-slate-800 leading-tight">
                {studentProfile ? `${studentProfile.first_name} ${studentProfile.last_name}` : user?.username}
              </span>
              <span className="text-[10px] font-mono text-indigo-600 font-semibold">
                {studentProfile?.student_id || user?.username}
              </span>
            </div>
          </div>

          {/* Logout button */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors"
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Logout</span>
          </button>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 lg:hidden"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Desktop Horizontal Navigation Ribbon */}
      <nav className="hidden lg:flex items-center justify-center gap-1 bg-slate-900 text-slate-300 px-4 h-12 border-t border-slate-800 overflow-x-auto">
        {studentNavLinks.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`
              }
            >
              <Icon className="w-3.5 h-3.5" />
              {item.name}
            </NavLink>
          );
        })}
      </nav>

      {/* Mobile Dropdown Navigation */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-slate-900 text-slate-200 border-t border-slate-800 px-4 py-3 space-y-1">
          {studentNavLinks.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.name}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    isActive ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`
                }
              >
                <Icon className="w-4 h-4" />
                {item.name}
              </NavLink>
            );
          })}
        </div>
      )}
    </header>
  );
}
