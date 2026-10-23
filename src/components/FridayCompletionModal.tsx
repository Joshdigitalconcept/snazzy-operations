import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ShieldCheck, CheckCircle2, AlertCircle, Clock, Archive, X, Sparkles, Send, FileCheck } from 'lucide-react';

interface FridayCompletionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FridayCompletionModal: React.FC<FridayCompletionModalProps> = ({ isOpen, onClose }) => {
  const { weeks, selectedWeekId, tasks, markFridayComplete, archiveWeek, currentUser } = useApp();
  const [fridayNote, setFridayNote] = useState('');
  const [shouldArchive, setShouldArchive] = useState(false);

  if (!isOpen) return null;

  const activeWeek = (weeks || []).find((w) => w.id === selectedWeekId) || weeks?.[0] || { id: '2026-08-W2', title: 'Current Week', startDate: '', endDate: '', status: 'active' };
  const weekTasks = (tasks || []).filter((t) => !t.archived && t.weekId === activeWeek.id);

  const completedTasks = weekTasks.filter((t) => t.status === 'Completed' || t.status === 'Approved');
  const inProgressTasks = weekTasks.filter((t) => t.status === 'In Progress' || t.status === 'Not Started');
  const blockedTasks = weekTasks.filter((t) => t.status === 'Blocked');
  const pendingApprovalTasks = weekTasks.filter((t) => t.status === 'Pending Approval' || t.status === 'Needs Revision');

  const completionRate = weekTasks.length > 0 ? Math.round((completedTasks.length / weekTasks.length) * 100) : 100;

  const handleSubmitSignOff = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeWeek?.id) {
      markFridayComplete(activeWeek.id, fridayNote.trim() || 'Friday completion signed off.');
      if (shouldArchive) {
        archiveWeek(activeWeek.id);
      }
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden text-xs">
        {/* Header */}
        <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <span>Friday Operational Sign-Off</span>
                <span className="text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-semibold">
                  {activeWeek.id}
                </span>
              </h3>
              <p className="text-xs text-slate-300 mt-0.5">
                Weekly completion review for {activeWeek.label}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmitSignOff} className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Status Indicator Banner */}
          {activeWeek.fridayCompleted ? (
            <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-850 rounded-xl flex items-start gap-3 text-emerald-900 dark:text-emerald-200">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold">Friday Sign-Off Already Completed!</div>
                <div className="text-xs text-emerald-700 dark:text-emerald-300 mt-0.5">
                  Signed off by {activeWeek.fridayCompletedBy || 'Management'} on{' '}
                  {activeWeek.fridayCompletedAt ? new Date(activeWeek.fridayCompletedAt).toLocaleDateString() : 'Friday'}.
                </div>
                {activeWeek.fridayNote && (
                  <div className="mt-1 text-xs italic bg-white/80 dark:bg-slate-800 p-2 rounded border border-emerald-200/60 dark:border-emerald-800 text-slate-800 dark:text-slate-200">
                    "{activeWeek.fridayNote}"
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="p-3.5 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-xl flex items-start gap-3 text-blue-900 dark:text-blue-200">
              <Sparkles className="w-5 h-5 text-[#005CBD] dark:text-blue-400 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold">Friday Review Ready</div>
                <div className="text-xs text-blue-700 dark:text-blue-300 mt-0.5">
                  Complete your weekly sign-off to finalize performance metrics and align team carryovers for next week.
                </div>
              </div>
            </div>
          )}

          {/* Weekly Metrics Summary Cards */}
          <div>
            <div className="font-bold text-slate-800 dark:text-white mb-2.5 flex items-center justify-between">
              <span>Weekly Completion Metrics</span>
              <span className="text-xs font-bold text-[#005CBD] dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2.5 py-1 rounded-full border border-blue-200 dark:border-blue-900/50">
                {completionRate}% Completion Rate
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-850 rounded-xl">
                <div className="text-xl font-extrabold text-emerald-700 dark:text-emerald-400">{completedTasks.length}</div>
                <div className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 mt-0.5">Completed</div>
              </div>

              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-850 rounded-xl">
                <div className="text-xl font-extrabold text-amber-700 dark:text-amber-400">{inProgressTasks.length}</div>
                <div className="text-[11px] font-bold text-amber-800 dark:text-amber-300 mt-0.5">In Progress</div>
              </div>

              <div className="p-3 bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-850 rounded-xl">
                <div className="text-xl font-extrabold text-purple-700 dark:text-purple-400">{pendingApprovalTasks.length}</div>
                <div className="text-[11px] font-bold text-purple-800 dark:text-purple-300 mt-0.5">Pending Review</div>
              </div>

              <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-850 rounded-xl">
                <div className="text-xl font-extrabold text-rose-700 dark:text-rose-400">{blockedTasks.length}</div>
                <div className="text-[11px] font-bold text-rose-800 dark:text-rose-300 mt-0.5">Blocked</div>
              </div>
            </div>
          </div>

          {/* Key Deliverables & Carryover Breakdown */}
          <div className="bg-slate-50 dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
            <div className="font-bold text-slate-800 dark:text-white flex items-center justify-between">
              <span>Task List Breakdown ({weekTasks.length} Tasks)</span>
              <span className="text-slate-500 dark:text-slate-400 font-normal">Week Cycle {activeWeek.id}</span>
            </div>
            <div className="max-h-36 overflow-y-auto divide-y divide-slate-200 dark:divide-slate-700 pr-1">
              {weekTasks.map((t) => (
                <div key={t.id} className="py-1.5 flex items-center justify-between gap-2 text-xs">
                  <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">{t.title}</span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                      t.status === 'Completed' || t.status === 'Approved'
                        ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                        : t.status === 'Blocked'
                        ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300'
                        : 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300'
                    }`}
                  >
                    {t.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Sign-off Note input */}
          <div>
            <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
              Friday Sign-Off Notes / Operational Summary
            </label>
            <textarea
              rows={3}
              placeholder="e.g. All critical infrastructure milestones met. 2 non-blocker marketing deliverables carried forward to next week."
              value={fridayNote}
              onChange={(e) => setFridayNote(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#005CBD]"
            />
          </div>

          {/* Option to Archive Week */}
          <div className="flex items-center gap-2 p-3 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
            <input
              type="checkbox"
              id="archiveWeekCheck"
              checked={shouldArchive}
              onChange={(e) => setShouldArchive(e.target.checked)}
              className="w-4 h-4 text-[#005CBD] rounded focus:ring-2 focus:ring-[#005CBD]"
            />
            <label htmlFor="archiveWeekCheck" className="font-bold text-slate-800 dark:text-slate-200 cursor-pointer flex items-center gap-1.5">
              <Archive className="w-4 h-4 text-slate-500 dark:text-slate-400" />
              <span>Archive this week upon completion (Move to Archived Weeks)</span>
            </label>
          </div>

          {/* Action buttons */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-semibold hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-md flex items-center gap-1.5"
            >
              <FileCheck className="w-4 h-4" />
              <span>Confirm Friday Sign-Off</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
