import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Calendar, ChevronDown, CheckCircle2, Archive, Clock, Sparkles, Filter, ShieldCheck, ArrowRight } from 'lucide-react';
import { WeekPeriod } from '../types';

interface WeekSelectorProps {
  onOpenFridayModal?: () => void;
  compact?: boolean;
}

export const WeekSelector: React.FC<WeekSelectorProps> = ({ onOpenFridayModal, compact = false }) => {
  const {
    weeks,
    selectedWeekId,
    setSelectedWeekId,
    activeWeek,
    tasks,
    archiveWeek,
    unarchiveWeek,
    weekFilterOption,
    setWeekFilterOption,
  } = useApp();

  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentWeekObj = (weeks || []).find((w) => w.status === 'current') || weeks?.[0] || { id: '2026-08-W2', title: 'Current Week', startDate: '', endDate: '', status: 'active' };
  const previousWeekObj = (weeks || []).find((w) => w.status === 'previous');
  const archivedWeeksList = (weeks || []).filter((w) => w.status === 'archived');
  const activeSelectedWeek = (weeks || []).find((w) => w.id === selectedWeekId) || currentWeekObj;

  const getWeekTaskStats = (wId: string) => {
    const weekTasks = (tasks || []).filter((t) => !t.archived && t.weekId === wId);
    const completed = weekTasks.filter((t) => t.status === 'Completed' || t.status === 'Approved').length;
    return { total: weekTasks.length, completed };
  };

  const handleSelectWeek = (weekId: string, filterMode: 'current' | 'previous' | 'archived' | 'all' | string) => {
    setSelectedWeekId(weekId);
    setWeekFilterOption(filterMode as any);
    setIsOpen(false);
  };

  return (
    <div className="relative flex flex-wrap items-center gap-2.5" ref={dropdownRef}>
      {/* Quick Access Segmented Tabs */}
      {!compact && (
        <div className="inline-flex items-center gap-1 bg-slate-100/90 dark:bg-slate-800/90 p-1 rounded-xl text-xs font-semibold border border-slate-200/80 dark:border-slate-700/80">
          {/* Current Week Tab */}
          <button
            type="button"
            onClick={() => handleSelectWeek(currentWeekObj.id, 'current')}
            className={`px-3 py-1.5 rounded-lg transition-all inline-flex items-center gap-1.5 whitespace-nowrap ${
              weekFilterOption === 'current' && selectedWeekId === currentWeekObj.id
                ? 'bg-white dark:bg-slate-900 text-[#005CBD] dark:text-blue-400 font-bold shadow-2xs border border-slate-200/80 dark:border-slate-700'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-[#005CBD] dark:text-blue-400 shrink-0" />
            <span>Active Week</span>
            {currentWeekObj.fridayCompleted && (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            )}
          </button>

          {/* Previous Week Tab */}
          {previousWeekObj && (
            <button
              type="button"
              onClick={() => handleSelectWeek(previousWeekObj.id, 'previous')}
              className={`px-3 py-1.5 rounded-lg transition-all inline-flex items-center gap-1.5 whitespace-nowrap ${
                weekFilterOption === 'previous' && selectedWeekId === previousWeekObj.id
                  ? 'bg-white dark:bg-slate-900 text-[#005CBD] dark:text-blue-400 font-bold shadow-2xs border border-slate-200/80 dark:border-slate-700'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Clock className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 shrink-0" />
              <span>Past Tasks</span>
              {previousWeekObj.fridayCompleted && (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              )}
            </button>
          )}

          {/* All History Tab */}
          <button
            type="button"
            onClick={() => {
              setWeekFilterOption('all');
            }}
            className={`px-3 py-1.5 rounded-lg transition-all whitespace-nowrap ${
              weekFilterOption === 'all'
                ? 'bg-white dark:bg-slate-900 text-[#005CBD] dark:text-blue-400 font-bold shadow-2xs border border-slate-200/80 dark:border-slate-700'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            All History
          </button>
        </div>
      )}

      {/* Week Selector Dropdown Trigger */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="h-9 px-3.5 rounded-xl border border-slate-200/90 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/80 text-slate-800 dark:text-white text-xs font-bold shadow-2xs inline-flex items-center gap-2 transition-all"
      >
        <Calendar className="w-3.5 h-3.5 text-[#005CBD] dark:text-blue-400 shrink-0" />
        <span className="truncate max-w-[180px] sm:max-w-[220px]">
          {weekFilterOption === 'all'
            ? 'All Weeks (Combined)'
            : activeSelectedWeek
            ? activeSelectedWeek.label
            : 'Select Week'}
        </span>
        {activeSelectedWeek?.fridayCompleted && (
          <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" title="Friday Sign-off Completed" />
        )}
        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 dark:text-slate-500 transition-transform shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 sm:left-auto sm:right-0 mt-2 w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden z-50 text-xs">
          {/* Header */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <div className="font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-[#005CBD] dark:text-blue-400" />
              <span>Select Operational Week</span>
            </div>
            {onOpenFridayModal && (
              <button
                onClick={() => {
                  setIsOpen(false);
                  onOpenFridayModal();
                }}
                className="text-[11px] font-bold text-[#005CBD] dark:text-blue-400 hover:underline flex items-center gap-1"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Friday Sign-Off</span>
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 p-1.5">
            {/* Current Active Week Section */}
            <div className="py-1">
              <div className="px-2.5 py-1 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center justify-between">
                <span>Active Cycle</span>
                <span className="bg-blue-100 dark:bg-blue-900/60 text-[#005CBD] dark:text-blue-300 px-1.5 py-0.5 rounded text-[9px]">Current</span>
              </div>
              <button
                onClick={() => handleSelectWeek(currentWeekObj.id, 'current')}
                className={`w-full text-left p-2.5 rounded-xl transition-all flex items-center justify-between group ${
                  selectedWeekId === currentWeekObj.id && weekFilterOption !== 'all'
                    ? 'bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 font-bold text-[#005CBD] dark:text-blue-400'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200'
                }`}
              >
                <div>
                  <div className="flex items-center gap-1.5">
                    <span>{currentWeekObj.label}</span>
                    {currentWeekObj.fridayCompleted ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <span className="text-[10px] px-1.5 py-0.2 bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 rounded font-semibold">
                        Friday Open
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 font-normal mt-0.5">
                    {getWeekTaskStats(currentWeekObj.id).completed} / {getWeekTaskStats(currentWeekObj.id).total} tasks completed
                  </div>
                </div>
              </button>
            </div>

            {/* Previous Week Section */}
            {previousWeekObj && (
              <div className="py-1">
                <div className="px-2.5 py-1 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center justify-between">
                  <span>Previous Cycle</span>
                  <span className="bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-1.5 py-0.5 rounded text-[9px]">Previous</span>
                </div>
                <button
                  onClick={() => handleSelectWeek(previousWeekObj.id, 'previous')}
                  className={`w-full text-left p-2.5 rounded-xl transition-all flex items-center justify-between group ${
                    selectedWeekId === previousWeekObj.id && weekFilterOption !== 'all'
                      ? 'bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 font-bold text-[#005CBD] dark:text-blue-400'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span>{previousWeekObj.label}</span>
                      {previousWeekObj.fridayCompleted && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      )}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 font-normal mt-0.5">
                      {getWeekTaskStats(previousWeekObj.id).completed} / {getWeekTaskStats(previousWeekObj.id).total} tasks completed
                    </div>
                  </div>
                </button>
              </div>
            )}

            {/* Archived Weeks Section */}
            {archivedWeeksList.length > 0 && (
              <div className="py-1">
                <div className="px-2.5 py-1 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1">
                  <Archive className="w-3 h-3" />
                  <span>Archived Weeks ({archivedWeeksList.length})</span>
                </div>
                {archivedWeeksList.map((week) => {
                  const stats = getWeekTaskStats(week.id);
                  const isSelected = selectedWeekId === week.id && weekFilterOption !== 'all';
                  return (
                    <div key={week.id} className="flex items-center justify-between group">
                      <button
                        onClick={() => handleSelectWeek(week.id, 'archived')}
                        className={`flex-1 text-left p-2.5 rounded-xl transition-all ${
                          isSelected
                            ? 'bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 font-bold text-amber-900 dark:text-amber-300'
                            : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-1.5">
                          <Archive className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
                          <span>{week.label}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 font-normal mt-0.5 ml-5">
                          {stats.completed} / {stats.total} tasks • Archived
                        </div>
                      </button>
                      <button
                        onClick={() => unarchiveWeek(week.id)}
                        className="text-[10px] text-slate-400 dark:text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 mr-1"
                        title="Restore Week"
                      >
                        Restore
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* All History Option */}
            <div className="py-1 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => {
                  setWeekFilterOption('all');
                  setIsOpen(false);
                }}
                className={`w-full text-left p-2.5 rounded-xl transition-all flex items-center gap-2 ${
                  weekFilterOption === 'all'
                    ? 'bg-slate-100 dark:bg-slate-800 font-bold text-slate-900 dark:text-white'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                <Filter className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                <span>Show All Operational Weeks</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
