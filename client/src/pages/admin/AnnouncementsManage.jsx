import { useState, useEffect } from 'react';
import { Plus, Bell, Megaphone, Calendar, Tag, Trash2, Edit2, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import Modal from '../../components/Modal';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';

export default function AnnouncementsManage() {
  const [announcements, setAnnouncements] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter
  const [search, setSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('ALL');

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [form, setForm] = useState({
    title: '',
    content: '',
    priority: 'normal',
    target_audience: 'all',
    target_id: '',
    expiry_date: '',
    is_active: true
  });
  const [submitting, setSubmitting] = useState(false);

  const toast = useToast();

  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      const res = await api.get('/announcements');
      if (res.data.success) {
        setAnnouncements(res.data.announcements || []);
      }
    } catch {
      toast.error('Failed to load notices');
    } finally {
      setLoading(false);
    }
  };

  const fetchMetadata = async () => {
    try {
      const [deptRes, courseRes] = await Promise.all([
        api.get('/academics/departments'),
        api.get('/academics/courses')
      ]);
      if (deptRes.data.success) setDepartments(deptRes.data.departments || []);
      if (courseRes.data.success) setCourses(courseRes.data.courses || []);
    } catch {
      // Non-fatal
    }
  };

  useEffect(() => {
    fetchAnnouncements();
    fetchMetadata();
  }, []);

  const handleOpenAdd = () => {
    setEditingItem(null);
    setForm({
      title: '',
      content: '',
      priority: 'normal',
      target_audience: 'all',
      target_id: '',
      expiry_date: '',
      is_active: true
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setForm({
      title: item.title,
      content: item.content,
      priority: item.priority || 'normal',
      target_audience: item.target_audience || 'all',
      target_id: item.target_id || '',
      expiry_date: item.expiry_date ? item.expiry_date.split('T')[0] : '',
      is_active: item.is_active !== false
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        target_id: form.target_audience === 'all' ? null : (form.target_id ? Number(form.target_id) : null),
        expiry_date: form.expiry_date || null
      };

      if (editingItem) {
        const res = await api.put(`/announcements/${editingItem.id}`, payload);
        if (res.data.success) {
          toast.success('Announcement updated');
          setModalOpen(false);
          fetchAnnouncements();
        }
      } else {
        const res = await api.post('/announcements', payload);
        if (res.data.success) {
          toast.success('Announcement published');
          setModalOpen(false);
          fetchAnnouncements();
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save announcement');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to remove this announcement?')) return;
    try {
      const res = await api.delete(`/announcements/${id}`);
      if (res.data.success) {
        toast.success('Announcement removed');
        setAnnouncements(prev => prev.filter(a => a.id !== id));
      }
    } catch {
      toast.error('Failed to remove announcement');
    }
  };

  // Filtered List
  const filtered = announcements.filter(item => {
    const matchesSearch = item.title?.toLowerCase().includes(search.toLowerCase()) ||
                          item.content?.toLowerCase().includes(search.toLowerCase());
    const matchesPriority = priorityFilter === 'ALL' || item.priority === priorityFilter;
    return matchesSearch && matchesPriority;
  });

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'urgent':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-700 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Urgent</span>;
      case 'high':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 flex items-center gap-1"><Clock className="w-3 h-3" /> High</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Normal</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Campus Notices & Announcements</h1>
          <p className="text-slate-500 text-sm mt-1">
            Broadcast official circulars, exam schedules, and alerts to students and staff.
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl font-medium text-sm transition shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Publish Notice
        </button>
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-wrap gap-4 items-center justify-between">
        <div className="flex items-center gap-2 flex-1 min-w-[240px]">
          <input
            type="text"
            placeholder="Search circulars by keyword..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
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

      {/* Announcements List */}
      {loading ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-slate-100">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-3 text-slate-500 text-sm">Loading campus notices...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-slate-100">
          <Megaphone className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-700">No notices found</h3>
          <p className="text-slate-400 text-sm mt-1">Publish circulars to inform students of examinations, fees, or holidays.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filtered.map(item => (
            <div
              key={item.id}
              className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:border-indigo-100 transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    {getPriorityBadge(item.priority)}
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 capitalize">
                      Target: {item.target_audience}
                    </span>
                    {!item.is_active && (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-50 text-rose-600">
                        Inactive
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(item)}
                      className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50 transition"
                      title="Edit Notice"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition"
                      title="Delete Notice"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <h3 className="text-lg font-bold text-slate-800 mb-2">{item.title}</h3>
                <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-line">
                  {item.content}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Posted: {new Date(item.createdAt || item.publish_date).toLocaleDateString()}</span>
                </div>
                {item.expiry_date && (
                  <span className="text-amber-600">
                    Expires: {new Date(item.expiry_date).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingItem ? 'Edit Campus Notice' : 'Publish Campus Notice'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Notice Headline / Title *</label>
            <input
              type="text"
              placeholder="e.g. End Semester Exam Registration Deadline"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Notice Content *</label>
            <textarea
              rows={4}
              placeholder="Enter detailed notice information for students..."
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              required
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Priority Level</label>
              <select
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500"
              >
                <option value="normal">Normal (Informative)</option>
                <option value="high">High (Action Required)</option>
                <option value="urgent">Urgent (Immediate Attention)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Expiry Date (Optional)</label>
              <input
                type="date"
                value={form.expiry_date}
                onChange={(e) => setForm({ ...form, expiry_date: e.target.value })}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Target Audience</label>
              <select
                value={form.target_audience}
                onChange={(e) => setForm({ ...form, target_audience: e.target.value, target_id: '' })}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">Entire College (All Students)</option>
                <option value="department">Specific Department</option>
                <option value="course">Specific Degree Program</option>
              </select>
            </div>

            {form.target_audience === 'department' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Select Department</label>
                <select
                  value={form.target_id}
                  onChange={(e) => setForm({ ...form, target_id: e.target.value })}
                  required
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Select Department</option>
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
            )}

            {form.target_audience === 'course' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Select Course</label>
                <select
                  value={form.target_id}
                  onChange={(e) => setForm({ ...form, target_id: e.target.value })}
                  required
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Select Course</option>
                  {courses.map(c => (
                    <option key={c.id} value={c.id}>{c.code} - {c.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="is_active_check"
              checked={form.is_active}
              onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
              className="rounded text-indigo-600 focus:ring-indigo-500"
            />
            <label htmlFor="is_active_check" className="text-xs font-medium text-slate-700">
              Notice is active and visible to students
            </label>
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
              {submitting ? 'Publishing...' : (editingItem ? 'Update Notice' : 'Publish Notice')}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
