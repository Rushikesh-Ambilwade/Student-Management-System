import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Mail,
  Phone,
  Calendar,
  MapPin,
  GraduationCap,
  Award,
  CalendarCheck,
  CreditCard,
  Printer,
  Edit2,
  AlertTriangle,
  Receipt
} from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';

export default function StudentProfile() {
  const { id } = useParams();
  const [student, setStudent] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'attendance', 'marks', 'fees'

  const navigate = useNavigate();
  const toast = useToast();

  useEffect(() => {
    const fetchStudent = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/students/${id}`);
        if (res.data.success) {
          setStudent(res.data.student);
          setMetrics(res.data.metrics);
        }
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to load student profile');
      } finally {
        setLoading(false);
      }
    };
    fetchStudent();
  }, [id, toast]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-semibold text-slate-500">Loading Student Profile...</span>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500">Student not found.</p>
        <Link to="/admin/students" className="text-xs text-indigo-600 font-bold mt-2 inline-block">
          Return to directory
        </Link>
      </div>
    );
  }

  const attendanceRecords = student.attendanceRecords || [];
  const marks = student.marks || [];
  const feeAssessments = student.feeAssessments || [];

  return (
    <div className="space-y-6">
      {/* Top Navigation */}
      <div className="flex items-center justify-between no-print">
        <Link
          to="/admin/students"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Students
        </Link>
        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
          >
            <Printer className="w-3.5 h-3.5" />
            Print Profile Card
          </button>
          <button
            onClick={() => navigate(`/admin/students/edit/${student.id}`)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-500 transition-colors shadow-sm"
          >
            <Edit2 className="w-3.5 h-3.5" />
            Edit Info
          </button>
        </div>
      </div>

      {/* Hero Profile Header Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
          <img
            src={student.profile_photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(student.first_name + ' ' + student.last_name)}&background=6366f1&color=fff`}
            alt="Profile Avatar"
            className="w-24 h-24 rounded-2xl object-cover border-2 border-slate-100 shadow-md shrink-0"
          />

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 truncate">
                {student.first_name} {student.last_name}
              </h1>
              <span className="font-mono px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                {student.student_id}
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold capitalize border ${
                student.status === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-600 border-slate-200'
              }`}>
                {student.status}
              </span>
            </div>

            <p className="text-xs sm:text-sm font-medium text-slate-600">
              {student.course?.name} • {student.department?.name} ({student.department?.code})
            </p>

            <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-slate-500">
              <span className="inline-flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                {student.email}
              </span>
              {student.phone && (
                <span className="inline-flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  {student.phone}
                </span>
              )}
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                Admitted: {student.admission_date}
              </span>
            </div>
          </div>

          {/* Attendance KPI badge */}
          <div className="sm:text-right shrink-0 p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Attendance</div>
            <div className="text-2xl font-black text-slate-900 mt-0.5">{metrics?.attendancePercentage}%</div>
            <div className="text-[11px] font-medium text-slate-500">
              {metrics?.attendedSessions} of {metrics?.totalSessions} sessions
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-px no-print">
        {[
          { key: 'overview', label: 'Profile Overview', icon: GraduationCap },
          { key: 'attendance', label: `Attendance (${attendanceRecords.length})`, icon: CalendarCheck },
          { key: 'marks', label: `Examination Marks (${marks.length})`, icon: Award },
          { key: 'fees', label: `Fee Accounts (${feeAssessments.length})`, icon: CreditCard }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab 1: Overview */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100">Personal Information</h3>
            <div className="space-y-3 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Full Name</span>
                <span className="font-semibold text-slate-800">{student.first_name} {student.last_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Gender</span>
                <span className="font-semibold text-slate-800">{student.gender}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Date of Birth</span>
                <span className="font-semibold text-slate-800">{student.date_of_birth || 'Not Specified'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Primary Email</span>
                <span className="font-semibold text-slate-800">{student.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Phone Contact</span>
                <span className="font-semibold text-slate-800">{student.phone || 'None'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Residential Address</span>
                <span className="font-semibold text-slate-800 text-right max-w-xs">{student.address || 'None'}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100">Academic & Emergency Contact</h3>
            <div className="space-y-3 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Department</span>
                <span className="font-semibold text-slate-800">{student.department?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Enrolled Course</span>
                <span className="font-semibold text-slate-800">{student.course?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Current Semester</span>
                <span className="font-semibold text-slate-800">{student.currentSemester?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Academic Year</span>
                <span className="font-semibold text-slate-800">{student.academic_year}</span>
              </div>
              <div className="pt-2 border-t border-slate-100 flex justify-between">
                <span className="text-slate-500">Emergency Contact</span>
                <span className="font-semibold text-slate-800">{student.emergency_contact_name || 'None'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Emergency Phone</span>
                <span className="font-semibold text-slate-800">{student.emergency_contact_phone || 'None'}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Attendance */}
      {activeTab === 'attendance' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Attendance Log</h3>
              <p className="text-xs text-slate-500">Conducted lecture and practical session attendance</p>
            </div>
            {metrics?.isAttendanceShortage && (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
                <AlertTriangle className="w-4 h-4" />
                <span>Shortage Warning (&lt; 75%)</span>
              </div>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-700 font-semibold uppercase text-[11px]">
                <tr>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Subject</th>
                  <th className="py-2.5 px-3">Topic / Session</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {attendanceRecords.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">No attendance sessions recorded yet.</td>
                  </tr>
                ) : (
                  attendanceRecords.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-mono">{r.session?.session_date}</td>
                      <td className="py-2.5 px-3 font-medium text-slate-900">{r.session?.subject?.name} ({r.session?.subject?.code})</td>
                      <td className="py-2.5 px-3 text-slate-500">{r.session?.topic || 'Regular Lecture'}</td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          r.status === 'present' ? 'bg-emerald-50 text-emerald-700' : (r.status === 'late' ? 'bg-amber-50 text-amber-700' : 'bg-rose-50 text-rose-700')
                        }`}>
                          {r.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-400">{r.remarks || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Marks */}
      {activeTab === 'marks' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden p-5">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-slate-900">Academic Marks & Results</h3>
            <p className="text-xs text-slate-500">Evaluation records across scheduled internal and final examinations</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-700 font-semibold uppercase text-[11px]">
                <tr>
                  <th className="py-2.5 px-3">Examination</th>
                  <th className="py-2.5 px-3">Subject</th>
                  <th className="py-2.5 px-3">Credits</th>
                  <th className="py-2.5 px-3">Marks Obtained</th>
                  <th className="py-2.5 px-3">Grade</th>
                  <th className="py-2.5 px-3 text-right">Result</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {marks.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">No marks entered yet.</td>
                  </tr>
                ) : (
                  marks.map((m) => {
                    const isPass = !m.is_absent && Number(m.marks_obtained) >= Number(m.passing_marks);
                    return (
                      <tr key={m.id} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 font-medium text-slate-900">{m.examination?.name}</td>
                        <td className="py-2.5 px-3">{m.subject?.name} ({m.subject?.code})</td>
                        <td className="py-2.5 px-3">{m.subject?.credits}</td>
                        <td className="py-2.5 px-3 font-semibold text-slate-800">
                          {m.is_absent ? 'ABSENT' : `${m.marks_obtained} / ${m.max_marks}`}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="font-bold text-xs">{m.grade || '-'}</span>
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isPass ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                          }`}>
                            {isPass ? 'PASS' : 'FAIL'}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Fees */}
      {activeTab === 'fees' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5">
            <h3 className="text-sm font-bold text-slate-900 mb-3">Semester Fee Assessments</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-slate-700 font-semibold uppercase text-[11px]">
                  <tr>
                    <th className="py-2.5 px-3">Semester</th>
                    <th className="py-2.5 px-3">Total Assessed</th>
                    <th className="py-2.5 px-3">Scholarship</th>
                    <th className="py-2.5 px-3">Net Payable</th>
                    <th className="py-2.5 px-3">Paid Amount</th>
                    <th className="py-2.5 px-3">Balance</th>
                    <th className="py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {feeAssessments.map((a) => (
                    <tr key={a.id}>
                      <td className="py-2.5 px-3 font-medium text-slate-900">{a.semester?.name}</td>
                      <td className="py-2.5 px-3">${Number(a.total_amount).toLocaleString()}</td>
                      <td className="py-2.5 px-3 text-emerald-600">-${Number(a.scholarship_amount).toLocaleString()}</td>
                      <td className="py-2.5 px-3 font-semibold text-slate-800">${Number(a.net_payable).toLocaleString()}</td>
                      <td className="py-2.5 px-3 text-emerald-700 font-medium">${Number(a.paid_amount).toLocaleString()}</td>
                      <td className="py-2.5 px-3 font-bold text-rose-600">${Number(a.balance_amount).toLocaleString()}</td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          a.status === 'paid' ? 'bg-emerald-50 text-emerald-700' : (a.status === 'partially_paid' ? 'bg-amber-50 text-amber-700' : 'bg-rose-50 text-rose-700')
                        }`}>
                          {a.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
