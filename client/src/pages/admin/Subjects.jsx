import { useState, useEffect } from 'react';
import { Plus, BookOpen, Edit2, Trash2 } from 'lucide-react';
import Modal from '../../components/Modal';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';

export default function Subjects() {
  const [subjects, setSubjects] = useState([]);
  const [courses, setCourses] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('');
  const [loading, setLoading] = useState(true);

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState(null);
  const [form, setForm] = useState({
    course_id: '',
    semester_id: '',
    code: '',
    name: '',
    credits: 3,
    type: 'theory',
    faculty_name: ''
  });

  const toast = useToast();

  const fetchCourses = async () => {
    try {
      const res = await api.get('/academics/courses');
      if (res.data.success) {
        setCourses(res.data.courses || []);
        if (res.data.courses?.length > 0) {
          setSelectedCourse(res.data.courses[0].id);
        }
      }
    } catch {
      toast.error('Failed to load courses');
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  // When course changes, load its semesters
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

  // Fetch subjects for selected course & semester
  const fetchSubjects = async () => {
    try {
      setLoading(true);
      const params = {};
      if (selectedCourse) params.course_id = selectedCourse;
      if (selectedSemester) params.semester_id = selectedSemester;

      const res = await api.get('/academics/subjects', { params });
      if (res.data.success) {
        setSubjects(res.data.subjects || []);
      }
    } catch {
      toast.error('Failed to load subjects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, [selectedCourse, selectedSemester]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingSubject) {
        await api.put(`/academics/subjects/${editingSubject.id}`, form);
        toast.success('Subject updated successfully.');
      } else {
        await api.post('/academics/subjects', form);
        toast.success('Subject created and added to curriculum.');
      }
      setModalOpen(false);
      setEditingSubject(null);
      fetchSubjects();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save subject');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to remove this subject from curriculum?')) return;
    try {
      await api.delete(`/academics/subjects/${id}`);
      toast.success('Subject removed.');
      fetchSubjects();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete subject');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner and Filter Bar */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Curriculum & Subject Management</h2>
            <p className="text-xs text-slate-500">Configure courses, credit allocation, syllabus topics, and faculty assignment.</p>
          </div>
          <button
            onClick={() => {
              setEditingSubject(null);
              setForm({
                course_id: selectedCourse || '',
                semester_id: selectedSemester || '',
                code: '',
                name: '',
                credits: 3,
                type: 'theory',
                faculty_name: ''
              });
              setModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Subject
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-100">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Select Program</label>
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
            <label className="block text-xs font-semibold text-slate-600 mb-1">Select Semester</label>
            <select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800"
            >
              <option value="">All Semesters</option>
              {semesters.map((s) => (
                <option key={s.id} value={s.id}>{s.name} ({s.academic_year})</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Subjects Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden p-5">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-700 font-semibold uppercase text-[11px]">
              <tr>
                <th className="py-3 px-3">Subject Code</th>
                <th className="py-3 px-3">Subject Name</th>
                <th className="py-3 px-3">Semester</th>
                <th className="py-3 px-3">Type</th>
                <th className="py-3 px-3">Credits</th>
                <th className="py-3 px-3">Assigned Faculty</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">Loading curriculum subjects...</td>
                </tr>
              ) : subjects.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">No subjects configured for this selection.</td>
                </tr>
              ) : (
                subjects.map((sub) => (
                  <tr key={sub.id} className="hover:bg-slate-50">
                    <td className="py-3 px-3 font-mono font-bold text-indigo-700">{sub.code}</td>
                    <td className="py-3 px-3 font-semibold text-slate-900">{sub.name}</td>
                    <td className="py-3 px-3">{sub.semester?.name || '-'}</td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        sub.type === 'theory' ? 'bg-blue-50 text-blue-700' : (sub.type === 'practical' ? 'bg-purple-50 text-purple-700' : 'bg-amber-50 text-amber-700')
                      }`}>
                        {sub.type}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-semibold text-slate-800">{sub.credits}</td>
                    <td className="py-3 px-3 text-slate-700 font-medium">{sub.faculty_name || 'Unassigned'}</td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => {
                            setEditingSubject(sub);
                            setForm({
                              course_id: sub.course_id,
                              semester_id: sub.semester_id,
                              code: sub.code,
                              name: sub.name,
                              credits: sub.credits,
                              type: sub.type,
                              faculty_name: sub.faculty_name || ''
                            });
                            setModalOpen(true);
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(sub.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal for Add / Edit Subject */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingSubject ? 'Edit Subject' : 'Add Subject to Curriculum'}
        subtitle="Specify subject code, credit value, and instructor"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Course Program *</label>
              <select
                required
                value={form.course_id}
                onChange={(e) => setForm(prev => ({ ...prev, course_id: e.target.value }))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              >
                <option value="">Select Course</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Semester *</label>
              <select
                required
                value={form.semester_id}
                onChange={(e) => setForm(prev => ({ ...prev, semester_id: e.target.value }))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              >
                <option value="">Select Semester</option>
                {semesters.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Subject Code *</label>
              <input
                type="text"
                required
                value={form.code}
                onChange={(e) => setForm(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                placeholder="e.g. CS401"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Credits</label>
              <input
                type="number"
                min={1}
                max={10}
                required
                value={form.credits}
                onChange={(e) => setForm(prev => ({ ...prev, credits: Number(e.target.value) }))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Subject Name *</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g. Operating Systems Architecture"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Subject Type</label>
              <select
                value={form.type}
                onChange={(e) => setForm(prev => ({ ...prev, type: e.target.value }))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              >
                <option value="theory">Theory</option>
                <option value="practical">Practical / Lab</option>
                <option value="elective">Elective</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Assigned Faculty Name</label>
              <input
                type="text"
                value={form.faculty_name}
                onChange={(e) => setForm(prev => ({ ...prev, faculty_name: e.target.value }))}
                placeholder="Prof. Linus Torvalds"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white"
            >
              Save Subject
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
