import React from 'react';
import { useApp } from '../context/AppContext';
import { ShieldAlert, ArrowLeft, Lock, UserCheck } from 'lucide-react';

interface AccessDeniedViewProps {
  requiredRole?: string;
  screenName?: string;
}

export const AccessDeniedView: React.FC<AccessDeniedViewProps> = ({
  requiredRole = 'Administrator',
  screenName = 'Admin Operations Center',
}) => {
  const { currentUser, setActiveView } = useApp();

  return (
    <div className="p-4 sm:p-8 max-w-4xl mx-auto flex items-center justify-center min-h-[60vh]">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-10 shadow-lg text-center space-y-6 max-w-lg w-full animate-in fade-in zoom-in-95">
        <div className="w-16 h-16 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 flex items-center justify-center mx-auto ring-8 ring-amber-50 dark:ring-amber-950/30">
          <Lock className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 uppercase tracking-wider">
            <ShieldAlert className="w-3.5 h-3.5" />
            Screen Access Restricted
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
            Permission Required
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            You do not have authorization to view <strong>{screenName}</strong>. This operational screen is restricted to users with the <strong className="text-slate-900 dark:text-white">{requiredRole}</strong> role.
          </p>
        </div>

        {/* Current User Role Badge */}
        <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 text-xs text-left space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 dark:text-slate-400 font-medium">Logged-in User:</span>
            <span className="font-bold text-slate-800 dark:text-white">{currentUser.name}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500 dark:text-slate-400 font-medium">Your Current Role:</span>
            <span className="bg-blue-100 dark:bg-blue-950/60 text-[#005CBD] dark:text-blue-300 font-bold px-2.5 py-0.5 rounded capitalize text-[11px]">
              {currentUser.role.replace('_', ' ')}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500 dark:text-slate-400 font-medium">Required Role:</span>
            <span className="bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 font-bold px-2.5 py-0.5 rounded text-[11px]">
              {requiredRole}
            </span>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={() => setActiveView('dashboard')}
          className="w-full py-3 bg-[#005CBD] hover:bg-[#0051B8] text-white font-bold rounded-xl text-xs sm:text-sm transition-all flex items-center justify-center gap-2 shadow-md"
        >
          <ArrowLeft className="w-4 h-4" /> Return to Main Dashboard
        </button>
      </div>
    </div>
  );
};
