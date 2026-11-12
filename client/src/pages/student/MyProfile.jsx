import { useState, useEffect } from 'react';
import {
  User,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Shield,
  BookOpen,
  Printer,
  Sparkles,
  School
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';

export default function MyProfile() {
  const { user } = useAuth();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    const studentId = user?.studentProfile?.id;
    if (studentId) {
      api.get(`/students/${studentId}`)
        .then(res => {
          if (res.data.success) {
            setStudent(res.data.student);
          }
        })
        .catch(() => {
          toast.error('Failed to load student profile');
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [user]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        <p className="mt-3 text-xs text-slate-500 font-medium">Loading profile details...</p>
      </div>
    );
  }

  const s = student || user?.studentProfile || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100 print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">My Student Profile & Identity</h1>
          <p className="text-slate-500 text-sm mt-1">
            Official institutional identity record and academic enrollment credentials.
          </p>
        </div>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl font-medium text-sm transition shadow-sm"
        >
          <Printer className="w-4 h-4" />
          Print Student ID Card
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 print:block">
        {/* Printable Student ID Card */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center print:border-none print:shadow-none print:p-0">
          <div className="w-full max-w-sm rounded-2xl overflow-hidden border-2 border-indigo-600 shadow-xl bg-gradient-to-b from-indigo-900 via-indigo-800 to-slate-900 text-white relative">
            {/* Card Header */}
            <div className="p-4 text-center border-b border-indigo-700/60 bg-indigo-950/80">
              <div className="flex items-center justify-center gap-2 mb-1">
                <School className="w-5 h-5 text-indigo-400" />
                <span className="font-extrabold text-sm tracking-wider uppercase">CAMPUSCORE COLLEGE</span>
              </div>
              <p className="text-[10px] text-indigo-300 tracking-widest uppercase">Student Identity Card</p>
            </div>

            {/* Card Body */}
            <div className="p-5 flex flex-col items-center text-center">
              <div className="w-24 h-24 rounded-2xl overflow-hidden border-3 border-indigo-400/80 shadow-md mb-3 bg-white">
                <img
                  src={s.profile_photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(s.first_name || 'Student')}&background=4f46e5&color=fff&size=200`}
                  alt="Student Photo"
                  className="w-full h-full object-cover"
                />
              </div>

              <h2 className="text-lg font-bold text-white">
                {s.first_name} {s.last_name}
              </h2>
              <div className="mt-1 px-3 py-0.5 rounded-full bg-indigo-500/30 text-indigo-200 text-xs font-mono font-bold border border-indigo-400/30">
                {s.student_id}
              </div>

              <div className="mt-4 w-full space-y-1.5 text-xs text-left bg-black/20 p-3 rounded-xl border border-white/5">
                <div className="flex justify-between">
                  <span className="text-slate-400">Department:</span>
                  <span className="font-semibold text-slate-200">{s.department?.name || 'Computer Science'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Course / Degree:</span>
                  <span className="font-semibold text-slate-200">{s.course?.code || 'B.Tech CS'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Current Semester:</span>
                  <span className="font-semibold text-slate-200">{s.currentSemester?.name || 'Semester 4'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Academic Year:</span>
                  <span className="font-semibold text-slate-200">{s.academic_year || '2026-2027'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Status:</span>
                  <span className="font-bold text-emerald-400 uppercase">{s.status || 'Active'}</span>
                </div>
              </div>

              {/* Barcode Mock */}
              <div className="mt-5 w-full flex flex-col items-center pt-2 border-t border-indigo-700/40">
                <div className="font-mono text-[9px] tracking-[6px] text-slate-400">
                  ||| | ||||| || |||| ||| |||||
                </div>
                <span className="text-[9px] text-indigo-300 font-mono mt-0.5">AUTHORISED INSTITUTIONAL CREDENTIAL</span>
              </div>
            </div>
          </div>

          <p className="text-[11px] text-slate-400 mt-4 text-center print:hidden">
            This card is verified via the college central database registrar.
          </p>
        </div>

        {/* Full Institutional Profile Details (Hidden in simple card print, visible on desktop) */}
        <div className="lg:col-span-2 space-y-6 print:hidden">
          {/* Personal Information */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <h2 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
              <User className="w-4 h-4 text-indigo-600" />
              Personal & Contact Information
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-400 block mb-0.5">Full Name</span>
                <span className="font-semibold text-slate-800 text-sm">{s.first_name} {s.last_name}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-400 block mb-0.5">Official Student ID</span>
                <span className="font-semibold font-mono text-indigo-600 text-sm">{s.student_id}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-400 block mb-0.5 flex items-center gap-1">
                  <Mail className="w-3 h-3 text-slate-400" /> Registered Email
                </span>
                <span className="font-semibold text-slate-800">{s.email}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-400 block mb-0.5 flex items-center gap-1">
                  <Phone className="w-3 h-3 text-slate-400" /> Primary Phone
                </span>
                <span className="font-semibold text-slate-800">{s.phone_number || 'N/A'}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-400 block mb-0.5 flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-slate-400" /> Date of Birth
                </span>
                <span className="font-semibold text-slate-800">
                  {s.date_of_birth ? new Date(s.date_of_birth).toLocaleDateString() : 'N/A'}
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-400 block mb-0.5">Gender</span>
                <span className="font-semibold text-slate-800 capitalize">{s.gender || 'Not specified'}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl sm:col-span-2">
                <span className="text-slate-400 block mb-0.5 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-slate-400" /> Residential Address
                </span>
                <span className="font-semibold text-slate-800">{s.address || 'Campus Residence / Day Scholar'}</span>
              </div>
            </div>
          </div>

          {/* Academic Enrollment Information */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <h2 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-indigo-600" />
              Academic Enrollment Details
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-400 block mb-0.5">Academic Department</span>
                <span className="font-semibold text-slate-800">{s.department?.name || 'Computer Science & Engineering'}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-400 block mb-0.5">Degree Program</span>
                <span className="font-semibold text-slate-800">{s.course?.name || 'Bachelor of Technology'}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-400 block mb-0.5">Current Semester</span>
                <span className="font-semibold text-slate-800">{s.currentSemester?.name || 'Semester 4'}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-400 block mb-0.5">Enrolled Academic Year</span>
                <span className="font-semibold text-slate-800">{s.academic_year || '2026-2027'}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-400 block mb-0.5">Admission Date</span>
                <span className="font-semibold text-slate-800">
                  {s.admission_date ? new Date(s.admission_date).toLocaleDateString() : 'August 2026'}
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-400 block mb-0.5">Emergency Contact</span>
                <span className="font-semibold text-slate-800">{s.emergency_contact || 'Parent / Guardian Contact'}</span>
              </div>
            </div>
          </div>

          {/* Read-Only Notice */}
          <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center gap-3 text-xs text-indigo-800">
            <Shield className="w-5 h-5 text-indigo-600 flex-shrink-0" />
            <div>
              <strong>Academic Integrity Notice:</strong> Institutional records, enrollment status, and course assignments are strictly managed by the college academic registrar. If any details are incorrect, contact the college administration office.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
