import React from 'react';
import { useApp } from '../context/AppContext';
import { SnazzyLogo } from '../components/SnazzyLogo';
import { Clock, ShieldAlert, CheckCircle2, UserCheck, RefreshCw, LogOut, Building2 } from 'lucide-react';

export const PendingApprovalView: React.FC = () => {
  const { currentUser, approveRegistration, logout, setCurrentUser, users, departments } = useApp();

  const userDeptNames = departments
    .filter((d) => (currentUser?.departmentIds || []).includes(d.id))
    .map((d) => d.name)
    .join(', ') || 'None specified';

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-[#005CBD]/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/3 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg p-8 text-center space-y-6 relative z-10">
        <SnazzyLogo size="lg" className="justify-center" />

        <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 flex items-center justify-center mx-auto ring-8 ring-amber-50 dark:ring-amber-950/30 shadow-inner">
          <Clock className="w-8 h-8 animate-pulse" />
        </div>

        <div className="space-y-2">
          <div className="inline-block bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
            Registration Under Review
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Account Approval Pending</h2>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed max-w-md mx-auto">
            Hello <strong className="text-slate-900 dark:text-white">{currentUser.name}</strong>! Your registration request for <strong className="text-slate-900 dark:text-white">{currentUser.email}</strong> has been submitted and is awaiting Technical Administrator review.
          </p>
        </div>

        {/* Submitted Details Card */}
        <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 text-xs text-slate-700 dark:text-slate-300 space-y-3 text-left">
          <div className="font-bold text-slate-800 dark:text-white flex items-center gap-1.5 border-b border-slate-200 dark:border-slate-700 pb-2">
            <UserCheck className="w-4 h-4 text-[#005CBD] dark:text-blue-400" />
            Submitted Registration Summary
          </div>
          <div className="grid grid-cols-2 gap-3 text-[11px]">
            <div>
              <span className="text-slate-400 dark:text-slate-500 block font-medium">Job Title</span>
              <span className="font-semibold text-slate-900 dark:text-white">{currentUser.title}</span>
            </div>
            <div>
              <span className="text-slate-400 dark:text-slate-500 block font-medium">Submission Date</span>
              <span className="font-semibold text-slate-900 dark:text-white">
                {new Date(currentUser.joinedDate).toLocaleDateString()}
              </span>
            </div>
            <div className="col-span-2">
              <span className="text-slate-400 dark:text-slate-500 block font-medium">Departments</span>
              <span className="font-semibold text-slate-900 dark:text-white flex items-center gap-1 mt-0.5">
                <Building2 className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                {userDeptNames}
              </span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="pt-2 space-y-3">
          <button
            onClick={() => {
              if (currentUser.registrationStatus === 'approved') {
                // If status is approved, page will re-render
              } else {
                alert('Your registration is currently under review by the Administrator. Please check back later.');
              }
            }}
            className="w-full py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all"
          >
            <RefreshCw className="w-4 h-4 text-slate-600 dark:text-slate-400" /> Refresh Approval Status
          </button>

          <button
            onClick={logout}
            className="w-full py-2.5 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all"
          >
            <LogOut className="w-4 h-4 text-slate-500 dark:text-slate-400" /> Sign Out & Return to Login
          </button>
        </div>
      </div>
    </div>
  );
};
