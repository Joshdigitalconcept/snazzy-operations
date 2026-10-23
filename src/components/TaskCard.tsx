import React from 'react';
import { useApp } from '../context/AppContext';
import { Task, TaskStatus } from '../types';
import { isPastTask } from '../utils/weekUtils';
import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  FileText,
  ShieldAlert,
  MessageSquare,
  History,
} from 'lucide-react';

interface TaskCardProps {
  task: Task;
  compact?: boolean;
}

export const TaskCard: React.FC<TaskCardProps> = ({ task, compact = false }) => {
  const { setSelectedTaskId, openTaskModal, getTaskComments, currentUser, activeWeek } = useApp();
  const commentCount = getTaskComments(task.id)?.length || 0;
  const isPast = isPastTask(task, activeWeek);

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'Critical':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 dark:bg-red-950/60 text-red-800 dark:text-red-300">Critical</span>;
      case 'High':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-orange-100 dark:bg-orange-950/60 text-orange-800 dark:text-orange-300">High</span>;
      case 'Medium':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300">Medium</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">Low</span>;
    }
  };

  const getStatusBadge = (status: TaskStatus) => {
    switch (status) {
      case 'Approved':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Completed & Approved
          </span>
        );
      case 'Pending Approval':
      case 'Completed':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 flex items-center gap-1">
            <Clock className="w-3 h-3" /> Waiting for Approval
          </span>
        );
      case 'Needs Revision':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" /> Needs Revision
          </span>
        );
      case 'In Progress':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 flex items-center gap-1">
            <Clock className="w-3 h-3" /> In Progress
          </span>
        );
      case 'Blocked':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 dark:bg-red-950/60 text-red-800 dark:text-red-300 flex items-center gap-1">
            <ShieldAlert className="w-3 h-3" /> Blocked
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
            Not Started
          </span>
        );
    }
  };

  if (compact) {
    return (
      <div
        onClick={() => setSelectedTaskId(task.id)}
        className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 rounded-xl shadow-2xs hover:shadow-md transition-all cursor-pointer group flex items-center justify-between"
      >
        <div className="flex items-center gap-3 min-w-0">
          <img
            src={
              task.ownerAvatar ||
              'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
            }
            alt={task.ownerName}
            className="w-7 h-7 rounded-full object-cover shrink-0 ring-1 ring-slate-200 dark:ring-slate-700"
          />
          <div className="min-w-0">
            <h4 className="font-semibold text-xs text-slate-900 dark:text-slate-100 group-hover:text-[#005CBD] dark:group-hover:text-blue-400 truncate">
              {task.title}
            </h4>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
              <span className="font-medium text-slate-700 dark:text-slate-300">{task.ownerName}</span>
              {task.ownerId === currentUser?.id && (
                <span className="px-1 py-0.2 rounded text-[9px] font-bold bg-blue-50 dark:bg-blue-950/60 text-[#005CBD] dark:text-blue-400 border border-blue-200/60 dark:border-blue-800">
                  You
                </span>
              )}
              <span>•</span>
              <span>{task.departmentName}</span>
              <span>•</span>
              <span>Deadline {task.deadline}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {isPast && (
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center gap-1">
              <History className="w-3 h-3" /> Past Task
            </span>
          )}
          {getStatusBadge(task.status)}
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={() => setSelectedTaskId(task.id)}
      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 rounded-xl p-4 shadow-2xs hover:shadow-md transition-all cursor-pointer group space-y-3 flex flex-col justify-between"
    >
      <div>
        {/* Top Badges */}
        <div className="flex flex-wrap items-center justify-between gap-1.5 mb-2">
          <div className="flex items-center gap-1.5 flex-wrap min-w-0">
            <span className="text-[10px] font-bold text-[#005CBD] dark:text-blue-400 uppercase tracking-wider bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded whitespace-nowrap">
              {task.departmentName}
            </span>
            {task.weekId && (
              <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700 whitespace-nowrap">
                {task.weekId}
              </span>
            )}
            {isPast && (
              <span className="text-[10px] font-bold text-amber-800 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/60 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-800 flex items-center gap-1 whitespace-nowrap">
                <History className="w-2.5 h-2.5" /> Past Task
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 flex-wrap shrink-0">
            {getPriorityBadge(task.priority)}
            {getStatusBadge(task.status)}
          </div>
        </div>

        {/* Title */}
        <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100 group-hover:text-[#005CBD] dark:group-hover:text-blue-400 line-clamp-2 leading-snug">
          {task.title}
        </h3>

        {/* Objective or Description snippet */}
        <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-1 leading-relaxed">
          {task.objective || task.description}
        </p>
      </div>

      {/* Progress Bar */}
      <div className="space-y-1 pt-1">
        <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 font-semibold">
          <span>Automated Progress</span>
          <span className="text-[#005CBD] dark:text-blue-400">{task.progressPercent}%</span>
        </div>
        <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
          <div
            className="bg-[#005CBD] h-full rounded-full transition-all"
            style={{ width: `${task.progressPercent}%` }}
          />
        </div>
      </div>

      {/* Footer Info */}
      <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-1.5 min-w-0">
          <img
            src={
              task.ownerAvatar ||
              'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
            }
            alt={task.ownerName}
            className="w-5 h-5 rounded-full object-cover ring-1 ring-slate-200 dark:ring-slate-700"
          />
          <span className="font-medium text-slate-700 dark:text-slate-300 truncate max-w-[85px]">{task.ownerName}</span>
          {task.ownerId === currentUser?.id && (
            <span className="px-1 py-0.2 rounded text-[9px] font-bold bg-blue-50 dark:bg-blue-950/60 text-[#005CBD] dark:text-blue-400 border border-blue-200/60 dark:border-blue-800">
              You
            </span>
          )}
        </div>

        <div className="flex items-center gap-2.5">
          {(task.deliverables || []).length > 0 && (
            <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400 font-medium">
              <FileText className="w-3 h-3 text-slate-400" />
              <span>{(task.deliverables || []).length}</span>
            </span>
          )}
          {commentCount > 0 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                openTaskModal(task.id, 'comments');
              }}
              className="flex items-center gap-1 text-slate-500 hover:text-[#005CBD] dark:text-slate-400 dark:hover:text-blue-400 font-medium hover:bg-slate-100 dark:hover:bg-slate-800 px-1.5 py-0.5 rounded transition-colors"
              title="Open discussion directly"
            >
              <MessageSquare className="w-3 h-3" />
              <span>{commentCount}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
