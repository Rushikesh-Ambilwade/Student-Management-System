import { useState, useEffect } from 'react';
import {
  CalendarCheck,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  FileText,
  Calendar,
  Filter
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell
} from 'recharts';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';

export default function MyAttendance() {
  const { user } = useAuth();
  const [attendanceData, setAttendanceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const toast = useToast();

  const studentId = user?.studentProfile?.id;

  useEffect(() => {
    if (studentId) {
      api.get(`/attendance/student/${studentId}`)
        .then(res => {
          if (res.data.success) {
            setAttendanceData(res.data);
          }
        })
        .catch(() => {
          toast.error('Failed to load attendance report');
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [studentId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        <p className="mt-3 text-xs text-slate-500 font-medium">Loading attendance records...</p>
      </div>
    );
  }

  const summary = attendanceData?.summary || {
    totalConducted: 0,
    attendedSessions: 0,
    totalPresent: 0,
    totalLate: 0,
    totalAbsent: 0,
    totalExcused: 0,
    overallPercentage: '0.0',
    isShortage: false
  };

  const subjectWise = attendanceData?.subjectWise || [];
  const records = attendanceData?.records || [];

  // Filtered session records
  const filteredRecords = records.filter(r => {
    if (statusFilter === 'ALL') return true;
    return r.status === statusFilter;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'present':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 flex items-center gap-1 w-fit"><CheckCircle className="w-3 h-3" /> Present</span>;
      case 'late':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 flex items-center gap-1 w-fit"><Clock className="w-3 h-3" /> Late</span>;
      case 'excused':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 flex items-center gap-1 w-fit"><FileText className="w-3 h-3" /> Excused</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 flex items-center gap-1 w-fit"><XCircle className="w-3 h-3" /> Absent</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">My Attendance Portal</h1>
          <p className="text-slate-500 text-sm mt-1">
            Track subject-wise class attendance, lecture counts, and compliance with the 75% threshold.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className={`px-4 py-2 rounded-xl text-xs font-bold border ${
            summary.isShortage
              ? 'bg-rose-50 text-rose-700 border-rose-200'
              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
          }`}>
            Overall: {summary.overallPercentage}% {summary.isShortage ? '(Shortage Alert)' : '(Good Standing)'}
          </div>
        </div>
      </div>

      {/* Shortage Warning Banner */}
      {summary.isShortage && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3.5 text-rose-800">
          <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
          <div className="text-xs sm:text-sm">
            <span className="font-bold">Immediate Attention Required:</span> Your attendance is below the mandatory 75% college regulation.
            Students with attendance shortages cannot sit for semester end examinations. Attend all remaining classes immediately.
          </div>
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
          <span className="text-xs font-semibold text-slate-500 block mb-1">Total Conducted</span>
          <span className="text-2xl font-bold text-slate-800">{summary.totalConducted}</span>
          <span className="text-[11px] text-slate-400 block mt-0.5">Class Sessions</span>
        </div>
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
          <span className="text-xs font-semibold text-emerald-600 block mb-1">Present / Late</span>
          <span className="text-2xl font-bold text-emerald-700">{summary.attendedSessions}</span>
          <span className="text-[11px] text-slate-400 block mt-0.5">Classes Attended</span>
        </div>
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
          <span className="text-xs font-semibold text-rose-600 block mb-1">Unexcused Absences</span>
          <span className="text-2xl font-bold text-rose-700">{summary.totalAbsent}</span>
          <span className="text-[11px] text-slate-400 block mt-0.5">Missed Sessions</span>
        </div>
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
          <span className="text-xs font-semibold text-blue-600 block mb-1">Approved Leaves</span>
          <span className="text-2xl font-bold text-blue-700">{summary.totalExcused}</span>
          <span className="text-[11px] text-slate-400 block mt-0.5">Medical / Duty</span>
        </div>
      </div>

      {/* Subject-Wise Analytics & Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recharts Bar Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h2 className="text-base font-bold text-slate-800 mb-1">Subject-Wise Attendance Percentage</h2>
          <p className="text-xs text-slate-400 mb-6">Red dashed reference line indicates the 75% minimum threshold.</p>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={subjectWise} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <XAxis dataKey="subjectCode" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(val, name, props) => [`${val}% (${props.payload.attended}/${props.payload.conducted} classes)`, 'Attendance']}
                  labelFormatter={(code, items) => items[0]?.payload?.subjectName || code}
                />
                <ReferenceLine y={75} stroke="#ef4444" strokeDasharray="3 3" label={{ value: '75% Required', fill: '#ef4444', fontSize: 10 }} />
                <Bar dataKey="percentage" radius={[6, 6, 0, 0]}>
                  {subjectWise.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={Number(entry.percentage) < 75 ? '#f43f5e' : '#4f46e5'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Shortage Subject List */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-800 mb-4">Subject Attendance Compliance</h2>
            <div className="space-y-3">
              {subjectWise.map(sub => (
                <div key={sub.subjectId} className="p-3 bg-slate-50 rounded-xl">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-semibold text-xs text-slate-800 line-clamp-1">{sub.subjectName}</span>
                    <span className={`text-xs font-bold ${sub.isShortage ? 'text-rose-600' : 'text-emerald-600'}`}>
                      {sub.percentage}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-1.5 rounded-full ${sub.isShortage ? 'bg-rose-500' : 'bg-emerald-500'}`}
                      style={{ width: `${Math.min(100, Math.max(0, Number(sub.percentage)))}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                    <span>{sub.attended} of {sub.conducted} attended</span>
                    {sub.isShortage && <span className="text-rose-600 font-bold">Shortage</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Chronological History Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h2 className="font-bold text-slate-800 text-base">Session-by-Session Attendance Log</h2>
            <p className="text-xs text-slate-400 mt-0.5">Every recorded lecture session with timestamps and present/absent status.</p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs">
            {['ALL', 'present', 'late', 'absent', 'excused'].map(st => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1 rounded-lg capitalize font-medium transition ${
                  statusFilter === st ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-700 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Subject</th>
                <th className="px-6 py-4">Class Time</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-10 text-slate-400">
                    No session records match the selected filter.
                  </td>
                </tr>
              ) : (
                filteredRecords.map(r => (
                  <tr key={r.id} className="hover:bg-slate-50/50 transition">
                    <td className="px-6 py-4 font-medium text-slate-800 whitespace-nowrap">
                      {new Date(r.session?.session_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-800">{r.session?.subject?.name}</div>
                      <div className="text-[11px] font-mono text-indigo-600">{r.session?.subject?.code}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-slate-500">
                      {r.session?.session_time || 'Regular Session'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(r.status)}
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      {r.remarks || '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
