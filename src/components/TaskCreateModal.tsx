import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Task, TaskPriority } from '../types';
import {
  X,
  Plus,
  Info,
  Building2,
  Calendar,
  Check,
  Archive,
  Search,
  RotateCcw,
  Sparkles,
  Copy,
  Trash2,
  Layers,
  ChevronDown,
  ChevronUp,
  Lock,
} from 'lucide-react';

interface TaskCreateModalProps {
  onClose: () => void;
  initialMode?: 'create' | 'archive';
}

interface DraftTaskItem {
  draftId: string;
  title: string;
  deptId: string;
  priority: TaskPriority;
  startDate: string;
  deadline: string;
  objective: string;
  description: string;
  challengeDescription: string;
  supportNeeded: string[];
  templateLoadedFrom: string | null;
  collapsed?: boolean;
}

export const TaskCreateModal: React.FC<TaskCreateModalProps> = ({ onClose, initialMode = 'create' }) => {
  const { currentUser, departments, createTask, updateTask, activeWeek, weeks, tasks } = useApp();

  const isAdmin = currentUser?.role === 'admin';
  const isBizOpsDept = (departments || []).some(
    (d) =>
      ((currentUser?.departmentIds || []).includes(d.id) || (d.teamLeadIds || []).includes(currentUser?.id || '')) &&
      (d.id === 'dept-biz' || d.code?.toUpperCase() === 'BIZ' || d.name?.toLowerCase().includes('business operation'))
  );
  const isBizOps = currentUser?.role === 'business_ops' || isBizOpsDept;
  const canChangeDepartment = isAdmin || isBizOps;

  const safeDepts = (departments || []).filter((d) => !d.archived);
  const userDepts = safeDepts.filter((d) => (currentUser?.departmentIds || []).includes(d.id));
  const userAssignedDept = userDepts[0] || safeDepts[0] || { id: 'dept-biz', name: 'Business Operation', code: 'BIZ' };
  const fallbackDept = userAssignedDept;

  const currentWeekObj = (weeks || []).find((w) => w.id === activeWeek);
  const defaultStartDate = currentWeekObj ? currentWeekObj.startDate : new Date().toISOString().split('T')[0];
  const defaultDeadline = currentWeekObj
    ? currentWeekObj.endDate
    : new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0];

  const createEmptyDraftTask = (overrideDeptId?: string): DraftTaskItem => ({
    draftId: 'draft-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
    title: '',
    deptId: canChangeDepartment ? (overrideDeptId || userAssignedDept.id) : userAssignedDept.id,
    priority: 'Medium',
    startDate: defaultStartDate,
    deadline: defaultDeadline,
    objective: '',
    description: '',
    challengeDescription: '',
    supportNeeded: [],
    templateLoadedFrom: null,
    collapsed: false,
  });

  const [mode, setMode] = useState<'create' | 'archive'>(initialMode);
  const [archiveSearch, setArchiveSearch] = useState('');
  const [selectedArchiveIds, setSelectedArchiveIds] = useState<string[]>([]);
  const [draftTasks, setDraftTasks] = useState<DraftTaskItem[]>(() => [createEmptyDraftTask()]);
  const [activeTooltipId, setActiveTooltipId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // User's personal archived tasks
  const myArchivedTasks = (tasks || []).filter(
    (t) => t.archived && (t.ownerId === currentUser?.id || currentUser?.role === 'admin')
  );

  const filteredArchivedTasks = myArchivedTasks.filter((t) => {
    if (!archiveSearch.trim()) return true;
    const q = archiveSearch.toLowerCase();
    return (
      t.title.toLowerCase().includes(q) ||
      (t.objective || '').toLowerCase().includes(q) ||
      (t.departmentName || '').toLowerCase().includes(q) ||
      (t.description || '').toLowerCase().includes(q)
    );
  });

  const updateDraftTask = (draftId: string, updates: Partial<DraftTaskItem>) => {
    setDraftTasks((prev) =>
      prev.map((item) => (item.draftId === draftId ? { ...item, ...updates } : item))
    );
  };

  const handleAddAnotherTask = () => {
    const lastTask = draftTasks[draftTasks.length - 1];
    const nextDeptId = canChangeDepartment ? (lastTask?.deptId || userAssignedDept.id) : userAssignedDept.id;
    const nextDraft = createEmptyDraftTask(nextDeptId);
    setDraftTasks((prev) => [...prev, nextDraft]);
  };

  const handleDuplicateDraftTask = (item: DraftTaskItem) => {
    const duplicated: DraftTaskItem = {
      ...item,
      draftId: 'draft-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
      title: item.title ? `${item.title} (Copy)` : '',
      deptId: canChangeDepartment ? item.deptId : userAssignedDept.id,
      collapsed: false,
    };
    setDraftTasks((prev) => [...prev, duplicated]);
  };

  const handleRemoveDraftTask = (draftId: string) => {
    if (draftTasks.length <= 1) return;
    setDraftTasks((prev) => prev.filter((item) => item.draftId !== draftId));
  };

  const handleSupportToggle = (draftId: string, deptName: string) => {
    setDraftTasks((prev) =>
      prev.map((item) => {
        if (item.draftId !== draftId) return item;
        const exists = item.supportNeeded.includes(deptName);
        return {
          ...item,
          supportNeeded: exists
            ? item.supportNeeded.filter((d) => d !== deptName)
            : [...item.supportNeeded, deptName],
        };
      })
    );
  };

  const handleUseArchivedAsTemplate = (archivedTask: Task) => {
    const templateDraft: DraftTaskItem = {
      draftId: 'draft-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
      title: archivedTask.title || '',
      description: archivedTask.description || '',
      objective: archivedTask.objective || '',
      priority: archivedTask.priority || 'Medium',
      deptId: canChangeDepartment ? (archivedTask.departmentId || userAssignedDept.id) : userAssignedDept.id,
      startDate: defaultStartDate,
      deadline: defaultDeadline,
      challengeDescription: archivedTask.challengeDescription || '',
      supportNeeded: archivedTask.supportNeeded || [],
      templateLoadedFrom: archivedTask.title,
      collapsed: false,
    };

    // If there is only 1 draft task and it is currently blank, replace it; otherwise append to the list
    if (
      draftTasks.length === 1 &&
      !draftTasks[0].title.trim() &&
      !draftTasks[0].objective.trim() &&
      !draftTasks[0].description.trim()
    ) {
      setDraftTasks([templateDraft]);
    } else {
      setDraftTasks((prev) => [...prev, templateDraft]);
    }
    setMode('create');
  };

  const handleRestoreArchivedDirectly = async (archivedTask: Task) => {
    await updateTask(archivedTask.id, {
      archived: false,
      weekId: activeWeek,
      status: 'Not Started',
      progressPercent: 0,
      deadline: defaultDeadline,
    });
    onClose();
  };

  const toggleSelectArchived = (taskId: string) => {
    setSelectedArchiveIds((prev) =>
      prev.includes(taskId) ? prev.filter((id) => id !== taskId) : [...prev, taskId]
    );
  };

  const handleRestoreSelectedArchived = async () => {
    if (selectedArchiveIds.length === 0) return;
    setIsSubmitting(true);
    try {
      for (const taskId of selectedArchiveIds) {
        const archivedTask = myArchivedTasks.find((t) => t.id === taskId);
        if (archivedTask) {
          await updateTask(archivedTask.id, {
            archived: false,
            weekId: activeWeek,
            status: 'Not Started',
            progressPercent: 0,
            deadline: defaultDeadline,
          });
        }
      }
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validDrafts = draftTasks.filter((d) => d.title.trim().length > 0);
    if (validDrafts.length === 0 || isSubmitting) return;

    setIsSubmitting(true);
    try {
      for (const item of validDrafts) {
        const targetDeptId = canChangeDepartment ? item.deptId : userAssignedDept.id;
        const itemDept = safeDepts.find((d) => d.id === targetDeptId) || userAssignedDept;
        await createTask({
          title: item.title.trim(),
          description: item.description.trim(),
          objective: item.objective.trim(),
          departmentId: itemDept.id,
          departmentName: itemDept.name,
          weekId: activeWeek,
          priority: item.priority,
          startDate: item.startDate,
          deadline: item.deadline,
          status: 'Not Started',
          progressPercent: 0,
          challengeCategory: item.challengeDescription.trim() ? 'Technical' : 'None',
          challengeDescription: item.challengeDescription.trim(),
          supportNeeded: item.supportNeeded,
        });
      }
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const primaryDept = safeDepts.find((d) => d.id === draftTasks[0]?.deptId) || fallbackDept;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-850 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#005CBD] text-white flex items-center justify-center font-bold shadow-xs">
              {mode === 'archive' ? (
                <Archive className="w-5 h-5" />
              ) : draftTasks.length > 1 ? (
                <Layers className="w-5 h-5" />
              ) : (
                <Plus className="w-5 h-5" />
              )}
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white flex items-center gap-2">
                <span>
                  {mode === 'archive'
                    ? 'Select Tasks from Archive'
                    : draftTasks.length > 1
                    ? `Create Weekly Operational Tasks (${draftTasks.length})`
                    : 'Create Weekly Operational Task'}
                </span>
              </h3>
              <div className="flex flex-wrap items-center gap-2 mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                <span className="inline-flex items-center gap-1 font-medium text-slate-700 dark:text-slate-200 bg-slate-200/70 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                  <Building2 className="w-3 h-3 text-slate-500 dark:text-slate-400" />
                  {primaryDept ? primaryDept.name : 'Your Department'}
                </span>
                <span className="text-slate-300 dark:text-slate-600">•</span>
                <span className="inline-flex items-center gap-1 font-semibold text-[#005CBD] dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-md border border-blue-100 dark:border-blue-900/50">
                  <Calendar className="w-3 h-3 text-[#005CBD] dark:text-blue-400" />
                  Cycle: {activeWeek}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 rounded-xl transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Source Mode Tabs: New Task(s) vs From My Archive */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 sm:px-6 pt-3 pb-2 border-b border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setMode('create')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                mode === 'create'
                  ? 'bg-[#005CBD] text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Task{draftTasks.length > 1 ? `s (${draftTasks.length})` : ''}</span>
            </button>

            <button
              type="button"
              onClick={() => setMode('archive')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                mode === 'archive'
                  ? 'bg-[#005CBD] text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <Archive className="w-3.5 h-3.5" />
              <span>Add from My Archive</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  mode === 'archive'
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                {myArchivedTasks.length}
              </span>
            </button>
          </div>

          {mode === 'create' && (
            <button
              type="button"
              onClick={handleAddAnotherTask}
              className="px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-[#005CBD] dark:text-blue-400 border border-blue-200/80 dark:border-blue-800/70 text-xs font-bold inline-flex items-center gap-1.5 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Another Task</span>
            </button>
          )}
        </div>

        {/* MODE 1: ARCHIVE SELECTION */}
        {mode === 'archive' ? (
          <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4 text-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search your archived tasks by title, objective, or department..."
                  value={archiveSearch}
                  onChange={(e) => setArchiveSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#005CBD]"
                />
              </div>
              {selectedArchiveIds.length > 0 && (
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleRestoreSelectedArchived}
                  className="px-3.5 py-2 rounded-xl bg-[#005CBD] hover:bg-[#0051B8] text-white font-bold text-xs inline-flex items-center justify-center gap-1.5 shadow-xs transition-all shrink-0"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Restore Selected ({selectedArchiveIds.length}) to Cycle</span>
                </button>
              )}
            </div>

            {filteredArchivedTasks.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 space-y-3">
                <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-950/60 text-[#005CBD] dark:text-blue-400 flex items-center justify-center mx-auto">
                  <Archive className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm">No Archived Tasks Found</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
                    {archiveSearch.trim()
                      ? 'No archived tasks matched your search query.'
                      : 'You do not have any archived tasks yet. When you archive completed or past deliverables, they are stored in your personal space so you can easily reuse or restore them anytime.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setMode('create')}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#005CBD] text-white font-bold rounded-xl text-xs shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Blank Task Instead</span>
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Select one or multiple archived tasks to restore directly to the current cycle ({activeWeek}) or add as templates to your task batch:
                </p>
                {filteredArchivedTasks.map((archivedTask) => {
                  const isChecked = selectedArchiveIds.includes(archivedTask.id);
                  return (
                    <div
                      key={archivedTask.id}
                      className={`p-3.5 sm:p-4 rounded-xl border transition-all space-y-2.5 shadow-2xs ${
                        isChecked
                          ? 'border-[#005CBD] bg-blue-50/30 dark:bg-blue-950/20'
                          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-start gap-2.5">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleSelectArchived(archivedTask.id)}
                            className="mt-1 rounded border-slate-300 text-[#005CBD] focus:ring-[#005CBD] cursor-pointer"
                          />
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">
                                {archivedTask.title}
                              </span>
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                                {archivedTask.priority}
                              </span>
                              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-50 dark:bg-blue-950/50 text-[#005CBD] dark:text-blue-400 border border-blue-100 dark:border-blue-900/40">
                                {archivedTask.departmentName}
                              </span>
                            </div>
                            {archivedTask.objective && (
                              <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                                {archivedTask.objective}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                          <button
                            type="button"
                            onClick={() => handleUseArchivedAsTemplate(archivedTask)}
                            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs flex items-center gap-1.5 transition-colors"
                            title="Add into the create form to modify and submit"
                          >
                            <Copy className="w-3.5 h-3.5 text-slate-500" />
                            <span>Add as Template</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleRestoreArchivedDirectly(archivedTask)}
                            className="px-3 py-1.5 rounded-xl bg-[#005CBD] hover:bg-[#0051B8] text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all"
                            title={`Restore directly into active cycle ${activeWeek}`}
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Restore to Cycle</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          /* MODE 2: CREATE TASK(S) FORM */
          <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-5 text-xs">
            <div className="space-y-5">
              {draftTasks.map((item, index) => {
                const itemDept = safeDepts.find((d) => d.id === item.deptId) || fallbackDept;
                const isMulti = draftTasks.length > 1;

                return (
                  <div
                    key={item.draftId}
                    className={`rounded-2xl transition-all ${
                      isMulti
                        ? 'border border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/20 p-4 space-y-4 shadow-2xs'
                        : 'space-y-4'
                    }`}
                  >
                    {/* Multi-Task Card Header */}
                    {isMulti && (
                      <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-slate-200/80 dark:border-slate-800">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="px-2.5 py-0.5 rounded-lg bg-[#005CBD] text-white font-bold text-[11px] shrink-0">
                            Task #{index + 1}
                          </span>
                          <span className="font-bold text-slate-800 dark:text-slate-200 truncate text-xs sm:text-sm">
                            {item.title.trim() || 'Untitled Task'}
                          </span>
                          <span className="text-[11px] text-slate-400 dark:text-slate-500 shrink-0 hidden sm:inline">
                            ({itemDept?.name})
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleDuplicateDraftTask(item)}
                            className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold text-[11px] inline-flex items-center gap-1 transition-colors"
                            title="Duplicate this task entry"
                          >
                            <Copy className="w-3 h-3" />
                            <span className="hidden sm:inline">Duplicate</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => updateDraftTask(item.draftId, { collapsed: !item.collapsed })}
                            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors"
                            title={item.collapsed ? 'Expand task details' : 'Collapse task details'}
                          >
                            {item.collapsed ? (
                              <ChevronDown className="w-3.5 h-3.5" />
                            ) : (
                              <ChevronUp className="w-3.5 h-3.5" />
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleRemoveDraftTask(item.draftId)}
                            className="p-1.5 rounded-lg border border-red-200 dark:border-red-900/50 bg-red-50/60 dark:bg-red-950/30 hover:bg-red-100 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 transition-colors"
                            title="Remove this task"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )}

                    {!item.collapsed && (
                      <div className="space-y-4">
                        {item.templateLoadedFrom && (
                          <div className="p-3 bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-900/60 rounded-xl flex items-center justify-between gap-2 text-xs text-[#005CBD] dark:text-blue-300 animate-in fade-in">
                            <div className="flex items-center gap-2">
                              <Sparkles className="w-4 h-4 shrink-0" />
                              <span>
                                Template prefilled from your archived task:{' '}
                                <strong>"{item.templateLoadedFrom}"</strong>
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => updateDraftTask(item.draftId, { templateLoadedFrom: null })}
                              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}

                        {/* Title */}
                        <div>
                          <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                            Task Title <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="Align with the business operation"
                            value={item.title}
                            onChange={(e) => updateDraftTask(item.draftId, { title: e.target.value })}
                            className="w-full px-3.5 py-2.5 border border-slate-300 dark:border-slate-700 rounded-xl text-xs sm:text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#005CBD] focus:border-transparent font-medium"
                          />
                        </div>

                        {/* Department Selection */}
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <label className="block font-bold text-slate-700 dark:text-slate-300">
                              Department
                            </label>
                            {!canChangeDepartment ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700">
                                <Lock className="w-3 h-3 text-slate-400" />
                                Locked to your department
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#005CBD] dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-md border border-blue-200 dark:border-blue-900/60">
                                <Building2 className="w-3 h-3" />
                                Admin / Business Operations
                              </span>
                            )}
                          </div>

                          {canChangeDepartment ? (
                            <select
                              value={item.deptId}
                              onChange={(e) => updateDraftTask(item.draftId, { deptId: e.target.value })}
                              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl text-xs bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-[#005CBD] font-semibold text-slate-800 dark:text-white"
                            >
                              {safeDepts.map((d) => {
                                const displayCode =
                                  d.name?.trim().toLowerCase() === 'community' ? 'Community' : d.code;
                                return (
                                  <option key={d.id} value={d.id}>
                                    {d.name} ({displayCode})
                                  </option>
                                );
                              })}
                            </select>
                          ) : (
                            <div className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-100/90 dark:bg-slate-800/80 text-slate-800 dark:text-slate-200 text-xs font-semibold flex items-center justify-between cursor-not-allowed">
                              <div className="flex items-center gap-2">
                                <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                <span>{itemDept?.name || userAssignedDept.name}</span>
                                <span className="text-[10px] text-slate-400 font-mono">
                                  ({itemDept?.code || userAssignedDept.code})
                                </span>
                              </div>
                              <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-700 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-600">
                                Fixed
                              </span>
                            </div>
                          )}
                          {!canChangeDepartment && (
                            <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">
                              Only Admin and Business Operations can change departments when creating tasks.
                            </p>
                          )}
                        </div>

                        {/* Planning Parameters: Priority, Start Date, Deadline Date */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                          <div>
                            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                              Priority Level
                            </label>
                            <select
                              value={item.priority}
                              onChange={(e) =>
                                updateDraftTask(item.draftId, { priority: e.target.value as TaskPriority })
                              }
                              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl text-xs bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-[#005CBD] font-semibold text-slate-800 dark:text-white"
                            >
                              <option value="Low">Low</option>
                              <option value="Medium">Medium</option>
                              <option value="High">High</option>
                              <option value="Critical">Critical</option>
                            </select>
                          </div>

                          <div>
                            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                              Start Date
                            </label>
                            <input
                              type="date"
                              value={item.startDate}
                              onChange={(e) => updateDraftTask(item.draftId, { startDate: e.target.value })}
                              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl text-xs bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-[#005CBD] font-medium text-slate-800 dark:text-white"
                            />
                          </div>

                          <div>
                            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                              Deadline Date <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="date"
                              required
                              value={item.deadline}
                              onChange={(e) => updateDraftTask(item.draftId, { deadline: e.target.value })}
                              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl text-xs bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-[#005CBD] font-medium text-slate-800 dark:text-white"
                            />
                          </div>
                        </div>

                        {/* Objective */}
                        <div>
                          <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                            Core Objective
                          </label>
                          <input
                            type="text"
                            placeholder="What target or operational outcome does this task accomplish?"
                            value={item.objective}
                            onChange={(e) => updateDraftTask(item.draftId, { objective: e.target.value })}
                            className="w-full px-3.5 py-2 border border-slate-300 dark:border-slate-700 rounded-xl text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#005CBD]"
                          />
                        </div>

                        {/* Detailed Description */}
                        <div>
                          <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                            Detailed Description
                          </label>
                          <textarea
                            rows={2}
                            placeholder="Provide context, technical specifications, or relevant links..."
                            value={item.description}
                            onChange={(e) => updateDraftTask(item.draftId, { description: e.target.value })}
                            className="w-full px-3.5 py-2 border border-slate-300 dark:border-slate-700 rounded-xl text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#005CBD] leading-relaxed"
                          />
                        </div>

                        {/* Challenge / Blocker Textbox with Info Tooltip */}
                        <div className="bg-amber-50/40 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/50 rounded-xl p-3.5 space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <label
                                htmlFor={`challenge-textbox-${item.draftId}`}
                                className="font-bold text-slate-800 dark:text-amber-200 text-xs cursor-pointer"
                              >
                                Challenges / Blockers{' '}
                                <span className="font-normal text-slate-400 dark:text-slate-500">
                                  (Optional)
                                </span>
                              </label>
                              {/* Info icon with hover / click tooltip */}
                              <div className="relative inline-flex items-center">
                                <button
                                  type="button"
                                  onMouseEnter={() => setActiveTooltipId(item.draftId)}
                                  onMouseLeave={() => setActiveTooltipId(null)}
                                  onClick={() =>
                                    setActiveTooltipId(
                                      activeTooltipId === item.draftId ? null : item.draftId
                                    )
                                  }
                                  className="p-0.5 text-slate-400 hover:text-[#005CBD] dark:hover:text-blue-400 rounded-full transition-colors focus:outline-none"
                                  aria-label="Challenge field explanation"
                                >
                                  <Info className="w-3.5 h-3.5" />
                                </button>

                                {activeTooltipId === item.draftId && (
                                  <div className="absolute left-6 -top-2 z-50 w-64 p-2.5 bg-slate-900 border border-slate-700 text-white text-[11px] rounded-lg shadow-xl leading-snug animate-in fade-in">
                                    <p className="font-medium">
                                      Describe any obstacles, cross-team dependencies, technical roadblocks, or staffing constraints that might delay or impact this task.
                                    </p>
                                    <div className="absolute -left-1 top-3 w-2 h-2 bg-slate-900 rotate-45 border-l border-b border-slate-700" />
                                  </div>
                                )}
                              </div>
                            </div>
                            <span className="text-[11px] text-amber-700 dark:text-amber-300 font-medium hidden sm:inline">
                              Visible in operational tracking
                            </span>
                          </div>

                          <textarea
                            id={`challenge-textbox-${item.draftId}`}
                            rows={2}
                            placeholder="e.g. Waiting on API credentials from external vendor, or high server latency under load..."
                            value={item.challengeDescription}
                            onChange={(e) =>
                              updateDraftTask(item.draftId, { challengeDescription: e.target.value })
                            }
                            className="w-full px-3 py-2 border border-amber-200 dark:border-amber-900/60 rounded-lg text-xs bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/50 leading-relaxed text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
                          />
                        </div>

                        {/* Cross Department Support Needed */}
                        <div>
                          <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                            Request Cross-Departmental Support{' '}
                            <span className="font-normal text-slate-400 dark:text-slate-500">
                              (Optional)
                            </span>
                          </label>
                          <div className="flex flex-wrap gap-2">
                            {departments
                              .filter((d) => !d.archived)
                              .map((dept) => {
                                const isSelected = item.supportNeeded.includes(dept.name);
                                return (
                                  <button
                                    key={dept.id}
                                    type="button"
                                    onClick={() => handleSupportToggle(item.draftId, dept.name)}
                                    className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all inline-flex items-center gap-1.5 ${
                                      isSelected
                                        ? 'bg-amber-100 dark:bg-amber-950/60 border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 shadow-2xs'
                                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-750'
                                    }`}
                                  >
                                    {isSelected ? (
                                      <Check className="w-3 h-3 text-amber-700 dark:text-amber-300 shrink-0" />
                                    ) : (
                                      <Plus className="w-3 h-3 text-slate-400 dark:text-slate-500 shrink-0" />
                                    )}
                                    <span>{dept.name}</span>
                                  </button>
                                );
                              })}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Add Another Task Button Banner */}
            <div className="pt-1">
              <button
                type="button"
                onClick={handleAddAnotherTask}
                className="w-full py-2.5 px-4 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-[#005CBD] dark:hover:border-blue-500 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-blue-50/40 dark:hover:bg-blue-950/30 text-slate-700 dark:text-slate-300 hover:text-[#005CBD] dark:hover:text-blue-400 font-bold text-xs flex items-center justify-center gap-2 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Add Another Task to Batch</span>
              </button>
            </div>

            {/* Footer Actions */}
            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 w-full sm:w-auto">
                <span>Timeline:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{activeWeek}</span>
                <span className="text-slate-300 dark:text-slate-600">|</span>
                <span className="text-slate-600 dark:text-slate-300">
                  {draftTasks.length === 1
                    ? primaryDept?.name
                    : `${draftTasks.length} tasks ready`}
                </span>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex-1 sm:flex-none"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-[#005CBD] hover:bg-[#0051B8] disabled:opacity-50 text-white rounded-xl font-bold shadow-xs transition-all flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>
                    {isSubmitting
                      ? 'Creating...'
                      : draftTasks.length > 1
                      ? `Create ${draftTasks.length} Tasks`
                      : 'Create Task'}
                  </span>
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

