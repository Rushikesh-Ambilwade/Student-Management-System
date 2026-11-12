import { useState, useEffect } from 'react';
import { Plus, Calendar, Clock, MapPin, User, Trash2, Printer } from 'lucide-react';
import Modal from '../../components/Modal';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function TimetableManage() {
  const [courses, setCourses] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('');
  const [timetables, setTimetables] = useState([]);
  const [loading, setLoading] = useState(false);

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({
    course_id: '',
    semester_id: '',
    subject_id: '',
    day_of_week: 'Monday',
    start_time: '09:00',
    end_time: '10:00',
    room_number: '',
    faculty_name: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [conflictError, setConflictError] = useState('');

  const toast = useToast();

  // Load courses
  useEffect(() => {
    api.get('/academics/courses').then(res => {
      if (res.data.success) {
        setCourses(res.data.courses || []);
        if (res.data.courses?.length > 0) {
          setSelectedCourse(res.data.courses[0].id);
        }
      }
    }).catch(() => toast.error('Failed to load courses'));
  }, []);

  // Load semesters when course changes
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

  // Load subjects when course & semester change
  useEffect(() => {
    if (selectedCourse && selectedSemester) {
      api.get(`/academics/subjects?course_id=${selectedCourse}&semester_id=${selectedSemester}`).then(res => {
        if (res.data.success) {
          setSubjects(res.data.subjects || []);
        }
      }).catch(() => {});
    } else {
      setSubjects([]);
    }
  }, [selectedCourse, selectedSemester]);

  // Fetch timetable slots
  const fetchTimetable = async () => {
    if (!selectedCourse || !selectedSemester) return;
    setLoading(true);
    try {
      const res = await api.get(`/timetables?course_id=${selectedCourse}&semester_id=${selectedSemester}`);
      if (res.data.success) {
        setTimetables(res.data.timetables || []);
      }
    } catch {
      toast.error('Failed to load timetable');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTimetable();
  }, [selectedCourse, selectedSemester]);

  const handleOpenAddModal = () => {
    setConflictError('');
    setForm({
      course_id: selectedCourse,
      semester_id: selectedSemester,
      subject_id: subjects[0]?.id || '',
      day_of_week: 'Monday',
      start_time: '09:00',
      end_time: '10:00',
      room_number: '',
      faculty_name: subjects[0]?.faculty_name || ''
    });
    setModalOpen(true);
  };

  const handleSubjectChange = (subjectId) => {
    const sub = subjects.find(s => String(s.id) === String(subjectId));
    setForm(prev => ({
      ...prev,
      subject_id: subjectId,
      faculty_name: sub?.faculty_name || prev.faculty_name
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setConflictError('');
    setSubmitting(true);

    try {
      const res = await api.post('/timetables', form);
      if (res.data.success) {
        toast.success('Timetable slot scheduled successfully');
        setModalOpen(false);
        fetchTimetable();
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to save timetable slot';
      setConflictError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this schedule slot?')) return;
    try {
      const res = await api.delete(`/timetables/${id}`);
      if (res.data.success) {
        toast.success('Schedule slot deleted');
        setTimetables(prev => prev.filter(t => t.id !== id));
      }
    } catch {
      toast.error('Failed to delete slot');
    }
  };

  const selectedCourseObj = courses.find(c => String(c.id) === String(selectedCourse));
  const selectedSemObj = semesters.find(s => String(s.id) === String(selectedSemester));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Class Timetable Management</h1>
          <p className="text-slate-500 text-sm mt-1">
            Build and optimize weekly class schedules with automated conflict detection.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 font-medium text-sm transition print:hidden"
          >
            <Printer className="w-4 h-4" />
            Print Schedule
          </button>
          <button
            onClick={handleOpenAddModal}
            disabled={!selectedCourse || !selectedSemester}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl font-medium text-sm transition shadow-sm disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            Add Schedule Slot
          </button>
        </div>
      </div>

      {/* Selectors Bar */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-wrap gap-4 items-center print:hidden">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
            Select Course / Degree
          </label>
          <select
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {courses.map(c => (
              <option key={c.id} value={c.id}>{c.code} - {c.name}</option>
            ))}
          </select>
        </div>

        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
            Select Semester
          </label>
          <select
            value={selectedSemester}
            onChange={(e) => setSelectedSemester(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {semesters.map(s => (
              <option key={s.id} value={s.id}>Semester {s.semester_number} ({s.name})</option>
            ))}
          </select>
        </div>

        <div className="pt-5">
          <div className="px-4 py-2 bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs rounded-xl font-medium">
            Active: {selectedCourseObj?.code || 'Course'} • Semester {selectedSemObj?.semester_number || 'Sem'}
          </div>
        </div>
      </div>

      {/* Timetable Grid View */}
      {loading ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-slate-100">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-3 text-slate-500 text-sm">Loading weekly schedule...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {DAYS_OF_WEEK.map((day) => {
            const daySlots = timetables.filter(t => t.day_of_week === day);

            return (
              <div key={day} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
                <div className="bg-slate-50/80 px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-indigo-600" />
                    <h3 className="font-semibold text-slate-800">{day}</h3>
                  </div>
                  <span className="text-xs bg-indigo-100 text-indigo-700 font-semibold px-2 py-0.5 rounded-full">
                    {daySlots.length} {daySlots.length === 1 ? 'class' : 'classes'}
                  </span>
                </div>

                <div className="p-4 flex-1 space-y-3">
                  {daySlots.length === 0 ? (
                    <div className="text-center py-8 text-slate-400 text-xs border border-dashed border-slate-200 rounded-xl">
                      No classes scheduled for {day}
                    </div>
                  ) : (
                    daySlots.map(slot => (
                      <div
                        key={slot.id}
                        className="p-3.5 rounded-xl border border-slate-200 hover:border-indigo-200 hover:bg-indigo-50/30 transition group relative"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                              {slot.subject?.code || 'SUB'}
                            </span>
                            <h4 className="font-semibold text-slate-800 text-sm mt-1">
                              {slot.subject?.name || 'Class Subject'}
                            </h4>
                          </div>
                          <button
                            onClick={() => handleDelete(slot.id)}
                            className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-600 p-1 transition"
                            title="Delete Slot"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-500">
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            <span>{slot.start_time?.slice(0, 5)} - {slot.end_time?.slice(0, 5)}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            <span className="font-medium text-slate-700">Room {slot.room_number}</span>
                          </div>
                        </div>

                        {slot.faculty_name && (
                          <div className="mt-2 pt-2 border-t border-slate-100 flex items-center gap-1.5 text-xs text-slate-500">
                            <User className="w-3.5 h-3.5 text-slate-400" />
                            <span>Prof. {slot.faculty_name}</span>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Slot Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Schedule Class Slot"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {conflictError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs">
              <strong>Conflict Detected:</strong> {conflictError}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Subject *</label>
            <select
              value={form.subject_id}
              onChange={(e) => handleSubjectChange(e.target.value)}
              required
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Select subject</option>
              {subjects.map(s => (
                <option key={s.id} value={s.id}>{s.code} - {s.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Day of Week *</label>
              <select
                value={form.day_of_week}
                onChange={(e) => setForm({ ...form, day_of_week: e.target.value })}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500"
              >
                {DAYS_OF_WEEK.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Room Number *</label>
              <input
                type="text"
                placeholder="e.g. Lab 302 / Room 104"
                value={form.room_number}
                onChange={(e) => setForm({ ...form, room_number: e.target.value })}
                required
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Start Time *</label>
              <input
                type="time"
                value={form.start_time}
                onChange={(e) => setForm({ ...form, start_time: e.target.value })}
                required
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">End Time *</label>
              <input
                type="time"
                value={form.end_time}
                onChange={(e) => setForm({ ...form, end_time: e.target.value })}
                required
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Faculty / Instructor Name</label>
            <input
              type="text"
              placeholder="e.g. Dr. Ramesh Kumar"
              value={form.faculty_name}
              onChange={(e) => setForm({ ...form, faculty_name: e.target.value })}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition disabled:opacity-50"
            >
              {submitting ? 'Checking Conflicts...' : 'Save Schedule Slot'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
