import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  User,
  CalendarCheck,
  Award,
  CreditCard,
  Clock,
  Megaphone,
  AlertTriangle,
  CheckCircle2,
  BookOpen,
  ArrowRight,
  TrendingUp,
  MapPin
} from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';

export default function StudentDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    api.get('/dashboard/student')
      .then(res => {
        if (res.data.success) {
          setData(res.data);
        }
      })
      .catch(err => {
        toast.error(err.response?.data?.message || 'Failed to load student dashboard');
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        <p className="mt-3 text-sm text-slate-500 font-medium">Loading your student dashboard...</p>
      </div>
    );
  }

  const profile = data?.profile || {};
  const attendance = data?.attendance || {};
  const academics = data?.academics || {};
  const fees = data?.fees || {};
  const todaySchedule = data?.todaySchedule || { classes: [] };
  const announcements = data?.announcements || [];

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <img
              src={profile.profile_photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.first_name || 'Student')}&background=4f46e5&color=fff&size=128`}
              alt="Student Avatar"
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-indigo-400/40 shadow-lg"
            />
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                  {profile.student_id}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 capitalize">
                  {profile.status || 'Active'}
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold mt-1 text-white">
                Welcome back, {profile.first_name} {profile.last_name}!
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 mt-0.5">
                {profile.course} • {profile.semester} • {profile.department}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/student/profile"
              className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold backdrop-blur-sm transition border border-white/10"
            >
              <User className="w-3.5 h-3.5" />
              View ID Card
            </Link>
            <Link
              to="/student/timetable"
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition shadow-md shadow-indigo-600/30"
            >
              <Clock className="w-3.5 h-3.5" />
              Today&apos;s Classes
            </Link>
          </div>
        </div>

        {/* Decorative background blurs */}
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-indigo-500/10 rounded-full blur-2xl" />
        <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-blue-500/10 rounded-full blur-2xl" />
      </div>

      {/* Attendance Shortage Alert if < 75% */}
      {attendance.isShortage && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3.5 text-rose-800">
          <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
          <div className="text-xs sm:text-sm">
            <span className="font-bold">Attendance Shortage Warning:</span> Your overall attendance is currently{' '}
            <strong className="underline">{attendance.overallAttendance}%</strong>, which is below the mandatory 75% college requirement.
            Please attend all upcoming sessions to avoid examination debarment.
          </div>
        </div>
      )}

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Attendance Card */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Attendance</span>
            <div className={`p-2 rounded-xl ${attendance.isShortage ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>
              <CalendarCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="my-3">
            <div className="flex items-baseline gap-2">
              <span className={`text-2xl font-bold ${attendance.isShortage ? 'text-rose-600' : 'text-slate-800'}`}>
                {attendance.overallAttendance}%
              </span>
              <span className="text-xs text-slate-500 font-medium">
                ({attendance.attendedSessions}/{attendance.totalSessions} sessions)
              </span>
            </div>
            {/* Progress bar */}
            <div className="w-full bg-slate-100 rounded-full h-2 mt-2 overflow-hidden">
              <div
                className={`h-2 rounded-full transition-all duration-500 ${attendance.isShortage ? 'bg-rose-500' : 'bg-emerald-500'}`}
                style={{ width: `${Math.min(100, Math.max(0, Number(attendance.overallAttendance)))}%` }}
              />
            </div>
          </div>
          <Link to="/student/attendance" className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
            Subject-wise breakdown <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {/* Academic Card */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Academic Score</span>
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <Award className="w-5 h-5" />
            </div>
          </div>
          <div className="my-3">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-800">{academics.overallPercentage}%</span>
              <span className="text-xs text-slate-500 font-medium">Aggregate</span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Evaluated across {academics.totalSubjects || 0} examination subjects
            </p>
          </div>
          <Link to="/student/marks" className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
            View Grade Card <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {/* Fees Status Card */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Fee Balance</span>
            <div className={`p-2 rounded-xl ${Number(fees.outstandingFees) > 0 ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'}`}>
              <CreditCard className="w-5 h-5" />
            </div>
          </div>
          <div className="my-3">
            <div className="text-2xl font-bold text-slate-800">
              ${fees.outstandingFees}
            </div>
            <div className="flex items-center gap-1.5 mt-1">
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                fees.status === 'paid' ? 'bg-emerald-100 text-emerald-800' :
                fees.status === 'overdue' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
              }`}>
                {fees.status || 'Pending'}
              </span>
              <span className="text-xs text-slate-400">Paid: ${fees.paidFees}</span>
            </div>
          </div>
          <Link to="/student/fees" className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
            Fee History & Receipts <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {/* Registered Degree Card */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Program</span>
            <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
              <BookOpen className="w-5 h-5" />
            </div>
          </div>
          <div className="my-3">
            <div className="text-base font-bold text-slate-800 line-clamp-1">{profile.course}</div>
            <p className="text-xs text-slate-500 mt-1">{profile.semester}</p>
          </div>
          <Link to="/student/subjects" className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
            Enrolled Subjects <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>

      {/* Main Grid: Today's Schedule & Campus Announcements */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Today's Class Schedule */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-indigo-600" />
              <h2 className="text-lg font-bold text-slate-800">
                Classes Scheduled for Today ({todaySchedule.day})
              </h2>
            </div>
            <Link to="/student/timetable" className="text-xs font-semibold text-indigo-600 hover:text-indigo-800">
              Weekly Timetable →
            </Link>
          </div>

          {todaySchedule.classes?.length === 0 ? (
            <div className="text-center py-10 border border-dashed border-slate-200 rounded-xl text-slate-400 text-sm">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              No classes scheduled for today! Enjoy your self-study time.
            </div>
          ) : (
            <div className="space-y-3">
              {todaySchedule.classes?.map((c) => (
                <div
                  key={c.id}
                  className="p-4 rounded-xl border border-slate-200 hover:border-indigo-200 hover:bg-indigo-50/20 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs flex-shrink-0">
                      {c.subject?.code?.slice(0, 3) || 'SUB'}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 text-sm">{c.subject?.name}</h3>
                      <div className="flex items-center gap-3 text-xs text-slate-500 mt-1 flex-wrap">
                        <span className="font-mono text-indigo-600 font-semibold">{c.subject?.code}</span>
                        {c.faculty_name && <span>Prof. {c.faculty_name}</span>}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-xs font-medium self-end sm:self-center">
                    <div className="flex items-center gap-1.5 text-slate-600 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{c.start_time?.slice(0, 5)} - {c.end_time?.slice(0, 5)}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-indigo-700 bg-indigo-50 px-3 py-1.5 rounded-lg font-semibold">
                      <MapPin className="w-3.5 h-3.5" />
                      <span>Room {c.room_number}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Recent Notices */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-indigo-600" />
                <h2 className="text-lg font-bold text-slate-800">Campus Circulars</h2>
              </div>
              <Link to="/student/announcements" className="text-xs font-semibold text-indigo-600 hover:text-indigo-800">
                All Notices
              </Link>
            </div>

            {announcements.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs">
                No active notices at this moment.
              </div>
            ) : (
              <div className="space-y-3">
                {announcements.map((a) => (
                  <div key={a.id} className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/60 hover:bg-slate-50 transition">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        a.priority === 'urgent' ? 'bg-rose-100 text-rose-700' :
                        a.priority === 'high' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {a.priority}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(a.createdAt || a.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <h4 className="font-semibold text-slate-800 text-xs leading-snug">{a.title}</h4>
                    <p className="text-xs text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                      {a.content}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Academic Reminder */}
          <div className="mt-4 p-3.5 bg-indigo-50/70 border border-indigo-100 rounded-xl text-xs text-indigo-800 flex items-center gap-2.5">
            <TrendingUp className="w-4 h-4 text-indigo-600 flex-shrink-0" />
            <span>Keep your aggregate above 75% for seamless examination hall ticket issuance.</span>
          </div>
        </div>
      </div>

      {/* Quick Access Grid */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <h2 className="text-sm font-bold text-slate-800 mb-4 uppercase tracking-wider">Quick Academic Shortcuts</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
          {[
            { label: 'My Profile', path: '/student/profile', icon: User, color: 'text-blue-600 bg-blue-50' },
            { label: 'Attendance', path: '/student/attendance', icon: CalendarCheck, color: 'text-emerald-600 bg-emerald-50' },
            { label: 'Grade Card', path: '/student/marks', icon: Award, color: 'text-purple-600 bg-purple-50' },
            { label: 'Fee Receipts', path: '/student/fees', icon: CreditCard, color: 'text-amber-600 bg-amber-50' },
            { label: 'Timetable', path: '/student/timetable', icon: Clock, color: 'text-indigo-600 bg-indigo-50' },
            { label: 'Announcements', path: '/student/announcements', icon: Megaphone, color: 'text-rose-600 bg-rose-50' },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.label}
                to={item.path}
                className="p-3.5 rounded-xl border border-slate-200 hover:border-indigo-300 hover:shadow-sm transition flex flex-col items-center text-center group"
              >
                <div className={`p-2.5 rounded-xl ${item.color} mb-2 group-hover:scale-110 transition-transform`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-xs font-semibold text-slate-700 group-hover:text-indigo-600">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
