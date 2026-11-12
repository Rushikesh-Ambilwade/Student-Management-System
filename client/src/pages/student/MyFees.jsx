import { useState, useEffect } from 'react';
import {
  CreditCard,
  DollarSign,
  Calendar,
  CheckCircle2,
  Clock,
  Printer,
  FileText,
  School,
  AlertCircle
} from 'lucide-react';
import Modal from '../../components/Modal';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';

export default function MyFees() {
  const { user } = useAuth();
  const [feesData, setFeesData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);
  const [activeReceipt, setActiveReceipt] = useState(null);
  const toast = useToast();

  const studentId = user?.studentProfile?.id;

  const fetchFees = async () => {
    if (!studentId) return;
    setLoading(true);
    try {
      const res = await api.get(`/fees/student/${studentId}`);
      if (res.data.success) {
        setFeesData(res.data);
      }
    } catch {
      toast.error('Failed to load fee records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFees();
  }, [studentId]);

  const handleOpenReceipt = (payment) => {
    setActiveReceipt(payment);
    setReceiptModalOpen(true);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        <p className="mt-3 text-xs text-slate-500 font-medium">Loading fee statement...</p>
      </div>
    );
  }

  const student = feesData?.student || user?.studentProfile || {};
  const summary = feesData?.summary || {
    totalAssessed: '0.00',
    totalPaid: '0.00',
    totalBalance: '0.00',
    overallStatus: 'paid'
  };
  const assessments = feesData?.assessments || [];
  const payments = feesData?.payments || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">My College Fees & Payment Portal</h1>
          <p className="text-slate-500 text-sm mt-1">
            Review assessed tuition, scholarship deductions, recorded transactions, and printable payment receipts.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-4 py-2 rounded-xl text-xs font-bold uppercase border ${
            summary.overallStatus === 'paid' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
            summary.overallStatus === 'overdue' ? 'bg-rose-50 text-rose-800 border-rose-200' :
            'bg-amber-50 text-amber-800 border-amber-200'
          }`}>
            Status: {summary.overallStatus}
          </span>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Assessed</span>
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="my-3">
            <span className="text-2xl font-bold text-slate-800">${summary.totalAssessed}</span>
            <p className="text-xs text-slate-400 mt-1">Tuition, labs, and academic fees</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Amount Paid</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="my-3">
            <span className="text-2xl font-bold text-emerald-700">${summary.totalPaid}</span>
            <p className="text-xs text-slate-400 mt-1">Successfully recorded payments</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className={`text-xs font-semibold uppercase tracking-wider ${
              Number(summary.totalBalance) > 0 ? 'text-amber-600' : 'text-slate-500'
            }`}>
              Outstanding Balance
            </span>
            <div className={`p-2 rounded-xl ${Number(summary.totalBalance) > 0 ? 'bg-amber-50 text-amber-600' : 'bg-slate-50 text-slate-400'}`}>
              <CreditCard className="w-5 h-5" />
            </div>
          </div>
          <div className="my-3">
            <span className={`text-2xl font-bold ${Number(summary.totalBalance) > 0 ? 'text-amber-700' : 'text-slate-800'}`}>
              ${summary.totalBalance}
            </span>
            <p className="text-xs text-slate-400 mt-1">Remaining balance due</p>
          </div>
        </div>
      </div>

      {/* Fee Structure Assessments */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-5 border-b border-slate-100">
          <h2 className="font-bold text-slate-800 text-base">Semester Fee Assessments</h2>
          <p className="text-xs text-slate-400 mt-0.5">Formal tuition breakdowns assessed by the college registrar.</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-700 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Semester</th>
                <th className="px-6 py-4">Due Date</th>
                <th className="px-6 py-4 text-right">Base Tuition</th>
                <th className="px-6 py-4 text-right">Scholarship/Discount</th>
                <th className="px-6 py-4 text-right">Net Payable</th>
                <th className="px-6 py-4 text-right">Paid Amount</th>
                <th className="px-6 py-4 text-right">Remaining Balance</th>
                <th className="px-6 py-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {assessments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-slate-400">
                    No fee assessments created for this academic year yet.
                  </td>
                </tr>
              ) : (
                assessments.map(a => (
                  <tr key={a.id} className="hover:bg-slate-50/50 transition">
                    <td className="px-6 py-4 font-semibold text-slate-800">
                      {a.semester?.name || 'Semester'}
                    </td>
                    <td className="px-6 py-4 text-slate-500 whitespace-nowrap">
                      {a.due_date ? new Date(a.due_date).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-6 py-4 text-right font-medium">
                      ${Number(a.gross_amount).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-right text-emerald-600 font-medium">
                      -${Number(a.discount_amount || 0).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-slate-800">
                      ${Number(a.net_payable).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-right text-emerald-700 font-bold">
                      ${Number(a.paid_amount).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-slate-900">
                      ${Number(a.balance_amount).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-center whitespace-nowrap">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${
                        a.status === 'paid' ? 'bg-emerald-100 text-emerald-800' :
                        a.status === 'overdue' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {a.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment History & Printable Receipts */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-5 border-b border-slate-100">
          <h2 className="font-bold text-slate-800 text-base">Recorded Payment History & Receipts</h2>
          <p className="text-xs text-slate-400 mt-0.5">Every validated transaction recorded with an official institutional receipt.</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-700 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Receipt Number</th>
                <th className="px-6 py-4">Payment Date</th>
                <th className="px-6 py-4">Mode</th>
                <th className="px-6 py-4">Transaction Reference</th>
                <th className="px-6 py-4 text-right">Amount Paid</th>
                <th className="px-6 py-4 text-center">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {payments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-400">
                    No payment transactions recorded yet.
                  </td>
                </tr>
              ) : (
                payments.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50/50 transition">
                    <td className="px-6 py-4 font-mono font-bold text-indigo-600 whitespace-nowrap">
                      {p.receipt_number}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-slate-600">
                      {new Date(p.payment_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 capitalize text-slate-700 font-medium">
                      {p.payment_mode?.replace('_', ' ')}
                    </td>
                    <td className="px-6 py-4 font-mono text-[11px] text-slate-500">
                      {p.transaction_ref || '—'}
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-emerald-700 text-sm">
                      ${Number(p.amount_paid).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-center whitespace-nowrap">
                      <button
                        onClick={() => handleOpenReceipt(p)}
                        className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-semibold transition"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        View Receipt
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Printable Receipt Modal */}
      <Modal
        isOpen={receiptModalOpen}
        onClose={() => setReceiptModalOpen(false)}
        title="Institutional Fee Receipt"
      >
        {activeReceipt && (
          <div className="space-y-6">
            <div className="border border-slate-300 rounded-2xl p-6 bg-white text-slate-800" id="printable-receipt">
              {/* Receipt Header */}
              <div className="text-center border-b border-slate-200 pb-4 mb-4">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <School className="w-6 h-6 text-indigo-600" />
                  <span className="font-extrabold text-base uppercase tracking-wider">CAMPUSCORE INSTITUTE</span>
                </div>
                <p className="text-[11px] text-slate-500 uppercase tracking-widest">Office of Accounts and Finance</p>
                <div className="mt-2 inline-block px-3 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                  OFFICIAL FEE PAYMENT RECEIPT
                </div>
              </div>

              {/* Receipt Meta */}
              <div className="grid grid-cols-2 gap-3 text-xs mb-4 p-3 bg-slate-50 rounded-xl">
                <div>
                  <span className="text-slate-400 block">Receipt No:</span>
                  <span className="font-mono font-bold text-indigo-600">{activeReceipt.receipt_number}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Date of Payment:</span>
                  <span className="font-semibold">{new Date(activeReceipt.payment_date).toLocaleDateString()}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Student Name:</span>
                  <span className="font-semibold">{student.name}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Student ID:</span>
                  <span className="font-mono font-semibold">{student.student_id}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Payment Mode:</span>
                  <span className="font-semibold capitalize">{activeReceipt.payment_mode?.replace('_', ' ')}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Txn Reference:</span>
                  <span className="font-mono text-[11px]">{activeReceipt.transaction_ref || 'N/A'}</span>
                </div>
              </div>

              {/* Amount Box */}
              <div className="border-t border-b border-slate-200 py-3 flex justify-between items-center text-sm">
                <span className="font-semibold text-slate-600">Total Amount Received:</span>
                <span className="text-xl font-black text-emerald-700">${Number(activeReceipt.amount_paid).toFixed(2)}</span>
              </div>

              {activeReceipt.remarks && (
                <p className="text-xs text-slate-500 mt-3 italic">
                  Note: {activeReceipt.remarks}
                </p>
              )}

              {/* Signatures */}
              <div className="grid grid-cols-2 gap-6 pt-8 text-center text-xs text-slate-600">
                <div>
                  <div className="border-t border-slate-400 pt-1 font-semibold">{activeReceipt.collected_by || 'Bursar'}</div>
                  <span className="text-[10px] text-slate-400">Cashier / Finance Desk</span>
                </div>
                <div>
                  <div className="border-t border-slate-400 pt-1 font-semibold">Authorized College Seal</div>
                  <span className="text-[10px] text-slate-400">CampusCore Accounts</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setReceiptModalOpen(false)}
                className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-50"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition"
              >
                <Printer className="w-4 h-4" />
                Print Receipt
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
