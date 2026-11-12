import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Users,
  GraduationCap,
  CalendarCheck,
  CreditCard,
  AlertTriangle,
  UserPlus,
  FileCheck,
  Megaphone,
  ArrowRight
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Cell
} from 'recharts';
import StatCard from '../../components/StatCard';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const toast = useToast();

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/dashboard/admin');
      if (res.data.success) {
        setData(res.data);
      }
    } catch {
      toast.error('Failed to load dashboard metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Loading Analytics...</span>
      </div>
    );
  }

  const { stats, charts, upcomingExams = [], recentStudents = [], lowAttendanceStudents = [], recentActivity = [] } = data || {};

  const GRADE_COLORS = {
    'A+': '#10b981',
    'A': '#34d399',
    'B+': '#6366f1',
    'B': '#818cf8',
    'C': '#f59e0b',
    'D': '#f97316',
    'F': '#ef4444',
    'AB': '#94a3b8'
  };

  return (
    <div className="space-y-6">
      {/* Top Welcome & Quick Actions Bar */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-xl shadow-slate-900/10">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold mb-3 border border-indigo-500/30">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Live College Operations & Database
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Executive Academic Console</h2>
            <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-xl">
              Real-time monitoring of enrolled students, curriculum progress, attendance compliance, fees collection, and examinations.
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => navigate('/admin/students/new')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors shadow-md shadow-indigo-600/30"
            >
              <UserPlus className="w-4 h-4" />
              Add Student
            </button>
            <button
              onClick={() => navigate('/admin/attendance')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs backdrop-blur-md transition-colors border border-white/15"
            >
              <CalendarCheck className="w-4 h-4" />
              Mark Attendance
            </button>
            <button
              onClick={() => navigate('/admin/fees')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs backdrop-blur-md transition-colors border border-white/15"
            >
              <CreditCard className="w-4 h-4" />
              Record Fees
            </button>
          </div>
        </div>
      </div>

      {/* Primary KPI Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Students"
          value={stats?.totalStudents || 0}
          subtext={`${stats?.activeStudents || 0} active enrollment`}
          icon={Users}
          badgeText="Active"
          badgeType="success"
          colorClass="from-indigo-600 to-indigo-500"
          onClick={() => navigate('/admin/students')}
        />
        <StatCard
          title="Avg Attendance"
          value={`${stats?.avgAttendance || 0}%`}
          subtext="Across all subjects & lectures"
          icon={CalendarCheck}
          badgeText={Number(stats?.avgAttendance) >= 75 ? 'Healthy' : 'Below 75%'}
          badgeType={Number(stats?.avgAttendance) >= 75 ? 'success' : 'danger'}
          colorClass="from-emerald-600 to-teal-500"
          onClick={() => navigate('/admin/attendance')}
        />
        <StatCard
          title="Fees Collected"
          value={`$${Number(stats?.totalCollected || 0).toLocaleString()}`}
          subtext={`Pending: $${Number(stats?.totalPending || 0).toLocaleString()}`}
          icon={CreditCard}
          badgeText={stats?.overdueCount > 0 ? `${stats.overdueCount} Overdue` : 'On Track'}
          badgeType={stats?.overdueCount > 0 ? 'warning' : 'success'}
          colorClass="from-blue-600 to-cyan-500"
          onClick={() => navigate('/admin/fees')}
        />
        <StatCard
          title="Academic Units"
          value={`${stats?.totalCourses || 0} Courses`}
          subtext={`${stats?.totalSubjects || 0} subjects in curriculum`}
          icon={GraduationCap}
          badgeText={`${stats?.totalDepartments || 0} Depts`}
          badgeType="info"
          colorClass="from-purple-600 to-indigo-500"
          onClick={() => navigate('/admin/departments')}
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Enrollment Distribution */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Student Enrollment by Department</h3>
              <p className="text-xs text-slate-500">Distribution of active students across academic programs</p>
            </div>
            <Link to="/admin/students" className="text-xs text-indigo-600 font-semibold hover:underline">
              View Directory →
            </Link>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts?.enrollmentByDept || []}>
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '12px' }}
                />
                <Bar dataKey="students" name="Enrolled Students" fill="#6366f1" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Academic Performance Distribution */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Academic Grade Distribution</h3>
              <p className="text-xs text-slate-500">Aggregated performance across examinations & subjects</p>
            </div>
            <Link to="/admin/examinations" className="text-xs text-indigo-600 font-semibold hover:underline">
              View Results →
            </Link>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts?.performanceChart || []}>
                <XAxis dataKey="grade" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '12px' }}
                />
                <Bar dataKey="count" name="Grade Count" radius={[8, 8, 0, 0]}>
                  {(charts?.performanceChart || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={GRADE_COLORS[entry.grade] || '#6366f1'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Two Column Grid: Low Attendance Alerts & Upcoming Exams */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low Attendance Shortage Alert Table */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-rose-50 text-rose-600">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Attendance Shortage Alerts</h3>
                <p className="text-xs text-slate-500">Students with aggregate attendance below 75%</p>
              </div>
            </div>
            <Link to="/admin/attendance" className="text-xs text-indigo-600 font-semibold hover:underline">
              Manage →
            </Link>
          </div>

          <div className="flex-1 overflow-x-auto">
            {lowAttendanceStudents.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                All students currently meet the mandatory 75% threshold!
              </div>
            ) : (
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-slate-700 font-semibold uppercase text-[10px]">
                  <tr>
                    <th className="py-2.5 px-3">Student</th>
                    <th className="py-2.5 px-3">Program</th>
                    <th className="py-2.5 px-3">Attended / Total</th>
                    <th className="py-2.5 px-3 text-right">Attendance %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {lowAttendanceStudents.map((st) => (
                    <tr key={st.id} className="hover:bg-rose-50/30 transition-colors">
                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-slate-900">{st.name}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{st.student_id}</div>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-700">
                          {st.course}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-medium">
                        {st.attendedSessions} / {st.totalSessions} sessions
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                          {st.percentage}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Upcoming Examinations */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
                <FileCheck className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Upcoming Examinations</h3>
                <p className="text-xs text-slate-500">Scheduled academic assessments and exams</p>
              </div>
            </div>
            <Link to="/admin/examinations" className="text-xs text-indigo-600 font-semibold hover:underline">
              Exam Schedule →
            </Link>
          </div>

          <div className="flex-1 space-y-2.5 overflow-y-auto">
            {upcomingExams.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">No upcoming examinations scheduled.</div>
            ) : (
              upcomingExams.map((exam) => (
                <div
                  key={exam.id}
                  className="p-3 rounded-xl border border-slate-100 hover:border-slate-200 bg-slate-50/50 flex items-center justify-between gap-3 transition-colors"
                >
                  <div>
                    <div className="font-semibold text-xs text-slate-900">{exam.name}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      {exam.course?.name} • Year {exam.academic_year}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100 uppercase">
                      {exam.exam_type.replace('_', ' ')}
                    </span>
                    <div className="text-[10px] text-slate-400 mt-1 font-mono">
                      {exam.start_date}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Two Column Grid: Recent Registrations & System Audit Trail */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Student Registrations */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-slate-900">Recent Registrations</h3>
            <Link to="/admin/students" className="text-xs text-indigo-600 font-semibold hover:underline">
              All Students →
            </Link>
          </div>
          <div className="divide-y divide-slate-100">
            {recentStudents.map((st) => (
              <div key={st.id} className="py-2.5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img
                    src={st.profile_photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(st.first_name + ' ' + st.last_name)}&background=6366f1&color=fff`}
                    alt="avatar"
                    className="w-8 h-8 rounded-full object-cover border border-slate-200"
                  />
                  <div>
                    <div className="font-semibold text-xs text-slate-900">{st.first_name} {st.last_name}</div>
                    <div className="text-[11px] text-slate-500 font-mono">{st.student_id} • {st.department?.code}</div>
                  </div>
                </div>
                <Link
                  to={`/admin/students/${st.id}`}
                  className="p-1 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-50 transition-colors"
                >
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* Recent System Activity Logs */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-slate-900">Recent Audit Logs</h3>
            <Link to="/admin/audit-logs" className="text-xs text-indigo-600 font-semibold hover:underline">
              Audit Center →
            </Link>
          </div>
          <div className="divide-y divide-slate-100">
            {recentActivity.map((act) => (
              <div key={act.id} className="py-2.5 flex items-center justify-between text-xs">
                <div>
                  <span className="font-mono font-semibold text-indigo-600">{act.action}</span>
                  <span className="text-slate-500 ml-2">on {act.entity}</span>
                  <div className="text-[10px] text-slate-400">By {act.user?.username || 'System'}</div>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">
                  {new Date(act.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
