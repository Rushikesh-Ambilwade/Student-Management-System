import { useState, useEffect } from 'react';
import { Clock, Calendar, MapPin, User, Printer } from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function MyTimetable() {
  const [weeklySchedule, setWeeklySchedule] = useState({});
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const todayDay = days[new Date().getDay()];

  useEffect(() => {
    api.get('/timetables/my-schedule')
      .then(res => {
        if (res.data.success) {
          setWeeklySchedule(res.data.weeklySchedule || {});
        }
      })
      .catch(() => {
        toast.error('Failed to load class schedule');
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        <p className="mt-3 text-xs text-slate-500 font-medium">Loading weekly class timetable...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100 print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">My Class Timetable & Schedule</h1>
          <p className="text-slate-500 text-sm mt-1">
            Weekly timetable slots, classroom allocations, and faculty lecture timings.
          </p>
        </div>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl font-medium text-sm transition shadow-sm"
        >
          <Printer className="w-4 h-4" />
          Print Weekly Schedule
        </button>
      </div>

      {/* Grid: Monday to Saturday */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {DAYS_OF_WEEK.map(day => {
          const slots = weeklySchedule[day] || [];
          const isToday = todayDay === day;

          return (
            <div
              key={day}
              className={`rounded-2xl shadow-sm border overflow-hidden flex flex-col transition ${
                isToday
                  ? 'bg-white border-indigo-400 ring-2 ring-indigo-500/20 shadow-md'
                  : 'bg-white border-slate-100'
              }`}
            >
              {/* Day Header */}
              <div className={`px-5 py-3.5 border-b flex items-center justify-between ${
                isToday ? 'bg-indigo-600 text-white border-indigo-700' : 'bg-slate-50 border-slate-100 text-slate-800'
              }`}>
                <div className="flex items-center gap-2">
                  <Calendar className={`w-4 h-4 ${isToday ? 'text-white' : 'text-indigo-600'}`} />
                  <h3 className="font-bold text-sm">{day}</h3>
                  {isToday && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white text-indigo-700 uppercase">
                      Today
                    </span>
                  )}
                </div>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                  isToday ? 'bg-indigo-700 text-white' : 'bg-indigo-100 text-indigo-700'
                }`}>
                  {slots.length} {slots.length === 1 ? 'class' : 'classes'}
                </span>
              </div>

              {/* Day Slots */}
              <div className="p-4 flex-1 space-y-3">
                {slots.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 text-xs border border-dashed border-slate-200 rounded-xl">
                    No classes scheduled for {day}
                  </div>
                ) : (
                  slots.map(s => (
                    <div
                      key={s.id}
                      className="p-3.5 rounded-xl border border-slate-200 hover:border-indigo-200 hover:bg-indigo-50/20 transition"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded font-mono">
                            {s.subject?.code}
                          </span>
                          <h4 className="font-bold text-slate-800 text-sm mt-1">{s.subject?.name}</h4>
                        </div>
                        <span className="text-[11px] font-semibold text-slate-500 capitalize bg-slate-100 px-2 py-0.5 rounded">
                          {s.subject?.type || 'Theory'}
                        </span>
                      </div>

                      <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-500">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>{s.start_time?.slice(0, 5)} - {s.end_time?.slice(0, 5)}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          <span className="font-semibold text-slate-700">Room {s.room_number}</span>
                        </div>
                      </div>

                      {s.faculty_name && (
                        <div className="mt-2 pt-2 border-t border-slate-100 flex items-center gap-1.5 text-xs text-slate-500">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          <span>Prof. {s.faculty_name}</span>
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
    </div>
  );
}
