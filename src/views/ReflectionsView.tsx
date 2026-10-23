import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Sparkles, CheckCircle2, Clock, ShieldAlert, Plus, Filter, User } from 'lucide-react';

export const ReflectionsView: React.FC = () => {
  const { reflections, departments, currentUser, setIsReflectionModalOpen, activeWeek } = useApp();

  const [selectedDept, setSelectedDept] = useState('all');

  const safeReflections = reflections || [];
  const filteredReflections = safeReflections.filter((r) => {
    if (selectedDept !== 'all' && r.departmentId !== selectedDept) return false;
    return true;
  });

  const hasSubmittedCurrent = safeReflections.some(
    (r) => r.userId === currentUser?.id && r.weekId === activeWeek
  );

  return (
    <div className="p-3.5 sm:p-6 space-y-4 sm:space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 sm:p-5 rounded-2xl shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-[#ED8231]/15 dark:bg-[#ED8231]/25 text-[#AD5E1F] dark:text-[#ED8231] text-[10px] font-bold px-2 py-0.5 rounded border border-[#ED8231]/30">
              Weekly Governance
            </span>
            <span className="text-slate-400 dark:text-slate-500 text-xs">• Friday Reflections</span>
          </div>
          <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mt-1">Weekly Reflection Archive</h1>
        </div>

        <button
          onClick={() => setIsReflectionModalOpen(true)}
          className="bg-[#ED8231] hover:bg-[#AD5E1F] text-white px-4 py-2 rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all self-start md:self-auto"
        >
          <Sparkles className="w-4 h-4" />
          <span>{hasSubmittedCurrent ? 'View My Reflection' : 'Submit My Reflection'}</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3.5 sm:p-4 rounded-2xl shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 shrink-0">Filter Department:</label>
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="w-full sm:w-auto px-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded-xl text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#005CBD]"
          >
            <option value="all">All Departments</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>

        <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
          Showing {filteredReflections.length} reflections
        </span>
      </div>

      {/* Reflections Feed */}
      <div className="space-y-4">
        {filteredReflections.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center text-slate-400 dark:text-slate-500 text-xs space-y-2">
            <Sparkles className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
            <div className="font-bold text-slate-700 dark:text-slate-200">No reflections submitted for this criteria.</div>
            <p>Be the first team member to log your Friday reflection!</p>
          </div>
        ) : (
          filteredReflections.map((refl) => (
            <div
              key={refl.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-2xs space-y-4 hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
            >
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-3">
                  <img
                    src={
                      refl.userAvatar ||
                      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
                    }
                    alt={refl.userName}
                    className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-200 dark:ring-slate-700"
                  />
                  <div>
                    <div className="font-bold text-xs text-slate-900 dark:text-white">{refl.userName}</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      {refl.departmentName} • Cycle {refl.weekId}
                    </div>
                  </div>
                </div>

                <div className="text-[10px] text-slate-400 dark:text-slate-500">
                  Logged: {new Date(refl.submittedAt).toLocaleDateString()}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div className="space-y-1">
                  <div className="font-bold text-emerald-800 dark:text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    Completed
                  </div>
                  <p className="text-slate-700 dark:text-slate-200 leading-relaxed bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-lg border border-slate-200/60 dark:border-slate-700">
                    {refl.completedSummary}
                  </p>
                </div>

                <div className="space-y-1">
                  <div className="font-bold text-blue-800 dark:text-blue-400 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    Carrying Over
                  </div>
                  <p className="text-slate-700 dark:text-slate-200 leading-relaxed bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-lg border border-slate-200/60 dark:border-slate-700">
                    {refl.carryOverSummary || 'None.'}
                  </p>
                </div>

                <div className="space-y-1">
                  <div className="font-bold text-red-800 dark:text-red-400 flex items-center gap-1">
                    <ShieldAlert className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
                    Blockers
                  </div>
                  <p className="text-slate-700 dark:text-slate-200 leading-relaxed bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-lg border border-slate-200/60 dark:border-slate-700">
                    {refl.blockersSummary || 'None.'}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
