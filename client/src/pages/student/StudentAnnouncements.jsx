import { useState, useEffect } from 'react';
import { Megaphone, Calendar, AlertCircle, Clock, CheckCircle, Search } from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';

export default function StudentAnnouncements() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const toast = useToast();

  useEffect(() => {
    api.get('/announcements')
      .then(res => {
        if (res.data.success) {
          setAnnouncements(res.data.announcements || []);
        }
      })
      .catch(() => {
        toast.error('Failed to load announcements');
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        <p className="mt-3 text-xs text-slate-500 font-medium">Loading circulars & notices...</p>
      </div>
    );
  }

  const filtered = announcements.filter(a => {
    const matchesSearch = a.title?.toLowerCase().includes(search.toLowerCase()) ||
                          a.content?.toLowerCase().includes(search.toLowerCase());
    const matchesPriority = priorityFilter === 'ALL' || a.priority === priorityFilter;
    return matchesSearch && matchesPriority;
  });

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'urgent':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-700 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Urgent</span>;
      case 'high':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 flex items-center gap-1"><Clock className="w-3 h-3" /> High Priority</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> General Notice</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <h1 className="text-2xl font-bold text-slate-800">Campus Circulars & Official Notices</h1>
        <p className="text-slate-500 text-sm mt-1">
          Stay up to date with examination schedules, fee deadlines, holidays, and campus events.
        </p>
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-wrap gap-4 items-center justify-between">
        <div className="flex items-center gap-2 flex-1 min-w-[240px]">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search circulars by keyword..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Priority:</span>
          {['ALL', 'urgent', 'high', 'normal'].map(p => (
            <button
              key={p}
              onClick={() => setPriorityFilter(p)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium capitalize transition ${
                priorityFilter === p
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Notices List */}
      {filtered.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-slate-100">
          <Megaphone className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-700">No circulars found</h3>
          <p className="text-slate-400 text-sm mt-1">There are no notices matching your search criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filtered.map(a => (
            <div
              key={a.id}
              className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:border-indigo-100 transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  {getPriorityBadge(a.priority)}
                  <div className="flex items-center gap-1.5 text-xs text-slate-400">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{new Date(a.createdAt || a.created_at).toLocaleDateString()}</span>
                  </div>
                </div>

                <h3 className="text-base font-bold text-slate-800 mb-2 leading-snug">{a.title}</h3>
                <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-line">
                  {a.content}
                </p>
              </div>

              {a.expiry_date && (
                <div className="mt-6 pt-4 border-t border-slate-100 text-xs text-amber-600">
                  Notice Valid Until: {new Date(a.expiry_date).toLocaleDateString()}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
