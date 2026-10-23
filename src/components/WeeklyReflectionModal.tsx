import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { X, Sparkles, CheckCircle2, Clock, ShieldAlert, Send } from 'lucide-react';

interface WeeklyReflectionModalProps {
  onClose: () => void;
}

export const WeeklyReflectionModal: React.FC<WeeklyReflectionModalProps> = ({ onClose }) => {
  const { currentUser, submitReflection, reflections, activeWeek } = useApp();

  const myReflection = (reflections || []).find(
    (r) => r.userId === currentUser?.id && r.weekId === activeWeek
  );

  const [completed, setCompleted] = useState(myReflection ? myReflection.completedSummary : '');
  const [carryOver, setCarryOver] = useState(myReflection ? myReflection.carryOverSummary : '');
  const [blockers, setBlockers] = useState(myReflection ? myReflection.blockersSummary : '');
  const [isSubmitted, setIsSubmitted] = useState(!!myReflection);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!completed.trim()) return;
    submitReflection(completed, carryOver, blockers);
    setIsSubmitted(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-[#00224D] to-[#005CBD] text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center font-bold text-[#ED8231]">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Friday Weekly Reflection</h3>
              <p className="text-xs text-blue-200">Cycle: {activeWeek} • Visibility: Team Leads & BizOps</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form or Submitted Display */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6 text-xs">
          {isSubmitted ? (
            <div className="space-y-4">
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center gap-3 text-emerald-900 dark:text-emerald-200 font-medium">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>Your reflection for week {activeWeek} has been logged and shared with leadership!</span>
              </div>

              <div className="space-y-4 pt-2">
                <div>
                  <h4 className="font-bold text-slate-800 dark:text-white flex items-center gap-1.5 mb-1 text-xs">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    1. What did you complete this week?
                  </h4>
                  <p className="p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 leading-relaxed">
                    {completed}
                  </p>
                </div>

                <div>
                  <h4 className="font-bold text-slate-800 dark:text-white flex items-center gap-1.5 mb-1 text-xs">
                    <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    2. What is carrying over into next week?
                  </h4>
                  <p className="p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 leading-relaxed">
                    {carryOver || 'None.'}
                  </p>
                </div>

                <div>
                  <h4 className="font-bold text-slate-800 dark:text-white flex items-center gap-1.5 mb-1 text-xs">
                    <ShieldAlert className="w-4 h-4 text-red-600 dark:text-red-400" />
                    3. What blockers did you experience?
                  </h4>
                  <p className="p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 leading-relaxed">
                    {blockers || 'None experienced.'}
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end">
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-[#005CBD] hover:bg-[#0051B8] text-white rounded-lg font-bold"
                >
                  Close Reflection
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  1. What did you complete this week? <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Summarize key tasks, deliverables, or milestones completed..."
                  value={completed}
                  onChange={(e) => setCompleted(e.target.value)}
                  className="w-full p-3 border border-slate-300 dark:border-slate-700 rounded-xl text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#005CBD]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  2. What is carrying over into next week?
                </label>
                <textarea
                  rows={2}
                  placeholder="Tasks in progress or scheduled to continue into next week..."
                  value={carryOver}
                  onChange={(e) => setCarryOver(e.target.value)}
                  className="w-full p-3 border border-slate-300 dark:border-slate-700 rounded-xl text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#005CBD]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1 flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-red-600 dark:text-red-400" />
                  3. What blockers did you experience?
                </label>
                <textarea
                  rows={2}
                  placeholder="Dependencies, technical hurdles, or resource constraints..."
                  value={blockers}
                  onChange={(e) => setBlockers(e.target.value)}
                  className="w-full p-3 border border-slate-300 dark:border-slate-700 rounded-xl text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#005CBD]"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-semibold hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#005CBD] hover:bg-[#0051B8] text-white rounded-lg font-bold shadow-sm flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" /> Submit Reflection
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
