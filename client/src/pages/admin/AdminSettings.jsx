import { useState } from 'react';
import { Shield, KeyRound, User, Database, CheckCircle2, AlertTriangle, Lock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import api from '../../services/api';

export default function AdminSettings() {
  const { user } = useAuth();
  const toast = useToast();

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      return toast.error('New password and confirmation do not match');
    }
    if (passwordForm.newPassword.length < 8) {
      return toast.error('New password must be at least 8 characters long');
    }

    setSubmitting(true);
    try {
      const res = await api.post('/auth/change-password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });
      if (res.data.success) {
        toast.success('Administrator password updated successfully');
        setPasswordForm({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <h1 className="text-2xl font-bold text-slate-800">Administrator Profile & System Settings</h1>
        <p className="text-slate-500 text-sm mt-1">
          Manage your credentials, view system environment parameters, and audit system integrity.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Profile Card + System Status */}
        <div className="space-y-6">
          {/* Admin Profile Card */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 text-center">
            <div className="w-20 h-20 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center font-bold text-2xl mx-auto mb-4 border-4 border-indigo-50">
              {user?.username?.charAt(0).toUpperCase() || 'A'}
            </div>
            <h2 className="text-lg font-bold text-slate-800">{user?.username || 'Administrator'}</h2>
            <p className="text-xs text-slate-500 font-mono mt-0.5">{user?.email || 'admin@college.edu'}</p>
            <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700">
              <Shield className="w-3.5 h-3.5" />
              Super Administrator
            </div>

            <div className="mt-6 pt-5 border-t border-slate-100 text-left space-y-2.5 text-xs text-slate-600">
              <div className="flex justify-between">
                <span className="text-slate-400">Account Type:</span>
                <span className="font-semibold text-slate-700">Primary Seed Admin</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Authentication:</span>
                <span className="font-semibold text-slate-700">JWT + Bcrypt (12 rounds)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Permissions:</span>
                <span className="font-semibold text-emerald-600">Full RBAC Unrestricted</span>
              </div>
            </div>
          </div>

          {/* System Status Card */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <h3 className="font-semibold text-slate-800 text-sm mb-4 flex items-center gap-2">
              <Database className="w-4 h-4 text-indigo-600" />
              Environment & Compliance
            </h3>
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-2.5 bg-emerald-50 text-emerald-800 rounded-xl">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span className="font-medium">MySQL Database</span>
                </div>
                <span className="text-[11px] font-mono">sms_db (Port 3306)</span>
              </div>

              <div className="flex items-center justify-between p-2.5 bg-indigo-50 text-indigo-800 rounded-xl">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                  <span className="font-medium">Academic Year</span>
                </div>
                <span className="text-[11px] font-mono">2026 - 2027</span>
              </div>

              <div className="flex items-center justify-between p-2.5 bg-amber-50 text-amber-800 rounded-xl">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span className="font-medium">Min. Attendance Threshold</span>
                </div>
                <span className="text-[11px] font-bold">75.0% Mandatory</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Columns: Password & Security Policies */}
        <div className="lg:col-span-2 space-y-6">
          {/* Change Password Card */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <div className="flex items-center gap-2 mb-4">
              <KeyRound className="w-5 h-5 text-indigo-600" />
              <h2 className="text-lg font-bold text-slate-800">Update Administrator Password</h2>
            </div>
            <p className="text-xs text-slate-500 mb-6">
              Ensure your account uses a robust passphrase. Passwords are encrypted with salted bcrypt hashes.
            </p>

            <form onSubmit={handlePasswordChange} className="space-y-4 max-w-lg">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Current Password *
                </label>
                <input
                  type="password"
                  required
                  placeholder="Enter current password"
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  New Password *
                </label>
                <input
                  type="password"
                  required
                  placeholder="Minimum 8 characters"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Confirm New Password *
                </label>
                <input
                  type="password"
                  required
                  placeholder="Re-enter new password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition disabled:opacity-50 shadow-sm"
                >
                  {submitting ? 'Updating Password...' : 'Save New Password'}
                </button>
              </div>
            </form>
          </div>

          {/* Security Best Practices */}
          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
            <h3 className="font-semibold text-slate-800 text-sm mb-3 flex items-center gap-2">
              <Lock className="w-4 h-4 text-slate-600" />
              Security Architecture Overview
            </h3>
            <ul className="space-y-2 text-xs text-slate-600 list-disc list-inside">
              <li><strong>Zero Plaintext Storage:</strong> Passwords are never saved or returned in any REST responses.</li>
              <li><strong>Insecure Direct Object Reference (IDOR) Protection:</strong> Student records and financial assets are bounded by user identity tokens.</li>
              <li><strong>Audit Logging:</strong> Every state transition in academic marks, attendance changes, or fee collection records an audit entry with client IP and JSON diffs.</li>
              <li><strong>Brute Force Throttling:</strong> Sensitive authentication and password reset routes are limited via in-memory rate limiting.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
