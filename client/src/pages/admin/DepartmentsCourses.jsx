import { useState, useEffect } from 'react';
import { Plus, GraduationCap, Building2, BookOpen, Edit2, Users } from 'lucide-react';
import Modal from '../../components/Modal';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';

export default function DepartmentsCourses() {
  const [departments, setDepartments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [deptModalOpen, setDeptModalOpen] = useState(false);
  const [courseModalOpen, setCourseModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState(null);

  // Forms
  const [deptForm, setDeptForm] = useState({ code: '', name: '', description: '', head_of_department: '', contact_email: '' });
  const [courseForm, setCourseForm] = useState({ department_id: '', code: '', name: '', description: '', duration_years: 4, total_semesters: 8 });

  const toast = useToast();

  const fetchData = async () => {
    try {
      setLoading(true);
      const [dRes, cRes] = await Promise.all([
        api.get('/academics/departments'),
        api.get('/academics/courses')
      ]);
      if (dRes.data.success) setDepartments(dRes.data.departments || []);
      if (cRes.data.success) setCourses(cRes.data.courses || []);
    } catch {
      toast.error('Failed to load academic departments and courses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDeptSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingDept) {
        await api.put(`/academics/departments/${editingDept.id}`, deptForm);
        toast.success('Department updated successfully');
      } else {
        await api.post('/academics/departments', deptForm);
        toast.success('Department created successfully');
      }
      setDeptModalOpen(false);
      setEditingDept(null);
      setDeptForm({ code: '', name: '', description: '', head_of_department: '', contact_email: '' });
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save department');
    }
  };

  const handleCourseSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/academics/courses', courseForm);
      toast.success('Course program created with automated semester sequence.');
      setCourseModalOpen(false);
      setCourseForm({ department_id: '', code: '', name: '', description: '', duration_years: 4, total_semesters: 8 });
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create course');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Academic Structure & Programs</h2>
          <p className="text-xs text-slate-500">Configure academic faculties, degree programs, and curriculum cycles.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setEditingDept(null);
              setDeptForm({ code: '', name: '', description: '', head_of_department: '', contact_email: '' });
              setDeptModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Department
          </button>
          <button
            onClick={() => setCourseModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create Course
          </button>
        </div>
      </div>

      {/* Departments Grid */}
      <div>
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Academic Departments</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {departments.map((dept) => (
            <div key={dept.id} className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex flex-col justify-between hover:border-indigo-300 transition-colors">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100">
                    {dept.code}
                  </span>
                  <button
                    onClick={() => {
                      setEditingDept(dept);
                      setDeptForm({
                        code: dept.code,
                        name: dept.name,
                        description: dept.description || '',
                        head_of_department: dept.head_of_department || '',
                        contact_email: dept.contact_email || ''
                      });
                      setDeptModalOpen(true);
                    }}
                    className="p-1 text-slate-400 hover:text-indigo-600 transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <h4 className="font-bold text-sm text-slate-900 leading-tight">{dept.name}</h4>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">{dept.description || 'No description provided.'}</p>
                <div className="mt-3 text-[11px] text-slate-600">
                  <span className="text-slate-400">Head:</span> <span className="font-semibold">{dept.head_of_department || 'TBD'}</span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
                  {dept.coursesCount} Programs
                </span>
                <span className="flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-emerald-500" />
                  {dept.studentsCount} Students
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Courses / Degree Programs Table */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm space-y-3">
        <h3 className="text-sm font-bold text-slate-900">Registered Degree Programs & Courses</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-700 font-semibold uppercase text-[11px]">
              <tr>
                <th className="py-2.5 px-3">Program Code</th>
                <th className="py-2.5 px-3">Course Name</th>
                <th className="py-2.5 px-3">Department</th>
                <th className="py-2.5 px-3">Duration</th>
                <th className="py-2.5 px-3">Semesters</th>
                <th className="py-2.5 px-3 text-right">Enrolled Students</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {courses.map((course) => (
                <tr key={course.id} className="hover:bg-slate-50">
                  <td className="py-3 px-3 font-mono font-semibold text-indigo-600">{course.code}</td>
                  <td className="py-3 px-3 font-bold text-slate-900">{course.name}</td>
                  <td className="py-3 px-3">{course.department?.name} ({course.department?.code})</td>
                  <td className="py-3 px-3">{course.duration_years} Years</td>
                  <td className="py-3 px-3">{course.total_semesters} Semesters</td>
                  <td className="py-3 px-3 text-right font-semibold text-slate-800">{course.studentsCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Department Modal */}
      <Modal
        isOpen={deptModalOpen}
        onClose={() => setDeptModalOpen(false)}
        title={editingDept ? 'Edit Academic Department' : 'Create Academic Department'}
        subtitle="Define department code and contact leadership"
      >
        <form onSubmit={handleDeptSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Code *</label>
              <input
                type="text"
                required
                value={deptForm.code}
                onChange={(e) => setDeptForm(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                placeholder="e.g. CSE"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Department Name *</label>
              <input
                type="text"
                required
                value={deptForm.name}
                onChange={(e) => setDeptForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Computer Science & Engineering"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Head of Department (HOD)</label>
            <input
              type="text"
              value={deptForm.head_of_department}
              onChange={(e) => setDeptForm(prev => ({ ...prev, head_of_department: e.target.value }))}
              placeholder="Dr. Alan Turing"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Contact Email</label>
            <input
              type="email"
              value={deptForm.contact_email}
              onChange={(e) => setDeptForm(prev => ({ ...prev, contact_email: e.target.value }))}
              placeholder="cse.hod@college.edu"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
            <textarea
              rows={2}
              value={deptForm.description}
              onChange={(e) => setDeptForm(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Department curriculum and specializations"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setDeptModalOpen(false)}
              className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white"
            >
              Save Department
            </button>
          </div>
        </form>
      </Modal>

      {/* Create Course Modal */}
      <Modal
        isOpen={courseModalOpen}
        onClose={() => setCourseModalOpen(false)}
        title="Create Degree Program / Course"
        subtitle="Defines academic curriculum cycle and auto-generates semesters"
      >
        <form onSubmit={handleCourseSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Parent Department *</label>
            <select
              required
              value={courseForm.department_id}
              onChange={(e) => setCourseForm(prev => ({ ...prev, department_id: e.target.value }))}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
            >
              <option value="">Select Department</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Course Code *</label>
              <input
                type="text"
                required
                value={courseForm.code}
                onChange={(e) => setCourseForm(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                placeholder="BTECH-CSE"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Course Full Name *</label>
              <input
                type="text"
                required
                value={courseForm.name}
                onChange={(e) => setCourseForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Bachelor of Technology in CS"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Duration (Years)</label>
              <input
                type="number"
                min={1}
                max={6}
                value={courseForm.duration_years}
                onChange={(e) => setCourseForm(prev => ({ ...prev, duration_years: Number(e.target.value) }))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Total Semesters</label>
              <input
                type="number"
                min={1}
                max={12}
                value={courseForm.total_semesters}
                onChange={(e) => setCourseForm(prev => ({ ...prev, total_semesters: Number(e.target.value) }))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setCourseModalOpen(false)}
              className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-xs font-semibold text-white"
            >
              Create Program
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
