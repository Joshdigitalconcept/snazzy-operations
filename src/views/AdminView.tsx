import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { User, UserRole, RegistrationStatus, SiteAnnouncement, AnnouncementCategory } from '../types';
import { parseCloudinaryUrl } from '../utils/workdriveUtils';
import {
  Shield,
  UserCheck,
  Building2,
  FileText,
  Bug,
  RotateCcw,
  Plus,
  Check,
  X,
  Crown,
  Trash2,
  Archive,
  Edit2,
  Lock,
  Search,
  Filter,
  Users,
  Edit3,
  XCircle,
  CheckCircle2,
  ArrowRight,
  FolderSync,
  Cloud,
  ExternalLink,
  RefreshCw,
  Key,
  Folder,
  CheckCircle,
  AlertCircle,
  Sparkles,
  Megaphone,
  Eye,
  BellRing,
} from 'lucide-react';

export const AdminView: React.FC = () => {
  const {
    currentUser,
    users,
    departments,
    auditLogs,
    bugReports,
    approveRegistration,
    rejectRegistration,
    updateUserRole,
    updateUser,
    assignTeamLead,
    removeTeamLead,
    createDepartment,
    updateDepartment,
    archiveDepartment,
    unarchiveDepartment,
    deleteDepartment,
    addMemberToDepartment,
    removeMemberFromDepartment,
    setDepartmentMembers,
    tasks,
    restoreTask,
    cloudinaryConfig,
    updateCloudinaryConfig,
    adminTab,
    setAdminTab,
    openMemberProfile,
    announcements,
    createAnnouncement,
    updateAnnouncement,
    toggleAnnouncement,
    deleteAnnouncement,
    republishAnnouncement,
    setPreviewAnnouncement,
  } = useApp();

  const safeUsers = users || [];
  const safeDepts = departments || [];
  const safeTasks = tasks || [];
  const safeBugs = bugReports || [];
  const safeLogs = auditLogs || [];

  // User management state
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userStatusFilter, setUserStatusFilter] = useState<'all' | 'approved' | 'pending' | 'rejected'>('all');
  const [userRoleFilter, setUserRoleFilter] = useState<'all' | 'team_member' | 'business_ops' | 'admin'>('all');
  const [userDeptFilter, setUserDeptFilter] = useState<string>('all');

  // Edit user modal state
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editUserName, setEditUserName] = useState('');
  const [editUserRole, setEditUserRole] = useState<UserRole>('team_member');
  const [editUserStatus, setEditUserStatus] = useState<RegistrationStatus>('approved');
  const [editUserDeptId, setEditUserDeptId] = useState<string>('');

  const openEditUserModal = (user: User) => {
    setEditingUser(user);
    setEditUserName(user.name);
    setEditUserRole(user.role);
    setEditUserStatus(user.registrationStatus);
    setEditUserDeptId((user?.departmentIds || []).length > 0 ? user.departmentIds[0] : (safeDepts[0]?.id || ''));
  };

  const handleSaveUserEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    updateUser(editingUser.id, {
      name: editUserName,
      role: editUserRole,
      registrationStatus: editUserStatus,
      departmentIds: editUserDeptId ? [editUserDeptId] : [],
    });
    setEditingUser(null);
  };

  // Registration approvals queue
  const pendingRegistrations = safeUsers.filter((u) => u.registrationStatus === 'pending');

  // Department management state
  const [deptFilterStatus, setDeptFilterStatus] = useState<'active' | 'archived' | 'all'>('active');
  const [deptSearchQuery, setDeptSearchQuery] = useState('');
  const [showDeptModal, setShowDeptModal] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<import('../types').Department | null>(null);
  const [deptFormName, setDeptFormName] = useState('');
  const [deptFormCode, setDeptFormCode] = useState('');
  const [deptFormDesc, setDeptFormDesc] = useState('');
  const [deptFormLeadIds, setDeptFormLeadIds] = useState<string[]>([]);
  const [deptFormMemberIds, setDeptFormMemberIds] = useState<string[]>([]);

  const openCreateDeptModal = () => {
    setEditingDepartment(null);
    setDeptFormName('');
    setDeptFormCode('');
    setDeptFormDesc('');
    setDeptFormLeadIds([]);
    setDeptFormMemberIds([]);
    setShowDeptModal(true);
  };

  const openEditDeptModal = (dept: import('../types').Department) => {
    setEditingDepartment(dept);
    setDeptFormName(dept.name);
    setDeptFormCode(dept.name.trim().toLowerCase() === 'community' ? 'Community' : dept.code);
    setDeptFormDesc(dept.description);
    setDeptFormLeadIds(dept.teamLeadIds || []);
    const currentMembers = users.filter((u) => (u.departmentIds || []).includes(dept.id)).map((u) => u.id);
    setDeptFormMemberIds(currentMembers);
    setShowDeptModal(true);
  };

  const handleDepartmentFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!deptFormName.trim() || !deptFormCode.trim()) return;

    const isCommunity = deptFormName.trim().toLowerCase() === 'community';
    const finalCode = isCommunity ? 'Community' : deptFormCode.toUpperCase();

    if (editingDepartment) {
      updateDepartment(editingDepartment.id, {
        name: deptFormName,
        code: finalCode,
        description: deptFormDesc,
        teamLeadIds: deptFormLeadIds,
      });
      setDepartmentMembers(editingDepartment.id, deptFormMemberIds);
    } else {
      createDepartment(
        deptFormName,
        finalCode,
        deptFormDesc,
        deptFormLeadIds,
        deptFormMemberIds
      );
    }
    setShowDeptModal(false);
  };

  const toggleDeptLead = (userId: string) => {
    setDeptFormLeadIds((prev) =>
      (prev || []).includes(userId) ? (prev || []).filter((id) => id !== userId) : [...(prev || []), userId]
    );
  };

  const toggleDeptMember = (userId: string) => {
    setDeptFormMemberIds((prev) =>
      (prev || []).includes(userId) ? (prev || []).filter((id) => id !== userId) : [...(prev || []), userId]
    );
  };

  const archivedTasks = safeTasks.filter((t) => t.archived);

  // Site Dialogs / Announcements management state
  const safeAnnouncements = announcements || [];
  const activeDialogsCount = safeAnnouncements.filter((a) => a.enabled).length;
  const [showDialogModal, setShowDialogModal] = useState(false);
  const [editingDialog, setEditingDialog] = useState<SiteAnnouncement | null>(null);
  const [dialogTitle, setDialogTitle] = useState('');
  const [dialogSummary, setDialogSummary] = useState('');
  const [dialogHighlightsText, setDialogHighlightsText] = useState('');
  const [dialogCategory, setDialogCategory] = useState<AnnouncementCategory>('feature');
  const [dialogEnabled, setDialogEnabled] = useState(true);
  const [dialogActionView, setDialogActionView] = useState<string>('');
  const [dialogActionLabel, setDialogActionLabel] = useState('');
  const [dialogSaving, setDialogSaving] = useState(false);
  const [trackingDialogId, setTrackingDialogId] = useState<string | null>(null);
  const [trackingFilter, setTrackingFilter] = useState<'seen' | 'unseen' | 'all'>('seen');
  const [trackingSearch, setTrackingSearch] = useState('');

  const openCreateDialogModal = () => {
    setEditingDialog(null);
    setDialogTitle('');
    setDialogSummary('');
    setDialogHighlightsText('');
    setDialogCategory('feature');
    setDialogEnabled(true);
    setDialogActionView('');
    setDialogActionLabel('');
    setShowDialogModal(true);
  };

  const openEditDialogModal = (item: SiteAnnouncement) => {
    setEditingDialog(item);
    setDialogTitle(item.title);
    setDialogSummary(item.summary);
    setDialogHighlightsText((item.highlights || []).join('\n'));
    setDialogCategory(item.category || 'feature');
    setDialogEnabled(Boolean(item.enabled));
    setDialogActionView(item.actionView || '');
    setDialogActionLabel(item.actionLabel || '');
    setShowDialogModal(true);
  };

  const handleSaveDialogForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dialogTitle.trim() || !dialogSummary.trim()) return;
    setDialogSaving(true);
    const parsedHighlights = dialogHighlightsText
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);

    try {
      if (editingDialog) {
        await updateAnnouncement(editingDialog.id, {
          title: dialogTitle.trim(),
          summary: dialogSummary.trim(),
          highlights: parsedHighlights,
          category: dialogCategory,
          enabled: dialogEnabled,
          actionView: (dialogActionView || undefined) as SiteAnnouncement['actionView'],
          actionLabel: dialogActionView ? dialogActionLabel.trim() || undefined : undefined,
        });
      } else {
        await createAnnouncement({
          title: dialogTitle.trim(),
          summary: dialogSummary.trim(),
          highlights: parsedHighlights,
          category: dialogCategory,
          enabled: dialogEnabled,
          actionView: (dialogActionView || undefined) as SiteAnnouncement['actionView'],
          actionLabel: dialogActionView ? dialogActionLabel.trim() || undefined : undefined,
        });
      }
      setShowDialogModal(false);
    } finally {
      setDialogSaving(false);
    }
  };

  // Cloudinary config local form state (Zoho WorkDrive suspended)
  const [cldEnabled, setCldEnabled] = useState(cloudinaryConfig.enabled ?? true);
  const [cldCloudName, setCldCloudName] = useState(cloudinaryConfig.cloudName || 'ho0rjsyi');
  const [cldApiKey, setCldApiKey] = useState(cloudinaryConfig.apiKey || '988431174297845');
  const [cldApiSecret, setCldApiSecret] = useState(cloudinaryConfig.apiSecret || 'yMLqH9UDbz9SJRPNTLTSgPlxwlg');
  const [cldUploadPreset, setCldUploadPreset] = useState(cloudinaryConfig.uploadPreset || 'ml_default');
  const [cldUrlQuickPaste, setCldUrlQuickPaste] = useState('');
  const [cldRootFolder, setCldRootFolder] = useState(cloudinaryConfig.rootFolder || 'Deliverables');
  const [cldAutoCycle, setCldAutoCycle] = useState(cloudinaryConfig.autoCycleFolder ?? true);
  const [cldUseDeptCode, setCldUseDeptCode] = useState(cloudinaryConfig.useDepartmentCode ?? false);
  const [cldConnected, setCldConnected] = useState(cloudinaryConfig.connected ?? true);
  const [cldSavedSuccess, setCldSavedSuccess] = useState(false);
  const [cldTestingConnection, setCldTestingConnection] = useState(false);
  const [cldTestResult, setCldTestResult] = useState<{ success: boolean; message: string; details?: any } | null>(null);

  React.useEffect(() => {
    if (cloudinaryConfig.cloudName) {
      setCldCloudName(cloudinaryConfig.cloudName);
    }
    if (cloudinaryConfig.apiKey) {
      setCldApiKey(cloudinaryConfig.apiKey);
    }
    if (cloudinaryConfig.apiSecret) {
      setCldApiSecret(cloudinaryConfig.apiSecret);
    }
    if (cloudinaryConfig.uploadPreset) {
      setCldUploadPreset(cloudinaryConfig.uploadPreset);
    }
    if (cloudinaryConfig.connected !== undefined) {
      setCldConnected(cloudinaryConfig.connected);
    }
  }, [
    cloudinaryConfig.cloudName,
    cloudinaryConfig.apiKey,
    cloudinaryConfig.apiSecret,
    cloudinaryConfig.uploadPreset,
    cloudinaryConfig.connected,
  ]);

  const handleCloudinaryUrlChange = (raw: string) => {
    setCldUrlQuickPaste(raw);
    const parsed = parseCloudinaryUrl(raw);
    if (parsed) {
      setCldCloudName(parsed.cloudName);
      setCldApiKey(parsed.apiKey);
      setCldApiSecret(parsed.apiSecret);
    }
  };

  const handleSaveCloudinaryConfig = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedFromUrl = parseCloudinaryUrl(cldUrlQuickPaste);
    const effectiveCloudName = (parsedFromUrl?.cloudName || cldCloudName || cloudinaryConfig.cloudName || 'ho0rjsyi').trim();
    const effectiveApiKey = (parsedFromUrl?.apiKey || cldApiKey || cloudinaryConfig.apiKey || '988431174297845').trim();
    const effectiveApiSecret = (parsedFromUrl?.apiSecret || cldApiSecret || cloudinaryConfig.apiSecret || 'yMLqH9UDbz9SJRPNTLTSgPlxwlg').trim();
    const effectivePreset = (cldUploadPreset || cloudinaryConfig.uploadPreset || 'ml_default').trim();

    const isReady = Boolean(
      effectiveCloudName && ((effectiveApiKey && effectiveApiSecret) || effectivePreset)
    );

    updateCloudinaryConfig({
      enabled: cldEnabled,
      cloudName: effectiveCloudName,
      apiKey: effectiveApiKey,
      apiSecret: effectiveApiSecret,
      uploadPreset: effectivePreset,
      rootFolder: cldRootFolder.trim() || 'Deliverables',
      autoCycleFolder: cldAutoCycle,
      namingConvention: 'department_username_[index]',
      useDepartmentCode: cldUseDeptCode,
      connected: isReady ? true : cldConnected,
      lastSyncedAt: new Date().toISOString(),
    });
    if (isReady) {
      setCldConnected(true);
    }
    setCldSavedSuccess(true);
    setTimeout(() => setCldSavedSuccess(false), 3000);
  };

  const handleTestCloudinaryConnection = async () => {
    setCldTestingConnection(true);
    setCldTestResult(null);

    const parsedFromUrl = parseCloudinaryUrl(cldUrlQuickPaste);
    const effectiveCloudName = (parsedFromUrl?.cloudName || cldCloudName || cloudinaryConfig.cloudName || 'ho0rjsyi').trim();
    const effectiveApiKey = (parsedFromUrl?.apiKey || cldApiKey || cloudinaryConfig.apiKey || '988431174297845').trim();
    const effectiveApiSecret = (parsedFromUrl?.apiSecret || cldApiSecret || cloudinaryConfig.apiSecret || 'yMLqH9UDbz9SJRPNTLTSgPlxwlg').trim();
    const effectivePreset = (cldUploadPreset || cloudinaryConfig.uploadPreset || 'ml_default').trim();

    try {
      let res: Response | null = null;
      let rawText = '';

      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          res = await fetch('/api/cloudinary/test-connection', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              cloudName: effectiveCloudName,
              apiKey: effectiveApiKey,
              apiSecret: effectiveApiSecret,
              uploadPreset: effectivePreset,
              cloudinaryUrl: cldUrlQuickPaste.trim() || undefined,
            }),
          });

          rawText = await res.text();
          if (res.ok && !rawText.toLowerCase().includes('<!doctype')) {
            break;
          }
        } catch (fetchErr) {
          if (attempt === 2) throw fetchErr;
          await new Promise((r) => setTimeout(r, 1000));
        }
      }

      let data: any = null;
      try {
        data = JSON.parse(rawText);
      } catch {
        const isHtml =
          rawText.toLowerCase().includes('<!doctype') ||
          rawText.toLowerCase().includes('<html') ||
          rawText.toLowerCase().includes('<body') ||
          rawText.includes('FUNCTION_INVOCATION_FAILED');
        throw new Error(
          isHtml
            ? 'The server returned an HTML error page instead of JSON. Ensure Vercel environment variables are configured and the serverless function is deployed.'
            : 'Server returned an invalid response format.'
        );
      }

      if (res && res.ok && data?.success) {
        setCldConnected(true);
        setCldTestResult({
          success: true,
          message:
            data.message ||
            `Connected to Cloudinary Cloud "${data.cloudName || effectiveCloudName}" (${data.mode || 'Signed Upload'}).`,
          details: data,
        });
        updateCloudinaryConfig({
          cloudName: effectiveCloudName,
          apiKey: effectiveApiKey,
          apiSecret: effectiveApiSecret,
          uploadPreset: effectivePreset,
          connected: true,
          lastSyncedAt: new Date().toISOString(),
        });
      } else {
        setCldConnected(false);
        setCldTestResult({
          success: false,
          message: data?.error || data?.details || 'Cloudinary rejected the provided credentials.',
          details: data,
        });
      }
    } catch (err: any) {
      setCldConnected(false);
      const isFetchErr = err?.message?.toLowerCase().includes('failed to fetch') || err?.name === 'TypeError';
      setCldTestResult({
        success: false,
        message: isFetchErr
          ? 'Could not connect to the backend server. The development server may be warming up. Please wait a few seconds and try again.'
          : (err.message || 'Failed to reach Cloudinary verification endpoint.'),
        error: err?.message,
      });
    } finally {
      setCldTestingConnection(false);
    }
  };

  return (
    <div className="p-3.5 sm:p-6 space-y-4 sm:space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#001C42] to-[#00224D] text-white p-4 sm:p-5 rounded-2xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-purple-500/20 text-purple-300 text-[10px] font-bold px-2 py-0.5 rounded border border-purple-400/30">
              Technical Administrator
            </span>
            <span className="text-slate-400 text-xs">• System Operations</span>
          </div>
          <h1 className="text-lg sm:text-xl font-bold text-white mt-1">Admin Operations Center</h1>
        </div>

        <div className="flex items-center gap-2">
          {pendingRegistrations.length > 0 && (
            <span className="bg-[#ED8231] text-white text-xs font-bold px-3 py-1 rounded-xl">
              {pendingRegistrations.length} Registration Request(s) Pending
            </span>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 dark:border-slate-800 flex items-center gap-4 sm:gap-6 text-xs font-bold text-slate-500 dark:text-slate-400 overflow-x-auto no-scrollbar pb-1">
        <button
          onClick={() => setAdminTab('registrations')}
          className={`py-3 border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
            adminTab === 'registrations' ? 'border-[#005CBD] text-[#005CBD] dark:text-blue-400' : 'border-transparent hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>Pending Registrations</span>
          {pendingRegistrations.length > 0 && (
            <span className="bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 text-[10px] font-bold px-1.5 py-0.2 rounded-full">
              {pendingRegistrations.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setAdminTab('users')}
          className={`py-3 border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
            adminTab === 'users' ? 'border-[#005CBD] text-[#005CBD] dark:text-blue-400' : 'border-transparent hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Shield className="w-4 h-4" /> User Management
        </button>

        <button
          onClick={() => setAdminTab('departments')}
          className={`py-3 border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
            adminTab === 'departments' ? 'border-[#005CBD] text-[#005CBD] dark:text-blue-400' : 'border-transparent hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Building2 className="w-4 h-4" /> Departments & Team Leads
        </button>

        <button
          onClick={() => setAdminTab('cloudinary')}
          className={`py-3 border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
            adminTab === 'cloudinary' ? 'border-[#005CBD] text-[#005CBD] dark:text-blue-400' : 'border-transparent hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Cloud className="w-4 h-4" /> Cloudinary Storage
        </button>

        <button
          onClick={() => setAdminTab('announcements')}
          className={`py-3 border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
            adminTab === 'announcements' ? 'border-[#005CBD] text-[#005CBD] dark:text-blue-400' : 'border-transparent hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Megaphone className="w-4 h-4" />
          <span>Site Dialogs</span>
          {activeDialogsCount > 0 && (
            <span className="bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold px-1.5 py-0.2 rounded-full tabular-nums">
              {activeDialogsCount} On
            </span>
          )}
        </button>

        <button
          onClick={() => setAdminTab('audit')}
          className={`py-3 border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
            adminTab === 'audit' ? 'border-[#005CBD] text-[#005CBD] dark:text-blue-400' : 'border-transparent hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <FileText className="w-4 h-4" /> Immutable Audit Logs
        </button>

        <button
          onClick={() => setAdminTab('bugs')}
          className={`py-3 border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
            adminTab === 'bugs' ? 'border-[#005CBD] text-[#005CBD] dark:text-blue-400' : 'border-transparent hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Bug className="w-4 h-4" /> Bug Reports ({safeBugs.length})
        </button>

        <button
          onClick={() => setAdminTab('restore')}
          className={`py-3 border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
            adminTab === 'restore' ? 'border-[#005CBD] text-[#005CBD] dark:text-blue-400' : 'border-transparent hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <RotateCcw className="w-4 h-4" /> Data Restore ({archivedTasks.length})
        </button>
      </div>

      {/* Tab 1: Pending Registrations */}
      {adminTab === 'registrations' && (
        <div className="space-y-4">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white">User Registration Approvals Queue</h3>
          {pendingRegistrations.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-10 text-center text-xs text-slate-400 dark:text-slate-500">
              No pending registrations. All user accounts are approved.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pendingRegistrations.map((u) => (
                <div
                  key={u.id}
                  className="bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-900/60 rounded-2xl p-4 shadow-2xs space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-bold text-sm text-slate-900 dark:text-white">{u.name}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">{u.email}</div>
                      <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">{u.title}</div>
                    </div>
                    <span className="text-[10px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 px-2 py-0.5 rounded">
                      Pending Approval
                    </span>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <button
                      onClick={() => rejectRegistration(u.id)}
                      className="px-3 py-1.5 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800"
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => approveRegistration(u.id)}
                      className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs flex items-center gap-1"
                    >
                      <Check className="w-3.5 h-3.5" /> Approve Registration
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: User Management */}
      {adminTab === 'users' && (
        <div className="space-y-4">
          {/* User Filtering Toolbar */}
          <div className="bg-white dark:bg-slate-900 p-4 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xs space-y-3">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              {/* Search bar */}
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                <input
                  type="text"
                  placeholder="Search user name, email, or title..."
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#005CBD]"
                />
              </div>

              {/* Filter Dropdowns */}
              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto text-xs">
                <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2.5 py-1.5 rounded-xl text-slate-600 dark:text-slate-300 font-semibold">
                  <Filter className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                  <span>Status:</span>
                  <select
                    value={userStatusFilter}
                    onChange={(e) => setUserStatusFilter(e.target.value as any)}
                    className="bg-slate-50 dark:bg-slate-800 font-bold text-slate-800 dark:text-white rounded-lg px-1.5 py-0.5 focus:outline-none cursor-pointer"
                  >
                    <option value="all" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">All Statuses</option>
                    <option value="approved" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Approved</option>
                    <option value="pending" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Pending</option>
                    <option value="rejected" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Rejected</option>
                  </select>
                </div>

                <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2.5 py-1.5 rounded-xl text-slate-600 dark:text-slate-300 font-semibold">
                  <span>Role:</span>
                  <select
                    value={userRoleFilter}
                    onChange={(e) => setUserRoleFilter(e.target.value as any)}
                    className="bg-slate-50 dark:bg-slate-800 font-bold text-slate-800 dark:text-white rounded-lg px-1.5 py-0.5 focus:outline-none cursor-pointer"
                  >
                    <option value="all" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">All Roles</option>
                    <option value="team_member" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Team Member</option>
                    <option value="business_ops" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Business Ops</option>
                    <option value="admin" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Technical Admin</option>
                  </select>
                </div>

                <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2.5 py-1.5 rounded-xl text-slate-600 dark:text-slate-300 font-semibold">
                  <span>Department:</span>
                  <select
                    value={userDeptFilter}
                    onChange={(e) => setUserDeptFilter(e.target.value)}
                    className="bg-slate-50 dark:bg-slate-800 font-bold text-slate-800 dark:text-white rounded-lg px-1.5 py-0.5 focus:outline-none cursor-pointer"
                  >
                    <option value="all" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">All Departments</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                        {d.code} - {d.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* User Table */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="p-4">User Member</th>
                    <th className="p-4">Job Title</th>
                    <th className="p-4">Departments</th>
                    <th className="p-4">Role</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {users
                    .filter((u) => {
                      const matchesSearch =
                        !userSearchQuery.trim() ||
                        (u.name || '').toLowerCase().includes(userSearchQuery.toLowerCase()) ||
                        (u.email || '').toLowerCase().includes(userSearchQuery.toLowerCase()) ||
                        (u.title || '').toLowerCase().includes(userSearchQuery.toLowerCase());

                      const matchesStatus =
                        userStatusFilter === 'all' || u.registrationStatus === userStatusFilter;

                      const matchesRole =
                        userRoleFilter === 'all' || u.role === userRoleFilter;

                      const matchesDept =
                        userDeptFilter === 'all' || (u.departmentIds || []).includes(userDeptFilter);

                      return matchesSearch && matchesStatus && matchesRole && matchesDept;
                    })
                    .map((u) => {
                      const uDepts = departments.filter((d) => (u.departmentIds || []).includes(d.id));
                      return (
                        <tr key={u.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                          <td className="p-4">
                            <button
                              type="button"
                              onClick={() => openMemberProfile(u.id)}
                              className="flex items-center gap-2.5 text-left group transition-colors"
                              title={`View ${u.name}'s profile`}
                            >
                              <img
                                src={
                                  u.avatarUrl ||
                                  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
                                }
                                alt={u.name}
                                className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-200 dark:ring-slate-700 group-hover:ring-[#005CBD]"
                              />
                              <div>
                                <div className="font-bold text-slate-900 dark:text-white group-hover:text-[#005CBD] dark:group-hover:text-blue-400 group-hover:underline">
                                  {u.name}
                                </div>
                                <div className="text-[11px] text-slate-500 dark:text-slate-400">{u.email}</div>
                              </div>
                            </button>
                          </td>

                          <td className="p-4 font-medium text-slate-700 dark:text-slate-300">{u.title}</td>

                          <td className="p-4">
                            <div className="flex flex-wrap gap-1">
                              {uDepts.length === 0 ? (
                                <span className="text-slate-400 dark:text-slate-500 text-[10px] italic">None</span>
                              ) : (
                                uDepts.map((d) => (
                                  <span
                                    key={d.id}
                                    className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-[10px] font-bold px-1.5 py-0.5 rounded"
                                  >
                                    {d.code}
                                  </span>
                                ))
                              )}
                            </div>
                          </td>

                          <td className="p-4">
                            <select
                              value={u.role}
                              onChange={(e) => updateUserRole(u.id, e.target.value as any)}
                              className="px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-900 dark:text-white focus:ring-1 focus:ring-[#005CBD]"
                            >
                              <option value="team_member" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Team Member</option>
                              <option value="business_ops" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Business Ops</option>
                              <option value="admin" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Technical Admin</option>
                            </select>
                          </td>

                          <td className="p-4">
                            <span
                              className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                u.registrationStatus === 'approved'
                                  ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                                  : u.registrationStatus === 'pending'
                                  ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300'
                                  : 'bg-red-100 dark:bg-red-950/60 text-red-800 dark:text-red-300'
                              }`}
                            >
                              {u.registrationStatus}
                            </span>
                          </td>

                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {u.registrationStatus === 'pending' && (
                                <button
                                  onClick={() => approveRegistration(u.id)}
                                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold flex items-center gap-1 shadow-2xs"
                                >
                                  <Check className="w-3 h-3" /> Approve
                                </button>
                              )}

                              <button
                                onClick={() => openEditUserModal(u)}
                                className="px-2.5 py-1 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-[11px] font-bold flex items-center gap-1"
                              >
                                <Edit3 className="w-3 h-3 text-[#005CBD] dark:text-blue-400" /> Edit
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Department Management & Team Leads */}
      {adminTab === 'departments' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xs">
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Building2 className="w-4 h-4 text-[#005CBD] dark:text-blue-400" />
                Departments & Organization Hierarchy
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Manage departments, assign team leads (multi-lead support enabled), and control team membership.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Search Bar */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                <input
                  type="text"
                  placeholder="Search departments..."
                  value={deptSearchQuery}
                  onChange={(e) => setDeptSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-[#005CBD]"
                />
              </div>

              {/* Status Filter */}
              <select
                value={deptFilterStatus}
                onChange={(e) => setDeptFilterStatus(e.target.value as any)}
                className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer focus:ring-2 focus:ring-[#005CBD]"
              >
                <option value="active" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Active Depts</option>
                <option value="archived" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Archived Depts</option>
                <option value="all" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">All Statuses</option>
              </select>

              <button
                onClick={openCreateDeptModal}
                className="bg-[#005CBD] hover:bg-[#0051B8] text-white px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
              >
                <Plus className="w-4 h-4" /> Create Department
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {departments
              .filter((d) => {
                const matchesSearch =
                  !deptSearchQuery.trim() ||
                  (d.name || '').toLowerCase().includes(deptSearchQuery.toLowerCase()) ||
                  (d.code || '').toLowerCase().includes(deptSearchQuery.toLowerCase()) ||
                  (d.description || '').toLowerCase().includes(deptSearchQuery.toLowerCase());

                const matchesStatus =
                  deptFilterStatus === 'all' ||
                  (deptFilterStatus === 'active' && !d.archived) ||
                  (deptFilterStatus === 'archived' && d.archived);

                return matchesSearch && matchesStatus;
              })
              .map((dept) => {
                const deptMembers = users.filter((u) => (u.departmentIds || []).includes(dept.id));
                const deptLeads = users.filter((u) => (dept.teamLeadIds || []).includes(u.id));

                return (
                  <div
                    key={dept.id}
                    className={`bg-white dark:bg-slate-900 border rounded-2xl p-5 shadow-2xs space-y-4 transition-all ${
                      dept.archived ? 'border-amber-200 dark:border-amber-900/60 bg-amber-50/20 dark:bg-amber-950/20 opacity-80' : 'border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-base text-slate-900 dark:text-white">{dept.name}</span>
                          <span className="font-mono text-xs font-bold bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-lg">
                            {dept.code}
                          </span>
                          {dept.archived ? (
                            <span className="bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                              Archived
                            </span>
                          ) : (
                            <span className="bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                              Active
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{dept.description}</p>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => openEditDeptModal(dept)}
                          className="p-1.5 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-600 dark:text-slate-300 hover:text-[#005CBD] dark:hover:text-blue-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                          title="Edit Department Details & Members"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        {dept.archived ? (
                          <button
                            onClick={() => unarchiveDepartment(dept.id)}
                            className="p-1.5 border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/50 rounded-lg text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/50 transition-colors"
                            title="Unarchive / Restore Department"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <button
                            onClick={() => archiveDepartment(dept.id)}
                            className="p-1.5 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-400 dark:text-slate-500 hover:text-amber-700 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/50 transition-colors"
                            title="Archive Department"
                          >
                            <Archive className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => {
                            if (confirm(`Delete department "${dept.name}"? This action cannot be undone.`)) {
                              deleteDepartment(dept.id);
                            }
                          }}
                          className="p-1.5 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50 transition-colors"
                          title="Delete Department"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Team Lead Section */}
                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                          <Crown className="w-4 h-4 text-amber-500" /> Designated Team Leads
                          <span className="text-[10px] font-normal text-slate-400 dark:text-slate-500">({deptLeads.length})</span>
                        </span>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">Click to toggle lead role</span>
                      </div>

                      <div className="flex flex-wrap gap-1.5">
                        {users.map((u) => {
                          const isLead = (dept.teamLeadIds || []).includes(u.id);
                          const otherLeads = departments.filter((d) => d.id !== dept.id && (d.teamLeadIds || []).includes(u.id));
                          return (
                            <button
                              key={u.id}
                              onClick={() => {
                                if (isLead) {
                                  removeTeamLead(dept.id, u.id);
                                } else {
                                  assignTeamLead(dept.id, u.id);
                                }
                              }}
                              className={`px-2.5 py-1 rounded-xl text-xs font-semibold transition-all border flex items-center gap-1 ${
                                isLead
                                  ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 shadow-2xs'
                                  : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                              }`}
                            >
                              <Crown className={`w-3 h-3 ${isLead ? 'text-amber-600 fill-amber-500' : 'text-slate-300 dark:text-slate-600'}`} />
                              <span>{u.name}</span>
                              {isLead && otherLeads.length > 0 && (
                                <span className="bg-amber-200/80 dark:bg-amber-900/60 text-amber-950 dark:text-amber-200 text-[9px] font-bold px-1 rounded">
                                  +{otherLeads.length} depts
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Department Members Section */}
                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                          <Users className="w-4 h-4 text-[#005CBD] dark:text-blue-400" /> Department Members
                          <span className="bg-blue-50 dark:bg-blue-950/60 text-[#005CBD] dark:text-blue-300 text-[10px] font-bold px-1.5 py-0.5 rounded border border-blue-200 dark:border-blue-800">
                            {deptMembers.length}
                          </span>
                        </span>
                        <button
                          onClick={() => openEditDeptModal(dept)}
                          className="text-[11px] font-bold text-[#005CBD] dark:text-blue-400 hover:underline inline-flex items-center gap-1"
                        >
                          <span>Manage Members</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>

                      <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                        {deptMembers.length === 0 ? (
                          <span className="text-slate-400 dark:text-slate-500 text-xs italic">No members assigned yet.</span>
                        ) : (
                          deptMembers.map((m) => (
                            <div
                              key={m.id}
                              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2 py-1 rounded-xl flex items-center gap-1.5 text-xs font-medium text-slate-700 dark:text-slate-300"
                            >
                              <button
                                type="button"
                                onClick={() => openMemberProfile(m.id)}
                                className="flex items-center gap-1.5 hover:text-[#005CBD] dark:hover:text-blue-400 transition-colors"
                                title={`View ${m.name}'s profile`}
                              >
                                <img
                                  src={
                                    m.avatarUrl ||
                                    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
                                  }
                                  alt={m.name}
                                  className="w-4 h-4 rounded-full object-cover shrink-0"
                                />
                                <span className="truncate max-w-[100px] hover:underline">{m.name}</span>
                              </button>
                              <button
                                onClick={() => removeMemberFromDepartment(dept.id, m.id)}
                                className="text-slate-400 dark:text-slate-500 hover:text-red-500 p-0.5 rounded transition-colors ml-0.5"
                                title="Remove from department"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Tab: Cloudinary Storage Configuration (Zoho WorkDrive Suspended) */}
      {adminTab === 'cloudinary' && (
        <div className="space-y-6">
          {/* Status & Overview Banner */}
          <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-5 rounded-2xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 border border-blue-800/40">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="bg-blue-500/20 text-blue-300 text-[10px] font-bold px-2 py-0.5 rounded border border-blue-400/30 flex items-center gap-1">
                  <Cloud className="w-3 h-3" /> Cloudinary CDN & Deliverables Engine
                </span>
                {cldConnected || Boolean(cloudinaryConfig.cloudName && (cloudinaryConfig.apiKey || cloudinaryConfig.uploadPreset)) ? (
                  <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded border border-emerald-400/30 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" /> Connected & Active
                  </span>
                ) : (
                  <span className="bg-amber-500/20 text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded border border-amber-400/30 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> Credentials Required
                  </span>
                )}
                <span className="bg-slate-700/60 text-slate-300 text-[10px] font-semibold px-2 py-0.5 rounded border border-slate-600/50">
                  Zoho WorkDrive Suspended
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-bold">Cloudinary Deliverables Storage</h2>
              <p className="text-xs text-blue-200/80 max-w-2xl">
                Zoho WorkDrive integration is currently suspended. All task deliverables are uploaded directly to Cloudinary and organized into dedicated cycle folders (<code className="font-mono">Deliverables/Cycle-[WeekID]</code>).
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleTestCloudinaryConnection}
                disabled={cldTestingConnection}
                className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors border border-white/20"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${cldTestingConnection ? 'animate-spin' : ''}`} />
                <span>{cldTestingConnection ? 'Testing...' : 'Test Connection'}</span>
              </button>
            </div>
          </div>

          {/* Quick Architecture Overview */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-2xs space-y-3">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <FolderSync className="w-4 h-4 text-[#005CBD] dark:text-blue-400" />
              How Cloudinary Deliverable Routing Works
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-1">
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-xl space-y-1.5">
                <div className="w-6 h-6 rounded-lg bg-blue-100 dark:bg-blue-950/80 text-[#005CBD] dark:text-blue-400 font-bold text-xs flex items-center justify-center">
                  1
                </div>
                <h4 className="font-bold text-xs text-slate-900 dark:text-white">Designated Root Folder</h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  All company deliverables are stored in Cloudinary under <code className="font-mono bg-white dark:bg-slate-900 px-1 py-0.2 rounded text-blue-700 dark:text-blue-300">{cldRootFolder || 'Deliverables'}</code>.
                </p>
              </div>

              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-xl space-y-1.5">
                <div className="w-6 h-6 rounded-lg bg-blue-100 dark:bg-blue-950/80 text-[#005CBD] dark:text-blue-400 font-bold text-xs flex items-center justify-center">
                  2
                </div>
                <h4 className="font-bold text-xs text-slate-900 dark:text-white">Cycle Subfolder Partition</h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  Each task routes uploads into its own cycle folder, e.g. <code className="font-mono bg-white dark:bg-slate-900 px-1 py-0.2 rounded text-blue-700 dark:text-blue-300">Deliverables/Cycle-2026-04-W1</code>.
                </p>
              </div>

              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-xl space-y-1.5">
                <div className="w-6 h-6 rounded-lg bg-blue-100 dark:bg-blue-950/80 text-[#005CBD] dark:text-blue-400 font-bold text-xs flex items-center justify-center">
                  3
                </div>
                <h4 className="font-bold text-xs text-slate-900 dark:text-white">Direct CDN Delivery</h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  Files are renamed to <code className="font-mono bg-white dark:bg-slate-900 px-1 py-0.2 rounded text-blue-700 dark:text-blue-300">department_username_[index]</code> and served via secure HTTPS URLs.
                </p>
              </div>
            </div>
          </div>

          {/* Test Connection Result Alert */}
          {cldTestResult && (
            <div
              className={`p-4 rounded-2xl border flex items-start gap-3 animate-in fade-in text-xs ${
                cldTestResult.success
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                  : 'bg-red-50 dark:bg-red-950/60 border-red-300 dark:border-red-800 text-red-900 dark:text-red-200'
              }`}
            >
              {cldTestResult.success ? (
                <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              )}
              <div className="space-y-1 flex-1">
                <h4 className="font-bold text-sm">
                  {cldTestResult.success ? 'Cloudinary Connection Verified' : 'Cloudinary Connection Check Failed'}
                </h4>
                <p className="leading-relaxed">{cldTestResult.message}</p>
              </div>
              <button
                type="button"
                onClick={() => setCldTestResult(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Configuration Form */}
          <form onSubmit={handleSaveCloudinaryConfig} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-2xs space-y-6 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">Cloudinary Settings & Credentials</h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Configure your Cloudinary Cloud Name, API credentials (or Unsigned Upload Preset), and deliverable folder structure.
                </p>
              </div>

              {cldSavedSuccess && (
                <span className="text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/80 font-bold px-3 py-1 rounded-xl flex items-center gap-1 text-xs">
                  <Check className="w-3.5 h-3.5" /> Saved Successfully!
                </span>
              )}
            </div>

            {/* General Folder & Naming Settings */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Enable / Disable */}
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 rounded-xl flex items-center justify-between">
                <div>
                  <label className="font-bold text-slate-800 dark:text-white block">Enable Cloudinary Deliverable Uploads</label>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Route all task file uploads directly to Cloudinary CDN storage
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={cldEnabled}
                  onChange={(e) => setCldEnabled(e.target.checked)}
                  className="w-4 h-4 rounded text-[#005CBD] focus:ring-[#005CBD]"
                />
              </div>

              {/* Automatic Cycle Subfolder */}
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 rounded-xl flex items-center justify-between">
                <div>
                  <label className="font-bold text-slate-800 dark:text-white block">Auto Cycle Subfolders</label>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Automatically nest files under <code className="font-mono">Cycle-[WeekID]</code> folders
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={cldAutoCycle}
                  onChange={(e) => setCldAutoCycle(e.target.checked)}
                  className="w-4 h-4 rounded text-[#005CBD] focus:ring-[#005CBD]"
                />
              </div>

              {/* Root Folder Name */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                  <Folder className="w-3.5 h-3.5 text-[#005CBD]" />
                  <span>Cloudinary Root Folder</span>
                </label>
                <input
                  type="text"
                  value={cldRootFolder}
                  onChange={(e) => setCldRootFolder(e.target.value)}
                  placeholder="Deliverables"
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-mono text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-[#005CBD]"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Base folder in your Cloudinary Media Library (e.g. Deliverables/Cycle-2026-04-W1)
                </span>
              </div>

              {/* Department Naming Mode */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Department Naming Mode</label>
                <div className="flex items-center gap-4 h-10 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl">
                  <label className="flex items-center gap-1.5 cursor-pointer text-xs font-semibold text-slate-700 dark:text-slate-300">
                    <input
                      type="radio"
                      name="deptSlugOption"
                      checked={!cldUseDeptCode}
                      onChange={() => setCldUseDeptCode(false)}
                      className="text-[#005CBD]"
                    />
                    <span>Full Name (e.g. Sales)</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer text-xs font-semibold text-slate-700 dark:text-slate-300">
                    <input
                      type="radio"
                      name="deptSlugOption"
                      checked={cldUseDeptCode}
                      onChange={() => setCldUseDeptCode(true)}
                      className="text-[#005CBD]"
                    />
                    <span>Code (e.g. SE)</span>
                  </label>
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">Used in: department_username_[index]</span>
              </div>
            </div>

            {/* Cloudinary API Credentials Section */}
            <div className="border-t border-slate-100 dark:border-slate-800 pt-5 space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h4 className="font-bold text-sm text-slate-800 dark:text-white flex items-center gap-2">
                  <Key className="w-4 h-4 text-amber-500" />
                  <span>Cloudinary API Credentials</span>
                </h4>
                <a
                  href="https://console.cloudinary.com/settings/api-keys"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] text-[#005CBD] dark:text-blue-400 hover:underline font-bold flex items-center gap-1"
                >
                  Open Cloudinary Console <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              {/* Quick Paste CLOUDINARY_URL */}
              <div className="p-3.5 bg-blue-50/50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/60 rounded-xl space-y-2">
                <label className="font-bold text-slate-800 dark:text-white block flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#005CBD] dark:text-blue-400" />
                  Quick Setup: Paste CLOUDINARY_URL Environment Variable
                </label>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Copy <code className="font-mono bg-white dark:bg-slate-800 px-1 py-0.5 rounded">cloudinary://API_KEY:API_SECRET@CLOUD_NAME</code> from your Cloudinary Dashboard to auto-fill all fields below.
                </p>
                <input
                  type="text"
                  value={cldUrlQuickPaste}
                  onChange={(e) => handleCloudinaryUrlChange(e.target.value)}
                  placeholder="cloudinary://123456789012345:abcdefghijklmnopqrstuvwxyz@your_cloud_name"
                  className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-mono text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-[#005CBD]"
                />
              </div>

              {/* Cloud Name & Unsigned Upload Preset */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Cloud Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={cldCloudName}
                    onChange={(e) => setCldCloudName(e.target.value)}
                    placeholder="e.g. dxyz12345"
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-mono text-slate-900 dark:text-white focus:ring-2 focus:ring-[#005CBD]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Unsigned Upload Preset <span className="text-[10px] font-normal text-slate-400">(Optional if API Key & Secret are set)</span>
                  </label>
                  <input
                    type="text"
                    value={cldUploadPreset}
                    onChange={(e) => setCldUploadPreset(e.target.value)}
                    placeholder="e.g. ml_default"
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-mono text-slate-900 dark:text-white focus:ring-2 focus:ring-[#005CBD]"
                  />
                </div>
              </div>

              {/* API Key & API Secret */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    API Key
                  </label>
                  <input
                    type="text"
                    value={cldApiKey}
                    onChange={(e) => setCldApiKey(e.target.value)}
                    placeholder="123456789012345"
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-mono text-slate-900 dark:text-white focus:ring-2 focus:ring-[#005CBD]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    API Secret
                  </label>
                  <input
                    type="password"
                    value={cldApiSecret}
                    onChange={(e) => setCldApiSecret(e.target.value)}
                    placeholder={
                      cloudinaryConfig.apiSecret
                        ? '•••••••••••••••••••••••• (Saved)'
                        : '••••••••••••••••••••••••'
                    }
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-mono text-slate-900 dark:text-white focus:ring-2 focus:ring-[#005CBD]"
                  />
                </div>
              </div>
            </div>

            {/* Save Button & Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800 gap-3 flex-wrap">
              <span className="text-[11px] text-slate-400">
                Last updated: {cloudinaryConfig.lastSyncedAt ? new Date(cloudinaryConfig.lastSyncedAt).toLocaleString() : 'Never'}
              </span>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleTestCloudinaryConnection}
                  disabled={cldTestingConnection}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl font-bold flex items-center gap-1.5 transition-colors text-xs border border-slate-300 dark:border-slate-700"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${cldTestingConnection ? 'animate-spin' : ''}`} />
                  <span>{cldTestingConnection ? 'Testing...' : 'Test Connection'}</span>
                </button>

                <button
                  type="submit"
                  className="px-5 py-2 bg-[#005CBD] hover:bg-[#0051B8] text-white rounded-xl font-bold shadow-md flex items-center gap-1.5 transition-colors text-xs"
                >
                  <Check className="w-4 h-4" /> Save Cloudinary Settings
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Tab 4b: Startup Site Dialogs & Release Notes */}
      {adminTab === 'announcements' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Megaphone className="w-4 h-4 text-[#005CBD] dark:text-blue-400" />
                <span>Startup Update Dialogs</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-2xl">
                Publish clean one-time announcement dialogs for new fixes, shipped features, or team notices. Enabled dialogs open automatically once when a member opens the site.
              </p>
            </div>

            <button
              type="button"
              onClick={openCreateDialogModal}
              className="px-4 py-2 bg-[#005CBD] hover:bg-[#0051B8] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors shrink-0 self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>New Dialog</span>
            </button>
          </div>

          {safeAnnouncements.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-10 text-center space-y-2">
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                No startup dialogs created yet
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                Create a dialog when you ship a fix or release a new workflow. You can turn it on or off anytime, preview it, or delete it cleanly.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {safeAnnouncements.map((item) => {
                const categoryLabel =
                  item.category === 'fix'
                    ? 'Fix Shipped'
                    : item.category === 'improvement'
                    ? 'Improvement'
                    : item.category === 'notice'
                    ? 'Team Notice'
                    : 'New Feature';

                const approvedUsers = safeUsers.filter((u) => u.registrationStatus === 'approved');
                const currentRevision = item.revision || 1;
                const seenMap = item.seenBy || {};
                const seenApprovedCount = approvedUsers.filter(
                  (u) => (seenMap[u.id]?.revision ?? 0) >= currentRevision
                ).length;

                return (
                  <div
                    key={item.id}
                    className={`bg-white dark:bg-slate-900 border rounded-2xl p-5 transition-all ${
                      item.enabled
                        ? 'border-slate-200 dark:border-slate-700 shadow-2xs'
                        : 'border-slate-200/70 dark:border-slate-800 opacity-75'
                    }`}
                  >
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                      <div className="space-y-2 min-w-0 flex-1">
                        <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex-wrap">
                          <span className="uppercase tracking-wider text-slate-700 dark:text-slate-200">
                            {categoryLabel}
                          </span>
                          <span>·</span>
                          <span>
                            {item.activatedAt
                              ? `${item.enabled ? 'Turned on' : 'Last on'} ${new Date(item.activatedAt).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                })}`
                              : item.enabled
                                ? `Turned on ${new Date(item.updatedAt || item.createdAt).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric',
                                  })}`
                                : `Draft · ${new Date(item.createdAt).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric',
                                  })}`}
                          </span>
                          <span>·</span>
                          <span className={item.enabled ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'}>
                            {item.enabled ? 'On (Visible once on visit)' : 'Off (Hidden)'}
                          </span>
                          <span>·</span>
                          <button
                            type="button"
                            onClick={() => {
                              setTrackingDialogId(item.id);
                              setTrackingFilter('seen');
                              setTrackingSearch('');
                            }}
                            className="inline-flex items-center gap-1 text-[#005CBD] dark:text-blue-400 hover:underline tabular-nums"
                            title="See which team members have viewed this dialog"
                          >
                            <Users className="w-3.5 h-3.5" />
                            <span>
                              Seen by {seenApprovedCount} / {approvedUsers.length}
                            </span>
                          </button>
                        </div>

                        <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                          {item.title}
                        </h4>

                        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-2">
                          {item.summary}
                        </p>

                        {Array.isArray(item.highlights) && item.highlights.length > 0 && (
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 pt-0.5 tabular-nums">
                            {item.highlights.length} bullet highlight{item.highlights.length === 1 ? '' : 's'}
                          </div>
                        )}
                      </div>

                      {/* Controls: On/Off Switch + Actions */}
                      <div className="flex items-center gap-2 flex-wrap shrink-0">
                        <button
                          type="button"
                          role="switch"
                          aria-checked={item.enabled}
                          onClick={() => toggleAnnouncement(item.id)}
                          className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-colors ${
                            item.enabled
                              ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
                              : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                          }`}
                          title={item.enabled ? 'Turn dialog off' : 'Turn dialog on'}
                        >
                          <span
                            className={`w-7 h-4 rounded-full relative transition-colors ${
                              item.enabled ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-600'
                            }`}
                          >
                            <span
                              className={`w-3 h-3 rounded-full bg-white absolute top-0.5 transition-transform ${
                                item.enabled ? 'translate-x-3.5' : 'translate-x-0.5'
                              }`}
                            />
                          </span>
                          <span>{item.enabled ? 'On' : 'Off'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setTrackingDialogId(item.id);
                            setTrackingFilter('seen');
                            setTrackingSearch('');
                          }}
                          className="px-2.5 py-1.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 inline-flex items-center gap-1 transition-colors tabular-nums"
                          title="Inspect who has seen this dialog"
                        >
                          <Users className="w-3.5 h-3.5 text-[#005CBD] dark:text-blue-400" />
                          <span>Viewers ({seenApprovedCount})</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setPreviewAnnouncement(item)}
                          className="px-2.5 py-1.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 inline-flex items-center gap-1 transition-colors"
                          title="Preview dialog appearance"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Preview</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => republishAnnouncement(item.id)}
                          className="px-2.5 py-1.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 inline-flex items-center gap-1 transition-colors"
                          title="Reset seen state and show once again to all team members"
                        >
                          <BellRing className="w-3.5 h-3.5" />
                          <span>Re-show</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => openEditDialogModal(item)}
                          className="p-1.5 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-600 dark:text-slate-300 hover:text-[#005CBD] dark:hover:text-blue-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                          title="Edit dialog"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(`Delete dialog "${item.title}" permanently?`)) {
                              deleteAnnouncement(item.id);
                            }
                          }}
                          className="p-1.5 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                          title="Delete dialog"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Immutable Audit Logs */}
      {adminTab === 'audit' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-2xs">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">Immutable System Event Trail</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-4">Action</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Actor</th>
                  <th className="p-4">Details</th>
                  <th className="p-4">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="p-4 font-mono font-bold text-slate-900 dark:text-white">{log.action}</td>
                    <td className="p-4 font-semibold text-slate-600 dark:text-slate-400 uppercase text-[10px]">{log.category}</td>
                    <td className="p-4 font-semibold text-slate-800 dark:text-slate-200">{log.actorName}</td>
                    <td className="p-4 text-slate-700 dark:text-slate-300">{log.details}</td>
                    <td className="p-4 font-mono text-slate-500 dark:text-slate-400">{new Date(log.timestamp).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 5: Bug Reports */}
      {adminTab === 'bugs' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white">System Bug Reports</h3>
          <div className="space-y-3">
            {bugReports.map((bug) => (
              <div key={bug.id} className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl space-y-1">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-xs text-slate-900 dark:text-white">{bug.title}</div>
                  <span className="px-2 py-0.5 text-[10px] font-bold bg-orange-100 dark:bg-orange-950/60 text-orange-800 dark:text-orange-300 rounded">
                    {bug.severity}
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300">{bug.description}</p>
                <div className="text-[10px] text-slate-400 dark:text-slate-500">By {bug.submittedByName} on {new Date(bug.createdAt).toLocaleDateString()}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 6: Restore Data */}
      {adminTab === 'restore' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white">Archived Data Restore Center</h3>
          <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
            {archivedTasks.length === 0 ? (
              <div className="p-8 text-center text-slate-400 dark:text-slate-500">No tasks currently archived.</div>
            ) : (
              archivedTasks.map((task) => (
                <div key={task.id} className="py-3 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white">{task.title}</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">{task.departmentName} • Archived by {task.archivedBy}</div>
                  </div>
                  <button
                    onClick={() => restoreTask(task.id)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1 rounded font-semibold flex items-center gap-1 text-xs"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> Restore
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Create / Edit Department Modal */}
      {showDeptModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg p-6 space-y-4 text-xs max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Building2 className="w-5 h-5 text-[#005CBD] dark:text-blue-400" />
                {editingDepartment ? `Edit Department: ${editingDepartment.name}` : 'Create New Department'}
              </h3>
              <button
                onClick={() => setShowDeptModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleDepartmentFormSubmit} className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Department Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Solution Engineering"
                    value={deptFormName}
                    onChange={(e) => {
                      const val = e.target.value;
                      setDeptFormName(val);
                      if (val.trim().toLowerCase() === 'community') {
                        setDeptFormCode('Community');
                      }
                    }}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-[#005CBD]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Code</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. SE"
                    value={deptFormName.trim().toLowerCase() === 'community' ? 'Community' : deptFormCode}
                    onChange={(e) => setDeptFormCode(e.target.value)}
                    className={`w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-bold ${
                      deptFormName.trim().toLowerCase() === 'community' ? '' : 'uppercase'
                    } text-slate-900 dark:text-white focus:ring-2 focus:ring-[#005CBD]`}
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Operational scope, goals, and responsibilities..."
                  value={deptFormDesc}
                  onChange={(e) => setDeptFormDesc(e.target.value)}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-[#005CBD]"
                />
              </div>

              {/* Assign Team Leads */}
              <div className="space-y-1.5">
                <label className="block font-bold text-slate-800 dark:text-white flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Crown className="w-4 h-4 text-amber-500" /> Assign Team Leads
                  </span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-normal">
                    One user can lead multiple departments
                  </span>
                </label>

                <div className="p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl space-y-1.5 max-h-36 overflow-y-auto">
                  {users.map((u) => {
                    const isSelected = (deptFormLeadIds || []).includes(u.id);
                    const otherDeptsLed = departments.filter(
                      (d) => d.id !== editingDepartment?.id && (d.teamLeadIds || []).includes(u.id)
                    );
                    return (
                      <div
                        key={u.id}
                        onClick={() => toggleDeptLead(u.id)}
                        className={`p-2 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                          isSelected
                            ? 'bg-amber-100/70 dark:bg-amber-950/70 border-amber-300 dark:border-amber-700 text-amber-950 dark:text-amber-200 font-bold'
                            : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Crown className={`w-3.5 h-3.5 ${isSelected ? 'text-amber-600 fill-amber-500' : 'text-slate-300 dark:text-slate-600'}`} />
                          <div>
                            <div className="text-xs text-slate-900 dark:text-white font-semibold">{u.name}</div>
                            <div className="text-[10px] text-slate-500 dark:text-slate-400">{u.title}</div>
                          </div>
                        </div>
                        {otherDeptsLed.length > 0 && (
                          <span className="text-[10px] bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-1.5 py-0.5 rounded">
                            Leads {otherDeptsLed.map((d) => d.code).join(', ')}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Assign Department Members */}
              <div className="space-y-1.5">
                <label className="block font-bold text-slate-800 dark:text-white flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-[#005CBD] dark:text-blue-400" /> Department Members
                  </span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-normal">
                    Select users who belong to this department
                  </span>
                </label>

                <div className="p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl space-y-1.5 max-h-40 overflow-y-auto">
                  {users.map((u) => {
                    const isSelected = (deptFormMemberIds || []).includes(u.id);
                    return (
                      <div
                        key={u.id}
                        onClick={() => toggleDeptMember(u.id)}
                        className={`p-2 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                          isSelected
                            ? 'bg-blue-100/70 dark:bg-blue-950/70 border-blue-300 dark:border-blue-700 text-blue-950 dark:text-blue-200 font-bold'
                            : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <img
                            src={
                              u.avatarUrl ||
                              'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
                            }
                            alt={u.name}
                            className="w-5 h-5 rounded-full object-cover"
                          />
                          <div>
                            <div className="text-xs text-slate-900 dark:text-white font-semibold">{u.name}</div>
                            <div className="text-[10px] text-slate-500 dark:text-slate-400">{u.title}</div>
                          </div>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-[#005CBD] dark:text-blue-400" />}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowDeptModal(false)}
                  className="px-3.5 py-2 border border-slate-300 dark:border-slate-700 rounded-xl font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#005CBD] hover:bg-[#0051B8] text-white rounded-xl font-bold shadow-md"
                >
                  {editingDepartment ? 'Save Department Changes' : 'Create Department'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 w-full max-w-lg p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-[#005CBD] dark:text-blue-400" /> Edit User Profile & Permissions
              </h3>
              <button
                onClick={() => setEditingUser(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveUserEdit} className="space-y-4">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={editUserName}
                  onChange={(e) => setEditUserName(e.target.value)}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-[#005CBD]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Work Email (Read-Only)</label>
                <input
                  type="email"
                  disabled
                  value={editingUser.email}
                  className="w-full p-2 bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-500 dark:text-slate-400 font-medium cursor-not-allowed"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">System Role</label>
                  <select
                    value={editUserRole}
                    onChange={(e) => setEditUserRole(e.target.value as any)}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-[#005CBD]"
                  >
                    <option value="team_member" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Team Member</option>
                    <option value="business_ops" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Business Operations</option>
                    <option value="admin" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Technical Admin</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Registration Status</label>
                  <select
                    value={editUserStatus}
                    onChange={(e) => setEditUserStatus(e.target.value as any)}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-[#005CBD]"
                  >
                    <option value="approved" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Approved</option>
                    <option value="pending" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Pending Review</option>
                    <option value="rejected" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Rejected</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5 text-[#005CBD] dark:text-blue-400" /> Assigned Department
                  </span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-normal">Select single department</span>
                </label>
                <div className="grid grid-cols-2 gap-1.5 p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl max-h-36 overflow-y-auto">
                  {departments.map((d) => {
                    const isSelected = editUserDeptId === d.id;
                    return (
                      <div
                        key={d.id}
                        onClick={() => setEditUserDeptId(d.id)}
                        className={`p-2 rounded-lg cursor-pointer transition-all flex items-center justify-between text-[11px] ${
                          isSelected
                            ? 'bg-blue-100 dark:bg-blue-950/70 border border-blue-300 dark:border-blue-700 text-blue-900 dark:text-blue-200 font-bold'
                            : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        <span className="truncate">{d.name}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-[#005CBD] dark:text-blue-400" />}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#005CBD] hover:bg-[#0051B8] text-white rounded-xl font-bold shadow-md"
                >
                  Save User Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Create / Edit Site Dialog Modal */}
      {showDialogModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg p-6 space-y-4 text-xs max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Megaphone className="w-4 h-4 text-[#005CBD] dark:text-blue-400" />
                <span>{editingDialog ? 'Edit Startup Dialog' : 'Create Startup Dialog'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowDialogModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveDialogForm} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Update Type
                  </label>
                  <select
                    value={dialogCategory}
                    onChange={(e) => setDialogCategory(e.target.value as AnnouncementCategory)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#005CBD]"
                  >
                    <option value="feature" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">New Feature</option>
                    <option value="fix" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Fix Shipped</option>
                    <option value="improvement" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Improvement</option>
                    <option value="notice" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Team Notice</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Status
                  </label>
                  <button
                    type="button"
                    onClick={() => setDialogEnabled((prev) => !prev)}
                    className={`w-full p-2.5 rounded-xl border font-semibold flex items-center justify-between transition-colors ${
                      dialogEnabled
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <span>{dialogEnabled ? 'On (Shows once on site open)' : 'Off (Saved without showing)'}</span>
                    <span
                      className={`w-7 h-4 rounded-full relative transition-colors ${
                        dialogEnabled ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-600'
                      }`}
                    >
                      <span
                        className={`w-3 h-3 rounded-full bg-white absolute top-0.5 transition-transform ${
                          dialogEnabled ? 'translate-x-3.5' : 'translate-x-0.5'
                        }`}
                      />
                    </span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Headline
                </label>
                <input
                  type="text"
                  required
                  maxLength={160}
                  placeholder="e.g. Task assignment & member profiles now live"
                  value={dialogTitle}
                  onChange={(e) => setDialogTitle(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#005CBD]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Message
                </label>
                <textarea
                  rows={3}
                  required
                  maxLength={2000}
                  placeholder="Describe what was fixed or added cleanly..."
                  value={dialogSummary}
                  onChange={(e) => setDialogSummary(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#005CBD]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Key Highlights <span className="font-normal text-slate-400">(optional — one point per line)</span>
                </label>
                <textarea
                  rows={3}
                  placeholder={"Click any teammate's name to view their profile\nDark mode dropdown contrast fixed across all filters"}
                  value={dialogHighlightsText}
                  onChange={(e) => setDialogHighlightsText(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#005CBD]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Shortcut Section <span className="font-normal text-slate-400">(optional)</span>
                  </label>
                  <select
                    value={dialogActionView}
                    onChange={(e) => setDialogActionView(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#005CBD]"
                  >
                    <option value="" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">None</option>
                    <option value="dashboard" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Dashboard</option>
                    <option value="tasks" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Active Tasks</option>
                    <option value="department_health" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Department Health</option>
                    <option value="reports" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Reports</option>
                    <option value="reflections" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Weekly Reflections</option>
                  </select>
                </div>

                {dialogActionView && (
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Shortcut Button Text
                    </label>
                    <input
                      type="text"
                      maxLength={48}
                      placeholder="e.g. Open Tasks"
                      value={dialogActionLabel}
                      onChange={(e) => setDialogActionLabel(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#005CBD]"
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    if (!dialogTitle.trim() && !dialogSummary.trim()) return;
                    const nowIso = new Date().toISOString();
                    setPreviewAnnouncement({
                      id: editingDialog?.id || 'preview',
                      title: dialogTitle.trim() || 'Untitled Update',
                      summary: dialogSummary.trim() || 'Update details...',
                      highlights: dialogHighlightsText
                        .split('\n')
                        .map((l) => l.trim())
                        .filter(Boolean),
                      category: dialogCategory,
                      enabled: dialogEnabled,
                      revision: editingDialog?.revision || 1,
                      createdBy: editingDialog?.createdBy || currentUser.id,
                      createdByName: editingDialog?.createdByName || currentUser.name,
                      createdAt: editingDialog?.createdAt || nowIso,
                      updatedAt: nowIso,
                      activatedAt: editingDialog?.enabled
                        ? editingDialog.activatedAt || editingDialog.updatedAt || editingDialog.createdAt
                        : dialogEnabled
                          ? nowIso
                          : editingDialog?.activatedAt,
                      actionView: (dialogActionView || undefined) as SiteAnnouncement['actionView'],
                      actionLabel: dialogActionView ? dialogActionLabel.trim() || undefined : undefined,
                    });
                  }}
                  className="px-3.5 py-2 border border-slate-300 dark:border-slate-700 rounded-xl font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 inline-flex items-center gap-1.5"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Preview</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowDialogModal(false)}
                    className="px-3.5 py-2 border border-slate-300 dark:border-slate-700 rounded-xl font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={dialogSaving}
                    className="px-4 py-2 bg-[#005CBD] hover:bg-[#0051B8] disabled:opacity-60 text-white rounded-xl font-bold shadow-md"
                  >
                    {dialogSaving ? 'Saving...' : editingDialog ? 'Save Changes' : 'Create Dialog'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Dialog Viewers / Read Receipts Modal */}
      {trackingDialogId && (() => {
        const tracked = safeAnnouncements.find((a) => a.id === trackingDialogId);
        if (!tracked) return null;

        const currentRev = tracked.revision || 1;
        const seenMap = tracked.seenBy || {};
        const approvedUsers = safeUsers.filter((u) => u.registrationStatus === 'approved');

        const seenMembers = approvedUsers
          .filter((u) => (seenMap[u.id]?.revision ?? 0) >= currentRev)
          .sort(
            (a, b) =>
              new Date(seenMap[b.id]?.seenAt || 0).getTime() -
              new Date(seenMap[a.id]?.seenAt || 0).getTime()
          );

        const unseenMembers = approvedUsers
          .filter((u) => (seenMap[u.id]?.revision ?? 0) < currentRev)
          .sort((a, b) => (a.name || '').localeCompare(b.name || ''));

        const seenRate =
          approvedUsers.length > 0
            ? Math.round((seenMembers.length / approvedUsers.length) * 100)
            : 0;

        const q = trackingSearch.trim().toLowerCase();
        const baseList =
          trackingFilter === 'seen'
            ? seenMembers
            : trackingFilter === 'unseen'
            ? unseenMembers
            : [...seenMembers, ...unseenMembers];

        const filteredList = q
          ? baseList.filter(
              (u) =>
                (u.name || '').toLowerCase().includes(q) ||
                (u.email || '').toLowerCase().includes(q) ||
                (u.title || '').toLowerCase().includes(q)
            )
          : baseList;

        return (
          <div
            onClick={() => setTrackingDialogId(null)}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs"
            role="dialog"
            aria-modal="true"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg max-h-[85vh] overflow-hidden flex flex-col text-xs"
            >
              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between gap-3">
                <div className="min-w-0 space-y-1">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    Dialog Read Receipts{currentRev > 1 ? ` · Round ${currentRev}` : ''}
                  </div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white truncate">
                    {tracked.title}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setTrackingDialogId(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Coverage Metrics Strip */}
              <div className="px-6 py-3.5 bg-slate-50/80 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800 grid grid-cols-3 gap-3 text-center">
                <div>
                  <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                    {seenMembers.length}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                    Seen
                  </div>
                </div>
                <div>
                  <div className="text-lg font-bold text-slate-900 dark:text-white tabular-nums">
                    {unseenMembers.length}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                    Not Yet Seen
                  </div>
                </div>
                <div>
                  <div className="text-lg font-bold text-[#005CBD] dark:text-blue-400 tabular-nums">
                    {seenRate}%
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                    Team Reach
                  </div>
                </div>
              </div>

              {/* Filter Tabs & Search */}
              <div className="px-6 py-3 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl self-start">
                  <button
                    type="button"
                    onClick={() => setTrackingFilter('seen')}
                    className={`px-2.5 py-1 rounded-lg font-semibold transition-colors tabular-nums ${
                      trackingFilter === 'seen'
                        ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    Seen ({seenMembers.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setTrackingFilter('unseen')}
                    className={`px-2.5 py-1 rounded-lg font-semibold transition-colors tabular-nums ${
                      trackingFilter === 'unseen'
                        ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    Not Seen ({unseenMembers.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setTrackingFilter('all')}
                    className={`px-2.5 py-1 rounded-lg font-semibold transition-colors tabular-nums ${
                      trackingFilter === 'all'
                        ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    All ({approvedUsers.length})
                  </button>
                </div>

                <div className="relative flex-1 sm:max-w-[200px]">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={trackingSearch}
                    onChange={(e) => setTrackingSearch(e.target.value)}
                    placeholder="Filter member..."
                    className="w-full pl-8 pr-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#005CBD]"
                  />
                </div>
              </div>

              {/* Member List */}
              <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 px-6">
                {filteredList.length === 0 ? (
                  <div className="py-10 text-center text-slate-400 dark:text-slate-500">
                    {trackingFilter === 'seen'
                      ? 'No team members have seen this dialog yet.'
                      : trackingFilter === 'unseen'
                      ? 'Every approved team member has seen this dialog.'
                      : 'No matching team members found.'}
                  </div>
                ) : (
                  filteredList.map((member) => {
                    const receipt = seenMap[member.id];
                    const hasSeenCurrent = (receipt?.revision ?? 0) >= currentRev;
                    const memberDepts = safeDepts
                      .filter((d) => (member.departmentIds || []).includes(d.id))
                      .map((d) => d.code)
                      .join(', ');

                    return (
                      <div
                        key={member.id}
                        className="py-3 flex items-center justify-between gap-3"
                      >
                        <button
                          type="button"
                          onClick={() => openMemberProfile(member.id)}
                          className="flex items-center gap-3 min-w-0 text-left group"
                          title={`View ${member.name}'s profile`}
                        >
                          <img
                            src={
                              member.avatarUrl ||
                              'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
                            }
                            alt={member.name}
                            className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-200 dark:ring-slate-700 group-hover:ring-[#005CBD] shrink-0"
                          />
                          <div className="min-w-0">
                            <div className="font-semibold text-slate-900 dark:text-white group-hover:text-[#005CBD] dark:group-hover:text-blue-400 group-hover:underline truncate">
                              {member.name}
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                              {member.title || 'Team Member'}
                              {memberDepts ? ` · ${memberDepts}` : ''}
                            </div>
                          </div>
                        </button>

                        <div className="text-right shrink-0">
                          {hasSeenCurrent && receipt ? (
                            <div>
                              <div className="font-semibold text-emerald-700 dark:text-emerald-400 inline-flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Seen</span>
                              </div>
                              <div className="text-[10px] text-slate-400 dark:text-slate-500 tabular-nums mt-0.5">
                                {new Date(receipt.seenAt).toLocaleString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: 'numeric',
                                  minute: '2-digit',
                                })}
                              </div>
                            </div>
                          ) : (
                            <div>
                              <div className="font-medium text-slate-400 dark:text-slate-500">
                                Not opened yet
                              </div>
                              {receipt && receipt.revision < currentRev && (
                                <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                                  Saw round {receipt.revision} earlier
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Footer */}
              <div className="px-6 py-3.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40 flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => setTrackingDialogId(null)}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 rounded-xl font-semibold transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
