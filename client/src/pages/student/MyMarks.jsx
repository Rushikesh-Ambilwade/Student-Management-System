import { useState, useEffect } from 'react';
import {
  Award,
  BookOpen,
  Printer,
  CheckCircle2,
  XCircle,
  TrendingUp,
  School,
  Calendar
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';

export default function MyMarks() {
  const { user } = useAuth();
  const [marksData, setMarksData] = useState(null);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  const studentId = user?.studentProfile?.id;

  useEffect(() => {
    if (studentId) {
      api.get(`/marks/student/${studentId}`)
        .then(res => {
          if (res.data.success) {
            setMarksData(res.data);
          }
        })
        .catch(() => {
          toast.error('Failed to load marks report');
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
        <p className="mt-3 text-xs text-slate-500 font-medium">Loading academic performance...</p>
      </div>
    );
  }

  const student = marksData?.student || user?.studentProfile || {};
  const exams = marksData?.exams || [];
  const summary = marksData?.overallSummary || {
    totalMarksObtained: 0,
    totalMaxMarks: 0,
    overallPercentage: '0.0',
    totalCredits: 0
  };

  // Prepare chart data from latest exam
  const latestExam = exams[exams.length - 1];
  const chartData = (latestExam?.marks || []).map(m => ({
    name: m.subjectCode,
    subject: m.subjectName,
    obtained: m.marksObtained,
    max: m.maxMarks,
    percentage: m.maxMarks > 0 ? ((m.marksObtained / m.maxMarks) * 100).toFixed(0) : 0,
    grade: m.grade
  }));

  const getGradeBadge = (grade) => {
    if (['A+', 'A'].includes(grade)) {
      return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">{grade}</span>;
    }
    if (['B+', 'B'].includes(grade)) {
      return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800">{grade}</span>;
    }
    if (['C', 'D'].includes(grade)) {
      return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">{grade}</span>;
    }
    return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800">{grade || 'FAIL'}</span>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100 print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">My Examination Marks & Grade Sheets</h1>
          <p className="text-slate-500 text-sm mt-1">
            Official semester performance transcript, grade evaluations, and pass/fail status.
          </p>
        </div>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl font-medium text-sm transition shadow-sm"
        >
          <Printer className="w-4 h-4" />
          Print Official Transcript
        </button>
      </div>

      {/* Printable Institutional Header (Shown on print only) */}
      <div className="hidden print:block text-center border-b-2 border-slate-900 pb-4 mb-6">
        <h1 className="text-2xl font-black tracking-wider uppercase text-slate-900">CAMPUSCORE INSTITUTE OF TECHNOLOGY</h1>
        <p className="text-xs text-slate-600 tracking-widest uppercase">Office of the Controller of Examinations</p>
        <p className="text-xs font-bold mt-1 text-slate-800">OFFICIAL STATEMENT OF ACADEMIC MARKS & GRADES</p>

        <div className="mt-4 grid grid-cols-2 text-xs text-left border border-slate-300 p-3 rounded-lg">
          <div>
            <div><strong>Student Name:</strong> {student.name || `${student.first_name} ${student.last_name}`}</div>
            <div><strong>Student ID:</strong> {student.student_id}</div>
          </div>
          <div className="text-right">
            <div><strong>Program:</strong> {student.course}</div>
            <div><strong>Department:</strong> {student.department}</div>
          </div>
        </div>
      </div>

      {/* Aggregate KPI Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 print:grid-cols-4">
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
          <span className="text-xs font-semibold text-slate-500 block mb-1">Aggregate Score</span>
          <span className="text-2xl font-bold text-slate-800">{summary.overallPercentage}%</span>
          <span className="text-[11px] text-slate-400 block mt-0.5">Overall Percentage</span>
        </div>
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
          <span className="text-xs font-semibold text-indigo-600 block mb-1">Marks Obtained</span>
          <span className="text-2xl font-bold text-indigo-700">{summary.totalMarksObtained}</span>
          <span className="text-[11px] text-slate-400 block mt-0.5">Out of {summary.totalMaxMarks}</span>
        </div>
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
          <span className="text-xs font-semibold text-emerald-600 block mb-1">Total Credits</span>
          <span className="text-2xl font-bold text-emerald-700">{summary.totalCredits}</span>
          <span className="text-[11px] text-slate-400 block mt-0.5">Earned Credit Units</span>
        </div>
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
          <span className="text-xs font-semibold text-purple-600 block mb-1">Result Standing</span>
          <span className="text-2xl font-bold text-purple-700">PASS</span>
          <span className="text-[11px] text-slate-400 block mt-0.5">Good Academic Standing</span>
        </div>
      </div>

      {/* Performance Bar Chart (Hidden when printing transcript) */}
      {chartData.length > 0 && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 print:hidden">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-800">Subject Performance Distribution</h2>
              <p className="text-xs text-slate-400">Score percentage achieved in latest examination.</p>
            </div>
            <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
              {latestExam?.examinationName}
            </span>
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(val, name, props) => [`${props.payload.obtained} / ${props.payload.max} (${val}%)`, 'Marks']}
                  labelFormatter={(code, items) => items[0]?.payload?.subject || code}
                />
                <Bar dataKey="percentage" radius={[6, 6, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={Number(entry.percentage) >= 50 ? '#4f46e5' : '#f43f5e'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Semester Examinations Tables */}
      {exams.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-slate-100">
          <Award className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-700">No examination records yet</h3>
          <p className="text-slate-400 text-sm mt-1">
            Exam scores and grades will appear here as soon as the faculty records semester marks.
          </p>
        </div>
      ) : (
        exams.map(exam => (
          <div key={exam.examinationId} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            {/* Exam Table Header */}
            <div className="p-5 bg-slate-50/80 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-slate-800 text-base">{exam.examinationName}</h3>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                    exam.resultStatus === 'PASS' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                  }`}>
                    {exam.resultStatus}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Type: <span className="capitalize">{exam.examType?.replace('_', ' ')}</span> • Academic Year: {exam.academicYear || '2026-2027'}
                </p>
              </div>

              <div className="flex items-center gap-4 text-xs">
                <span className="text-slate-600 font-medium">
                  Aggregate: <strong className="text-slate-900">{exam.totalObtained} / {exam.totalMax}</strong>
                </span>
                <span className="font-bold text-indigo-700 bg-indigo-50 px-3 py-1 rounded-lg">
                  {exam.percentage}%
                </span>
              </div>
            </div>

            {/* Marks Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-3.5">Subject Code & Name</th>
                    <th className="px-6 py-3.5">Credits</th>
                    <th className="px-6 py-3.5 text-center">Max Marks</th>
                    <th className="px-6 py-3.5 text-center">Passing Marks</th>
                    <th className="px-6 py-3.5 text-center">Marks Obtained</th>
                    <th className="px-6 py-3.5 text-center">Grade</th>
                    <th className="px-6 py-3.5 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {exam.marks?.map(m => (
                    <tr key={m.id} className="hover:bg-slate-50/50 transition">
                      <td className="px-6 py-3.5">
                        <div className="font-semibold text-slate-800">{m.subjectName}</div>
                        <div className="text-[11px] font-mono text-indigo-600">{m.subjectCode}</div>
                      </td>
                      <td className="px-6 py-3.5 text-slate-500 font-medium">
                        {m.credits}
                      </td>
                      <td className="px-6 py-3.5 text-center font-medium text-slate-700">
                        {m.maxMarks}
                      </td>
                      <td className="px-6 py-3.5 text-center font-medium text-slate-500">
                        {m.passingMarks}
                      </td>
                      <td className="px-6 py-3.5 text-center font-bold text-slate-900">
                        {m.isAbsent ? <span className="text-rose-600 font-bold">ABSENT</span> : m.marksObtained}
                      </td>
                      <td className="px-6 py-3.5 text-center">
                        {getGradeBadge(m.grade)}
                      </td>
                      <td className="px-6 py-3.5 text-center">
                        {m.isPass ? (
                          <span className="text-emerald-600 font-bold flex items-center justify-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> PASS
                          </span>
                        ) : (
                          <span className="text-rose-600 font-bold flex items-center justify-center gap-1">
                            <XCircle className="w-3.5 h-3.5" /> FAIL
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))
      )}

      {/* Official Signatures (Shown on print only) */}
      <div className="hidden print:grid grid-cols-3 gap-6 pt-16 text-center text-xs text-slate-700">
        <div>
          <div className="border-t border-slate-800 pt-1 font-bold">Checked By</div>
          <span className="text-[10px] text-slate-500">Academic Registrar</span>
        </div>
        <div>
          <div className="border-t border-slate-800 pt-1 font-bold">Verified By</div>
          <span className="text-[10px] text-slate-500">Dean of Academics</span>
        </div>
        <div>
          <div className="border-t border-slate-800 pt-1 font-bold">Controller of Examinations</div>
          <span className="text-[10px] text-slate-500">CampusCore Institute</span>
        </div>
      </div>
    </div>
  );
}
