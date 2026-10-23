import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import {
  Search,
  X,
  CheckSquare,
  Users,
  Building2,
  FileText,
  MessageSquare,
  History,
  ArrowRight,
  Sparkles,
  ExternalLink,
  Clock,
  User,
  Crown,
} from 'lucide-react';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type SearchCategory = 'all' | 'tasks' | 'members' | 'departments' | 'files' | 'comments' | 'audit';

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({ isOpen, onClose }) => {
  const {
    tasks,
    users,
    departments,
    taskComments,
    auditLogs,
    setSelectedTaskId,
    setActiveView,
    setIsUserProfileOpen,
    setSelectedUserId,
  } = useApp();

  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<SearchCategory>('all');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const safeTasks = tasks || [];
  const safeUsers = users || [];
  const safeDepts = departments || [];
  const safeLogs = auditLogs || [];

  const q = query.trim().toLowerCase();

  // Search Results
  const matchedTasks = q
    ? safeTasks.filter(
        (t) =>
          !t.archived &&
          ((t.title || '').toLowerCase().includes(q) ||
            (t.description || '').toLowerCase().includes(q) ||
            (t.objective || '').toLowerCase().includes(q) ||
            (t.departmentName || '').toLowerCase().includes(q) ||
            (t.ownerName || '').toLowerCase().includes(q))
      )
    : [];

  const matchedMembers = q
    ? safeUsers.filter(
        (u) =>
          (u.name || '').toLowerCase().includes(q) ||
          (u.email || '').toLowerCase().includes(q) ||
          (u.title || '').toLowerCase().includes(q)
      )
    : [];

  const matchedDepartments = q
    ? safeDepts.filter(
        (d) =>
          !d.archived &&
          ((d.name || '').toLowerCase().includes(q) ||
            (d.code || '').toLowerCase().includes(q) ||
            (d.description || '').toLowerCase().includes(q))
      )
    : [];

  // Files / Deliverables
  const matchedFiles: { id: string; name: string; type: string; url: string; taskId: string; taskTitle: string; ownerName: string }[] = [];
  if (q) {
    safeTasks.forEach((t) => {
      if (t.deliverables) {
        t.deliverables.forEach((del) => {
          if (
            (del.name || '').toLowerCase().includes(q) ||
            (del.type || '').toLowerCase().includes(q) ||
            (del.uploadedBy || '').toLowerCase().includes(q)
          ) {
            matchedFiles.push({
              id: del.id,
              name: del.name || 'File',
              type: del.type || 'document',
              url: del.url || '#',
              taskId: t.id,
              taskTitle: t.title || 'Task',
              ownerName: del.uploadedBy || 'Team Member',
            });
          }
        });
      }
    });
  }

  // Comments
  const matchedComments: { id: string; content: string; userName: string; taskId: string; taskTitle: string; createdAt: string }[] = [];
  if (q && taskComments) {
    Object.entries(taskComments || {}).forEach(([taskId, comments]) => {
      const task = safeTasks.find((t) => t.id === taskId);
      if (task && Array.isArray(comments)) {
        comments.forEach((c: any) => {
          if ((c.content || '').toLowerCase().includes(q) || (c.userName || '').toLowerCase().includes(q)) {
            matchedComments.push({
              id: c.id,
              content: c.content || '',
              userName: c.userName || 'User',
              taskId: task.id,
              taskTitle: task.title || 'Task',
              createdAt: c.createdAt || new Date().toISOString(),
            });
          }
        });
      }
    });
  }

  // Audit Logs
  const matchedAudit = q
    ? auditLogs.filter(
        (a) =>
          (a.action || '').toLowerCase().includes(q) ||
          (a.details || '').toLowerCase().includes(q) ||
          (a.actorName || '').toLowerCase().includes(q)
      )
    : [];

  const totalResultsCount =
    matchedTasks.length +
    matchedMembers.length +
    matchedDepartments.length +
    matchedFiles.length +
    matchedComments.length +
    matchedAudit.length;

  const handleSelectTask = (taskId: string) => {
    setSelectedTaskId(taskId);
    onClose();
  };

  const handleSelectMember = (userId: string) => {
    setSelectedUserId(userId);
    setIsUserProfileOpen(true);
    onClose();
  };

  const handleSelectDepartment = (deptId: string) => {
    setActiveView('tasks');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs z-50 flex items-start justify-center pt-16 px-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-3xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Top Search Input Bar */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3 bg-slate-50/50 dark:bg-slate-800/40">
          <Search className="w-5 h-5 text-[#005CBD] dark:text-blue-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Global Search across tasks, members, departments, files, comments, audit logs..."
            className="w-full bg-transparent text-sm font-medium text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg hover:bg-slate-200/50 dark:hover:bg-slate-700/50"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="px-2.5 py-1 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
          >
            Esc
          </button>
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-1 p-2 bg-slate-100/70 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700/80 overflow-x-auto no-scrollbar shrink-0 text-xs font-semibold">
          {[
            { id: 'all', label: 'All Results', icon: Sparkles, count: totalResultsCount },
            { id: 'tasks', label: 'Tasks', icon: CheckSquare, count: matchedTasks.length },
            { id: 'members', label: 'Members', icon: Users, count: matchedMembers.length },
            { id: 'departments', label: 'Departments', icon: Building2, count: matchedDepartments.length },
            { id: 'files', label: 'Files & Deliverables', icon: FileText, count: matchedFiles.length },
            { id: 'comments', label: 'Comments', icon: MessageSquare, count: matchedComments.length },
            { id: 'audit', label: 'Audit Trail', icon: History, count: matchedAudit.length },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeCategory === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveCategory(tab.id as SearchCategory)}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-[#005CBD] text-white shadow-xs font-bold'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-700/60 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
                {q.length > 0 && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                      isActive ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Results Body */}
        <div className="p-4 overflow-y-auto space-y-6 flex-1">
          {!q ? (
            <div className="text-center py-12 space-y-3">
              <Search className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
              <div className="font-bold text-sm text-slate-700 dark:text-slate-200">Type to search across Snazzy Workspace</div>
              <p className="text-xs text-slate-400 dark:text-slate-500 max-w-sm mx-auto">
                Instant search indexes tasks, team members, department codes, deliverables, comments, and security logs.
              </p>
              <div className="flex justify-center gap-2 pt-2">
                <span className="text-[11px] bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 px-2 py-1 rounded">
                  Try "CI/CD"
                </span>
                <span className="text-[11px] bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 px-2 py-1 rounded">
                  Try "Joshua"
                </span>
                <span className="text-[11px] bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 px-2 py-1 rounded">
                  Try "Marketing"
                </span>
              </div>
            </div>
          ) : totalResultsCount === 0 ? (
            <div className="text-center py-12 space-y-2">
              <div className="font-bold text-sm text-slate-700 dark:text-slate-200">No matching results found for "{query}"</div>
              <p className="text-xs text-slate-400 dark:text-slate-500">Check spelling or search for broader keywords.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Tasks Section */}
              {(activeCategory === 'all' || activeCategory === 'tasks') && matchedTasks.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <CheckSquare className="w-3.5 h-3.5 text-[#005CBD]" />
                      <span>Tasks ({matchedTasks.length})</span>
                    </span>
                  </h4>
                  <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 overflow-hidden">
                    {matchedTasks.slice(0, activeCategory === 'all' ? 4 : 20).map((task) => (
                      <div
                        key={task.id}
                        onClick={() => handleSelectTask(task.id)}
                        className="p-3 hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer transition-colors flex items-center justify-between gap-3 group"
                      >
                        <div className="space-y-0.5 min-w-0">
                          <div className="font-bold text-xs text-slate-900 dark:text-white group-hover:text-[#005CBD] dark:group-hover:text-blue-400 transition-colors truncate">
                            {task.title}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2">
                            <span className="font-semibold text-blue-600 dark:text-blue-400">{task.departmentName}</span>
                            <span>•</span>
                            <span>Owner: {task.ownerName}</span>
                            <span>•</span>
                            <span>Week: {task.weekId}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                            {task.status}
                          </span>
                          <ArrowRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 group-hover:text-[#005CBD] dark:group-hover:text-blue-400" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Members Section */}
              {(activeCategory === 'all' || activeCategory === 'members') && matchedMembers.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                    <span>Team Members ({matchedMembers.length})</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {matchedMembers.slice(0, activeCategory === 'all' ? 4 : 20).map((user) => (
                      <div
                        key={user.id}
                        onClick={() => handleSelectMember(user.id)}
                        className="p-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 hover:border-blue-300 dark:hover:border-blue-500 hover:bg-blue-50/40 dark:hover:bg-blue-950/30 cursor-pointer transition-all flex items-center gap-3"
                      >
                        <img
                          src={
                            user.avatarUrl ||
                            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
                          }
                          alt={user.name}
                          className="w-8 h-8 rounded-full object-cover shrink-0 ring-1 ring-slate-200 dark:ring-slate-700"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="font-bold text-xs text-slate-900 dark:text-white truncate">{user.name}</div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{user.title}</div>
                        </div>
                        <span className="text-[9px] font-bold uppercase bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-1.5 py-0.5 rounded">
                          {user.role.replace('_', ' ')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Departments Section */}
              {(activeCategory === 'all' || activeCategory === 'departments') && matchedDepartments.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                    <span>Departments ({matchedDepartments.length})</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {matchedDepartments.slice(0, activeCategory === 'all' ? 4 : 20).map((dept) => (
                      <div
                        key={dept.id}
                        onClick={() => handleSelectDepartment(dept.id)}
                        className="p-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 hover:border-purple-300 dark:hover:border-purple-500 cursor-pointer transition-all space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-slate-900 dark:text-white">{dept.name}</span>
                          <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 bg-purple-50 dark:bg-purple-950/60 border border-purple-200/50 dark:border-purple-800/50 text-purple-700 dark:text-purple-300 rounded">
                            {dept.code}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">{dept.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Files & Deliverables Section */}
              {(activeCategory === 'all' || activeCategory === 'files') && matchedFiles.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>Deliverables & Files ({matchedFiles.length})</span>
                  </h4>
                  <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 overflow-hidden">
                    {matchedFiles.slice(0, activeCategory === 'all' ? 4 : 20).map((f) => (
                      <div
                        key={f.id}
                        onClick={() => handleSelectTask(f.taskId)}
                        className="p-3 hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer transition-colors flex items-center justify-between gap-3"
                      >
                        <div className="space-y-0.5 min-w-0">
                          <div className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                            <FileText className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                            <span className="truncate">{f.name}</span>
                          </div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400">
                            On Task: <span className="font-medium text-slate-700 dark:text-slate-300">{f.taskTitle}</span> • By {f.ownerName}
                          </div>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/50 dark:border-emerald-800/50 text-emerald-700 dark:text-emerald-300 rounded uppercase">
                          {f.type}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Comments Section */}
              {(activeCategory === 'all' || activeCategory === 'comments') && matchedComments.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    <span>Comments & Discussions ({matchedComments.length})</span>
                  </h4>
                  <div className="space-y-2">
                    {matchedComments.slice(0, activeCategory === 'all' ? 3 : 20).map((c) => (
                      <div
                        key={c.id}
                        onClick={() => handleSelectTask(c.taskId)}
                        className="p-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 hover:border-blue-300 dark:hover:border-blue-500 cursor-pointer transition-all space-y-1"
                      >
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-bold text-slate-900 dark:text-white">{c.userName}</span>
                          <span className="text-slate-400 dark:text-slate-500 text-[10px]">
                            {new Date(c.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-xs text-slate-700 dark:text-slate-300 italic line-clamp-2">"{c.content}"</p>
                        <div className="text-[10px] font-semibold text-[#005CBD] dark:text-blue-400 pt-0.5">
                          In Task: {c.taskTitle}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Audit Trail Section */}
              {(activeCategory === 'all' || activeCategory === 'audit') && matchedAudit.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <History className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                    <span>Audit Trail Logs ({matchedAudit.length})</span>
                  </h4>
                  <div className="border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 divide-y divide-slate-100 dark:divide-slate-700 overflow-hidden text-xs">
                    {matchedAudit.slice(0, activeCategory === 'all' ? 3 : 20).map((a) => (
                      <div key={a.id} className="p-2.5 flex items-start gap-2">
                        <History className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                        <div className="min-w-0 flex-1">
                          <div className="font-semibold text-slate-800 dark:text-slate-200">{a.details}</div>
                          <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                            By {a.actorName} • {new Date(a.timestamp).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Shortcut Helper */}
        <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-700 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span>Press <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded font-mono font-bold text-slate-700 dark:text-slate-200">Esc</kbd> to close</span>
            <span>•</span>
            <span>Click any result to inspect</span>
          </div>
          <span className="font-bold text-[#005CBD] dark:text-blue-400">Snazzy Global Index v2.0</span>
        </div>
      </div>
    </div>
  );
};
