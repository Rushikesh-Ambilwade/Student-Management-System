import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UserPlus,
  Eye,
  Edit2,
  Trash2,
  KeyRound,
  CheckCircle,
  XCircle,
  Filter
} from 'lucide-react';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';

export default function StudentList() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [search, setSearch] = useState('');
  
  // Filters
  const [departments, setDepartments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  // Modals state
  const [resetModalStudent, setResetModalStudent] = useState(null);
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [deleteModalStudent, setDeleteModalStudent] = useState(null);

  const navigate = useNavigate();
  const toast = useToast();

  const fetchFilters = async () => {
    try {
      const [deptRes, courseRes] = await Promise.all([
        api.get('/academics/departments'),
        api.get('/academics/courses')
      ]);
      if (deptRes.data.success) setDepartments(deptRes.data.departments || []);
      if (courseRes.data.success) setCourses(courseRes.data.courses || []);
    } catch {
      // Ignore filter load error
    }
  };

  const fetchStudents = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: 10,
        search,
        department_id: selectedDept || undefined,
        course_id: selectedCourse || undefined,
        status: selectedStatus || undefined
      };

      const res = await api.get('/students', { params });
      if (res.data.success) {
        setStudents(res.data.students || []);
        setPagination(res.data.pagination);
      }
    } catch {
      toast.error('Failed to load students');
    } finally {
      setLoading(false);
    }
  }, [search, selectedDept, selectedCourse, selectedStatus, toast]);

  useEffect(() => {
    fetchFilters();
  }, []);

  useEffect(() => {
    fetchStudents(1);
  }, [fetchStudents]);

  const handleExportCsv = async () => {
    try {
      const res = await api.get('/students/export/csv', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `students_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Students directory exported to CSV.');
    } catch {
      toast.error('Failed to export students CSV');
    }
  };

  const handleStatusChange = async (student, newStatus) => {
    try {
      await api.patch(`/students/${student.id}/status`, { status: newStatus });
      toast.success(`Student status changed to ${newStatus}`);
      fetchStudents(pagination.page);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status');
    }
  };

  const handleResetPassword = async () => {
    if (!resetModalStudent) return;
    try {
      const res = await api.post(`/students/${resetModalStudent.id}/reset-password`, {
        newPassword: newPasswordInput || 'Student@12345'
      });
      toast.success(res.data.message || 'Password reset successfully.');
      setResetModalStudent(null);
      setNewPasswordInput('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reset password');
    }
  };

  const handleDeleteStudent = async () => {
    if (!deleteModalStudent) return;
    try {
      await api.delete(`/students/${deleteModalStudent.id}`);
      toast.success('Student and user account permanently deleted.');
      setDeleteModalStudent(null);
      fetchStudents(pagination.page);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete student');
    }
  };

  const columns = [
    {
      header: 'Student',
      render: (row) => (
        <div className="flex items-center gap-3">
          <img
            src={row.profile_photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(row.first_name + ' ' + row.last_name)}&background=6366f1&color=fff`}
            alt="avatar"
            className="w-9 h-9 rounded-xl object-cover border border-slate-200"
          />
          <div>
            <div className="font-semibold text-slate-900">{row.first_name} {row.last_name}</div>
            <div className="text-[11px] text-slate-400 font-mono">{row.email}</div>
          </div>
        </div>
      )
    },
    {
      header: 'Student ID',
      render: (row) => <span className="font-mono font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">{row.student_id}</span>
    },
    {
      header: 'Department & Program',
      render: (row) => (
        <div>
          <div className="font-medium text-slate-800">{row.course?.name || '-'}</div>
          <div className="text-[11px] text-slate-400">{row.department?.code || '-'} • Sem {row.currentSemester?.semester_number || '-'}</div>
        </div>
      )
    },
    {
      header: 'Status',
      render: (row) => {
        const styles = {
          active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          graduated: 'bg-indigo-50 text-indigo-700 border-indigo-200',
          suspended: 'bg-amber-50 text-amber-700 border-amber-200',
          inactive: 'bg-slate-100 text-slate-600 border-slate-200'
        };
        return (
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize border ${styles[row.status] || styles.active}`}>
            {row.status}
          </span>
        );
      }
    },
    {
      header: 'Actions',
      className: 'text-right',
      render: (row) => (
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={() => navigate(`/admin/students/${row.id}`)}
            className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
            title="View Full Profile"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={() => navigate(`/admin/students/edit/${row.id}`)}
            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
            title="Edit Information"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setResetModalStudent(row)}
            className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-amber-50 transition-colors"
            title="Reset Login Password"
          >
            <KeyRound className="w-4 h-4" />
          </button>
          {row.status === 'active' ? (
            <button
              onClick={() => handleStatusChange(row, 'inactive')}
              className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
              title="Deactivate Student"
            >
              <XCircle className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={() => handleStatusChange(row, 'active')}
              className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
              title="Activate Student"
            >
              <CheckCircle className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => setDeleteModalStudent(row)}
            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
            title="Delete Student"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-4">
      {/* Header and Filter Controls Bar */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Student Directory</h2>
            <p className="text-xs text-slate-500">Manage student profiles, enrollments, credentials, and academic standing.</p>
          </div>
          <button
            onClick={() => navigate('/admin/students/new')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl transition-colors shadow-sm"
          >
            <UserPlus className="w-4 h-4" />
            Enroll New Student
          </button>
        </div>

        {/* Dropdown Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-100">
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Department
            </label>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:border-indigo-500"
            >
              <option value="">All Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Course / Program
            </label>
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:border-indigo-500"
            >
              <option value="">All Courses</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Enrollment Status
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:border-indigo-500"
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
              <option value="graduated">Graduated</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Data Table */}
      <DataTable
        columns={columns}
        data={students}
        loading={loading}
        searchPlaceholder="Search by name, ID, or email..."
        searchValue={search}
        onSearchChange={setSearch}
        pagination={pagination}
        onPageChange={(p) => fetchStudents(p)}
        onExportCsv={handleExportCsv}
        emptyMessage="No students match the selected filter criteria."
      />

      {/* Reset Password Modal */}
      <Modal
        isOpen={!!resetModalStudent}
        onClose={() => setResetModalStudent(null)}
        title="Reset Student Password"
        subtitle={`Generate new login credentials for ${resetModalStudent?.first_name} ${resetModalStudent?.last_name}`}
        actions={
          <>
            <button
              onClick={() => setResetModalStudent(null)}
              className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              onClick={handleResetPassword}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white"
            >
              Set New Password
            </button>
          </>
        }
      >
        <div className="space-y-3">
          <p className="text-xs text-slate-600">
            Username: <span className="font-mono font-bold text-slate-900">{resetModalStudent?.student_id}</span>
          </p>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">New Password</label>
            <input
              type="text"
              value={newPasswordInput}
              onChange={(e) => setNewPasswordInput(e.target.value)}
              placeholder="Leave blank for default: Student@12345"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteModalStudent}
        onClose={() => setDeleteModalStudent(null)}
        title="Confirm Permanent Deletion"
        subtitle="This action cannot be undone."
        actions={
          <>
            <button
              onClick={() => setDeleteModalStudent(null)}
              className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteStudent}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-xs font-semibold text-white"
            >
              Permanently Delete Student
            </button>
          </>
        }
      >
        <div className="text-xs text-slate-600 space-y-2">
          <p>
            Are you sure you want to delete <strong className="text-slate-900">{deleteModalStudent?.first_name} {deleteModalStudent?.last_name}</strong> ({deleteModalStudent?.student_id})?
          </p>
          <p className="text-rose-600 font-medium">
            This will permanently remove the student profile, associated login account, attendance history, marks, and fee assessments.
          </p>
        </div>
      </Modal>
    </div>
  );
}
