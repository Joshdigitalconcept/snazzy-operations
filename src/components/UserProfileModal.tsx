import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  X,
  User as UserIcon,
  Mail,
  Briefcase,
  Building2,
  Lock,
  Crown,
  Shield,
  Check,
  LogOut,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Archive,
  RotateCcw,
  Plus,
  Search,
} from 'lucide-react';

interface UserProfileModalProps {
  onClose: () => void;
}

const AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
];

export const UserProfileModal: React.FC<UserProfileModalProps> = ({ onClose }) => {
  const {
    currentUser,
    departments,
    tasks,
    updateTask,
    activeWeek,
    setIsCreateTaskOpen,
    setCreateTaskModalMode,
    updateProfile,
    changePassword,
    logout,
    isTeamLead,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'permissions' | 'archive'>('profile');
  const [archiveSearch, setArchiveSearch] = useState('');

  // Profile Edit State
  const initialFirst = currentUser?.firstName || (currentUser?.name ? currentUser.name.trim().split(/\s+/)[0] : '');
  const initialLast = currentUser?.lastName || (currentUser?.name ? currentUser.name.trim().split(/\s+/).slice(1).join(' ') : '');
  const [firstName, setFirstName] = useState(initialFirst);
  const [lastName, setLastName] = useState(initialLast);
  const [avatarUrl, setAvatarUrl] = useState(currentUser?.avatarUrl || AVATAR_PRESETS[0]);
  const [selectedDeptId, setSelectedDeptId] = useState<string>(
    (currentUser?.departmentIds || []).length > 0 ? currentUser.departmentIds[0] : (departments[0]?.id || 'dept-biz')
  );
  const [profileMsg, setProfileMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Password Change State
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [passMsg, setPassMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const isAdmin = currentUser?.role === 'admin';
  const leadDepts = (departments || []).filter((d) => (d.teamLeadIds || []).includes(currentUser?.id || ''));
  const currentDept = (departments || []).find((d) => (currentUser?.departmentIds || []).includes(d.id));

  const handleSelectDepartment = (deptId: string) => {
    if (!isAdmin) return;
    setSelectedDeptId(deptId);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMsg(null);
    if (!firstName.trim()) {
      setProfileMsg({ type: 'error', text: 'First Name is required.' });
      return;
    }

    const combinedName = `${firstName.trim()} ${lastName.trim()}`.trim();

    const profileUpdates: Partial<typeof currentUser> = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      name: combinedName,
      avatarUrl,
    };

    // Only update department if user is admin
    if (isAdmin && selectedDeptId) {
      profileUpdates.departmentIds = [selectedDeptId];
    }

    updateProfile(profileUpdates);

    setProfileMsg({ type: 'success', text: 'Profile changes saved successfully!' });
    setTimeout(() => setProfileMsg(null), 3000);
  };

  const handleChangePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPassMsg(null);
    if (!currentPass) {
      setPassMsg({ type: 'error', text: 'Please enter your current password.' });
      return;
    }
    if (!newPass || newPass.length < 6) {
      setPassMsg({ type: 'error', text: 'New password must be at least 6 characters.' });
      return;
    }
    if (newPass !== confirmPass) {
      setPassMsg({ type: 'error', text: 'Passwords do not match.' });
      return;
    }

    const res = changePassword(currentPass, newPass);
    if (!res.success) {
      setPassMsg({ type: 'error', text: res.message || 'Failed to update password.' });
    } else {
      setPassMsg({ type: 'success', text: 'Password updated successfully!' });
      setCurrentPass('');
      setNewPass('');
      setConfirmPass('');
      setTimeout(() => setPassMsg(null), 3000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#001C42] to-[#00224D] text-white p-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <img
                src={avatarUrl}
                alt={currentUser?.name || 'User'}
                className="w-14 h-14 rounded-full object-cover ring-4 ring-white/20 shadow-md"
              />
              {(leadDepts || []).length > 0 && (
                <div className="absolute -bottom-1 -right-1 bg-amber-500 text-slate-950 p-1 rounded-full shadow-xs" title="Team Lead">
                  <Crown className="w-3.5 h-3.5 fill-slate-950" />
                </div>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white">{currentUser?.name || 'User'}</h2>
                <span className="bg-white/20 text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                  {(currentUser?.role || 'team_member').replace('_', ' ')}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">{currentDept?.name || 'Operations Team'}</p>
              <p className="text-[11px] text-slate-400">{currentUser.email}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-300 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-4 sm:gap-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 px-4 sm:px-6 text-xs font-bold text-slate-600 dark:text-slate-300 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('profile')}
            className={`py-3.5 border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
              activeTab === 'profile'
                ? 'border-[#005CBD] text-[#005CBD] dark:text-blue-400 dark:border-blue-400'
                : 'border-transparent hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <UserIcon className="w-4 h-4" /> Profile Details
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`py-3.5 border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
              activeTab === 'security'
                ? 'border-[#005CBD] text-[#005CBD] dark:text-blue-400 dark:border-blue-400'
                : 'border-transparent hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Lock className="w-4 h-4" /> Password & Security
          </button>
          <button
            onClick={() => setActiveTab('permissions')}
            className={`py-3.5 border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
              activeTab === 'permissions'
                ? 'border-[#005CBD] text-[#005CBD] dark:text-blue-400 dark:border-blue-400'
                : 'border-transparent hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Shield className="w-4 h-4" /> Roles & Designations
          </button>
          <button
            onClick={() => setActiveTab('archive')}
            className={`py-3.5 border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
              activeTab === 'archive'
                ? 'border-[#005CBD] text-[#005CBD] dark:text-blue-400 dark:border-blue-400'
                : 'border-transparent hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Archive className="w-4 h-4" /> My Archive
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
              {(tasks || []).filter((t) => t.archived && (t.ownerId === currentUser?.id || currentUser?.role === 'admin')).length}
            </span>
          </button>
        </div>

        {/* Tab Contents */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4 text-xs">
          {/* TAB 1: PROFILE DETAILS */}
          {activeTab === 'profile' && (
            <form onSubmit={handleSaveProfile} className="space-y-4">
              {profileMsg && (
                <div
                  className={`p-3 rounded-xl text-xs flex items-center gap-2 border ${
                    profileMsg.type === 'error'
                      ? 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300'
                      : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                  }`}
                >
                  {profileMsg.type === 'error' ? (
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  )}
                  <span>{profileMsg.text}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Joshua"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-[#005CBD] text-slate-900 dark:text-white font-medium text-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Fasinu"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-[#005CBD] text-slate-900 dark:text-white font-medium text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Full Display Name Preview</label>
                <input
                  type="text"
                  disabled
                  value={`${firstName} ${lastName}`.trim() || '—'}
                  className="w-full p-2.5 bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-500 dark:text-slate-400 font-medium text-xs cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Email Address (Primary Identifier)</label>
                <input
                  type="email"
                  disabled
                  value={currentUser.email}
                  className="w-full p-2.5 bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-500 dark:text-slate-400 font-medium cursor-not-allowed"
                />
              </div>

              {/* Avatar Preset Gallery */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-2">Profile Avatar Picture</label>
                <div className="flex items-center gap-3 overflow-x-auto pb-2">
                  {AVATAR_PRESETS.map((url, idx) => (
                    <img
                      key={idx}
                      src={url}
                      alt="Avatar preset"
                      onClick={() => setAvatarUrl(url)}
                      className={`w-12 h-12 rounded-full object-cover cursor-pointer transition-all border-2 ${
                        avatarUrl === url
                          ? 'border-[#005CBD] scale-110 shadow-md ring-2 ring-blue-200 dark:ring-blue-800'
                          : 'border-transparent opacity-70 hover:opacity-100'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Department Section - Admin can change, Non-admin read-only, Single department only */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5 text-[#005CBD] dark:text-blue-400" />
                    Department Assignment
                  </label>
                  {!isAdmin && (
                    <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                      <Lock className="w-3 h-3" /> Managed by Administrator
                    </span>
                  )}
                  {isAdmin && (
                    <span className="text-[10px] text-[#005CBD] dark:text-blue-400 font-medium">
                      Select one department
                    </span>
                  )}
                </div>

                {isAdmin ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl">
                    {departments.map((dept) => {
                      const isSelected = selectedDeptId === dept.id;
                      return (
                        <div
                          key={dept.id}
                          onClick={() => handleSelectDepartment(dept.id)}
                          className={`p-2.5 rounded-lg cursor-pointer transition-all flex items-center justify-between ${
                            isSelected
                              ? 'bg-blue-100/80 dark:bg-blue-950/70 border border-blue-400 dark:border-blue-700 text-blue-900 dark:text-blue-200 font-bold shadow-2xs'
                              : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-750'
                          }`}
                        >
                          <div>
                            <div className="truncate text-xs">{dept.name}</div>
                            <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">{dept.code}</div>
                          </div>
                          <div
                            className={`w-4 h-4 rounded-full flex items-center justify-center border ${
                              isSelected
                                ? 'bg-[#005CBD] border-[#005CBD] text-white'
                                : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700'
                            }`}
                          >
                            {isSelected && <Check className="w-2.5 h-2.5" />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950 text-[#005CBD] dark:text-blue-300 font-bold flex items-center justify-center text-xs">
                        {currentDept?.code || 'DEPT'}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white text-xs">{currentDept?.name || 'Assigned Department'}</div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">{currentDept?.code || ''}</div>
                      </div>
                    </div>
                    <span className="text-[10px] bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-full font-medium">
                      Current Department
                    </span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    logout();
                    onClose();
                  }}
                  className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-colors"
                >
                  <LogOut className="w-4 h-4" /> Log Out
                </button>

                <button
                  type="submit"
                  className="bg-[#005CBD] hover:bg-[#0051B8] text-white px-5 py-2 rounded-xl font-bold shadow-md transition-all"
                >
                  Save Profile Changes
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: PASSWORD & SECURITY */}
          {activeTab === 'security' && (
            <form onSubmit={handleChangePasswordSubmit} className="space-y-4">
              {passMsg && (
                <div
                  className={`p-3 rounded-xl text-xs flex items-center gap-2 border ${
                    passMsg.type === 'error'
                      ? 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300'
                      : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                  }`}
                >
                  {passMsg.type === 'error' ? (
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  )}
                  <span>{passMsg.text}</span>
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Current Password *</label>
                <input
                  type="password"
                  required
                  placeholder="Enter your current password"
                  value={currentPass}
                  onChange={(e) => setCurrentPass(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-[#005CBD] text-slate-900 dark:text-white font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">New Password *</label>
                <input
                  type="password"
                  required
                  placeholder="Minimum 6 characters"
                  value={newPass}
                  onChange={(e) => setNewPass(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-[#005CBD] text-slate-900 dark:text-white font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Confirm New Password *</label>
                <input
                  type="password"
                  required
                  placeholder="Re-enter new password"
                  value={confirmPass}
                  onChange={(e) => setConfirmPass(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-[#005CBD] text-slate-900 dark:text-white font-medium"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2.5 bg-[#005CBD] hover:bg-[#0051B8] text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
                >
                  <Lock className="w-4 h-4" /> Update Password
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: ROLES & DESIGNATIONS */}
          {activeTab === 'permissions' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl space-y-2">
                <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-sm">
                  <Shield className="w-4 h-4 text-[#005CBD] dark:text-blue-400" /> Your Role & Access
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-800 dark:text-slate-200">Current Role:</span>
                  <span className="bg-purple-100 dark:bg-purple-950/60 text-purple-900 dark:text-purple-300 font-bold px-2.5 py-0.5 rounded uppercase tracking-wider text-[11px]">
                    {currentUser.role.replace('_', ' ')}
                  </span>
                </div>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-[11px]">
                  {currentUser.role === 'admin' && 'You can manage team members, departments, roles, and view all dashboards.'}
                  {currentUser.role === 'business_ops' && 'You have access to the Business Operations dashboard, department reports, and team updates.'}
                  {currentUser.role === 'team_member' && 'You can create tasks, upload deliverables, work with your department, and share weekly reflections.'}
                </p>
              </div>

              {/* Team Lead Badges */}
              <div className="p-4 bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 rounded-2xl space-y-2">
                <div className="font-bold text-amber-900 dark:text-amber-300 flex items-center gap-2 text-sm">
                  <Crown className="w-4 h-4 text-amber-600 dark:text-amber-400 fill-amber-500" /> Team Lead Access
                </div>
                {(leadDepts || []).length === 0 ? (
                  <p className="text-slate-600 dark:text-slate-400 text-[11px]">
                    You are not currently assigned as a Team Lead for any department.
                  </p>
                ) : (
                  <div className="space-y-1">
                    <p className="text-slate-700 dark:text-slate-300 text-[11px] font-medium">
                      You are designated Team Lead for the following department(s):
                    </p>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {(leadDepts || []).map((d) => (
                        <span key={d.id} className="bg-amber-100 dark:bg-amber-900/50 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs font-bold px-3 py-1 rounded-xl flex items-center gap-1.5 shadow-2xs">
                          <Crown className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                          <span>{d.name} ({d.code})</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: MY ARCHIVED TASKS */}
          {activeTab === 'archive' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700/60">
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm flex items-center gap-2">
                    <Archive className="w-4 h-4 text-[#005CBD] dark:text-blue-400" />
                    Personal Task Archive
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Tasks you have archived are kept here in your space. You can restore them to the current week or use them to create new operational tasks.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    setCreateTaskModalMode('archive');
                    setIsCreateTaskOpen(true);
                  }}
                  className="px-3 py-1.5 bg-[#005CBD] hover:bg-[#0051B8] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shrink-0 shadow-xs transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add to Active Cycle</span>
                </button>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search your archived tasks by title, objective, or department..."
                  value={archiveSearch}
                  onChange={(e) => setArchiveSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#005CBD]"
                />
              </div>

              {/* List of Tasks */}
              {(() => {
                const userArchived = (tasks || [])
                  .filter((t) => t.archived && (t.ownerId === currentUser?.id || currentUser?.role === 'admin'))
                  .filter((t) => {
                    if (!archiveSearch.trim()) return true;
                    const q = archiveSearch.toLowerCase();
                    return (
                      t.title.toLowerCase().includes(q) ||
                      (t.objective || '').toLowerCase().includes(q) ||
                      (t.departmentName || '').toLowerCase().includes(q)
                    );
                  });

                if (userArchived.length === 0) {
                  return (
                    <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 space-y-2">
                      <Archive className="w-8 h-8 text-slate-400 mx-auto" />
                      <div className="font-bold text-slate-700 dark:text-slate-300 text-xs">No archived tasks found</div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                        {archiveSearch.trim()
                          ? 'No archived tasks matched your query.'
                          : 'When you archive tasks from the board or modal, they safely land here in your archive space so you can easily pull them back whenever needed.'}
                      </p>
                    </div>
                  );
                }

                return (
                  <div className="space-y-2.5">
                    {userArchived.map((task) => (
                      <div
                        key={task.id}
                        className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 space-y-2 hover:border-slate-300 dark:hover:border-slate-700 transition-all shadow-2xs"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-slate-900 dark:text-white text-xs">{task.title}</span>
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                                {task.priority}
                              </span>
                              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-50 dark:bg-blue-950/50 text-[#005CBD] dark:text-blue-400 border border-blue-100 dark:border-blue-900/40">
                                {task.departmentName}
                              </span>
                            </div>
                            {task.objective && (
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                                {task.objective}
                              </p>
                            )}
                          </div>

                          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                            <button
                              type="button"
                              onClick={async () => {
                                await updateTask(task.id, {
                                  archived: false,
                                  weekId: activeWeek,
                                  status: 'Not Started',
                                  progressPercent: 0,
                                });
                              }}
                              className="px-2.5 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900 text-[#005CBD] dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-xs font-bold flex items-center gap-1 transition-colors"
                              title={`Restore directly into active week ${activeWeek}`}
                            >
                              <RotateCcw className="w-3 h-3" />
                              <span>Restore to {activeWeek}</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                onClose();
                                setCreateTaskModalMode('archive');
                                setIsCreateTaskOpen(true);
                              }}
                              className="px-2.5 py-1.5 rounded-xl bg-[#005CBD] hover:bg-[#0051B8] text-white text-xs font-bold flex items-center gap-1 shadow-xs transition-all"
                              title="Open add task modal with archive selection"
                            >
                              <Plus className="w-3 h-3" />
                              <span>Add to Board</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
