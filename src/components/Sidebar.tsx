import React from 'react';
import { useApp } from '../context/AppContext';
import { SnazzyLogo } from './SnazzyLogo';
import { isTaskCurrentlyActive, isPastTask } from '../utils/weekUtils';
import {
  CheckSquare,
  Activity,
  PieChart,
  BookOpen,
  Shield,
  Building2,
  Calendar,
  Sparkles,
  ChevronRight,
  X,
  User,
  Crown,
  BarChart3,
  Lock,
  History,
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const {
    currentUser,
    activeView,
    setActiveView,
    activeDashboardTab,
    setActiveDashboardTab,
    departments,
    tasks,
    reflections,
    setIsReflectionModalOpen,
    activeWeek,
    isMobileSidebarOpen,
    setIsMobileSidebarOpen,
    isTeamLead,
  } = useApp();

  const activeTasksCount = (tasks || []).filter((t) => isTaskCurrentlyActive(t, activeWeek)).length;
  const pastTasksCount = (tasks || []).filter((t) => isPastTask(t, activeWeek) && !t.archived).length;
  const myPendingReflections = !(reflections || []).some(
    (r) => r.userId === currentUser?.id && r.weekId === activeWeek
  );

  const isAdmin = currentUser?.role === 'admin';
  const isLead = currentUser?.id ? isTeamLead(currentUser.id) : false;
  const isBizOpsDept = (departments || []).some(
    (d) =>
      ((currentUser?.departmentIds || []).includes(d.id) || (d.teamLeadIds || []).includes(currentUser?.id || '')) &&
      (d.id === 'dept-biz' || d.code?.toUpperCase() === 'BIZ' || d.name?.toLowerCase().includes('business operation'))
  );
  const isBizOps = currentUser?.role === 'business_ops' || isBizOpsDept;

  // Access rules:
  // 1. Everyone has access to Team Member Dashboard
  // 2. Team Leads and Admins have access to Team Lead Dashboard
  // 3. Business Operation department members/leads and Admins have access to Business Operations Dashboard
  const canAccessMemberDashboard = true;
  const canAccessTeamLeadDashboard = isAdmin || isLead;
  const canAccessBizOpsDashboard = isAdmin || isBizOps;

  const effectiveDashboardTab: 'member' | 'team_lead' | 'biz_ops' =
    activeDashboardTab === 'team_lead' && canAccessTeamLeadDashboard
      ? 'team_lead'
      : activeDashboardTab === 'biz_ops' && canAccessBizOpsDashboard
      ? 'biz_ops'
      : 'member';

  const dashboardMenuItems: Array<{
    id: 'member' | 'team_lead' | 'biz_ops';
    label: string;
    icon: any;
    hasAccess: boolean;
    badge?: string;
    restrictedHint: string;
  }> = [
    {
      id: 'member',
      label: 'Team Member Dashboard',
      icon: User,
      hasAccess: canAccessMemberDashboard,
      badge: 'All Members',
      restrictedHint: 'Everyone has access to the Team Member Dashboard',
    },
    {
      id: 'team_lead',
      label: 'Team Lead Dashboard',
      icon: Crown,
      hasAccess: canAccessTeamLeadDashboard,
      badge: isAdmin && !isLead ? 'Admin' : isLead ? 'Lead' : undefined,
      restrictedHint: 'Restricted: Only Team Leads and Admins have access to the Team Lead Dashboard',
    },
    {
      id: 'biz_ops',
      label: 'Business Operations Dashboard',
      icon: BarChart3,
      hasAccess: canAccessBizOpsDashboard,
      badge: isAdmin && !isBizOps ? 'Admin' : isBizOps ? 'BizOps' : undefined,
      restrictedHint: 'Restricted: Only Business Operation department members and Admins have access',
    },
  ];

  const navItems = [
    {
      id: 'tasks',
      label: 'Active Tasks',
      icon: CheckSquare,
      badge: activeTasksCount,
      roles: ['admin', 'team_member', 'business_ops'],
    },
    {
      id: 'past_tasks',
      label: 'Past Tasks',
      icon: History,
      badge: pastTasksCount > 0 ? pastTasksCount : undefined,
      roles: ['admin', 'team_member', 'business_ops'],
    },
    {
      id: 'department_health',
      label: 'Department Health',
      icon: Activity,
      roles: ['admin', 'team_member', 'business_ops'],
    },
    {
      id: 'reports',
      label: 'Reports & Analytics',
      icon: PieChart,
      roles: ['admin', 'team_member', 'business_ops'],
    },
    {
      id: 'reflections',
      label: 'Weekly Reflections',
      icon: BookOpen,
      roles: ['admin', 'team_member', 'business_ops'],
    },
    {
      id: 'admin',
      label: 'Admin Panel',
      icon: Shield,
      badge: currentUser.role === 'admin' ? 'Admin' : undefined,
      roles: ['admin'],
    },
  ];

  const handleNavClick = (viewId: any) => {
    setActiveView(viewId);
    setIsMobileSidebarOpen(false);
  };

  const sidebarContent = (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Mobile Drawer Header */}
      <div className="md:hidden flex items-center justify-between p-4 border-b border-slate-800 dark:border-slate-800 bg-[#001430] dark:bg-slate-950">
        <SnazzyLogo size="sm" textColor="text-white" subtextColor="text-slate-400" />
        <button
          onClick={() => setIsMobileSidebarOpen(false)}
          className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 dark:hover:bg-slate-800 transition-colors"
          aria-label="Close navigation"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Main Navigation */}
      <div className="p-3 space-y-1">
        <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider">
          Dashboards
        </div>

        {dashboardMenuItems.map((dashItem) => {
          const Icon = dashItem.icon;
          const hasAccess = dashItem.hasAccess;
          const isActive = activeView === 'dashboard' && effectiveDashboardTab === dashItem.id;

          return (
            <button
              key={dashItem.id}
              type="button"
              disabled={!hasAccess}
              onClick={() => {
                if (hasAccess) {
                  setActiveDashboardTab(dashItem.id);
                  handleNavClick('dashboard');
                }
              }}
              title={hasAccess ? `Open ${dashItem.label}` : dashItem.restrictedHint}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-[#005CBD] text-white shadow-md'
                  : hasAccess
                  ? 'text-slate-300 hover:text-white hover:bg-white/5 dark:hover:bg-slate-800/60'
                  : 'text-slate-500 dark:text-slate-600 opacity-50 cursor-not-allowed'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    isActive
                      ? 'text-white'
                      : hasAccess
                      ? dashItem.id === 'team_lead'
                        ? 'text-purple-400'
                        : dashItem.id === 'biz_ops'
                        ? 'text-emerald-400'
                        : 'text-slate-400'
                      : 'text-slate-600'
                  }`}
                />
                <span className="truncate">{dashItem.label}</span>
              </div>
              {hasAccess && dashItem.badge ? (
                <span
                  className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full shrink-0 ${
                    isActive ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  {dashItem.badge}
                </span>
              ) : !hasAccess ? (
                <Lock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              ) : null}
            </button>
          );
        })}

        <div className="px-3 pt-3 pb-1 text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider">
          Operations
        </div>

        {navItems
          .filter((item) => (item.roles || []).includes(currentUser?.role || 'team_member'))
          .map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-[#005CBD] text-white shadow-md'
                    : 'text-slate-300 hover:text-white hover:bg-white/5 dark:hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                      isActive ? 'bg-white/20 text-white' : 'bg-slate-800 dark:bg-slate-800 text-slate-300'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
      </div>

      {/* Departments Overview */}
      <div className="p-3 pt-2 border-t border-slate-800/80">
        <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider flex items-center justify-between">
          <span>Departments</span>
          <Building2 className="w-3 h-3 text-slate-500" />
        </div>

        <div className="space-y-1 mt-1">
          {departments
            .filter((d) => !d.archived)
            .map((dept) => {
              const deptTasks = tasks.filter((t) => !t.archived && t.departmentId === dept.id);
              const activeCount = deptTasks.filter((t) => isTaskCurrentlyActive(t, activeWeek)).length;

              return (
                <button
                  key={dept.id}
                  onClick={() => {
                    handleNavClick('tasks');
                  }}
                  className="w-full flex items-center justify-between px-3 py-1.5 rounded-md text-xs font-medium text-slate-300 hover:text-white hover:bg-white/5 dark:hover:bg-slate-800/60 transition-colors group"
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className="w-2 h-2 rounded-full bg-[#ED8231]" />
                    <span className="truncate">{dept.name}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 dark:text-slate-400 font-mono group-hover:text-slate-200">
                    {activeCount}
                  </span>
                </button>
              );
            })}
        </div>
      </div>

      <div className="mt-auto p-3 border-t border-slate-800/80 space-y-3">
        {/* Friday Weekly Reflection Callout Banner */}
        <div className="bg-gradient-to-br from-[#005CBD]/30 to-[#ED8231]/20 dark:from-blue-950/40 dark:to-orange-950/30 border border-[#005CBD]/40 dark:border-blue-800/50 rounded-xl p-3 text-slate-200">
          <div className="flex items-center gap-1.5 text-xs font-bold text-white mb-1">
            <Sparkles className="w-3.5 h-3.5 text-[#ED8231]" />
            <span>Friday Reflection</span>
          </div>
          <p className="text-[11px] text-slate-300 dark:text-slate-300 leading-tight mb-2.5">
            Document what you completed, carryover items, and blockers.
          </p>
          <button
            onClick={() => {
              setIsReflectionModalOpen(true);
              setIsMobileSidebarOpen(false);
            }}
            className="w-full flex items-center justify-center gap-1 bg-[#ED8231] hover:bg-[#AD5E1F] text-white py-1.5 rounded-lg text-xs font-semibold shadow-xs transition-colors"
          >
            <span>{myPendingReflections ? 'Submit Reflection' : 'View Reflections'}</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Current Cycle Indicator */}
        <div className="flex items-center justify-between px-2 text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            <span>Week Cycle</span>
          </div>
          <span className="font-mono text-slate-200 font-semibold">{activeWeek}</span>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar (Permanent) */}
      <aside className="hidden md:flex w-64 bg-[#001C42] dark:bg-slate-950 text-slate-300 flex-col shrink-0 min-h-[calc(100vh-57px)] border-r border-slate-800 dark:border-slate-800/80">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer (Overlay) */}
      {isMobileSidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileSidebarOpen(false)}
          />

          {/* Drawer Panel */}
          <aside className="relative w-72 max-w-[85vw] bg-[#001C42] dark:bg-slate-950 text-slate-300 flex flex-col h-full shadow-2xl z-10 border-r border-slate-800 dark:border-slate-800/80 animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
};
