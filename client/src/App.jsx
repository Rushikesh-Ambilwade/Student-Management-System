import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';

// Layouts
import PublicLayout from './layouts/PublicLayout';
import AdminLayout from './layouts/AdminLayout';
import StudentLayout from './layouts/StudentLayout';

// Public Pages
import Login from './pages/public/Login';
import ForgotPassword from './pages/public/ForgotPassword';
import ResetPassword from './pages/public/ResetPassword';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import StudentList from './pages/admin/StudentList';
import StudentForm from './pages/admin/StudentForm';
import StudentProfile from './pages/admin/StudentProfile';
import DepartmentsCourses from './pages/admin/DepartmentsCourses';
import Subjects from './pages/admin/Subjects';
import AttendanceManage from './pages/admin/AttendanceManage';
import ExaminationsMarks from './pages/admin/ExaminationsMarks';
import FeesManage from './pages/admin/FeesManage';
import TimetableManage from './pages/admin/TimetableManage';
import AnnouncementsManage from './pages/admin/AnnouncementsManage';
import AuditLogs from './pages/admin/AuditLogs';
import AdminSettings from './pages/admin/AdminSettings';

// Student Pages
import StudentDashboard from './pages/student/StudentDashboard';
import MyProfile from './pages/student/MyProfile';
import MySubjects from './pages/student/MySubjects';
import MyAttendance from './pages/student/MyAttendance';
import MyMarks from './pages/student/MyMarks';
import MyFees from './pages/student/MyFees';
import MyTimetable from './pages/student/MyTimetable';
import StudentAnnouncements from './pages/student/StudentAnnouncements';
import ChangePassword from './pages/student/ChangePassword';

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <Routes>
            {/* Root Redirect */}
            <Route path="/" element={<Navigate to="/login" replace />} />

            {/* Public Authentication Routes */}
            <Route element={<PublicLayout />}>
              <Route path="/login" element={<Login />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
            </Route>

            {/* Admin Portal Protected Routes */}
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="students" element={<StudentList />} />
              <Route path="students/new" element={<StudentForm />} />
              <Route path="students/:id/edit" element={<StudentForm />} />
              <Route path="students/:id" element={<StudentProfile />} />
              <Route path="departments" element={<DepartmentsCourses />} />
              <Route path="subjects" element={<Subjects />} />
              <Route path="attendance" element={<AttendanceManage />} />
              <Route path="examinations" element={<ExaminationsMarks />} />
              <Route path="fees" element={<FeesManage />} />
              <Route path="timetable" element={<TimetableManage />} />
              <Route path="announcements" element={<AnnouncementsManage />} />
              <Route path="audit-logs" element={<AuditLogs />} />
              <Route path="settings" element={<AdminSettings />} />
            </Route>

            {/* Student Portal Protected Routes */}
            <Route path="/student" element={<StudentLayout />}>
              <Route index element={<Navigate to="/student/dashboard" replace />} />
              <Route path="dashboard" element={<StudentDashboard />} />
              <Route path="profile" element={<MyProfile />} />
              <Route path="subjects" element={<MySubjects />} />
              <Route path="attendance" element={<MyAttendance />} />
              <Route path="marks" element={<MyMarks />} />
              <Route path="fees" element={<MyFees />} />
              <Route path="timetable" element={<MyTimetable />} />
              <Route path="announcements" element={<StudentAnnouncements />} />
              <Route path="change-password" element={<ChangePassword />} />
            </Route>

            {/* Fallback 404 Route */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}
