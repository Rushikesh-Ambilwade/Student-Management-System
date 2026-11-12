import { useState, useEffect } from 'react';
import {
  Award,
  Plus,
  Save,
  Download,
  Calendar,
  CheckCircle,
  XCircle,
  FileText
} from 'lucide-react';
import Modal from '../../components/Modal';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';

export default function ExaminationsMarks() {
  const [activeTab, setActiveTab] = useState('sheet'); // 'sheet', 'exams', 'results'
  const toast = useToast();

  // Academic filters
  const [courses, setCourses] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [examinations, setExaminations] = useState([]);

  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedExam, setSelectedExam] = useState('');

  // Marks Sheet state
  const [studentsWithMarks, setStudentsWithMarks] = useState([]);
  const [maxMarks, setMaxMarks] = useState(100);
  const [passingMarks, setPassingMarks] = useState(40);
  const [loadingSheet, setLoadingSheet] = useState(false);
  const [savingMarks, setSavingMarks] = useState(false);

  // New Exam Modal
  const [examModalOpen, setExamModalOpen] = useState(false);
  const [examForm, setExamForm] = useState({
    name: '',
    exam_type: 'internal_1',
    course_id: '',
    semester_id: '',
    academic_year: '2025-2026',
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]
  });

  // Load courses & exams
  const fetchMetadata = async () => {
    try {
      const [cRes, eRes] = await Promise.all([
        api.get('/academics/courses'),
        api.get('/marks/examinations')
      ]);
      if (cRes.data.success) {
        setCourses(cRes.data.courses || []);
        if (cRes.data.courses?.length > 0) {
          setSelectedCourse(cRes.data.courses[0].id);
        }
      }
      if (eRes.data.success) {
        setExaminations(eRes.data.examinations || []);
        if (eRes.data.examinations?.length > 0) {
          setSelectedExam(eRes.data.examinations[0].id);
        }
      }
    } catch {
      toast.error('Failed to load academic records');
    }
  };

  useEffect(() => {
    fetchMetadata();
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

  // When semester changes, load subjects
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

  // Load marks sheet when exam & subject are selected
  const fetchMarksSheet = async () => {
    if (!selectedExam || !selectedSubject) return;
    try {
      setLoadingSheet(true);
      const res = await api.get('/marks/sheet', {
        params: {
          examination_id: selectedExam,
          subject_id: selectedSubject
        }
      });
      if (res.data.success) {
        setStudentsWithMarks(res.data.students || []);
        if (res.data.students?.length > 0 && res.data.students[0].max_marks) {
          setMaxMarks(Number(res.data.students[0].max_marks));
          setPassingMarks(Number(res.data.students[0].passing_marks));
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load marks sheet');
    } finally {
      setLoadingSheet(false);
    }
  };

  useEffect(() => {
    if (selectedExam && selectedSubject) {
      fetchMarksSheet();
    }
  }, [selectedExam, selectedSubject]);

  const handleMarkChange = (index, value) => {
    setStudentsWithMarks(prev => {
      const updated = [...prev];
      updated[index].marks_obtained = value;
      // Live Grade Preview
      const obt = Number(value);
      if (updated[index].is_absent) {
        updated[index].grade = 'AB';
      } else if (!isNaN(obt) && value !== '') {
        const pct = (obt / maxMarks) * 100;
        if (obt < passingMarks) updated[index].grade = 'F';
        else if (pct >= 90) updated[index].grade = 'A+';
        else if (pct >= 80) updated[index].grade = 'A';
        else if (pct >= 70) updated[index].grade = 'B+';
        else if (pct >= 60) updated[index].grade = 'B';
        else if (pct >= 50) updated[index].grade = 'C';
        else updated[index].grade = 'D';
      } else {
        updated[index].grade = '';
      }
      return updated;
    });
  };

  const handleAbsentToggle = (index) => {
    setStudentsWithMarks(prev => {
      const updated = [...prev];
      const nextAbsent = !updated[index].is_absent;
      updated[index].is_absent = nextAbsent;
      if (nextAbsent) {
        updated[index].marks_obtained = 0;
        updated[index].grade = 'AB';
      } else {
        updated[index].grade = '';
      }
      return updated;
    });
  };

  const handleSaveMarks = async (e) => {
    e.preventDefault();
    if (!selectedExam || !selectedSubject) {
      toast.error('Please select both an Examination and a Subject.');
      return;
    }

    try {
      setSavingMarks(true);
      const payload = {
        examination_id: Number(selectedExam),
        subject_id: Number(selectedSubject),
        max_marks: Number(maxMarks),
        passing_marks: Number(passingMarks),
        marks: studentsWithMarks.map(s => ({
          student_id: s.student_id,
          marks_obtained: s.marks_obtained === '' ? 0 : Number(s.marks_obtained),
          is_absent: Boolean(s.is_absent),
          remarks: s.remarks || null
        }))
      };

      const res = await api.post('/marks/batch', payload);
      toast.success(res.data.message || 'Marks recorded successfully.');
      fetchMarksSheet();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to record marks.');
    } finally {
      setSavingMarks(false);
    }
  };

  const handleCreateExam = async (e) => {
    e.preventDefault();
    try {
      await api.post('/marks/examinations', examForm);
      toast.success('Examination scheduled successfully.');
      setExamModalOpen(false);
      fetchMetadata();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create examination');
    }
  };

  const handleExportCsv = async () => {
    try {
      const res = await api.get('/marks/export/csv', {
        params: { examination_id: selectedExam },
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `results_export_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Examination results exported to CSV.');
    } catch {
      toast.error('Failed to export results CSV');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Bar */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Examinations & Marks Evaluation</h2>
          <p className="text-xs text-slate-500">Manage internal tests, final assessments, enter student scores, and calculate grades.</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setExamForm(prev => ({
                ...prev,
                course_id: selectedCourse || (courses[0]?.id || ''),
                semester_id: selectedSemester || (semesters[0]?.id || '')
              }));
              setExamModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            Schedule Exam
          </button>
        </div>
      </div>

      {/* Selectors Bar */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Examination *</label>
          <select
            value={selectedExam}
            onChange={(e) => setSelectedExam(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-indigo-700"
          >
            <option value="">Select Examination</option>
            {examinations.map((ex) => (
              <option key={ex.id} value={ex.id}>{ex.name}</option>
            ))}
          </select>
        </div>

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
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Subject *</label>
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-indigo-700"
          >
            <option value="">Select Subject</option>
            {subjects.map((sub) => (
              <option key={sub.id} value={sub.id}>{sub.name} ({sub.code})</option>
            ))}
          </select>
        </div>
      </div>

      {/* Marks Entry Sheet */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 space-y-4">
        {/* Parameters & CSV Export */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-100">
          <div className="flex flex-wrap items-center gap-4">
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-0.5">Maximum Marks</label>
              <input
                type="number"
                min={1}
                value={maxMarks}
                onChange={(e) => setMaxMarks(Number(e.target.value))}
                className="w-24 px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-center"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-0.5">Passing Marks</label>
              <input
                type="number"
                min={1}
                value={passingMarks}
                onChange={(e) => setPassingMarks(Number(e.target.value))}
                className="w-24 px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-center"
              />
            </div>
          </div>

          <button
            onClick={handleExportCsv}
            disabled={!selectedExam}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Exam Results CSV</span>
          </button>
        </div>

        {/* Marks Table */}
        {loadingSheet ? (
          <div className="py-12 text-center text-xs text-slate-400">Loading student marks sheet...</div>
        ) : !selectedExam || !selectedSubject ? (
          <div className="py-12 text-center text-xs text-slate-400">Please select both an Examination and Subject from the filters above.</div>
        ) : studentsWithMarks.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400">No enrolled students found for this subject and semester.</div>
        ) : (
          <form onSubmit={handleSaveMarks}>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-slate-700 font-semibold uppercase text-[11px]">
                  <tr>
                    <th className="py-3 px-3">Roll No.</th>
                    <th className="py-3 px-3">Student Name</th>
                    <th className="py-3 px-3">Absent</th>
                    <th className="py-3 px-3">Marks Obtained (Max: {maxMarks})</th>
                    <th className="py-3 px-3">Grade Preview</th>
                    <th className="py-3 px-3">Result</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {studentsWithMarks.map((st, idx) => {
                    const isPass = !st.is_absent && Number(st.marks_obtained) >= passingMarks;
                    return (
                      <tr key={st.student_id} className="hover:bg-slate-50">
                        <td className="py-3 px-3 font-mono font-bold text-indigo-700">{st.roll_number}</td>
                        <td className="py-3 px-3 font-semibold text-slate-900">{st.name}</td>
                        <td className="py-3 px-3">
                          <label className="flex items-center gap-1.5 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={st.is_absent}
                              onChange={() => handleAbsentToggle(idx)}
                              className="rounded bg-slate-100 border-slate-300 text-rose-600 focus:ring-rose-500/20 w-4 h-4"
                            />
                            <span className="text-[11px] font-medium text-slate-500">Absent</span>
                          </label>
                        </td>
                        <td className="py-3 px-3">
                          <input
                            type="number"
                            min={0}
                            max={maxMarks}
                            disabled={st.is_absent}
                            value={st.marks_obtained}
                            onChange={(e) => handleMarkChange(idx, e.target.value)}
                            placeholder="0"
                            className="w-24 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-900 disabled:opacity-40 focus:outline-none focus:border-indigo-500"
                          />
                        </td>
                        <td className="py-3 px-3 font-bold text-sm">
                          {st.grade ? (
                            <span className={`px-2.5 py-0.5 rounded-md text-xs font-extrabold ${
                              st.grade === 'F' ? 'bg-rose-50 text-rose-700' : (st.grade === 'AB' ? 'bg-slate-100 text-slate-600' : 'bg-emerald-50 text-emerald-700')
                            }`}>
                              {st.grade}
                            </span>
                          ) : (
                            <span className="text-slate-300">-</span>
                          )}
                        </td>
                        <td className="py-3 px-3">
                          {st.marks_obtained !== '' && (
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              isPass ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                            }`}>
                              {isPass ? 'PASS' : 'FAIL'}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                Server-side validation ensures marks are strictly between 0 and maximum marks.
              </span>
              <button
                type="submit"
                disabled={savingMarks}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-sm transition-colors disabled:opacity-60"
              >
                {savingMarks ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Submit & Save All Marks</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Modal: Schedule Examination */}
      <Modal
        isOpen={examModalOpen}
        onClose={() => setExamModalOpen(false)}
        title="Schedule New Examination"
        subtitle="Create an internal assessment or semester final examination"
      >
        <form onSubmit={handleCreateExam} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Examination Title *</label>
            <input
              type="text"
              required
              value={examForm.name}
              onChange={(e) => setExamForm(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g. Mid-Semester Examinations 2026"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Exam Type</label>
              <select
                value={examForm.exam_type}
                onChange={(e) => setExamForm(prev => ({ ...prev, exam_type: e.target.value }))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              >
                <option value="internal_1">Internal Test 1</option>
                <option value="internal_2">Internal Test 2</option>
                <option value="practical">Practical Exam</option>
                <option value="assignment">Assignment / Project</option>
                <option value="semester_final">Semester Final Exam</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Academic Year</label>
              <input
                type="text"
                value={examForm.academic_year}
                onChange={(e) => setExamForm(prev => ({ ...prev, academic_year: e.target.value }))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Start Date</label>
              <input
                type="date"
                required
                value={examForm.start_date}
                onChange={(e) => setExamForm(prev => ({ ...prev, start_date: e.target.value }))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">End Date</label>
              <input
                type="date"
                required
                value={examForm.end_date}
                onChange={(e) => setExamForm(prev => ({ ...prev, end_date: e.target.value }))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setExamModalOpen(false)}
              className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white"
            >
              Save Examination
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
