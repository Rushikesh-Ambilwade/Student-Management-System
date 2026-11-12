import { useState, useEffect } from 'react';
import { BookOpen, Award, User, Layers, CheckCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';

export default function MySubjects() {
  const { user } = useAuth();
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  const student = user?.studentProfile;

  useEffect(() => {
    if (student?.course_id && student?.current_semester_id) {
      api.get(`/academics/subjects?course_id=${student.course_id}&semester_id=${student.current_semester_id}`)
        .then(res => {
          if (res.data.success) {
            setSubjects(res.data.subjects || []);
          }
        })
        .catch(() => {
          toast.error('Failed to load enrolled subjects');
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [student]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        <p className="mt-3 text-xs text-slate-500 font-medium">Loading enrolled subjects...</p>
      </div>
    );
  }

  const totalCredits = subjects.reduce((sum, s) => sum + (Number(s.credits) || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">My Enrolled Subjects</h1>
          <p className="text-slate-500 text-sm mt-1">
            Registered courses, syllabi credits, and faculty allocations for your active semester.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-indigo-50 border border-indigo-100 rounded-xl text-indigo-700 text-xs font-semibold">
            {subjects.length} Subjects Registered • {totalCredits} Total Credits
          </div>
        </div>
      </div>

      {/* Subjects Grid */}
      {subjects.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-slate-100">
          <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-700">No subjects assigned</h3>
          <p className="text-slate-400 text-sm mt-1">
            Your course coordinator has not assigned subjects to your semester yet.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {subjects.map((sub) => (
            <div
              key={sub.id}
              className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:border-indigo-200 transition flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                    {sub.code}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 capitalize">
                    {sub.type || 'Theory'}
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-800 mb-2 group-hover:text-indigo-600 transition-colors">
                  {sub.name}
                </h3>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 space-y-2 text-xs">
                <div className="flex items-center justify-between text-slate-500">
                  <span className="flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-indigo-600" /> Academic Credits:
                  </span>
                  <span className="font-bold text-slate-700">{sub.credits || 3} Credits</span>
                </div>

                {sub.faculty_name && (
                  <div className="flex items-center justify-between text-slate-500">
                    <span className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-slate-400" /> Instructor:
                    </span>
                    <span className="font-semibold text-slate-700">Prof. {sub.faculty_name}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
