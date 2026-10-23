import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Download,
  FileText,
  User,
  Building2,
  PieChart,
  CheckCircle2,
  Clock,
  TrendingUp,
} from 'lucide-react';

export const ReportsView: React.FC = () => {
  const { tasks, currentUser, departments } = useApp();
  const [reportTab, setReportTab] = useState<'personal' | 'department' | 'organization'>('personal');

  // Personal Stats
  const allTasks = tasks || [];
  const myTasks = allTasks.filter((t) => !t.archived && t.ownerId === currentUser?.id);
  const myActive = myTasks.filter((t) => t.status !== 'Approved').length;
  const myApproved = myTasks.filter((t) => t.status === 'Approved').length;
  const myAvgProgress = myTasks.length > 0
    ? Math.round(myTasks.reduce((acc, t) => acc + (t.progressPercent || 0), 0) / myTasks.length)
    : 0;

  // CSV Export handler
  const exportToCSV = () => {
    const headers = ['ID', 'Title', 'Department', 'Owner', 'Priority', 'Status', 'Progress %', 'Deadline'];
    const rows = allTasks.map((t) => [
      t.id,
      `"${(t.title || '').replace(/"/g, '""')}"`,
      `"${t.departmentName || ''}"`,
      `"${t.ownerName || ''}"`,
      t.priority || '',
      t.status || '',
      t.progressPercent || 0,
      t.deadline || '',
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Snazzy_Operations_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-3.5 sm:p-6 space-y-4 sm:space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 sm:p-5 rounded-2xl shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">Operational Performance Reports</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Detailed performance tracking and data export for individual members, departments, and organization.
          </p>
        </div>

        <button
          onClick={exportToCSV}
          className="bg-[#005CBD] hover:bg-[#0051B8] text-white px-4 py-2 rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all self-start sm:self-auto"
        >
          <Download className="w-4 h-4" /> Export Operations CSV
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 dark:border-slate-800 flex items-center gap-4 sm:gap-6 text-xs font-bold text-slate-500 dark:text-slate-400 overflow-x-auto no-scrollbar pb-1">
        <button
          onClick={() => setReportTab('personal')}
          className={`py-2 sm:py-3 border-b-2 transition-colors flex items-center gap-1.5 shrink-0 ${
            reportTab === 'personal'
              ? 'border-[#005CBD] dark:border-blue-400 text-[#005CBD] dark:text-blue-400'
              : 'border-transparent hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <User className="w-4 h-4" /> Personal Performance
        </button>
        <button
          onClick={() => setReportTab('department')}
          className={`py-2 sm:py-3 border-b-2 transition-colors flex items-center gap-1.5 shrink-0 ${
            reportTab === 'department'
              ? 'border-[#005CBD] dark:border-blue-400 text-[#005CBD] dark:text-blue-400'
              : 'border-transparent hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Building2 className="w-4 h-4" /> Department Performance
        </button>
        <button
          onClick={() => setReportTab('organization')}
          className={`py-2 sm:py-3 border-b-2 transition-colors flex items-center gap-1.5 shrink-0 ${
            reportTab === 'organization'
              ? 'border-[#005CBD] dark:border-blue-400 text-[#005CBD] dark:text-blue-400'
              : 'border-transparent hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <PieChart className="w-4 h-4" /> Organization Performance
        </button>
      </div>

      {/* Content */}
      {reportTab === 'personal' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl space-y-1">
              <div className="text-xs font-medium text-slate-500 dark:text-slate-400">Active Tasks</div>
              <div className="text-2xl font-bold text-slate-900 dark:text-white">{myActive}</div>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl space-y-1">
              <div className="text-xs font-medium text-slate-500 dark:text-slate-400">Completed & Approved</div>
              <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{myApproved}</div>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl space-y-1">
              <div className="text-xs font-medium text-slate-500 dark:text-slate-400">Average Completion</div>
              <div className="text-2xl font-bold text-[#005CBD] dark:text-blue-400">{myAvgProgress}%</div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">My Task History Breakdown</h3>
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {myTasks.map((t) => (
                <div key={t.id} className="py-3 text-xs flex items-center justify-between">
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white">{t.title}</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">{t.departmentName} • {t.priority}</div>
                  </div>
                  <span className="font-bold text-slate-700 dark:text-slate-300">{t.status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {reportTab === 'department' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white">Department Summary Matrix</h3>
          <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
            {departments.map((dept) => {
              const deptTasks = tasks.filter((t) => t.departmentId === dept.id);
              const approved = deptTasks.filter((t) => t.status === 'Approved').length;
              return (
                <div key={dept.id} className="py-3 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white">{dept.name}</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">{dept.description}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-[#005CBD] dark:text-blue-400">{approved} / {deptTasks.length} Approved</div>
                    <div className="text-[10px] text-slate-400 dark:text-slate-500">Total Tasks Created</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {reportTab === 'organization' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#005CBD] dark:text-blue-400" />
            <span>Organization Execution Velocity</span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
              <div className="text-[11px] text-slate-500 dark:text-slate-400">Total Operational Tasks</div>
              <div className="text-xl font-bold text-slate-900 dark:text-white mt-1">
                {allTasks.filter((t) => !t.archived).length}
              </div>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
              <div className="text-[11px] text-slate-500 dark:text-slate-400">Completed & Approved</div>
              <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                {allTasks.filter((t) => !t.archived && t.status === 'Approved').length}
              </div>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
              <div className="text-[11px] text-slate-500 dark:text-slate-400">Overall Completion Velocity</div>
              <div className="text-xl font-bold text-[#005CBD] dark:text-blue-400 mt-1">
                {allTasks.filter((t) => !t.archived).length > 0
                  ? Math.round(
                      (allTasks.filter((t) => !t.archived && t.status === 'Approved').length /
                        allTasks.filter((t) => !t.archived).length) *
                        100
                    )
                  : 0}
                %
              </div>
            </div>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300">
            Total operational tasks across all departments: <strong className="text-slate-900 dark:text-white">{allTasks.length}</strong> (Formula: Approved Deliverables ÷ Total Operational Tasks × 100%).
          </p>
        </div>
      )}
    </div>
  );
};
