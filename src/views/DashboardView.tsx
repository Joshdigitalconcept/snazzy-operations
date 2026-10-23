import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { TaskCard } from '../components/TaskCard';
import { DashboardClock } from '../components/DashboardClock';
import { isTaskInActiveWeek, isPastTask } from '../utils/weekUtils';
import {
  Sparkles,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Building2,
  Crown,
  ChevronRight,
  TrendingUp,
  Plus,
  ShieldCheck,
  Eye,
  BarChart3,
  Users,
  Activity,
  Flame,
  FileText,
  MessageSquare,
  History,
  Check,
  RotateCcw,
  User,
  ArrowUpRight,
  Zap,
  Target,
  ShieldAlert,
  ArrowRight,
  Calendar,
} from 'lucide-react';

export const DashboardView: React.FC = () => {
  const {
    currentUser,
    tasks,
    departments,
    users,
    reflections,
    auditLogs,
    taskComments,
    isTeamLead,
    setIsCreateTaskOpen,
    setIsReflectionModalOpen,
    setSelectedTaskId,
    activeWeek,
    weeks,
    approveTask,
    requestRevision,
    activeDashboardTab,
    setActiveDashboardTab,
  } = useApp();

  const safeTasks = tasks || [];
  const safeDepts = departments || [];
  const safeUsers = users || [];
  const safeReflections = reflections || [];

  const isAdmin = currentUser?.role === 'admin';
  const isLead = currentUser?.id ? isTeamLead(currentUser.id) : false;
  const isBizOpsDept = safeDepts.some(
    (d) =>
      ((currentUser?.departmentIds || []).includes(d.id) || (d.teamLeadIds || []).includes(currentUser?.id || '')) &&
      (d.id === 'dept-biz' || d.code?.toUpperCase() === 'BIZ' || d.name?.toLowerCase().includes('business operation'))
  );
  const isBizOps = currentUser?.role === 'business_ops' || isBizOpsDept;

  // Access permissions:
  // - Admin has access to the whole dashboard (all 3 perspectives)
  // - Everyone has access to Team Member Dashboard
  // - Business Operation department has access to Business Operations Dashboard
  // - Team Lead has access to Team Lead Dashboard
  const canAccessTeamLeadDashboard = isAdmin || isLead;
  const canAccessBizOpsDashboard = isAdmin || isBizOps;

  const activeTab: 'member' | 'team_lead' | 'biz_ops' =
    activeDashboardTab === 'team_lead' && canAccessTeamLeadDashboard
      ? 'team_lead'
      : activeDashboardTab === 'biz_ops' && canAccessBizOpsDashboard
      ? 'biz_ops'
      : 'member';

  React.useEffect(() => {
    if (activeDashboardTab !== activeTab) {
      setActiveDashboardTab(activeTab);
    }
  }, [activeDashboardTab, activeTab, setActiveDashboardTab]);

  // Department IDs led by current user (Admins have oversight across all active departments)
  const myLedDepts = isAdmin
    ? safeDepts.filter((d) => !d.archived)
    : safeDepts.filter((d) => (d.teamLeadIds || []).includes(currentUser?.id || ''));

  // Reflections check
  const hasSubmittedReflection = safeReflections.some(
    (r) => r.userId === currentUser?.id && r.weekId === activeWeek
  );

  // First name extraction
  const userFirstName = currentUser?.firstName || (currentUser?.name ? currentUser.name.trim().split(/\s+/)[0] : 'there');

  return (
    <div className="p-3.5 sm:p-6 space-y-5 sm:space-y-6 max-w-7xl mx-auto">
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-[#00224D] via-[#005CBD] to-[#0051B8] text-white rounded-2xl p-5 sm:p-6 shadow-xl relative overflow-hidden flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        <div className="z-10 space-y-2 max-w-2xl">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-white/15 text-white border border-white/20 backdrop-blur-xs">
              <Building2 className="w-3.5 h-3.5 text-blue-200 shrink-0" />
              <span>{currentUser?.departmentNames?.length ? currentUser.departmentNames.join(', ') : 'Operations Center'}</span>
            </span>
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-white/15 text-white border border-white/20 backdrop-blur-xs">
              <Calendar className="w-3.5 h-3.5 text-blue-200 shrink-0" />
              <span>Cycle: {activeWeek}</span>
            </span>
            <DashboardClock />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              Welcome back, {userFirstName}!
            </h1>
            <p className="text-xs sm:text-sm text-blue-100/90 leading-relaxed mt-0.5">
              Organizational progress, department health, and weekly operational deliverables.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 z-10 shrink-0 pt-3 lg:pt-0 border-t border-white/15 lg:border-t-0">
          <button
            onClick={() => setIsCreateTaskOpen(true)}
            className="h-10 bg-[#ED8231] hover:bg-[#AD5E1F] text-white px-4 rounded-xl text-xs font-bold shadow-md flex items-center justify-center gap-2 transition-all active:scale-98 flex-1 sm:flex-none whitespace-nowrap"
          >
            <Plus className="w-4 h-4 shrink-0" />
            <span>Create Task</span>
          </button>
          {!hasSubmittedReflection && (
            <button
              onClick={() => setIsReflectionModalOpen(true)}
              className="h-10 bg-white/10 hover:bg-white/20 text-white border border-white/25 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 backdrop-blur-xs flex-1 sm:flex-none whitespace-nowrap"
            >
              <Sparkles className="w-4 h-4 text-[#ED8231] shrink-0" />
              <span>Friday Reflection</span>
            </button>
          )}
        </div>

        {/* Decorative background shape */}
        <div className="absolute right-0 bottom-0 translate-x-12 translate-y-12 opacity-10 pointer-events-none">
          <Building2 className="w-72 h-72 text-white" />
        </div>
      </div>

      {/* DASHBOARD TAB 1: TEAM MEMBER DASHBOARD */}
      {activeTab === 'member' && (
        <TeamMemberDashboardView
          currentUser={currentUser}
          tasks={tasks}
          taskComments={taskComments}
          reflections={reflections}
          activeWeek={activeWeek}
          setIsCreateTaskOpen={setIsCreateTaskOpen}
          setIsReflectionModalOpen={setIsReflectionModalOpen}
          setSelectedTaskId={setSelectedTaskId}
        />
      )}

      {/* DASHBOARD TAB 2: TEAM LEAD DASHBOARD */}
      {activeTab === 'team_lead' && (
        <TeamLeadDashboardView
          currentUser={currentUser}
          tasks={tasks}
          departments={departments}
          users={users}
          reflections={reflections}
          myLedDepts={myLedDepts}
          approveTask={approveTask}
          requestRevisionTask={requestRevision}
          setSelectedTaskId={setSelectedTaskId}
          activeWeek={activeWeek}
        />
      )}

      {/* DASHBOARD TAB 3: BUSINESS OPERATIONS DASHBOARD */}
      {activeTab === 'biz_ops' && (
        <BizOpsDashboardView
          tasks={tasks}
          departments={departments}
          users={users}
          auditLogs={auditLogs}
          weeks={weeks}
          activeWeek={activeWeek}
          setSelectedTaskId={setSelectedTaskId}
        />
      )}
    </div>
  );
};

// ==========================================
// SUB-COMPONENT 1: TEAM MEMBER DASHBOARD
// ==========================================
const TeamMemberDashboardView: React.FC<{
  currentUser: any;
  tasks: any[];
  taskComments: Record<string, any[]>;
  reflections: any[];
  activeWeek: string;
  setIsCreateTaskOpen: (open: boolean) => void;
  setIsReflectionModalOpen: (open: boolean) => void;
  setSelectedTaskId: (id: string) => void;
}> = ({
  currentUser,
  tasks,
  taskComments,
  reflections,
  activeWeek,
  setIsCreateTaskOpen,
  setIsReflectionModalOpen,
  setSelectedTaskId,
}) => {
  const safeTasks = tasks || [];
  // Tasks are only active for that week; after that week they become past tasks whether completed or not
  const myCurrentWeekTasks = safeTasks.filter(
    (t) => !t.archived && t.ownerId === currentUser?.id && isTaskInActiveWeek(t, activeWeek)
  );
  const myActiveTasks = myCurrentWeekTasks.filter((t) => t.status !== 'Approved');
  const myApprovedTasks = myCurrentWeekTasks.filter((t) => t.status === 'Approved');
  const myBlockedTasks = myCurrentWeekTasks.filter((t) => t.status === 'Blocked');
  const myPastTasks = safeTasks.filter(
    (t) => !t.archived && t.ownerId === currentUser?.id && isPastTask(t, activeWeek)
  );

  // Average completion across current week personal tasks
  const myAvgProgress = myCurrentWeekTasks.length > 0
    ? Math.round(
        myCurrentWeekTasks.reduce((acc, t) => acc + (t.progressPercent || 0), 0) / myCurrentWeekTasks.length
      )
    : 0;

  // Mentions feed where user was tagged in comments
  const myMentions: { commentId: string; content: string; author: string; taskTitle: string; taskId: string; date: string }[] = [];
  if (taskComments) {
    Object.entries(taskComments || {}).forEach(([taskId, comments]) => {
      const task = tasks.find((t) => t.id === taskId);
      if (task && Array.isArray(comments)) {
        comments.forEach((c: any) => {
          const contentStr = (c?.content || '').toLowerCase();
          const currentUserName = (currentUser?.name || '').toLowerCase();
          if (contentStr.includes(`@${currentUserName}`) || (currentUserName && contentStr.includes(`@${currentUserName.split(' ')[0]}`)) || contentStr.includes('@joshua')) {
            myMentions.push({
              commentId: c.id,
              content: c.content || '',
              author: c.userName || 'Team Member',
              taskTitle: task.title || 'Task',
              taskId: task.id,
              date: c.createdAt || new Date().toISOString(),
            });
          }
        });
      }
    });
  }

  const hasSubmittedReflection = reflections.some(
    (r) => r.userId === currentUser.id && r.weekId === activeWeek
  );

  return (
    <div className="space-y-6">
      {/* Operational Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium">
            <span>My Active Tasks</span>
            <Clock className="w-4 h-4 text-[#005CBD] dark:text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">{myActiveTasks.length}</div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400">{myApprovedTasks.length} approved this week ({activeWeek})</div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium">
            <span>Average Progress</span>
            <Zap className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">{myAvgProgress}%</div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400">Across this week's tasks</div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium">
            <span>Blocked Items</span>
            <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">{myBlockedTasks.length}</div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400">Requiring support this week</div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium">
            <span>Past Tasks</span>
            <History className="w-4 h-4 text-slate-500 dark:text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">{myPastTasks.length}</div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400">From previous week cycles</div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: My Active Tasks */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#005CBD] dark:text-blue-400" />
              <span>My Active Tasks This Week ({myActiveTasks.length})</span>
            </h3>
            <button
              onClick={() => setIsCreateTaskOpen(true)}
              className="text-xs font-semibold text-[#005CBD] dark:text-blue-400 hover:underline"
            >
              + Create Task
            </button>
          </div>

          {myActiveTasks.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center space-y-3">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
              <div className="font-bold text-sm text-slate-800 dark:text-white">You have no active tasks for this week ({activeWeek})!</div>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                Tasks are only active during their assigned week. Create operational tasks for this week or check department priorities.
              </p>
              <button
                onClick={() => setIsCreateTaskOpen(true)}
                className="bg-[#005CBD] text-white px-4 py-2 rounded-xl text-xs font-bold"
              >
                Create Task
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {myActiveTasks.map((task) => (
                <TaskCard key={task.id} task={task} />
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Mentions & Weekly Reflection Status */}
        <div className="space-y-6">
          {/* Mentions Feed */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-2xs space-y-3">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>Recent Mentions & Tags ({myMentions.length})</span>
            </h3>

            {myMentions.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-850 rounded-xl">
                No comment mentions yet. Type @Name in any task comment to tag colleagues.
              </div>
            ) : (
              <div className="space-y-2">
                {myMentions.slice(0, 4).map((m) => (
                  <div
                    key={m.commentId}
                    onClick={() => setSelectedTaskId(m.taskId)}
                    className="p-3 border border-slate-100 dark:border-slate-800 rounded-xl bg-slate-50/70 dark:bg-slate-800/70 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors space-y-1"
                  >
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-slate-900 dark:text-white">{m.author}</span>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500">
                        {new Date(m.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 dark:text-slate-300 italic line-clamp-2">"{m.content}"</p>
                    <div className="text-[10px] font-semibold text-[#005CBD] dark:text-blue-400 pt-0.5">Task: {m.taskTitle}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Friday Reflection Box */}
          <div className="bg-gradient-to-br from-[#00224D] to-[#005CBD] text-white rounded-2xl p-5 space-y-3 shadow-lg">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#ED8231]" />
              <h3 className="font-bold text-sm text-white">Friday Reflection Readiness</h3>
            </div>
            <p className="text-xs text-blue-100 leading-relaxed">
              Answer the 3 required questions: Completed tasks, carry-overs, and blockers faced during this cycle.
            </p>
            <button
              onClick={() => setIsReflectionModalOpen(true)}
              className="w-full bg-[#ED8231] hover:bg-[#AD5E1F] text-white py-2 rounded-xl text-xs font-bold shadow-md transition-colors"
            >
              {hasSubmittedReflection ? 'View Submitted Reflection' : 'Submit Friday Reflection'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// SUB-COMPONENT 2: TEAM LEAD DASHBOARD
// ==========================================
const TeamLeadDashboardView: React.FC<{
  currentUser: any;
  tasks: any[];
  departments: any[];
  users: any[];
  reflections: any[];
  myLedDepts: any[];
  approveTask: (id: string, note?: string) => void;
  requestRevisionTask: (id: string, reason: string) => void;
  setSelectedTaskId: (id: string) => void;
  activeWeek: string;
}> = ({
  currentUser,
  tasks,
  departments,
  users,
  reflections,
  myLedDepts,
  approveTask,
  requestRevisionTask,
  setSelectedTaskId,
  activeWeek,
}) => {
  const safeTasks = tasks || [];
  const safeUsers = users || [];
  const safeReflections = reflections || [];
  const myLedDeptIds = (myLedDepts || []).map((d) => d.id);

  // Tasks in departments led by this user for the current active week (after that week they are past tasks)
  const deptTasks = safeTasks.filter(
    (t) => !t.archived && myLedDeptIds.includes(t.departmentId) && isTaskInActiveWeek(t, activeWeek)
  );

  // Pending Approvals
  const pendingApprovals = deptTasks.filter(
    (t) => t.ownerId !== currentUser?.id && (t.status === 'Pending Approval' || t.status === 'Completed')
  );

  // Blocked Tasks in Department
  const blockedTasks = deptTasks.filter((t) => t.status === 'Blocked');

  // Department Team Members
  const deptMembers = safeUsers.filter((u) => (u.departmentIds || []).some((dId) => myLedDeptIds.includes(dId)));

  // Reflection Compliance Matrix
  const membersWithReflection = deptMembers.filter((m) =>
    safeReflections.some((r) => r.userId === m.id && r.weekId === activeWeek)
  );

  return (
    <div className="space-y-6">
      {/* Key Metric Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 p-4 rounded-2xl shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-xs text-purple-700 dark:text-purple-300 font-bold">
            <span>Pending Approvals</span>
            <Crown className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">{pendingApprovals.length}</div>
          <div className="text-[11px] text-purple-700 dark:text-purple-300">Awaiting your sign-off</div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium">
            <span>Department Active Tasks</span>
            <Clock className="w-4 h-4 text-[#005CBD] dark:text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">
            {deptTasks.filter((t) => t.status !== 'Approved').length}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400">
            {deptTasks.filter((t) => t.status === 'Approved').length} completed
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium">
            <span>Blocked & Bottlenecks</span>
            <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">{blockedTasks.length}</div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400">Requires lead escalation</div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium">
            <span>Friday Sign-off Readiness</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">
            {membersWithReflection.length}/{deptMembers.length}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400">Reflections submitted</div>
        </div>
      </div>

      {/* Approval Queue Section */}
      <div className="bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/80 rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-purple-700 dark:text-purple-300" />
            <h3 className="font-bold text-sm text-purple-900 dark:text-purple-200">
              Department Approval Queue ({pendingApprovals.length})
            </h3>
          </div>
          <span className="text-xs text-purple-700 dark:text-purple-300 font-medium">
            Lead review required for tasks marked Pending Approval
          </span>
        </div>

        {pendingApprovals.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 border border-purple-100 dark:border-purple-900/50 rounded-xl p-6 text-center text-xs text-purple-600 dark:text-purple-300 font-medium">
            No pending task approvals in your department! All submitted work has been reviewed.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {pendingApprovals.map((task) => (
              <div
                key={task.id}
                className="bg-white dark:bg-slate-900 border border-purple-100 dark:border-purple-900/50 rounded-xl p-4 shadow-2xs space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1 min-w-0">
                    <div className="font-bold text-xs text-slate-900 dark:text-white truncate">{task.title}</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2">
                      <span>Owner: {task.ownerName}</span>
                      <span>•</span>
                      <span>{task.departmentName}</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-900/60 text-purple-800 dark:text-purple-200 shrink-0">
                    {task.deliverables?.length || 0} Deliverables
                  </span>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={() => setSelectedTaskId(task.id)}
                    className="text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white inline-flex items-center gap-1"
                  >
                    <span>Inspect Details</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => approveTask(task.id, 'Approved by Team Lead from Dashboard')}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1 rounded-lg text-xs font-bold shadow-xs"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => {
                        const reason = prompt('Specify revision feedback for ' + task.ownerName + ':');
                        if (reason) requestRevisionTask(task.id, reason);
                      }}
                      className="bg-amber-100 hover:bg-amber-200 dark:bg-amber-950/60 dark:hover:bg-amber-900/80 text-amber-800 dark:text-amber-300 px-3 py-1 rounded-lg text-xs font-bold"
                    >
                      Revision
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Team Member Workload & Capacity Grid */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-2xs space-y-4">
        <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
          <Users className="w-4 h-4 text-[#005CBD] dark:text-blue-400" />
          <span>Team Capacity & Workload Allocation Matrix</span>
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
                <th className="p-3">Team Member</th>
                <th className="p-3">Role</th>
                <th className="p-3">Active Tasks</th>
                <th className="p-3">Avg Progress</th>
                <th className="p-3">Reflection Status</th>
                <th className="p-3">Capacity Health</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {deptMembers.map((member) => {
                const memberTasks = deptTasks.filter((t) => t.ownerId === member.id);
                const memberActive = memberTasks.filter((t) => t.status !== 'Approved');
                const memberAvgProgress = memberTasks.length > 0
                  ? Math.round(memberTasks.reduce((acc, t) => acc + (t.progressPercent || 0), 0) / memberTasks.length)
                  : 0;
                const submittedRef = reflections.some(
                  (r) => r.userId === member.id && r.weekId === activeWeek
                );

                const isOverloaded = memberActive.length > 4;

                return (
                  <tr key={member.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="p-3 font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <img
                        src={
                          member.avatarUrl ||
                          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
                        }
                        alt=""
                        className="w-6 h-6 rounded-full object-cover"
                      />
                      <span>{member.name}</span>
                    </td>
                    <td className="p-3 text-slate-500 dark:text-slate-400 capitalize">{member.role}</td>
                    <td className="p-3 font-bold text-slate-800 dark:text-slate-200">{memberActive.length} tasks</td>
                    <td className="p-3 text-slate-600 dark:text-slate-300 font-semibold">
                      {memberAvgProgress}%
                    </td>
                    <td className="p-3">
                      {submittedRef ? (
                        <span className="bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded text-[10px] font-bold inline-flex items-center gap-1">
                          <Check className="w-3 h-3" />
                          <span>Submitted</span>
                        </span>
                      ) : (
                        <span className="bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 px-2 py-0.5 rounded text-[10px] font-bold">
                          Pending
                        </span>
                      )}
                    </td>
                    <td className="p-3">
                      {isOverloaded ? (
                        <span className="bg-red-100 dark:bg-red-950/60 text-red-800 dark:text-red-300 font-bold text-[10px] px-2 py-0.5 rounded">
                          High Workload ({memberActive.length})
                        </span>
                      ) : (
                        <span className="bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-bold text-[10px] px-2 py-0.5 rounded">
                          Balanced
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// SUB-COMPONENT 3: BUSINESS OPERATIONS DASHBOARD
// ==========================================
const BizOpsDashboardView: React.FC<{
  tasks: any[];
  departments: any[];
  users: any[];
  auditLogs: any[];
  weeks: any[];
  activeWeek: string;
  setSelectedTaskId: (id: string) => void;
}> = ({ tasks, departments, users, auditLogs, weeks, activeWeek, setSelectedTaskId }) => {
  const safeTasks = tasks || [];
  const safeDepts = departments || [];
  const currentWeekTasks = safeTasks.filter((t) => !t.archived && isTaskInActiveWeek(t, activeWeek));
  const activeTasks = currentWeekTasks.filter((t) => t.status !== 'Approved');
  const approvedTasks = currentWeekTasks.filter((t) => t.status === 'Approved');
  const blockedTasks = currentWeekTasks.filter((t) => t.status === 'Blocked');
  const pendingApprovals = currentWeekTasks.filter((t) => t.status === 'Pending Approval');
  const orgAvgProgress = currentWeekTasks.length > 0
    ? Math.round(currentWeekTasks.reduce((acc, t) => acc + (t.progressPercent || 0), 0) / currentWeekTasks.length)
    : 0;

  return (
    <div className="space-y-6">
      {/* Executive KPI Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium">
            <span>Org Throughput</span>
            <Activity className="w-4 h-4 text-[#005CBD] dark:text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">{approvedTasks.length} Approved</div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400">{activeTasks.length} currently in progress</div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium">
            <span>Org Completion Rate</span>
            <Clock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">
            {orgAvgProgress}%
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400">Average across {currentWeekTasks.length} tasks this week</div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium">
            <span>Org Approval Queue</span>
            <Crown className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">{pendingApprovals.length}</div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400">Cross-department reviews</div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium">
            <span>Cross-Dept Support Blockers</span>
            <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">{blockedTasks.length}</div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400">Blocked tasks flagged</div>
        </div>
      </div>

      {/* Cross-Department Performance Matrix */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-2xs space-y-4">
        <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
          <Building2 className="w-4 h-4 text-[#005CBD] dark:text-blue-400" />
          <span>Cross-Department Velocity & Health Matrix</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {departments
            .filter((d) => !d.archived)
            .map((dept) => {
              const deptTasks = currentWeekTasks.filter((t) => t.departmentId === dept.id);
              const deptApproved = deptTasks.filter((t) => t.status === 'Approved').length;
              const deptActive = deptTasks.filter((t) => t.status !== 'Approved').length;
              const deptBlocked = deptTasks.filter((t) => t.status === 'Blocked').length;
              const rate = deptTasks.length > 0 ? Math.round((deptApproved / deptTasks.length) * 100) : 0;

              return (
                <div
                  key={dept.id}
                  className="bg-slate-50/70 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-750 p-4 rounded-xl space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-slate-900 dark:text-white">{dept.name}</span>
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/60 text-[#005CBD] dark:text-blue-300">
                      {dept.code}
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">{dept.description}</p>

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-600 dark:text-slate-300">Completion Rate</span>
                      <span className="text-slate-900 dark:text-white">{rate}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#005CBD] transition-all"
                        style={{ width: `${rate}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] font-semibold pt-1 border-t border-slate-200 dark:border-slate-700">
                    <span className="text-slate-600 dark:text-slate-300">{deptActive} Active</span>
                    <span className="text-emerald-700 dark:text-emerald-300">{deptApproved} Approved</span>
                    {deptBlocked > 0 && <span className="text-red-600 dark:text-red-400 font-bold">{deptBlocked} Blocked</span>}
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* Audit Log Stream */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-2xs space-y-3">
        <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
          <History className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          <span>Real-time System Audit & Administrative Feed</span>
        </h3>

        <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-60 overflow-y-auto font-mono text-xs">
          {auditLogs.slice(0, 8).map((log) => (
            <div key={log.id} className="p-2.5 flex items-start gap-3">
              <span className="text-[10px] text-slate-400 dark:text-slate-500 shrink-0">
                {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
              <div className="min-w-0 flex-1">
                <span className="font-bold text-slate-800 dark:text-slate-200">{log.actorName}</span>{' '}
                <span className="text-slate-600 dark:text-slate-400">{log.action}:</span>{' '}
                <span className="text-slate-500 dark:text-slate-300">{log.details}</span>
              </div>
              <span className="text-[9px] uppercase px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-slate-600 dark:text-slate-300 shrink-0">
                {log.category}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
