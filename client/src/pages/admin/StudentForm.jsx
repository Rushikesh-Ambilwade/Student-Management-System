import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeft, Save, UserPlus, Check } from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';

export default function StudentForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const toast = useToast();

  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [semesters, setSemesters] = useState([]);

  const [formData, setFormData] = useState({
    student_id: '',
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    date_of_birth: '',
    gender: 'Male',
    address: '',
    profile_photo: '',
    department_id: '',
    course_id: '',
    academic_year: '2025-2026',
    current_semester_id: '',
    admission_date: new Date().toISOString().split('T')[0],
    status: 'active',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    initialPassword: 'Student@12345'
  });

  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const [dRes, cRes] = await Promise.all([
          api.get('/academics/departments'),
          api.get('/academics/courses')
        ]);
        if (dRes.data.success) setDepartments(dRes.data.departments || []);
        if (cRes.data.success) setCourses(cRes.data.courses || []);
      } catch {
        toast.error('Failed to load academic departments');
      }
    };
    fetchMetadata();
  }, [toast]);

  // When course changes, load its semesters
  useEffect(() => {
    if (formData.course_id) {
      api.get(`/academics/semesters?course_id=${formData.course_id}`).then(res => {
        if (res.data.success) {
          setSemesters(res.data.semesters || []);
          if (!formData.current_semester_id && res.data.semesters?.length > 0) {
            setFormData(prev => ({ ...prev, current_semester_id: res.data.semesters[0].id }));
          }
        }
      }).catch(() => {});
    }
  }, [formData.course_id, formData.current_semester_id]);

  // If in edit mode, fetch existing student
  useEffect(() => {
    if (isEdit) {
      setLoading(true);
      api.get(`/students/${id}`)
        .then(res => {
          if (res.data.success && res.data.student) {
            const s = res.data.student;
            setFormData({
              student_id: s.student_id,
              first_name: s.first_name,
              last_name: s.last_name,
              email: s.email,
              phone: s.phone || '',
              date_of_birth: s.date_of_birth || '',
              gender: s.gender || 'Male',
              address: s.address || '',
              profile_photo: s.profile_photo || '',
              department_id: s.department_id,
              course_id: s.course_id,
              academic_year: s.academic_year || '2025-2026',
              current_semester_id: s.current_semester_id,
              admission_date: s.admission_date || '',
              status: s.status || 'active',
              emergency_contact_name: s.emergency_contact_name || '',
              emergency_contact_phone: s.emergency_contact_phone || '',
              initialPassword: ''
            });
          }
        })
        .catch(err => {
          toast.error(err.response?.data?.message || 'Failed to fetch student details');
        })
        .finally(() => setLoading(false));
    } else {
      // Auto-suggest student ID
      const randomNum = Math.floor(1000 + Math.random() * 9000);
      setFormData(prev => ({ ...prev, student_id: `CS2026${randomNum}` }));
    }
  }, [id, isEdit, toast]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      if (isEdit) {
        await api.put(`/students/${id}`, formData);
        toast.success('Student information updated successfully.');
      } else {
        await api.post('/students', formData);
        toast.success(`Student ${formData.first_name} ${formData.last_name} enrolled successfully!`);
      }
      navigate('/admin/students');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save student.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link
          to="/admin/students"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Students List
        </Link>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
          {isEdit ? 'Edit Mode' : 'New Registration'}
        </span>
      </div>

      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm">
        <div className="mb-6 pb-4 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-900">
            {isEdit ? `Edit Student: ${formData.first_name} ${formData.last_name}` : 'Student Admission & Registration'}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Complete the fields below to establish the student's official identity, program enrollment, and portal access.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1: Basic Identity */}
          <div>
            <h3 className="text-xs font-bold text-indigo-700 uppercase tracking-wider mb-3">1. Personal & Identity Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Student ID / Roll No. *</label>
                <input
                  type="text"
                  required
                  disabled={isEdit}
                  name="student_id"
                  value={formData.student_id}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-semibold text-slate-800 disabled:opacity-70 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">First Name *</label>
                <input
                  type="text"
                  required
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                  placeholder="e.g. Rahul"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Last Name *</label>
                <input
                  type="text"
                  required
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  placeholder="e.g. Sharma"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="e.g. student@college.edu"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+91 98765 43210"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Gender</label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Date of Birth</label>
                <input
                  type="date"
                  name="date_of_birth"
                  value={formData.date_of_birth}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">Profile Photo URL</label>
                <input
                  type="text"
                  name="profile_photo"
                  value={formData.profile_photo}
                  onChange={handleChange}
                  placeholder="https://images.unsplash.com/... or leave blank for auto-avatar"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="mt-3">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Residential Address</label>
              <textarea
                name="address"
                rows={2}
                value={formData.address}
                onChange={handleChange}
                placeholder="Street address, City, State, Country"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Section 2: Academic Enrollment */}
          <div className="pt-4 border-t border-slate-100">
            <h3 className="text-xs font-bold text-indigo-700 uppercase tracking-wider mb-3">2. Academic Program & Status</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Department *</label>
                <select
                  required
                  name="department_id"
                  value={formData.department_id}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
                >
                  <option value="">Select Department</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Course / Program *</label>
                <select
                  required
                  name="course_id"
                  value={formData.course_id}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
                >
                  <option value="">Select Course</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Current Semester *</label>
                <select
                  required
                  name="current_semester_id"
                  value={formData.current_semester_id}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
                >
                  <option value="">Select Semester</option>
                  {semesters.map((s) => (
                    <option key={s.id} value={s.id}>{s.name} ({s.academic_year})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Academic Year</label>
                <input
                  type="text"
                  name="academic_year"
                  value={formData.academic_year}
                  onChange={handleChange}
                  placeholder="2025-2026"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Admission Date *</label>
                <input
                  type="date"
                  required
                  name="admission_date"
                  value={formData.admission_date}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Account Status</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="suspended">Suspended</option>
                  <option value="graduated">Graduated</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 3: Emergency Contact */}
          <div className="pt-4 border-t border-slate-100">
            <h3 className="text-xs font-bold text-indigo-700 uppercase tracking-wider mb-3">3. Emergency Contact Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Contact Name & Relationship</label>
                <input
                  type="text"
                  name="emergency_contact_name"
                  value={formData.emergency_contact_name}
                  onChange={handleChange}
                  placeholder="e.g. Sunil Sharma (Father)"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Emergency Phone Number</label>
                <input
                  type="text"
                  name="emergency_contact_phone"
                  value={formData.emergency_contact_phone}
                  onChange={handleChange}
                  placeholder="+91 98765 43219"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Initial Password (if creating) */}
          {!isEdit && (
            <div className="pt-4 border-t border-slate-100">
              <h3 className="text-xs font-bold text-indigo-700 uppercase tracking-wider mb-3">4. Initial Login Password</h3>
              <div className="max-w-xs">
                <label className="block text-xs font-semibold text-slate-700 mb-1">Temporary Password</label>
                <input
                  type="text"
                  name="initialPassword"
                  value={formData.initialPassword}
                  onChange={handleChange}
                  placeholder="Student@12345"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:outline-none focus:border-indigo-500"
                />
                <p className="text-[11px] text-slate-400 mt-1">Student can change their password upon logging in.</p>
              </div>
            </div>
          )}

          {/* Submit Action */}
          <div className="pt-6 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate('/admin/students')}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors shadow-sm disabled:opacity-60"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>{isEdit ? 'Save Changes' : 'Confirm Registration'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
