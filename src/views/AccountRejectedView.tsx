import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { SnazzyLogo } from '../components/SnazzyLogo';
import { XCircle, ShieldAlert, LogOut, RefreshCw, Send, CheckCircle2 } from 'lucide-react';

export const AccountRejectedView: React.FC = () => {
  const { currentUser, logout, approveRegistration, users, setCurrentUser } = useApp();
  const [appealSent, setAppealSent] = useState(false);
  const [appealText, setAppealText] = useState('');

  const handleSendAppeal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!appealText.trim()) return;
    setAppealSent(true);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background ambient glow */}
      <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/3 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg p-6 sm:p-8 text-center space-y-6 relative z-10 animate-in fade-in zoom-in-95">
        <SnazzyLogo size="lg" className="justify-center" />

        <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-300 flex items-center justify-center mx-auto ring-8 ring-red-50 dark:ring-red-950/30 shadow-inner">
          <XCircle className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <div className="inline-block bg-red-100 dark:bg-red-950/60 text-red-800 dark:text-red-300 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
            Account Inactive / Rejected
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Access Restricted</h2>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed max-w-md mx-auto">
            Hello <strong className="text-slate-900 dark:text-white">{currentUser.name || currentUser.email}</strong>, your account registration or operational access has been <strong>rejected or suspended</strong> by the System Administrator.
          </p>
        </div>

        {/* Status Card */}
        <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 text-xs text-slate-700 dark:text-slate-300 space-y-2 text-left">
          <div className="font-bold text-slate-800 dark:text-white flex items-center gap-1.5 border-b border-slate-200 dark:border-slate-700 pb-2">
            <ShieldAlert className="w-4 h-4 text-red-500" />
            Account Status Details
          </div>
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div>
              <span className="text-slate-400 dark:text-slate-500 block font-medium">Registered Email</span>
              <span className="font-semibold text-slate-900 dark:text-white truncate block">{currentUser.email}</span>
            </div>
            <div>
              <span className="text-slate-400 dark:text-slate-500 block font-medium">Account Status</span>
              <span className="font-bold text-red-600 dark:text-red-400 uppercase">Rejected</span>
            </div>
            <div className="col-span-2">
              <span className="text-slate-400 dark:text-slate-500 block font-medium">Assigned Role</span>
              <span className="font-semibold text-slate-900 dark:text-white capitalize">{currentUser.role?.replace('_', ' ')}</span>
            </div>
          </div>
        </div>

        {/* Appeal Form */}
        {!appealSent ? (
          <form onSubmit={handleSendAppeal} className="space-y-3 text-left">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Request Account Re-evaluation / Appeal
            </label>
            <textarea
              rows={2}
              value={appealText}
              onChange={(e) => setAppealText(e.target.value)}
              placeholder="Provide context or explanation to request admin reinstatement..."
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl text-xs focus:ring-2 focus:ring-[#005CBD] focus:bg-white dark:focus:bg-slate-800 resize-none"
            />
            <button
              type="submit"
              disabled={!appealText.trim()}
              className="w-full py-2 bg-[#005CBD] hover:bg-[#0051B8] disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-xs"
            >
              <Send className="w-3.5 h-3.5" /> Submit Reinstatement Request
            </button>
          </form>
        ) : (
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-850 text-emerald-800 dark:text-emerald-200 rounded-xl text-xs flex items-center justify-center gap-2 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            Reinstatement request sent to System Administrator for review.
          </div>
        )}

        {/* Action Controls */}
        <div className="pt-2 space-y-2">
          <button
            onClick={() => logout()}
            className="w-full py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all"
          >
            <LogOut className="w-4 h-4 text-slate-600 dark:text-slate-400" /> Sign Out & Return to Login
          </button>
        </div>
      </div>
    </div>
  );
};
