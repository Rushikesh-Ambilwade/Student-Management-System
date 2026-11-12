import { useState, useEffect } from 'react';
import {
  CreditCard,
  Plus,
  Download,
  Receipt,
  Printer,
  CheckCircle,
  AlertCircle,
  Search,
  Filter
} from 'lucide-react';
import Modal from '../../components/Modal';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';

export default function FeesManage() {
  const [activeTab, setActiveTab] = useState('assessments'); // 'assessments', 'structures'
  const toast = useToast();

  const [assessments, setAssessments] = useState([]);
  const [structures, setStructures] = useState([]);
  const [courses, setCourses] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  // Payment Recording Modal
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedAssessment, setSelectedAssessment] = useState(null);
  const [paymentForm, setPaymentForm] = useState({
    amount_paid: '',
    payment_mode: 'online',
    payment_date: new Date().toISOString().split('T')[0],
    transaction_ref: '',
    remarks: ''
  });

  // Fee Structure Creation Modal
  const [structureModalOpen, setStructureModalOpen] = useState(false);
  const [structureForm, setStructureForm] = useState({
    course_id: '',
    semester_id: '',
    academic_year: '2025-2026',
    category_name: 'Regular',
    tuition_fee: 45000,
    lab_fee: 10000,
    library_fee: 3000,
    exam_fee: 2500,
    other_fee: 1500,
    due_date: '2026-04-30'
  });

  // Printable Receipt Modal State
  const [receiptData, setReceiptData] = useState(null);

  const fetchAssessments = async () => {
    try {
      setLoading(true);
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (selectedStatus) params.status = selectedStatus;

      const [aRes, sRes, cRes] = await Promise.all([
        api.get('/fees/assessments', { params }),
        api.get('/fees/structures'),
        api.get('/academics/courses')
      ]);

      if (aRes.data.success) setAssessments(aRes.data.assessments || []);
      if (sRes.data.success) setStructures(sRes.data.structures || []);
      if (cRes.data.success) setCourses(cRes.data.courses || []);
    } catch {
      toast.error('Failed to load fee records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssessments();
  }, [search, selectedStatus]);

  // When structure course changes, load its semesters
  useEffect(() => {
    if (structureForm.course_id) {
      api.get(`/academics/semesters?course_id=${structureForm.course_id}`).then(res => {
        if (res.data.success) {
          setSemesters(res.data.semesters || []);
          if (res.data.semesters?.length > 0) {
            setStructureForm(prev => ({ ...prev, semester_id: res.data.semesters[0].id }));
          }
        }
      }).catch(() => {});
    }
  }, [structureForm.course_id]);

  const handleOpenPayment = (assessment) => {
    setSelectedAssessment(assessment);
    setPaymentForm({
      amount_paid: assessment.balance_amount,
      payment_mode: 'online',
      payment_date: new Date().toISOString().split('T')[0],
      transaction_ref: `TXN_${Date.now()}`,
      remarks: 'Payment recorded via Bursar Office'
    });
    setPaymentModalOpen(true);
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    if (!selectedAssessment) return;
    try {
      const res = await api.post('/fees/payments', {
        assessment_id: selectedAssessment.id,
        student_id: selectedAssessment.student_id,
        amount_paid: Number(paymentForm.amount_paid),
        payment_mode: paymentForm.payment_mode,
        payment_date: paymentForm.payment_date,
        transaction_ref: paymentForm.transaction_ref,
        remarks: paymentForm.remarks
      });

      toast.success(`Payment recorded! Generated Receipt #${res.data.payment.receipt_number}`);
      setPaymentModalOpen(false);
      fetchAssessments();

      // Show receipt view
      setReceiptData({
        ...res.data.payment,
        student: selectedAssessment.student,
        assessment: selectedAssessment
      });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to record payment');
    }
  };

  const handleCreateStructure = async (e) => {
    e.preventDefault();
    try {
      await api.post('/fees/structures', structureForm);
      toast.success('Fee structure created.');
      setStructureModalOpen(false);
      fetchAssessments();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create fee structure');
    }
  };

  const handleExportCsv = async () => {
    try {
      const res = await api.get('/fees/export/csv', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `fee_assessments_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Fee report exported to CSV.');
    } catch {
      toast.error('Failed to export CSV');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Bar */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Student Fees & Accounts</h2>
          <p className="text-xs text-slate-500">Configure fee structures, record student payments, track outstanding balances, and print receipts.</p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('assessments')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'assessments' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Student Assessments
            </button>
            <button
              onClick={() => setActiveTab('structures')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'structures' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Fee Structures ({structures.length})
            </button>
          </div>

          <button
            onClick={() => {
              if (courses.length > 0) {
                setStructureForm(prev => ({ ...prev, course_id: courses[0].id }));
              }
              setStructureModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Structure
          </button>
        </div>
      </div>

      {/* TAB 1: ASSESSMENTS TABLE */}
      {activeTab === 'assessments' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 space-y-4">
          {/* Filter Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search student or ID..."
                  className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
              >
                <option value="">All Statuses</option>
                <option value="paid">Paid</option>
                <option value="partially_paid">Partially Paid</option>
                <option value="pending">Pending</option>
                <option value="overdue">Overdue</option>
              </select>
            </div>

            <button
              onClick={handleExportCsv}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-700 font-semibold uppercase text-[11px]">
                <tr>
                  <th className="py-2.5 px-3">Student</th>
                  <th className="py-2.5 px-3">Program & Sem</th>
                  <th className="py-2.5 px-3">Total Assessed</th>
                  <th className="py-2.5 px-3">Net Payable</th>
                  <th className="py-2.5 px-3">Paid</th>
                  <th className="py-2.5 px-3">Balance</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">Loading fee records...</td>
                  </tr>
                ) : assessments.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">No student fee assessments found.</td>
                  </tr>
                ) : (
                  assessments.map((a) => (
                    <tr key={a.id} className="hover:bg-slate-50">
                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-900">{a.student?.first_name} {a.student?.last_name}</div>
                        <div className="text-[11px] font-mono text-indigo-600">{a.student?.student_id}</div>
                      </td>
                      <td className="py-3 px-3">
                        <div>{a.student?.course?.code || '-'}</div>
                        <div className="text-[11px] text-slate-400">{a.semester?.name}</div>
                      </td>
                      <td className="py-3 px-3 font-medium">${Number(a.total_amount).toLocaleString()}</td>
                      <td className="py-3 px-3 font-semibold text-slate-800">${Number(a.net_payable).toLocaleString()}</td>
                      <td className="py-3 px-3 text-emerald-600 font-bold">${Number(a.paid_amount).toLocaleString()}</td>
                      <td className="py-3 px-3 font-extrabold text-rose-600">${Number(a.balance_amount).toLocaleString()}</td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          a.status === 'paid' ? 'bg-emerald-50 text-emerald-700' : (a.status === 'partially_paid' ? 'bg-amber-50 text-amber-700' : 'bg-rose-50 text-rose-700')
                        }`}>
                          {a.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        {Number(a.balance_amount) > 0 ? (
                          <button
                            onClick={() => handleOpenPayment(a)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg font-semibold text-xs transition-colors"
                          >
                            <CreditCard className="w-3.5 h-3.5" />
                            Record Pay
                          </button>
                        ) : (
                          <span className="text-[11px] text-emerald-600 font-bold inline-flex items-center gap-1">
                            <CheckCircle className="w-3.5 h-3.5" /> Fully Settled
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: FEE STRUCTURES */}
      {activeTab === 'structures' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 space-y-4">
          <h3 className="text-sm font-bold text-slate-900">Standard Program Fee Structures</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-700 font-semibold uppercase text-[11px]">
                <tr>
                  <th className="py-2.5 px-3">Course</th>
                  <th className="py-2.5 px-3">Semester</th>
                  <th className="py-2.5 px-3">Tuition</th>
                  <th className="py-2.5 px-3">Lab Fee</th>
                  <th className="py-2.5 px-3">Library</th>
                  <th className="py-2.5 px-3">Examination</th>
                  <th className="py-2.5 px-3 font-bold text-slate-900">Total Amount</th>
                  <th className="py-2.5 px-3 text-right">Due Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {structures.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50">
                    <td className="py-3 px-3 font-semibold text-slate-900">{s.course?.name} ({s.course?.code})</td>
                    <td className="py-3 px-3">{s.semester?.name}</td>
                    <td className="py-3 px-3">${Number(s.tuition_fee).toLocaleString()}</td>
                    <td className="py-3 px-3">${Number(s.lab_fee).toLocaleString()}</td>
                    <td className="py-3 px-3">${Number(s.library_fee).toLocaleString()}</td>
                    <td className="py-3 px-3">${Number(s.exam_fee).toLocaleString()}</td>
                    <td className="py-3 px-3 font-bold text-slate-900">${Number(s.total_amount).toLocaleString()}</td>
                    <td className="py-3 px-3 text-right font-mono text-slate-500">{s.due_date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Record Fee Payment */}
      <Modal
        isOpen={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        title="Record Fee Payment"
        subtitle={`Student: ${selectedAssessment?.student?.first_name} ${selectedAssessment?.student?.last_name} (${selectedAssessment?.student?.student_id})`}
      >
        <form onSubmit={handleRecordPayment} className="space-y-4">
          <div className="p-3 bg-indigo-50/60 border border-indigo-100 rounded-xl text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-600">Total Net Payable:</span>
              <span className="font-semibold text-slate-900">${Number(selectedAssessment?.net_payable).toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Already Paid:</span>
              <span className="font-semibold text-emerald-700">${Number(selectedAssessment?.paid_amount).toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-rose-700 font-bold border-t border-indigo-100/80 pt-1">
              <span>Outstanding Balance:</span>
              <span>${Number(selectedAssessment?.balance_amount).toLocaleString()}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Amount ($) *</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                max={selectedAssessment?.balance_amount}
                required
                value={paymentForm.amount_paid}
                onChange={(e) => setPaymentForm(prev => ({ ...prev, amount_paid: e.target.value }))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Mode</label>
              <select
                value={paymentForm.payment_mode}
                onChange={(e) => setPaymentForm(prev => ({ ...prev, payment_mode: e.target.value }))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              >
                <option value="online">Online / NetBanking</option>
                <option value="bank_transfer">Bank Transfer / NEFT</option>
                <option value="upi">UPI</option>
                <option value="cash">Cash (Bursar Counter)</option>
                <option value="cheque">Demand Draft / Cheque</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Date</label>
              <input
                type="date"
                required
                value={paymentForm.payment_date}
                onChange={(e) => setPaymentForm(prev => ({ ...prev, payment_date: e.target.value }))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Transaction Ref / Cheque No.</label>
              <input
                type="text"
                value={paymentForm.transaction_ref}
                onChange={(e) => setPaymentForm(prev => ({ ...prev, transaction_ref: e.target.value }))}
                placeholder="TXN_12345"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Remarks</label>
            <input
              type="text"
              value={paymentForm.remarks}
              onChange={(e) => setPaymentForm(prev => ({ ...prev, remarks: e.target.value }))}
              placeholder="e.g. Semester installment payment"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setPaymentModalOpen(false)}
              className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white"
            >
              Confirm &amp; Generate Receipt
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Create Fee Structure */}
      <Modal
        isOpen={structureModalOpen}
        onClose={() => setStructureModalOpen(false)}
        title="Configure Program Fee Structure"
        subtitle="Define course and semester tuition fees and due dates"
      >
        <form onSubmit={handleCreateStructure} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Course Program *</label>
              <select
                required
                value={structureForm.course_id}
                onChange={(e) => setStructureForm(prev => ({ ...prev, course_id: e.target.value }))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              >
                <option value="">Select Course</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Semester *</label>
              <select
                required
                value={structureForm.semester_id}
                onChange={(e) => setStructureForm(prev => ({ ...prev, semester_id: e.target.value }))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              >
                <option value="">Select Semester</option>
                {semesters.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Tuition Fee</label>
              <input
                type="number"
                value={structureForm.tuition_fee}
                onChange={(e) => setStructureForm(prev => ({ ...prev, tuition_fee: Number(e.target.value) }))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Lab Fee</label>
              <input
                type="number"
                value={structureForm.lab_fee}
                onChange={(e) => setStructureForm(prev => ({ ...prev, lab_fee: Number(e.target.value) }))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Library Fee</label>
              <input
                type="number"
                value={structureForm.library_fee}
                onChange={(e) => setStructureForm(prev => ({ ...prev, library_fee: Number(e.target.value) }))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Due Date</label>
              <input
                type="date"
                required
                value={structureForm.due_date}
                onChange={(e) => setStructureForm(prev => ({ ...prev, due_date: e.target.value }))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
              <input
                type="text"
                value={structureForm.category_name}
                onChange={(e) => setStructureForm(prev => ({ ...prev, category_name: e.target.value }))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setStructureModalOpen(false)}
              className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white"
            >
              Save Structure
            </button>
          </div>
        </form>
      </Modal>

      {/* Printable Receipt Modal */}
      {receiptData && (
        <Modal
          isOpen={!!receiptData}
          onClose={() => setReceiptData(null)}
          title="Official Fee Payment Receipt"
          subtitle={`Receipt #${receiptData.receipt_number}`}
          actions={
            <>
              <button
                onClick={() => setReceiptData(null)}
                className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600"
              >
                Close
              </button>
              <button
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white"
              >
                <Printer className="w-4 h-4" />
                Print Official Receipt
              </button>
            </>
          }
        >
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-4 print-card">
            {/* Header */}
            <div className="text-center pb-3 border-b border-slate-200">
              <h2 className="text-base font-bold text-slate-900 uppercase">CampusCore College of Engineering &amp; Technology</h2>
              <p className="text-[11px] text-slate-500">Official Bursar Office &amp; Financial Division</p>
              <div className="inline-block mt-1 font-mono font-bold text-xs bg-indigo-50 text-indigo-700 px-3 py-0.5 rounded-full border border-indigo-100">
                Receipt #{receiptData.receipt_number}
              </div>
            </div>

            {/* Student Info */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-slate-400">Student Name:</span>
                <div className="font-bold text-slate-900">{receiptData.student?.first_name} {receiptData.student?.last_name}</div>
              </div>
              <div>
                <span className="text-slate-400">Student ID / Roll:</span>
                <div className="font-mono font-bold text-slate-900">{receiptData.student?.student_id}</div>
              </div>
              <div>
                <span className="text-slate-400">Payment Date:</span>
                <div className="font-medium text-slate-800">{receiptData.payment_date}</div>
              </div>
              <div>
                <span className="text-slate-400">Payment Mode:</span>
                <div className="font-medium text-slate-800 uppercase">{receiptData.payment_mode}</div>
              </div>
            </div>

            {/* Breakdown */}
            <div className="border-t border-b border-slate-200 py-3 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span>Tuition &amp; Educational Dues</span>
                <span className="font-semibold">${Number(receiptData.amount_paid).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-500 text-[11px]">
                <span>Transaction Ref:</span>
                <span className="font-mono">{receiptData.transaction_ref}</span>
              </div>
            </div>

            {/* Total */}
            <div className="flex justify-between items-center text-sm font-bold text-slate-900 pt-1">
              <span>Amount Paid in Full / Part:</span>
              <span className="text-base text-emerald-600">${Number(receiptData.amount_paid).toLocaleString()}</span>
            </div>

            <div className="pt-4 text-center text-[10px] text-slate-400">
              This is a computer-generated receipt authorized by the Bursar Office.
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
