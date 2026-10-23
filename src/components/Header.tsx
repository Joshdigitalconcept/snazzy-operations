import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { SnazzyLogo } from './SnazzyLogo';
import { GlobalSearchModal } from './GlobalSearchModal';
import {
  Search,
  Plus,
  Bell,
  CheckCircle2,
  AlertTriangle,
  FileText,
  UserCheck,
  Eye,
  Check,
  ChevronDown,
  User as UserIcon,
  Shield,
  LogOut,
  Settings,
  Clock,
  MessageSquare,
  AtSign,
  RefreshCw,
  Trash2,
  Sparkles,
  Command,
  Menu,
  Sun,
  Moon,
  ArrowRight,
} from 'lucide-react';

export const Header: React.FC = () => {
  const {
    theme,
    toggleTheme,
    currentUser,
    tasks,
    notifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    clearReadNotifications,
    clearAllNotifications,
    checkDeadlineReminders,
    setIsCreateTaskOpen,
    setSelectedTaskId,
    openTaskModal,
    setActiveView,
    setIsUserProfileOpen,
    logout,
    isMobileSidebarOpen,
    setIsMobileSidebarOpen,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isGlobalSearchOpen, setIsGlobalSearchOpen] = useState(false);
  const [notifFilter, setNotifFilter] = useState<'all' | 'deadline' | 'comment' | 'mention' | 'approval' | 'watch_update'>('all');
  const [scanMessage, setScanMessage] = useState<string | null>(null);

  // Keyboard shortcut for Global Search (Ctrl+K or Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsGlobalSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const notifRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const currentUserId = currentUser?.id || '';
  const myNotifications = (notifications || []).filter((n) => n.userId === currentUserId);
  const unreadNotifs = myNotifications.filter((n) => !n.read);

  // Filtered notifications
  const filteredNotifs = myNotifications.filter((n) => {
    if (notifFilter === 'all') return true;
    if (notifFilter === 'deadline') return n.type === 'deadline' || n.type === 'overdue';
    if (notifFilter === 'approval') return n.type === 'approval' || n.type === 'revision' || n.type === 'registration';
    return n.type === notifFilter;
  });

  const handleRunDeadlineScan = () => {
    const created = checkDeadlineReminders();
    if (created > 0) {
      setScanMessage(`Scanned deadlines: ${created} new reminder(s) generated!`);
    } else {
      setScanMessage('Scanned deadlines: All task reminders are up to date.');
    }
    setTimeout(() => setScanMessage(null), 4000);
  };

  // Close popovers on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setIsNotifOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Instant search results
  const searchResults = searchQuery.trim()
    ? tasks.filter(
        (t) =>
          !t.archived &&
          ((t.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (t.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (t.ownerName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (t.departmentName || '').toLowerCase().includes(searchQuery.toLowerCase()))
      ).slice(0, 5)
    : [];

  const handleSelectSearchResult = (taskId: string) => {
    setSelectedTaskId(taskId);
    setSearchQuery('');
    setIsSearchFocused(false);
  };

  const getNotifIcon = (type: string) => {
    switch (type) {
      case 'deadline':
      case 'overdue':
        return <Clock className="w-4 h-4 text-amber-600 shrink-0" />;
      case 'comment':
        return <MessageSquare className="w-4 h-4 text-blue-600 shrink-0" />;
      case 'mention':
        return <AtSign className="w-4 h-4 text-indigo-600 shrink-0" />;
      case 'approval':
        return <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />;
      case 'revision':
        return <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />;
      case 'registration':
        return <UserCheck className="w-4 h-4 text-purple-600 shrink-0" />;
      case 'watch_update':
        return <Eye className="w-4 h-4 text-purple-600 shrink-0" />;
      default:
        return <FileText className="w-4 h-4 text-slate-500 shrink-0" />;
    }
  };

  return (
    <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30 px-3 sm:px-4 py-2 sm:py-2.5 flex items-center justify-between shadow-2xs gap-2 transition-colors">
      <div className="flex items-center gap-2 sm:gap-4 lg:gap-6 min-w-0">
        {/* Mobile Hamburger Menu Button */}
        <button
          onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
          className="md:hidden p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors shrink-0"
          aria-label="Toggle navigation drawer"
        >
          <Menu className="w-5 h-5" />
        </button>

        <SnazzyLogo size="md" textColor="text-[#00224D] dark:text-white" subtextColor="text-slate-500 dark:text-slate-400" />

        {/* Search Bar - Desktop & Tablet */}
        <div className="hidden sm:block relative w-48 md:w-64 lg:w-96">
          <button
            onClick={() => setIsGlobalSearchOpen(true)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-100/90 dark:bg-slate-800 hover:bg-slate-200/80 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between transition-all group shadow-2xs"
          >
            <div className="flex items-center gap-2 truncate">
              <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 group-hover:text-[#005CBD] dark:group-hover:text-blue-400 shrink-0" />
              <span className="truncate">Search tasks, members, depts...</span>
            </div>
            <kbd className="hidden lg:inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-400 rounded text-[10px] font-mono font-bold shrink-0">
              <Command className="w-2.5 h-2.5" /> K
            </kbd>
          </button>
        </div>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
        {/* Search Icon button for mobile only */}
        <button
          onClick={() => setIsGlobalSearchOpen(true)}
          className="sm:hidden p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
          title="Search"
        >
          <Search className="w-4 h-4" />
        </button>

        {/* Quick New Task Button */}
        <button
          onClick={() => setIsCreateTaskOpen(true)}
          className="flex items-center gap-1 bg-[#005CBD] hover:bg-[#0051B8] text-white px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold shadow-xs transition-all active:scale-98"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">New Task</span>
        </button>

        {/* Light / Dark Mode Toggle */}
        <button
          onClick={toggleTheme}
          aria-label="Toggle light/dark theme"
          className="p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-slate-600" />
          )}
        </button>

        {/* Notifications Popover */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className="p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg relative transition-colors"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadNotifs.length > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#ED8231] ring-2 ring-white dark:ring-slate-900 animate-pulse" />
            )}
          </button>

          {isNotifOpen && (
            <div className="absolute right-0 top-full mt-2 w-80 sm:w-[420px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
              {/* Header Bar */}
              <div className="p-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/70 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-xs text-slate-800 dark:text-white flex items-center gap-1.5">
                      <Bell className="w-3.5 h-3.5 text-[#005CBD] dark:text-blue-400" />
                      <span>Notifications Center</span>
                    </h4>
                    {unreadNotifs.length > 0 && (
                      <span className="bg-[#ED8231] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                        {unreadNotifs.length} new
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleRunDeadlineScan}
                      className="text-[10px] font-bold text-slate-700 dark:text-slate-200 hover:text-[#005CBD] dark:hover:text-blue-400 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-blue-300 px-2 py-1 rounded-lg flex items-center gap-1 shadow-2xs transition-all"
                      title="Run Deadline Reminder Check"
                    >
                      <RefreshCw className="w-3 h-3 text-[#005CBD] dark:text-blue-400" />
                      <span>Scan Deadlines</span>
                    </button>
                    {unreadNotifs.length > 0 && (
                      <button
                        onClick={markAllNotificationsAsRead}
                        className="text-[10px] font-bold text-[#005CBD] dark:text-blue-400 hover:underline flex items-center gap-1"
                      >
                        <Check className="w-3 h-3" /> Mark all read
                      </button>
                    )}
                  </div>
                </div>

                {/* Scan Feedback Banner */}
                {scanMessage && (
                  <div className="bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 p-2 rounded-lg text-[11px] font-semibold text-[#005CBD] dark:text-blue-300 flex items-center gap-1.5 animate-in fade-in">
                    <Sparkles className="w-3.5 h-3.5 shrink-0" />
                    <span>{scanMessage}</span>
                  </div>
                )}

                {/* Category Filter Tabs */}
                <div className="flex items-center gap-1 overflow-x-auto pt-1 pb-0.5 no-scrollbar">
                  {[
                    { id: 'all', label: 'All', count: myNotifications.length },
                    {
                      id: 'deadline',
                      label: 'Deadlines',
                      count: myNotifications.filter((n) => n.type === 'deadline' || n.type === 'overdue').length,
                    },
                    {
                      id: 'comment',
                      label: 'Comments',
                      count: myNotifications.filter((n) => n.type === 'comment').length,
                    },
                    {
                      id: 'mention',
                      label: 'Mentions',
                      count: myNotifications.filter((n) => n.type === 'mention').length,
                    },
                    {
                      id: 'approval',
                      label: 'Approvals',
                      count: myNotifications.filter((n) => n.type === 'approval' || n.type === 'revision' || n.type === 'registration').length,
                    },
                    {
                      id: 'watch_update',
                      label: 'Watched',
                      count: myNotifications.filter((n) => n.type === 'watch_update').length,
                    },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setNotifFilter(tab.id as typeof notifFilter)}
                      className={`px-2 py-1 rounded-lg text-[10px] font-bold whitespace-nowrap transition-all flex items-center gap-1 ${
                        notifFilter === tab.id
                          ? 'bg-[#005CBD] text-white shadow-2xs'
                          : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800 border border-slate-200/60 dark:border-slate-700'
                      }`}
                    >
                      <span>{tab.label}</span>
                      {tab.count > 0 && (
                        <span
                          className={`text-[9px] px-1 rounded-full ${
                            notifFilter === tab.id ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                          }`}
                        >
                          {tab.count}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notification List */}
              <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-80 overflow-y-auto">
                {filteredNotifs.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400">
                    No {notifFilter !== 'all' ? notifFilter : ''} notifications found.
                  </div>
                ) : (
                  filteredNotifs.map((notif) => (
                    <div
                      key={notif.id}
                      onClick={() => {
                        markNotificationAsRead(notif.id);
                        if (notif.taskId) {
                          const targetTab = notif.type === 'mention' || notif.type === 'comment' ? 'comments' : 'details';
                          openTaskModal(notif.taskId, targetTab);
                          setIsNotifOpen(false);
                        }
                      }}
                      className={`p-3 text-xs cursor-pointer transition-colors flex items-start gap-2.5 ${
                        notif.read ? 'bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/60' : 'bg-blue-50/50 dark:bg-blue-950/30 hover:bg-blue-50/80 dark:hover:bg-blue-950/50 font-medium'
                      }`}
                    >
                      <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 shrink-0 mt-0.5">{getNotifIcon(notif.type)}</div>
                      <div className="flex-1 min-w-0 space-y-0.5">
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-bold text-slate-900 dark:text-white truncate">{notif.title}</span>
                          <span className="text-[9px] font-semibold text-slate-400 shrink-0">
                            {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed line-clamp-2">{notif.message}</p>
                        <div className="flex items-center justify-between pt-1">
                          <span className="text-[9px] uppercase tracking-wider font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.2 rounded">
                            {notif.type.replace('_', ' ')}
                          </span>
                          {notif.taskId && (
                            <span className="text-[10px] font-bold text-[#005CBD] dark:text-blue-400 hover:underline inline-flex items-center gap-1">
                              <span>{notif.type === 'mention' || notif.type === 'comment' ? 'Open Discussion' : 'View Task'}</span>
                              <ArrowRight className="w-3 h-3" />
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Footer Actions */}
              <div className="p-2 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 flex items-center justify-between text-[11px]">
                <button
                  onClick={clearReadNotifications}
                  className="text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white font-medium px-2 py-1 rounded hover:bg-slate-200/50 dark:hover:bg-slate-700 flex items-center gap-1"
                >
                  <Trash2 className="w-3 h-3" /> Clear read
                </button>
                <button
                  onClick={clearAllNotifications}
                  className="text-red-500 dark:text-red-400 hover:text-red-700 font-medium px-2 py-1 rounded hover:bg-red-50 dark:hover:bg-red-950/50 flex items-center gap-1"
                >
                  Clear all
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User Profile Badge & Dropdown */}
        <div className="relative pl-2 border-l border-slate-200 dark:border-slate-800" ref={userMenuRef}>
          <button
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className="flex items-center gap-2 p-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <img
              src={
                currentUser.avatarUrl ||
                'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
              }
              alt={currentUser.name}
              className="w-8 h-8 rounded-full object-cover ring-2 ring-slate-200 dark:ring-slate-700 shrink-0"
            />
            <div className="hidden sm:block text-left leading-tight">
              <div className="font-semibold text-xs text-slate-900 dark:text-slate-100 flex items-center gap-1">
                {currentUser.name}
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate max-w-[120px]">{currentUser.title}</div>
            </div>
          </button>

          {isUserMenuOpen && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-1.5 z-50 animate-in fade-in slide-in-from-top-2 text-xs">
              <div className="p-2.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/70 rounded-xl mb-1">
                <div className="font-bold text-slate-900 dark:text-white">{currentUser.name}</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{currentUser.email}</div>
                <div className="mt-1">
                  <span className="bg-blue-100 dark:bg-blue-900/50 text-[#005CBD] dark:text-blue-300 font-bold text-[10px] px-2 py-0.5 rounded uppercase tracking-wider">
                    {currentUser.role.replace('_', ' ')}
                  </span>
                </div>
              </div>

              <button
                onClick={() => {
                  setIsUserProfileOpen(true);
                  setIsUserMenuOpen(false);
                }}
                className="w-full text-left p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2 transition-colors"
              >
                <UserIcon className="w-4 h-4 text-[#005CBD] dark:text-blue-400" /> My Profile & Settings
              </button>

              {currentUser.role === 'admin' && (
                <button
                  onClick={() => {
                    setActiveView('admin');
                    setIsUserMenuOpen(false);
                  }}
                  className="w-full text-left p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2 transition-colors"
                >
                  <Shield className="w-4 h-4 text-purple-600 dark:text-purple-400" /> Admin Control Center
                </button>
              )}

              <div className="my-1 border-t border-slate-100 dark:border-slate-800" />

              <button
                onClick={() => {
                  setIsUserMenuOpen(false);
                  logout();
                }}
                className="w-full text-left p-2 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl font-bold text-red-600 dark:text-red-400 flex items-center gap-2 transition-colors"
              >
                <LogOut className="w-4 h-4" /> Sign Out
              </button>
            </div>
          )}
        </div>
      </div>

      <GlobalSearchModal isOpen={isGlobalSearchOpen} onClose={() => setIsGlobalSearchOpen(false)} />
    </header>
  );
};
