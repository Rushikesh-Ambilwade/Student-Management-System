import { useState, useEffect } from 'react';
import {
  CalendarCheck,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Download,
  Filter,
  Save,
  Users
} from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';

export default function AttendanceManage() {
  const [activeTab, setActiveTab] = useState('mark'); // 'mark', 'reports', 'sessions'
  const toast = useToast();

  // Academic selectors
  const [courses, setCourses] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');

  // Mark Attendance Sheet State
  const [sessionDate, setSessionDate] = useState(new Date().toISOString().split('T')[0]);
  const [sessionTime, setSessionTime] = useState('10:00 - 11:00 AM');
  const [sessionType, setSessionType] = useState('lecture');
  const [topic, setTopic] = useState('');
  const [enrolledStudents, setEnrolledStudents] = useState([]);
  const [studentStatusMap, setStudentStatusMap] = useState({}); // { studentId: { status, remarks } }
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [savingAttendance, setSavingAttendance] = useState(false);

  // Reports State
  const [threshold, setThreshold] = useState(75);
  const [reportData, setReportData] = useState([]);
  const [loadingReport, setLoadingReport] = useState(false);

  // Load courses
  useEffect(() => {
    api.get('/academics/courses').then(res => {
      if (res.data.success) {
        setCourses(res.data.courses || []);
        if (res.data.courses?.length > 0) {
          setSelectedCourse(res.data.courses[0].id);
        }
      }
    }).catch(() => {});
  }, []);

  // When course changes, load semesters
  useEffect(() => {
    if (selectedCourse) {
      api.get(`/academics/semesters?course_id=${selectedCourse}`).then(res => {
        if (res.data.success) {
          setSemesters(res.data.semesters || []);
          if (res.data.semesters?.length > 0) {
            setSelectedSemester(res.data.semesters[0].id);
          } else {
            setSelectedSemester('');
          }
        }
      }).catch(() => {});
    }
  }, [selectedCourse]);

  // When course and semester change, load subjects
  useEffect(() => {
    if (selectedCourse && selectedSemester) {
      api.get(`/academics/subjects?course_id=${selectedCourse}&semester_id=${selectedSemester}`).then(res => {
        if (res.data.success) {
          setSubjects(res.data.subjects || []);
          if (res.data.subjects?.length > 0) {
            setSelectedSubject(res.data.subjects[0].id);
          } else {
            setSelectedSubject('');
          }
        }
      }).catch(() => {});
    }
  }, [selectedCourse, selectedSemester]);

  // Load students for marking attendance
  useEffect(() => {
    if (selectedCourse && selectedSemester && activeTab === 'mark') {
      setLoadingStudents(true);
      api.get('/students', {
        params: {
          course_id: selectedCourse,
          semester_id: selectedSemester,
          status: 'active',
          limit: 100
        }
      }).then(res => {
        if (res.data.success) {
          const list = res.data.students || [];
          setEnrolledStudents(list);
          const map = {};
          list.forEach(st => {
            map[st.id] = { status: 'present', remarks: '' };
          });
          setStudentStatusMap(map);
        }
      }).catch(() => {
        toast.error('Failed to load students for attendance marking');
      }).finally(() => {
        setLoadingStudents(false);
      });
    }
  }, [selectedCourse, selectedSemester, activeTab, toast]);

  // Fetch Report Data
  const fetchReport = async () => {
    try {
      setLoadingReport(true);
      const params = {
        course_id: selectedCourse || undefined,
        semester_id: selectedSemester || undefined,
        subject_id: selectedSubject || undefined,
        threshold
      };
      const res = await api.get('/attendance/reports', { params });
      if (res.data.success) {
        setReportData(res.data.report || []);
      }
    } catch {
      toast.error('Failed to load attendance report');
    } finally {
      setLoadingReport(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'reports') {
      fetchReport();
    }
  }, [activeTab, selectedCourse, selectedSemester, selectedSubject, threshold]);

  const handleMarkAll = (status) => {
    const updated = {};
    enrolledStudents.forEach(st => {
      updated[st.id] = {
        status,
        remarks: studentStatusMap[st.id]?.remarks || ''
      };
    });
    setStudentStatusMap(updated);
    toast.info(`Marked all ${enrolledStudents.length} students as '${status}'.`);
  };

  const handleStatusChange = (studentId, status) => {
    setStudentStatusMap(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        status
      }
    }));
  };

  const handleRemarksChange = (studentId, remarks) => {
    setStudentStatusMap(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        remarks
      }
    }));
  };

  const handleSaveAttendance = async (e) => {
    e.preventDefault();
    if (!selectedSubject || !selectedSemester) {
      toast.error('Please select both a course semester and a subject.');
      return;
    }
    if (enrolledStudents.length === 0) {
      toast.error('No enrolled students found to mark attendance.');
      return;
    }

    try {
      setSavingAttendance(true);
      const records = enrolledStudents.map(st => ({
        student_id: st.id,
        status: studentStatusMap[st.id]?.status || 'present',
        remarks: studentStatusMap[st.id]?.remarks || null
      }));

      await api.post('/attendance/sessions', {
        subject_id: Number(selectedSubject),
        semester_id: Number(selectedSemester),
        session_date: sessionDate,
        session_time: sessionTime,
        session_type: sessionType,
        topic: topic || 'Regular Lecture',
        records
      });

      toast.success(`Attendance successfully recorded for ${records.length} students!`);
      setTopic('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to record attendance session.');
    } finally {
      setSavingAttendance(false);
    }
  };

  const handleExportCsv = async () => {
    try {
      const params = {
        course_id: selectedCourse || undefined,
        semester_id: selectedSemester || undefined,
        threshold,
        exportCsv: 'true'
      };
      const res = await api.get('/attendance/reports', { params, responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `attendance_report_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Attendance report exported to CSV.');
    } catch {
      toast.error('Failed to export CSV');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Attendance Administration</h2>
          <p className="text-xs text-slate-500">Record subject-wise class sessions, monitor student presence, and audit shortage compliance.</p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('mark')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'mark' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Mark Session
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'reports' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Reports &amp; Shortage
          </button>
        </div>
      </div>

      {/* Selectors Bar */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Course Program</label>
          <select
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800"
          >
            {courses.map((c) => (
              <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Semester</label>
          <select
            value={selectedSemester}
            onChange={(e) => setSelectedSemester(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800"
          >
            {semesters.map((s) => (
              <option key={s.id} value={s.id}>{s.name} ({s.academic_year})</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Subject</label>
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800"
          >
            <option value="">{activeTab === 'reports' ? 'All Subjects' : 'Select Subject'}</option>
            {subjects.map((sub) => (
              <option key={sub.id} value={sub.id}>{sub.name} ({sub.code})</option>
            ))}
          </select>
        </div>
      </div>

      {/* TAB 1: MARK ATTENDANCE */}
      {activeTab === 'mark' && (
        <form onSubmit={handleSaveAttendance} className="space-y-4">
          {/* Session Parameters */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Session Date *</label>
              <input
                type="date"
                required
                value={sessionDate}
                onChange={(e) => setSessionDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Time Slot</label>
              <input
                type="text"
                value={sessionTime}
                onChange={(e) => setSessionTime(e.target.value)}
                placeholder="10:00 - 11:00 AM"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Session Type</label>
              <select
                value={sessionType}
                onChange={(e) => setSessionType(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
              >
                <option value="lecture">Theory Lecture</option>
                <option value="lab">Practical / Lab</option>
                <option value="tutorial">Tutorial</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Lecture Topic / Notes</label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. Memory Management & Paging"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
              />
            </div>
          </div>

          {/* Student Roster Table with Quick Actions */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  Enrolled Students ({enrolledStudents.length})
                </h3>
              </div>

              {/* Quick Bulk Mark Buttons */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">Quick Fill:</span>
                <button
                  type="button"
                  onClick={() => handleMarkAll('present')}
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors"
                >
                  All Present
                </button>
                <button
                  type="button"
                  onClick={() => handleMarkAll('absent')}
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 transition-colors"
                >
                  All Absent
                </button>
              </div>
            </div>

            {loadingStudents ? (
              <div className="py-12 text-center text-xs text-slate-400">Loading student class roster...</div>
            ) : enrolledStudents.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">No active students enrolled in this course and semester.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-50 text-slate-700 font-semibold uppercase text-[11px]">
                    <tr>
                      <th className="py-3 px-3">Roll No.</th>
                      <th className="py-3 px-3">Student Name</th>
                      <th className="py-3 px-3">Attendance Status</th>
                      <th className="py-3 px-3">Remarks (Optional)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {enrolledStudents.map((st) => {
                      const currentStatus = studentStatusMap[st.id]?.status || 'present';
                      const currentRemarks = studentStatusMap[st.id]?.remarks || '';

                      return (
                        <tr key={st.id} className="hover:bg-slate-50">
                          <td className="py-3 px-3 font-mono font-bold text-indigo-700">{st.student_id}</td>
                          <td className="py-3 px-3 font-semibold text-slate-900">{st.first_name} {st.last_name}</td>
                          <td className="py-3 px-3">
                            <div className="inline-flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
                              {[
                                { key: 'present', label: 'Present', color: 'bg-emerald-600 text-white' },
                                { key: 'late', label: 'Late', color: 'bg-amber-600 text-white' },
                                { key: 'absent', label: 'Absent', color: 'bg-rose-600 text-white' },
                                { key: 'excused', label: 'Excused', color: 'bg-indigo-600 text-white' }
                              ].map((opt) => (
                                <button
                                  type="button"
                                  key={opt.key}
                                  onClick={() => handleStatusChange(st.id, opt.key)}
                                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                                    currentStatus === opt.key ? `${opt.color} shadow-sm` : 'text-slate-600 hover:text-slate-900'
                                  }`}
                                >
                                  {opt.label}
                                </button>
                              ))}
                            </div>
                          </td>
                          <td className="py-3 px-3">
                            <input
                              type="text"
                              value={currentRemarks}
                              onChange={(e) => handleRemarksChange(st.id, e.target.value)}
                              placeholder="Reason / note"
                              className="w-full max-w-xs px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-indigo-500"
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Bottom Save Action */}
            <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                System prevents duplicate attendance logs for the same subject, date, and slot.
              </span>
              <button
                type="submit"
                disabled={savingAttendance || enrolledStudents.length === 0}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors shadow-sm disabled:opacity-60"
              >
                {savingAttendance ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save Session Attendance</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* TAB 2: REPORTS & SHORTAGE */}
      {activeTab === 'reports' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Attendance Compliance Report</h3>
              <p className="text-xs text-slate-500">Students evaluated against minimum threshold requirement</p>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <label className="text-xs font-semibold text-slate-600">Threshold %:</label>
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={threshold}
                  onChange={(e) => setThreshold(Number(e.target.value))}
                  className="w-16 px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-center"
                />
              </div>

              <button
                onClick={handleExportCsv}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-sm transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export CSV</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-700 font-semibold uppercase text-[11px]">
                <tr>
                  <th className="py-2.5 px-3">Student ID</th>
                  <th className="py-2.5 px-3">Student Name</th>
                  <th className="py-2.5 px-3">Program</th>
                  <th className="py-2.5 px-3">Conducted Sessions</th>
                  <th className="py-2.5 px-3">Attended Sessions</th>
                  <th className="py-2.5 px-3">Attendance %</th>
                  <th className="py-2.5 px-3 text-right">Shortage Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loadingReport ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">Evaluating attendance compliance...</td>
                  </tr>
                ) : reportData.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">No student records found for selected filters.</td>
                  </tr>
                ) : (
                  reportData.map((r) => (
                    <tr key={r.id} className={r.isBelowThreshold ? 'bg-rose-50/20' : 'hover:bg-slate-50'}>
                      <td className="py-2.5 px-3 font-mono font-bold text-indigo-700">{r.student_id}</td>
                      <td className="py-2.5 px-3 font-semibold text-slate-900">{r.name}</td>
                      <td className="py-2.5 px-3">{r.course} • {r.semester}</td>
                      <td className="py-2.5 px-3">{r.conducted}</td>
                      <td className="py-2.5 px-3 font-medium text-slate-800">{r.attended}</td>
                      <td className="py-2.5 px-3">
                        <span className={`font-black ${r.isBelowThreshold ? 'text-rose-600' : 'text-emerald-600'}`}>
                          {r.percentage}%
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        {r.isBelowThreshold ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            <AlertTriangle className="w-3 h-3" />
                            SHORTAGE (&lt;{threshold}%)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" />
                            COMPLIANT
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
