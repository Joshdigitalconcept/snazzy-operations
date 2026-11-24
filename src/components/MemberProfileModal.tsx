import React, { useEffect, useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  X,
  Mail,
  Calendar,
  Building2,
  Crown,
  CheckCircle2,
  Copy,
  Check,
  Briefcase,
  ArrowUpRight,
  Edit3,
  Clock,
} from 'lucide-react';

interface MemberProfileModalProps {
  userId: string;
  onClose: () => void;
}

export const MemberProfileModal: React.FC<MemberProfileModalProps> = ({ userId, onClose }) => {
  const {
    users,
    currentUser,
    departments,
    tasks,
    setSelectedTaskId,
    setIsUserProfileOpen,
  } = useApp();

  const [avatarError, setAvatarError] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);

  const member = useMemo(() => {
    const found = (users || []).find((u) => u.id === userId);
    if (found) return found;
    if (currentUser?.id === userId) return currentUser;
    return null;
  }, [users, currentUser, userId]);

  useEffect(() => {
    setAvatarError(false);
    setCopiedEmail(false);
  }, [userId]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!member) {
    return (
      <div
        onClick={onClose}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs"
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 w-full max-w-sm text-center space-y-3 shadow-2xl"
        >
          <p className="text-sm font-semibold text-slate-900 dark:text-white">
            Team member profile unavailable
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            This team member account could not be found.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl text-xs font-semibold"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  const isSelf = member.id === currentUser?.id;

  const memberDepts = (departments || []).filter((d) =>
    (member.departmentIds || []).includes(d.id)
  );
  const leadDepts = (departments || []).filter((d) =>
    (d.teamLeadIds || []).includes(member.id)
  );

  const memberTasks = (tasks || []).filter(
    (t) => !t.archived && t.ownerId === member.id
  );
  const approvedTasks = memberTasks.filter((t) => t.status === 'Approved');
  const activeTasks = memberTasks.filter((t) => t.status !== 'Approved');
  const deliverablesCount = memberTasks.reduce(
    (sum, t) => sum + (Array.isArray(t.deliverables) ? t.deliverables.length : 0),
    0
  );
  const completionRate =
    memberTasks.length > 0
      ? Math.round((approvedTasks.length / memberTasks.length) * 100)
      : 0;

  const roleLabel =
    member.role === 'admin'
      ? 'Technical Admin'
      : member.role === 'business_ops'
      ? 'Business Operations'
      : 'Team Member';

  const initials = (member.name || 'TM')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() || '')
    .join('');

  const joinedLabel = member.joinedDate
    ? new Date(member.joinedDate).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : 'Active member';

  const handleCopyEmail = async () => {
    if (!member.email) return;
    try {
      await navigator.clipboard.writeText(member.email);
      setCopiedEmail(true);
      setTimeout(() => setCopiedEmail(false), 2000);
    } catch {
      // ignore clipboard errors
    }
  };

  const handleOpenTask = (taskId: string) => {
    onClose();
    setSelectedTaskId(taskId);
  };

  const handleEditOwnProfile = () => {
    onClose();
    setIsUserProfileOpen(true);
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="member-profile-name"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* Top Profile Header */}
        <div className="px-6 pt-6 pb-5 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            {member.avatarUrl && !avatarError ? (
              <img
                src={member.avatarUrl}
                alt={member.name}
                onError={() => setAvatarError(true)}
                className="w-16 h-16 rounded-2xl object-cover shrink-0 ring-1 ring-slate-200 dark:ring-slate-700 bg-slate-100 dark:bg-slate-800"
              />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-lg font-bold text-slate-700 dark:text-slate-200 shrink-0">
                {initials}
              </div>
            )}

            <div className="min-w-0 space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h2
                  id="member-profile-name"
                  className="text-lg font-bold text-slate-900 dark:text-white tracking-tight truncate"
                >
                  {member.name}
                </h2>
                {isSelf && (
                  <span className="text-[10px] font-semibold text-[#005CBD] dark:text-blue-400">
                    (You)
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 font-medium">
                <Briefcase className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate">{member.title || roleLabel}</span>
              </div>

              <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 flex-wrap">
                <span>{roleLabel}</span>
                {leadDepts.length > 0 && (
                  <>
                    <span className="text-slate-300 dark:text-slate-600">·</span>
                    <span className="inline-flex items-center gap-1 font-semibold text-amber-700 dark:text-amber-400">
                      <Crown className="w-3 h-3" />
                      Team Lead ({leadDepts.map((d) => d.code).join(', ')})
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close profile"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Details Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs">
          {/* Contact & Membership Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-800 flex items-center justify-between gap-2 min-w-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                <div className="min-w-0">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    Work Email
                  </div>
                  <div className="font-medium text-slate-800 dark:text-slate-200 truncate">
                    {member.email || 'Not provided'}
                  </div>
                </div>
              </div>
              {member.email && (
                <button
                  type="button"
                  onClick={handleCopyEmail}
                  title="Copy email"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-white dark:hover:bg-slate-700 transition-colors shrink-0"
                >
                  {copiedEmail ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              )}
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-800 flex items-center gap-2.5">
              <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Joined Workspace
                </div>
                <div className="font-medium text-slate-800 dark:text-slate-200">
                  {joinedLabel}
                </div>
              </div>
            </div>
          </div>

          {/* Departments */}
          <div className="space-y-2">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5" />
              <span>Assigned Departments</span>
            </div>
            {memberDepts.length === 0 ? (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Not currently assigned to a department.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {memberDepts.map((dept) => {
                  const isLeadOfDept = (dept.teamLeadIds || []).includes(member.id);
                  return (
                    <div
                      key={dept.id}
                      className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center gap-2"
                    >
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {dept.name}
                      </span>
                      <span className="font-mono text-[10px] text-slate-500 dark:text-slate-400">
                        {dept.code}
                      </span>
                      {isLeadOfDept && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-amber-700 dark:text-amber-400">
                          <Crown className="w-3 h-3" /> Lead
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Operational Summary */}
          <div className="grid grid-cols-4 gap-2 pt-1">
            <div className="p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/50 text-center">
              <div className="text-lg font-bold text-slate-900 dark:text-white tabular-nums">
                {activeTasks.length}
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                Active Tasks
              </div>
            </div>
            <div className="p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/50 text-center">
              <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                {approvedTasks.length}
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                Approved
              </div>
            </div>
            <div className="p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/50 text-center">
              <div className="text-lg font-bold text-[#005CBD] dark:text-blue-400 tabular-nums">
                {completionRate}%
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                Completion
              </div>
            </div>
            <div className="p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/50 text-center">
              <div className="text-lg font-bold text-slate-900 dark:text-white tabular-nums">
                {deliverablesCount}
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                Deliverables
              </div>
            </div>
          </div>

          {/* Recent Tasks */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Recent Tasks
              </div>
              {memberTasks.length > 0 && (
                <span className="text-[11px] text-slate-400 dark:text-slate-500 tabular-nums">
                  {memberTasks.length} total
                </span>
              )}
            </div>

            {memberTasks.length === 0 ? (
              <div className="p-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-center text-slate-400 dark:text-slate-500">
                No tasks assigned to {member.firstName || member.name} yet.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                {memberTasks.slice(0, 4).map((task) => (
                  <button
                    key={task.id}
                    type="button"
                    onClick={() => handleOpenTask(task.id)}
                    className="w-full p-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors flex items-center justify-between gap-3 group"
                  >
                    <div className="min-w-0">
                      <div className="font-semibold text-slate-800 dark:text-slate-200 group-hover:text-[#005CBD] dark:group-hover:text-blue-400 truncate">
                        {task.title}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-0.5">
                        <span>{task.departmentName}</span>
                        <span>·</span>
                        <span className="inline-flex items-center gap-1">
                          {task.status === 'Approved' ? (
                            <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                          ) : (
                            <Clock className="w-3 h-3 text-slate-400" />
                          )}
                          {task.status}
                        </span>
                      </div>
                    </div>
                    <ArrowUpRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 group-hover:text-[#005CBD] dark:group-hover:text-blue-400 shrink-0" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 flex items-center justify-end gap-2">
          {isSelf && (
            <button
              type="button"
              onClick={handleEditOwnProfile}
              className="px-3.5 py-2 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-800 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit My Profile</span>
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 rounded-xl text-xs font-semibold transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
