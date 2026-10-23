import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { isTaskInActiveWeek } from '../utils/weekUtils';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart as RePieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  Line,
  ComposedChart,
} from 'recharts';
import {
  Activity,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Building2,
  TrendingUp,
  ShieldAlert,
  Users,
  Info,
  Layers,
  Filter,
  Sparkles,
} from 'lucide-react';

export const DepartmentHealthView: React.FC = () => {
  const { tasks, departments, users, activeWeek, weeks } = useApp();

  const [selectedDeptFilter, setSelectedDeptFilter] = useState<string>('all');
  const [velocityViewMode, setVelocityViewMode] = useState<'dual' | 'velocity' | 'volume'>('dual');

  const safeDepts = (departments || []).filter((d) => !d.archived);

  // Filter tasks based on selected department
  const filteredTasks = (tasks || []).filter((t) => {
    if (t.archived) return false;
    if (selectedDeptFilter !== 'all' && t.departmentId !== selectedDeptFilter) return false;
    return true;
  });

  const currentWeekTasks = filteredTasks.filter((t) => isTaskInActiveWeek(t, activeWeek));
  const activeTasks = currentWeekTasks.filter((t) => t.status !== 'Approved');
  const approvedTasks = currentWeekTasks.filter((t) => t.status === 'Approved');
  const blockedTasks = currentWeekTasks.filter((t) => t.status === 'Blocked');
  const pendingApprovals = currentWeekTasks.filter((t) => t.status === 'Pending Approval');

  // Chart 1: Tasks per Department (uses all departments)
  const deptData = safeDepts.map((dept) => {
    const dTasks = (tasks || []).filter((t) => !t.archived && isTaskInActiveWeek(t, activeWeek) && t.departmentId === dept.id);
    return {
      name: dept.code,
      fullName: dept.name,
      Active: dTasks.filter((t) => t.status !== 'Approved' && t.status !== 'Blocked').length,
      Completed: dTasks.filter((t) => t.status === 'Approved').length,
      Blocked: dTasks.filter((t) => t.status === 'Blocked').length,
    };
  });

  // Chart 2: Priority Distribution
  const priorityData = [
    { name: 'Critical', value: filteredTasks.filter((t) => t.priority === 'Critical').length, color: '#EF4444' },
    { name: 'High', value: filteredTasks.filter((t) => t.priority === 'High').length, color: '#F97316' },
    { name: 'Medium', value: filteredTasks.filter((t) => t.priority === 'Medium').length, color: '#005CBD' },
    { name: 'Low', value: filteredTasks.filter((t) => t.priority === 'Low').length, color: '#64748B' },
  ];

  // -------------------------------------------------------------
  // DYNAMIC CALCULATION: Weekly Completion Velocity Trend
  // Formula:
  //   - Cycle Total = Count of all non-archived tasks assigned to that operational week
  //   - Cycle Completed = Count of tasks with status 'Approved' or 'Completed' (or progress 100%)
  //   - Velocity Rate (%) = (Cycle Completed / Cycle Total) * 100%
  //   - Velocity Volume = Raw count of completed and approved deliverables
  // -------------------------------------------------------------
  const allWeekIds = new Set<string>();
  (weeks || []).forEach((w) => allWeekIds.add(w.id));
  (tasks || []).forEach((t) => {
    if (t.weekId) allWeekIds.add(t.weekId);
  });

  const sortedWeekIds = Array.from(allWeekIds).sort((a, b) => a.localeCompare(b));
  const activeIdx = sortedWeekIds.indexOf(activeWeek);

  // Include recent cycles leading up to and including the current active week
  const relevantWeekIds = activeIdx !== -1
    ? sortedWeekIds.slice(Math.max(0, activeIdx - 5), activeIdx + 1)
    : sortedWeekIds.slice(-6);

  const trendData = relevantWeekIds.map((wId) => {
    const weekObj = (weeks || []).find((w) => w.id === wId);
    const cycleTasks = filteredTasks.filter((t) => t.weekId === wId);
    const total = cycleTasks.length;
    const completed = cycleTasks.filter(
      (t) => t.status === 'Approved' || t.status === 'Completed' || t.progressPercent === 100
    ).length;
    const inProgress = cycleTasks.filter((t) => t.status === 'In Progress' || t.status === 'Pending Approval').length;
    const blocked = cycleTasks.filter((t) => t.status === 'Blocked').length;
    const velocityRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    const avgProgress = total > 0
      ? Math.round(cycleTasks.reduce((acc, t) => acc + (t.progressPercent || 0), 0) / total)
      : 0;

    // Friendly week label (e.g. "2026-10-W2" -> "Oct W2")
    const match = wId.match(/^\d{4}-(\d{2})-W(\d+)$/);
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const shortLabel = match
      ? `${monthNames[parseInt(match[1], 10) - 1] || match[1]} W${match[2]}`
      : wId;

    return {
      weekId: wId,
      week: shortLabel,
      fullLabel: weekObj?.label || wId,
      isCurrent: wId === activeWeek,
      Completed: completed,
      Total: total,
      InProgress: inProgress,
      Blocked: blocked,
      Velocity: velocityRate, // Dynamic Completion Velocity percentage (0 - 100)
      AvgProgress: avgProgress,
    };
  });

  // Derived Trend KPI Metrics
  const currentCycleItem = trendData.find((d) => d.isCurrent) || trendData[trendData.length - 1];
  const currentVelocity = currentCycleItem ? currentCycleItem.Velocity : 0;
  const currentCompleted = currentCycleItem ? currentCycleItem.Completed : 0;
  const currentTotal = currentCycleItem ? currentCycleItem.Total : 0;

  const cyclesWithTasks = trendData.filter((d) => d.Total > 0);
  const avgVelocity = cyclesWithTasks.length > 0
    ? Math.round(cyclesWithTasks.reduce((sum, d) => sum + d.Velocity, 0) / cyclesWithTasks.length)
    : 0;
  const totalCompletedInTrend = trendData.reduce((sum, d) => sum + d.Completed, 0);

  return (
    <div className="p-3.5 sm:p-6 space-y-4 sm:space-y-6 max-w-7xl mx-auto">
      {/* Header & Department Filter */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 sm:p-5 rounded-2xl shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-blue-50 dark:bg-blue-950/60 text-[#005CBD] dark:text-blue-300 text-[10px] font-bold px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800">
              Executive Leadership
            </span>
            <span className="text-slate-400 dark:text-slate-500 text-xs">• Real-Time Intelligence</span>
          </div>
          <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mt-1">
            Department Health & Operations Dashboard
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Operational throughput, deliverables velocity, and cross-functional performance tracking.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Department Filter Select */}
          <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Scope:</span>
            <select
              value={selectedDeptFilter}
              onChange={(e) => setSelectedDeptFilter(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-900 dark:text-white focus:outline-none cursor-pointer"
            >
              <option value="all">All Departments (Organization-Wide)</option>
              {safeDepts.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.code})
                </option>
              ))}
            </select>
          </div>

          <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-3 py-1.5 rounded-xl flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> Operational Stream
          </span>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl space-y-2 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium">
            <span>Active Workload</span>
            <Clock className="w-4 h-4 text-[#005CBD] dark:text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">{activeTasks.length}</div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400">
            Tasks in active cycle ({activeWeek})
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl space-y-2 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium">
            <span>Approved Deliverables</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">{approvedTasks.length}</div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400">Completed & approved this week</div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl space-y-2 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium">
            <span>Pending Approval Queue</span>
            <TrendingUp className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">{pendingApprovals.length}</div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400">Awaiting Team Lead signoff</div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl space-y-2 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium">
            <span>Active Blockers</span>
            <ShieldAlert className="w-4 h-4 text-red-600 dark:text-red-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">{blockedTasks.length}</div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400">Requires cross-dept assistance</div>
        </div>
      </div>

      {/* Visual Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bar Chart: Workload by Department */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Building2 className="w-4 h-4 text-[#005CBD] dark:text-blue-400" />
              Workload Distribution by Department
            </h3>
            <span className="text-xs text-slate-500 dark:text-slate-400">Cycle {activeWeek}</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={deptData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#64748B30" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748B' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748B' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#00224D', color: '#fff', borderRadius: '12px', fontSize: '11px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="Active" fill="#005CBD" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Completed" fill="#10B981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Blocked" fill="#EF4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart: Priority Mix */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-2xs space-y-4">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white">Priority Distribution</h3>

          <div className="h-52 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <RePieChart>
                <Pie
                  data={priorityData}
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {priorityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#00224D', color: '#fff', borderRadius: '12px', fontSize: '11px' }}
                />
              </RePieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            {priorityData.map((p) => (
              <div key={p.name} className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
                <span className="text-slate-600 dark:text-slate-400 font-medium">{p.name}:</span>
                <span className="font-bold text-slate-900 dark:text-white">{p.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* DYNAMIC Weekly Completion Velocity Trend Section */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#005CBD] dark:text-blue-400" />
                <span>Weekly Completion Velocity Trend</span>
              </h3>
              <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 text-[#005CBD] dark:text-blue-400 border border-blue-200 dark:border-blue-900/60">
                Live Dynamic Calculation
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Calculated as <code className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono text-[11px] font-semibold">(Completed & Approved Deliverables ÷ Total Weekly Tasks) × 100%</code> across operational cycles.
            </p>
          </div>

          {/* View mode toggle */}
          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl self-start sm:self-auto text-xs">
            <button
              type="button"
              onClick={() => setVelocityViewMode('dual')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                velocityViewMode === 'dual'
                  ? 'bg-white dark:bg-slate-700 text-[#005CBD] dark:text-blue-400 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Dual Trend
            </button>
            <button
              type="button"
              onClick={() => setVelocityViewMode('velocity')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                velocityViewMode === 'velocity'
                  ? 'bg-white dark:bg-slate-700 text-[#005CBD] dark:text-blue-400 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Velocity %
            </button>
            <button
              type="button"
              onClick={() => setVelocityViewMode('volume')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                velocityViewMode === 'volume'
                  ? 'bg-white dark:bg-slate-700 text-[#005CBD] dark:text-blue-400 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Task Volume
            </button>
          </div>
        </div>

        {/* Dynamic Metric Chips */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-1">
          <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200/80 dark:border-slate-750">
            <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Current Week Velocity</div>
            <div className="text-lg font-bold text-slate-900 dark:text-white mt-0.5 flex items-baseline gap-1">
              <span>{currentVelocity}%</span>
              <span className="text-[10px] font-normal text-slate-400">({currentCompleted}/{currentTotal})</span>
            </div>
            <div className="text-[10px] text-slate-400 dark:text-slate-500">Active cycle throughput</div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200/80 dark:border-slate-750">
            <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Average Cycle Velocity</div>
            <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
              {avgVelocity}%
            </div>
            <div className="text-[10px] text-slate-400 dark:text-slate-500">Across operational cycles</div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200/80 dark:border-slate-750">
            <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Completed Deliverables</div>
            <div className="text-lg font-bold text-[#005CBD] dark:text-blue-400 mt-0.5">
              {totalCompletedInTrend}
            </div>
            <div className="text-[10px] text-slate-400 dark:text-slate-500">Total in trend window</div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200/80 dark:border-slate-750">
            <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Active Cycles Tracked</div>
            <div className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
              {relevantWeekIds.length}
            </div>
            <div className="text-[10px] text-slate-400 dark:text-slate-500">Up to current week ({activeWeek})</div>
          </div>
        </div>

        {/* Dynamic Chart */}
        <div className="h-64 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            {velocityViewMode === 'dual' ? (
              <ComposedChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#64748B30" />
                <XAxis dataKey="week" tick={{ fontSize: 11, fill: '#64748B' }} />
                <YAxis yAxisId="left" tick={{ fontSize: 11, fill: '#64748B' }} />
                <YAxis yAxisId="right" orientation="right" domain={[0, 100]} tick={{ fontSize: 11, fill: '#10B981' }} unit="%" />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload || !payload.length) return null;
                    const data = payload[0].payload;
                    return (
                      <div className="p-3 bg-slate-900 text-white rounded-xl shadow-xl border border-slate-800 text-xs space-y-1.5">
                        <div className="font-bold text-blue-300 border-b border-slate-800 pb-1 flex items-center justify-between gap-3">
                          <span>{data.fullLabel}</span>
                          {data.isCurrent && (
                            <span className="text-[10px] bg-blue-500/20 text-blue-300 px-1.5 py-0.2 rounded">
                              Current
                            </span>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1 pt-0.5 text-[11px]">
                          <span className="text-slate-400">Completed & Approved:</span>
                          <span className="font-bold text-emerald-400 text-right">{data.Completed}</span>
                          <span className="text-slate-400">Total Assigned Tasks:</span>
                          <span className="font-bold text-white text-right">{data.Total}</span>
                          <span className="text-slate-400">Completion Velocity:</span>
                          <span className="font-bold text-[#005CBD] text-right">{data.Velocity}%</span>
                          {data.Blocked > 0 && (
                            <>
                              <span className="text-slate-400">Blocked Tasks:</span>
                              <span className="font-bold text-red-400 text-right">{data.Blocked}</span>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Bar yAxisId="left" dataKey="Completed" name="Completed Deliverables (Count)" fill="#005CBD" radius={[4, 4, 0, 0]} />
                <Bar yAxisId="left" dataKey="Total" name="Total Planned Tasks (Count)" fill="#94A3B8" opacity={0.35} radius={[4, 4, 0, 0]} />
                <Line yAxisId="right" type="monotone" dataKey="Velocity" name="Completion Velocity (%)" stroke="#10B981" strokeWidth={3} dot={{ r: 4, fill: '#10B981' }} />
              </ComposedChart>
            ) : velocityViewMode === 'velocity' ? (
              <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="velocityGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#64748B30" />
                <XAxis dataKey="week" tick={{ fontSize: 11, fill: '#64748B' }} />
                <YAxis domain={[0, 100]} unit="%" tick={{ fontSize: 11, fill: '#64748B' }} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload || !payload.length) return null;
                    const data = payload[0].payload;
                    return (
                      <div className="p-3 bg-slate-900 text-white rounded-xl shadow-xl border border-slate-800 text-xs space-y-1">
                        <div className="font-bold text-emerald-400">{data.fullLabel}</div>
                        <div className="text-[11px] text-slate-300">
                          Completion Velocity: <strong className="text-white">{data.Velocity}%</strong> ({data.Completed} of {data.Total} completed)
                        </div>
                      </div>
                    );
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="Velocity"
                  name="Completion Velocity Rate (%)"
                  stroke="#10B981"
                  fill="url(#velocityGradient)"
                  strokeWidth={2.5}
                />
              </AreaChart>
            ) : (
              <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="completedGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#005CBD" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#005CBD" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#64748B30" />
                <XAxis dataKey="week" tick={{ fontSize: 11, fill: '#64748B' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748B' }} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload || !payload.length) return null;
                    const data = payload[0].payload;
                    return (
                      <div className="p-3 bg-slate-900 text-white rounded-xl shadow-xl border border-slate-800 text-xs space-y-1">
                        <div className="font-bold text-blue-400">{data.fullLabel}</div>
                        <div className="text-[11px] text-slate-300">
                          Completed: <strong className="text-emerald-400">{data.Completed}</strong> / Total: <strong className="text-white">{data.Total}</strong>
                        </div>
                      </div>
                    );
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="Completed"
                  name="Completed Deliverables"
                  stroke="#005CBD"
                  fill="url(#completedGradient)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="Total"
                  name="Total Tasks Planned"
                  stroke="#94A3B8"
                  fill="#94A3B8"
                  fillOpacity={0.1}
                  strokeWidth={1.5}
                  strokeDasharray="4 4"
                />
              </AreaChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* Department Comparison Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-2xs">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">Department Health Comparison Table</h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Department leadership assignments, active throughput, and completion velocity
            </p>
          </div>
          {selectedDeptFilter !== 'all' && (
            <button
              onClick={() => setSelectedDeptFilter('all')}
              className="text-xs text-[#005CBD] dark:text-blue-400 font-bold hover:underline"
            >
              Reset filter to All
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-800 font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="p-4">Department</th>
                <th className="p-4">Designated Lead</th>
                <th className="p-4">Active Tasks</th>
                <th className="p-4">Approved</th>
                <th className="p-4">Completion Velocity</th>
                <th className="p-4">Status & Bottlenecks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {safeDepts
                .filter((d) => selectedDeptFilter === 'all' || d.id === selectedDeptFilter)
                .map((dept) => {
                  const dTasks = (tasks || []).filter((t) => !t.archived && t.departmentId === dept.id);
                  const approved = dTasks.filter((t) => t.status === 'Approved').length;
                  const total = dTasks.length;
                  const rate = total > 0 ? Math.round((approved / total) * 100) : 0;
                  const leads = dept.teamLeadIds || [];

                  return (
                    <tr key={dept.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="p-4 font-bold text-slate-900 dark:text-white">
                        <div className="flex items-center gap-2">
                          <span>{dept.name}</span>
                          <span className="font-mono text-[10px] text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.2 rounded">
                            {dept.code}
                          </span>
                        </div>
                      </td>
                      <td className="p-4 font-semibold text-slate-700 dark:text-slate-300">
                        {leads.length > 0
                          ? leads
                              .map((id) => (users || []).find((u) => u.id === id)?.name || 'Designated Lead')
                              .join(', ')
                          : 'No Lead Assigned (Auto-Approves)'}
                      </td>
                      <td className="p-4 font-mono font-bold text-[#005CBD] dark:text-blue-400">
                        {dTasks.length - approved}
                      </td>
                      <td className="p-4 font-mono font-bold text-emerald-600 dark:text-emerald-400">{approved}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                            <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${rate}%` }} />
                          </div>
                          <span className="font-mono text-slate-700 dark:text-slate-300 font-bold">{rate}%</span>
                        </div>
                      </td>
                      <td className="p-4">
                        {dTasks.some((t) => t.status === 'Blocked') ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 dark:bg-red-950/60 border border-red-200/50 dark:border-red-900/50 text-red-800 dark:text-red-300 flex items-center gap-1 w-fit">
                            <AlertTriangle className="w-3 h-3" /> Blockers Present
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-200/50 dark:border-emerald-900/50 text-emerald-800 dark:text-emerald-300 flex items-center gap-1 w-fit">
                            <CheckCircle2 className="w-3 h-3" /> Healthy Stream
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
