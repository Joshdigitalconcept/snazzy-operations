import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { TaskCard } from '../components/TaskCard';
import { FridayCompletionModal } from '../components/FridayCompletionModal';
import { Task, TaskPriority, TaskStatus, WeekPeriod } from '../types';
import { isTaskInActiveWeek, isPastTask } from '../utils/weekUtils';
import {
  Search,
  Plus,
  LayoutGrid,
  List,
  Calendar,
  X,
  RotateCcw,
  Building2,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  Users,
  User,
  CheckSquare,
  History,
  FolderArchive,
  ArrowRight,
  Filter,
} from 'lucide-react';

interface TasksViewProps {
  viewModeOverride?: 'active' | 'past';
}

export const TasksView: React.FC<TasksViewProps> = ({ viewModeOverride }) => {
  const {
    currentUser,
    tasks,
    departments,
    users,
    setIsCreateTaskOpen,
    setSelectedTaskId,
    activeWeek,
    weeks,
    activeView,
    setActiveView,
  } = useApp();

  const isPastMode = viewModeOverride ? viewModeOverride === 'past' : activeView === 'past_tasks';

  const [viewMode, setViewMode] = useState<'board' | 'list'>('board');
  const [isFridayModalOpen, setIsFridayModalOpen] = useState(false);

  // Uncluttered, straightforward filters
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('all');
  const [ownerFilter, setOwnerFilter] = useState('all');
  const [pastCycleFilter, setPastCycleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const safeWeeks = weeks || [];
  const currentWeekObj =
    safeWeeks.find((w) => w.status === 'current') ||
    safeWeeks.find((w) => w.id === activeWeek) ||
    safeWeeks[0] ||
    ({ id: activeWeek, label: `Active Week (${activeWeek})`, status: 'current', fridayCompleted: false } as WeekPeriod);

  // Past weeks list for past tasks filter dropdown
  const pastWeeks = safeWeeks.filter((w) => w.id !== activeWeek && w.status !== 'current');

  const safeTasks = tasks || [];

  // Active tasks for current week vs past tasks
  const allActiveWeekTasks = safeTasks.filter((t) => !t.archived && isTaskInActiveWeek(t, activeWeek));
  const allPastTasks = safeTasks.filter((t) => !t.archived && isPastTask(t, activeWeek));

  // Determine base task pool based on current screen
  const baseTasks = isPastMode ? allPastTasks : allActiveWeekTasks;

  // Apply clean department, user, search, and past cycle filters
  const filteredTasks = baseTasks.filter((t) => {
    // In Past Tasks screen, user can optionally filter by specific past cycle
    if (isPastMode && pastCycleFilter !== 'all') {
      if (t.weekId !== pastCycleFilter) return false;
    }

    // Department filter
    if (deptFilter !== 'all' && t.departmentId !== deptFilter) return false;

    // Owner filter (Default is 'all' = everyone's tasks)
    if (ownerFilter === 'my') {
      if (t.ownerId !== currentUser?.id) return false;
    } else if (ownerFilter !== 'all') {
      if (t.ownerId !== ownerFilter) return false;
    }

    // Status filter
    if (statusFilter !== 'all' && t.status !== statusFilter) return false;

    // Search query
    if (search.trim()) {
      const q = search.toLowerCase();
      const match =
        (t.title || '').toLowerCase().includes(q) ||
        (t.description || '').toLowerCase().includes(q) ||
        (t.ownerName || '').toLowerCase().includes(q) ||
        (t.departmentName || '').toLowerCase().includes(q) ||
        (t.objective || '').toLowerCase().includes(q);
      if (!match) return false;
    }

    return true;
  });

  // Sort by deadline
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
  });

  const isFilterActive =
    deptFilter !== 'all' ||
    ownerFilter !== 'all' ||
    statusFilter !== 'all' ||
    search.trim() !== '' ||
    (isPastMode && pastCycleFilter !== 'all');

  const handleResetFilters = () => {
    setDeptFilter('all');
    setOwnerFilter('all');
    setStatusFilter('all');
    setPastCycleFilter('all');
    setSearch('');
  };

  // Kanban Columns
  const statusColumns: TaskStatus[] = [
    'Not Started',
    'In Progress',
    'Blocked',
    'Needs Revision',
    'Pending Approval',
    'Approved',
  ];

  const getColumnTitle = (status: TaskStatus) => {
    switch (status) {
      case 'Approved':
        return 'Completed & Approved';
      case 'Pending Approval':
        return 'Waiting for Approval';
      case 'Needs Revision':
        return 'Needs Revision';
      default:
        return status;
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Header Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 p-5 sm:p-6 rounded-2xl shadow-xs space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          {/* Title & Context */}
          <div className="flex items-start sm:items-center gap-4">
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-2xs border ${
                isPastMode
                  ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-900/40 text-amber-600 dark:text-amber-400'
                  : 'bg-blue-50 dark:bg-blue-950/60 border-blue-100 dark:border-blue-900/40 text-[#005CBD] dark:text-blue-400'
              }`}
            >
              {isPastMode ? <History className="w-6 h-6" /> : <CheckSquare className="w-6 h-6" />}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                  {isPastMode ? 'Past Tasks Archive' : 'Active Tasks & Workflow'}
                </h1>
                <span
                  className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
                    isPastMode
                      ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300'
                      : 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800 text-[#005CBD] dark:text-blue-400'
                  }`}
                >
                  {isPastMode ? 'Historical Archive' : `Active Cycle: ${currentWeekObj.label || activeWeek}`}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                {isPastMode
                  ? "Showing everyone's tasks from previous operational weeks. Tasks expire after their week ends."
                  : "Showing everyone's active tasks for the current week. Use the department and member filters to focus."}
              </p>
            </div>
          </div>

          {/* Top Actions: Segmented View Switcher & Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {/* Direct Switcher Between Active & Past Tasks */}
            <div className="inline-flex items-center p-1 bg-slate-100 dark:bg-slate-800/90 rounded-xl border border-slate-200/80 dark:border-slate-700/80 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setActiveView('tasks')}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  !isPastMode
                    ? 'bg-white dark:bg-slate-900 text-[#005CBD] dark:text-blue-400 font-bold shadow-2xs border border-slate-200/80 dark:border-slate-700'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <CheckSquare className="w-3.5 h-3.5 shrink-0" />
                <span>Active Tasks</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-blue-50 dark:bg-blue-950/60 text-[#005CBD] dark:text-blue-400">
                  {allActiveWeekTasks.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveView('past_tasks')}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  isPastMode
                    ? 'bg-white dark:bg-slate-900 text-[#005CBD] dark:text-blue-400 font-bold shadow-2xs border border-slate-200/80 dark:border-slate-700'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <History className="w-3.5 h-3.5 shrink-0" />
                <span>Past Tasks</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                  {allPastTasks.length}
                </span>
              </button>
            </div>

            {/* Friday Sign-off Button (Only on Active Tasks view) */}
            {!isPastMode && (
              <button
                onClick={() => setIsFridayModalOpen(true)}
                className={`h-9 px-3.5 rounded-xl border text-xs font-bold shadow-2xs flex items-center gap-1.5 transition-all ${
                  currentWeekObj.fridayCompleted
                    ? 'border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/40'
                    : 'border-amber-300 dark:border-amber-800 bg-amber-50/70 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/30'
                }`}
              >
                <ShieldCheck
                  className={`w-4 h-4 ${
                    currentWeekObj.fridayCompleted
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-amber-600 dark:text-amber-400'
                  }`}
                />
                <span>{currentWeekObj.fridayCompleted ? 'Friday Signed Off' : 'Friday Sign-Off'}</span>
              </button>
            )}

            {/* New Task Button */}
            <button
              onClick={() => setIsCreateTaskOpen(true)}
              className="h-9 bg-[#005CBD] hover:bg-[#0051B8] text-white px-4 rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all active:scale-98"
            >
              <Plus className="w-4 h-4" />
              <span>New Task</span>
            </button>
          </div>
        </div>
      </div>

      {/* Spacious, Non-Clustered Filter Toolbar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 p-4 sm:p-5 rounded-2xl shadow-xs space-y-3.5">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          {/* Left Controls: Clean Filters */}
          <div className="flex flex-wrap items-center gap-3 flex-1">
            {/* Department Filter Dropdown */}
            <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-xl px-3 py-1.5 shadow-2xs">
              <Building2 className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0" />
              <label htmlFor="dept-filter-select" className="text-xs font-medium text-slate-500 dark:text-slate-400 shrink-0">
                Department:
              </label>
              <select
                id="dept-filter-select"
                value={deptFilter}
                onChange={(e) => setDeptFilter(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer pr-1"
              >
                <option value="all">All Departments</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Team Member / User Filter Dropdown */}
            <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-xl px-3 py-1.5 shadow-2xs">
              <Users className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0" />
              <label htmlFor="user-filter-select" className="text-xs font-medium text-slate-500 dark:text-slate-400 shrink-0">
                Assignee:
              </label>
              <select
                id="user-filter-select"
                value={ownerFilter}
                onChange={(e) => setOwnerFilter(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer pr-1"
              >
                <option value="all">Everyone's Tasks</option>
                <option value="my">Assigned to Me ({currentUser?.name})</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.title || u.role})
                  </option>
                ))}
              </select>
            </div>

            {/* Optional Past Cycle Filter (Only on Past Tasks screen) */}
            {isPastMode && pastWeeks.length > 0 && (
              <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-xl px-3 py-1.5 shadow-2xs">
                <Calendar className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0" />
                <label htmlFor="cycle-filter-select" className="text-xs font-medium text-slate-500 dark:text-slate-400 shrink-0">
                  Cycle:
                </label>
                <select
                  id="cycle-filter-select"
                  value={pastCycleFilter}
                  onChange={(e) => setPastCycleFilter(e.target.value)}
                  className="bg-transparent text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer pr-1"
                >
                  <option value="all">All Past Cycles</option>
                  {pastWeeks.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.label || w.id}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Keyword Search Input */}
            <div className="relative min-w-[200px] flex-1 max-w-sm">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
              <input
                type="text"
                placeholder="Search tasks or keywords..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#005CBD]"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Reset Filters Button */}
            {isFilterActive && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="h-8 px-3 rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 hover:bg-rose-100 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-2xs"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset Filters</span>
              </button>
            )}
          </div>

          {/* Right Controls: View Switcher (Kanban vs Table) & Active Results Count */}
          <div className="flex items-center justify-between lg:justify-end gap-3 pt-3 lg:pt-0 border-t border-slate-100 dark:border-slate-800 lg:border-t-0 shrink-0">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Showing <strong className="text-slate-900 dark:text-white font-bold">{sortedTasks.length}</strong> tasks
            </span>

            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-semibold border border-slate-200/80 dark:border-slate-700/80">
              <button
                type="button"
                onClick={() => setViewMode('board')}
                className={`px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                  viewMode === 'board'
                    ? 'bg-white dark:bg-slate-700 text-[#005CBD] dark:text-blue-400 shadow-2xs font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
                title="Kanban Board View"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Board</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                  viewMode === 'list'
                    ? 'bg-white dark:bg-slate-700 text-[#005CBD] dark:text-blue-400 shadow-2xs font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
                title="Interactive Table View"
              >
                <List className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Table</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Task View Content */}
      {viewMode === 'board' ? (
        /* Kanban Board View - Fully responsive horizontal scrolling track */
        <div className="flex gap-4 overflow-x-auto pb-4 items-start snap-x no-scrollbar sm:scroll-auto">
          {statusColumns.map((colStatus) => {
            const colTasks = sortedTasks.filter((t) => t.status === colStatus);

            return (
              <div
                key={colStatus}
                className="bg-slate-100/70 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-3.5 flex flex-col gap-3 w-[280px] sm:w-[310px] shrink-0 snap-start shadow-2xs"
              >
                <div className="flex items-center justify-between px-1">
                  <h3 className="font-bold text-xs text-slate-800 dark:text-white flex items-center gap-1.5 truncate">
                    <span className="truncate">{getColumnTitle(colStatus)}</span>
                  </h3>
                  <span className="bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0">
                    {colTasks.length}
                  </span>
                </div>

                <div className="space-y-3 flex-1">
                  {colTasks.length === 0 ? (
                    <div className="p-6 border-2 border-dashed border-slate-200/80 dark:border-slate-800 rounded-xl text-center text-[11px] text-slate-400 dark:text-slate-500">
                      No tasks in this stage
                    </div>
                  ) : (
                    colTasks.map((task) => <TaskCard key={task.id} task={task} />)
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table / List View */
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-4">Task Title & Objective</th>
                  <th className="p-4">Department</th>
                  <th className="p-4">Owner</th>
                  <th className="p-4">Priority</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Progress</th>
                  <th className="p-4">Deadline</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {sortedTasks.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-400 dark:text-slate-500">
                      {isFilterActive
                        ? 'No tasks match your selected filter criteria. Try resetting filters.'
                        : isPastMode
                        ? 'No past tasks in the archive.'
                        : 'No active tasks found for the current operational cycle.'}
                    </td>
                  </tr>
                ) : (
                  sortedTasks.map((task) => (
                    <tr
                      key={task.id}
                      onClick={() => setSelectedTaskId(task.id)}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
                    >
                      <td className="p-4">
                        <div className="font-bold text-slate-900 dark:text-white hover:text-[#005CBD] dark:hover:text-blue-400">
                          {task.title}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                          {task.objective}
                        </div>
                      </td>
                      <td className="p-4 font-semibold text-slate-700 dark:text-slate-300">{task.departmentName}</td>
                      <td className="p-4 font-semibold text-slate-800 dark:text-slate-200">{task.ownerName}</td>
                      <td className="p-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                          {task.priority}
                        </span>
                      </td>
                      <td className="p-4 font-bold text-slate-800 dark:text-slate-200">{task.status}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                            <div
                              className="bg-[#005CBD] h-full rounded-full"
                              style={{ width: `${task.progressPercent}%` }}
                            />
                          </div>
                          <span className="font-mono text-[11px] text-slate-600 dark:text-slate-400">
                            {task.progressPercent}%
                          </span>
                        </div>
                      </td>
                      <td className="p-4 font-mono text-slate-600 dark:text-slate-400">{task.deadline}</td>
                      <td className="p-4 text-right">
                        <button className="text-[#005CBD] dark:text-blue-400 hover:underline font-bold text-xs">
                          Inspect
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Friday Completion Modal */}
      <FridayCompletionModal
        isOpen={isFridayModalOpen}
        onClose={() => setIsFridayModalOpen(false)}
      />
    </div>
  );
};
