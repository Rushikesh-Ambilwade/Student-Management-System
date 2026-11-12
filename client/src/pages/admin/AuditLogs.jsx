import { useState, useEffect } from 'react';
import { ShieldCheck, Filter, Eye, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import Modal from '../../components/Modal';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);

  // Filters
  const [entityFilter, setEntityFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');

  // Payload Inspection Modal
  const [selectedLog, setSelectedLog] = useState(null);
  const [inspectModalOpen, setInspectModalOpen] = useState(false);

  const toast = useToast();

  const fetchLogs = async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page', page);
      params.append('limit', pagination.limit);
      if (entityFilter) params.append('entity', entityFilter);
      if (actionFilter) params.append('action', actionFilter);

      const res = await api.get(`/audit-logs?${params.toString()}`);
      if (res.data.success) {
        setLogs(res.data.logs || []);
        setPagination(res.data.pagination);
      }
    } catch {
      toast.error('Failed to load audit trails');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(1);
  }, [entityFilter, actionFilter]);

  const handleInspect = (log) => {
    setSelectedLog(log);
    setInspectModalOpen(true);
  };

  const getActionBadge = (action) => {
    const act = (action || '').toUpperCase();
    if (act.includes('CREATE') || act.includes('ADD')) {
      return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">{action}</span>;
    }
    if (act.includes('DELETE') || act.includes('REMOVE')) {
      return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800">{action}</span>;
    }
    if (act.includes('FEE') || act.includes('PAYMENT')) {
      return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800">{action}</span>;
    }
    return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">{action}</span>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-indigo-600" />
            <h1 className="text-2xl font-bold text-slate-800">Security & Audit Trail</h1>
          </div>
          <p className="text-slate-500 text-sm mt-1">
            Immutable system logs tracking financial transactions, marks edits, student modifications, and administrative operations.
          </p>
        </div>
        <button
          onClick={() => fetchLogs(pagination.page)}
          className="flex items-center gap-2 px-4 py-2 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 text-sm font-medium transition"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh Log
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
          <Filter className="w-4 h-4 text-indigo-600" />
          Filters:
        </div>

        <select
          value={entityFilter}
          onChange={(e) => setEntityFilter(e.target.value)}
          className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">All Entities</option>
          <option value="STUDENT">Student Records</option>
          <option value="MARKS">Academic Marks</option>
          <option value="ATTENDANCE">Attendance Sessions</option>
          <option value="FEES">Fee Assessments & Payments</option>
          <option value="TIMETABLE">Timetable Schedule</option>
          <option value="ACADEMICS">Academic Catalog</option>
          <option value="ANNOUNCEMENT">Notices</option>
        </select>

        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">All Action Types</option>
          <option value="CREATE_STUDENT">Create Student</option>
          <option value="UPDATE_STUDENT">Update Student</option>
          <option value="RECORD_MARKS">Record Marks</option>
          <option value="RECORD_ATTENDANCE">Record Attendance</option>
          <option value="RECORD_FEE_PAYMENT">Record Fee Payment</option>
          <option value="CREATE_TIMETABLE_SLOT">Create Timetable</option>
        </select>

        {(entityFilter || actionFilter) && (
          <button
            onClick={() => { setEntityFilter(''); setActionFilter(''); }}
            className="text-xs font-semibold text-rose-600 hover:text-rose-800"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-700 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Timestamp</th>
                <th className="px-6 py-4">User / Actor</th>
                <th className="px-6 py-4">Action</th>
                <th className="px-6 py-4">Target Entity</th>
                <th className="px-6 py-4">IP Address</th>
                <th className="px-6 py-4 text-center">Payload Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                    <p className="mt-2 text-xs text-slate-400">Loading audit records...</p>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400 text-sm">
                    No audit records match the current filters.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50 transition">
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-500">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-800 text-xs">
                        {log.user?.username || 'System Actor'}
                      </div>
                      <div className="text-[11px] text-slate-400">{log.user?.email || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getActionBadge(log.action)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-semibold text-xs text-slate-700">{log.entity}</span>
                      {log.entity_id && (
                        <span className="ml-1.5 text-xs text-slate-400 font-mono">#{log.entity_id}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs font-mono text-slate-500">
                      {log.ip_address || '127.0.0.1'}
                    </td>
                    <td className="px-6 py-4 text-center whitespace-nowrap">
                      <button
                        onClick={() => handleInspect(log)}
                        className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-600 rounded-lg text-xs font-medium transition"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Inspect Diff
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>
            Showing {logs.length} of {pagination.total} audit logs
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchLogs(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-white disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-medium">
              Page {pagination.page} of {pagination.totalPages || 1}
            </span>
            <button
              onClick={() => fetchLogs(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-white disabled:opacity-40"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Inspect Modal */}
      <Modal
        isOpen={inspectModalOpen}
        onClose={() => setInspectModalOpen(false)}
        title="Audit Trail Payload Inspection"
      >
        {selectedLog && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl text-xs">
              <div>
                <span className="text-slate-400">Action:</span>
                <span className="ml-1 font-semibold text-slate-800">{selectedLog.action}</span>
              </div>
              <div>
                <span className="text-slate-400">Entity:</span>
                <span className="ml-1 font-semibold text-slate-800">{selectedLog.entity} (ID: {selectedLog.entity_id})</span>
              </div>
              <div>
                <span className="text-slate-400">Actor:</span>
                <span className="ml-1 font-semibold text-slate-800">{selectedLog.user?.username || 'System'}</span>
              </div>
              <div>
                <span className="text-slate-400">IP Address:</span>
                <span className="ml-1 font-mono text-slate-800">{selectedLog.ip_address}</span>
              </div>
            </div>

            {selectedLog.old_values && (
              <div>
                <h4 className="text-xs font-semibold text-slate-600 mb-1">Previous Values (Before Change):</h4>
                <pre className="p-3 bg-slate-900 text-slate-200 text-xs rounded-xl overflow-x-auto font-mono">
                  {typeof selectedLog.old_values === 'string'
                    ? selectedLog.old_values
                    : JSON.stringify(selectedLog.old_values, null, 2)}
                </pre>
              </div>
            )}

            {selectedLog.new_values && (
              <div>
                <h4 className="text-xs font-semibold text-slate-600 mb-1">New Values (Recorded State):</h4>
                <pre className="p-3 bg-slate-900 text-emerald-300 text-xs rounded-xl overflow-x-auto font-mono">
                  {typeof selectedLog.new_values === 'string'
                    ? selectedLog.new_values
                    : JSON.stringify(selectedLog.new_values, null, 2)}
                </pre>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setInspectModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-medium"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
