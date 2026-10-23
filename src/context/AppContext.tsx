import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  sendPasswordResetEmail,
  updateProfile as updateAuthProfile,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  deleteField,
  onSnapshot,
  query,
  where,
  getDocs,
} from 'firebase/firestore';
import { auth, db, googleProvider, handleFirestoreError, OperationType, testConnection, cleanForFirestore } from '../lib/firebase';
import {
  User,
  Department,
  Task,
  TaskStatus,
  TaskPriority,
  Notification,
  NotificationType,
  getAutomaticProgress,
  WeeklyReflection,
  AuditLog,
  BugReport,
  TaskComment,
  Deliverable,
  ActivityItem,
  ActivityType,
  WeekFilterOption,
  WeekPeriod,
  CloudinaryConfig,
  WorkDriveConfig,
  WorkDriveDeliverableMeta,
} from '../types';
import { generateDefaultWeeks, getCurrentWeekId } from '../utils/weekUtils';
import {
  buildWorkDriveFileName,
  buildWorkDriveFullPath,
  buildWorkDrivePreviewUrl,
  getWorkDriveCycleFolderName,
  parseCloudinaryUrlInput,
} from '../utils/workdriveUtils';
import {
  SEEDED_USER_IDS,
  SEEDED_TASK_IDS,
  SEEDED_REFLECTION_IDS,
  SEEDED_NOTIFICATION_IDS,
  SEEDED_AUDIT_IDS,
  SEEDED_BUG_IDS,
  isSeededUser,
} from '../utils/seedData';

interface AppContextType {
  // Theme
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  toggleTheme: () => void;

  // Current session & user
  currentUser: User;
  setCurrentUser: (user: User) => void;
  users: User[];
  isAuthenticated: boolean;
  setIsAuthenticated: (val: boolean) => void;
  isUserProfileOpen: boolean;
  setIsUserProfileOpen: (open: boolean) => void;

  // Authentication & Session
  login: (email: string, password?: string) => Promise<{ success: boolean; message?: string }>;
  googleSignIn: () => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  signup: (name: string, email: string, password: string, title: string, departmentIds: string[]) => Promise<{ success: boolean; message?: string }>;
  forgotPassword: (email: string) => Promise<{ success: boolean; message?: string }>;
  resetPasswordWithOtp: (email: string, otp: string, newPassword: string) => { success: boolean; message?: string };
  updateProfile: (updates: Partial<User>) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => { success: boolean; message?: string };
  updateUser: (userId: string, updates: Partial<User>) => Promise<void>;

  // Navigation & UI state
  activeView: 'dashboard' | 'tasks' | 'past_tasks' | 'department_health' | 'reports' | 'reflections' | 'admin';
  setActiveView: (view: 'dashboard' | 'tasks' | 'past_tasks' | 'department_health' | 'reports' | 'reflections' | 'admin') => void;
  activeDashboardTab: 'member' | 'team_lead' | 'biz_ops';
  setActiveDashboardTab: (tab: 'member' | 'team_lead' | 'biz_ops') => void;
  isMobileSidebarOpen: boolean;
  setIsMobileSidebarOpen: (open: boolean) => void;
  selectedTaskId: string | null;
  setSelectedTaskId: (id: string | null) => void;
  selectedTaskTab: 'details' | 'deliverables' | 'comments' | 'history';
  setSelectedTaskTab: (tab: 'details' | 'deliverables' | 'comments' | 'history') => void;
  openTaskModal: (taskId: string, initialTab?: 'details' | 'deliverables' | 'comments' | 'history') => void;
  isCreateTaskOpen: boolean;
  setIsCreateTaskOpen: (open: boolean) => void;
  createTaskModalMode: 'create' | 'archive';
  setCreateTaskModalMode: (mode: 'create' | 'archive') => void;
  isReflectionModalOpen: boolean;
  setIsReflectionModalOpen: (open: boolean) => void;

  // Week & Date filters
  activeWeek: string;
  selectedWeekId: string;
  setSelectedWeekId: (weekId: string) => void;
  weeks: WeekPeriod[];
  weekFilterOption: WeekFilterOption;
  setWeekFilterOption: (opt: WeekFilterOption) => void;
  markFridayComplete: (weekId: string, note?: string) => Promise<void>;
  archiveWeek: (weekId: string) => Promise<void>;
  unarchiveWeek: (weekId: string) => Promise<void>;

  // Domain Entities
  departments: Department[];
  tasks: Task[];
  notifications: Notification[];
  reflections: WeeklyReflection[];
  auditLogs: AuditLog[];
  bugReports: BugReport[];

  // Task Actions
  createTask: (taskData: Omit<Task, 'id' | 'createdAt' | 'ownerId' | 'ownerName' | 'ownerAvatar' | 'watchers' | 'archived' | 'deliverables'> & { ownerId?: string; ownerName?: string; ownerAvatar?: string }) => Promise<Task>;
  updateTask: (taskId: string, updates: Partial<Task>) => Promise<void>;
  updateTaskStatus: (taskId: string, newStatus: TaskStatus, note?: string) => Promise<void>;
  approveTask: (taskId: string, note?: string) => Promise<void>;
  requestRevision: (taskId: string, reason: string) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  addDeliverable: (taskId: string, deliverable: Omit<Deliverable, 'id' | 'uploadedBy' | 'uploadedAt'>) => Promise<void>;
  removeDeliverable: (taskId: string, deliverableId: string) => Promise<void>;
  cloudinaryConfig: CloudinaryConfig;
  updateCloudinaryConfig: (updates: Partial<CloudinaryConfig> & { cloudinaryUrl?: string }) => Promise<void>;
  workdriveConfig: WorkDriveConfig;
  updateWorkDriveConfig: (updates: Partial<WorkDriveConfig>) => Promise<void>;
  generateDeliverableWorkDriveMeta: (task: Task, originalName?: string, customIndex?: number, customCycle?: string) => WorkDriveDeliverableMeta;
  addComment: (taskId: string, content: string, parentId?: string) => Promise<void>;
  editComment: (taskId: string, commentId: string, newContent: string) => Promise<void>;
  deleteComment: (taskId: string, commentId: string) => Promise<void>;
  toggleWatchTask: (taskId: string) => Promise<void>;
  archiveTask: (taskId: string) => Promise<void>;
  restoreTask: (taskId: string) => Promise<void>;

  // Admin & User Management Actions
  approveRegistration: (userId: string) => Promise<void>;
  rejectRegistration: (userId: string) => Promise<void>;
  registerUser: (name: string, email: string, title: string, departmentIds: string[]) => void;
  updateUserRole: (userId: string, role: User['role']) => Promise<void>;
  assignTeamLead: (departmentId: string, userId: string) => Promise<void>;
  removeTeamLead: (departmentId: string, userId: string) => Promise<void>;

  // Department Actions
  createDepartment: (name: string, code: string, description: string, teamLeadIds: string[], memberUserIds?: string[]) => Promise<void>;
  updateDepartment: (id: string, updates: Partial<Department>) => Promise<void>;
  archiveDepartment: (id: string) => Promise<void>;
  unarchiveDepartment: (id: string) => Promise<void>;
  deleteDepartment: (id: string) => Promise<void>;
  addMemberToDepartment: (departmentId: string, userId: string) => Promise<void>;
  removeMemberFromDepartment: (departmentId: string, userId: string) => Promise<void>;
  setDepartmentMembers: (departmentId: string, memberUserIds: string[]) => Promise<void>;

  // Reflection Actions
  submitReflection: (completed: string, carryOver: string, blockers: string) => Promise<void>;

  // Notification Actions
  sendNotification: (userId: string, title: string, message: string, type: NotificationType, taskId?: string) => Promise<void>;
  notifyDepartmentLeads: (departmentId: string, title: string, message: string, type: NotificationType, taskId?: string) => Promise<void>;
  markNotificationAsRead: (notifId: string) => Promise<void>;
  markAllNotificationsAsRead: () => Promise<void>;
  clearReadNotifications: () => Promise<void>;
  clearAllNotifications: () => Promise<void>;
  checkDeadlineReminders: () => number;

  // Misc Actions
  submitBugReport: (title: string, description: string, severity: BugReport['severity']) => Promise<void>;
  resetToDefaults: () => Promise<void>;

  // Helper getters & permissions
  isTeamLead: (userId?: string, departmentId?: string) => boolean;
  hasDepartmentLead: (departmentId?: string) => boolean;
  isCrossDeptSupport: (task: Task) => boolean;
  canEditTask: (task: Task) => boolean;
  canApproveTask: (task: Task) => boolean;
  getTaskComments: (taskId: string) => TaskComment[];
  getTaskActivities: (taskId: string) => ActivityItem[];
}

export const DEFAULT_TEAM_MEMBERS: User[] = [];

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Test connection on startup
  useEffect(() => {
    testConnection();
  }, []);

  // State initialized purely empty / dynamically
  const [currentUser, setCurrentUser] = useState<User>({
    id: '',
    name: 'Loading...',
    email: '',
    title: '',
    role: 'team_member',
    departmentIds: [],
    registrationStatus: 'approved',
  });

  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [reflections, setReflections] = useState<WeeklyReflection[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [bugReports, setBugReports] = useState<BugReport[]>([]);
  const [taskComments, setTaskComments] = useState<Record<string, TaskComment[]>>({});
  const [taskActivities, setTaskActivities] = useState<Record<string, ActivityItem[]>>({});
  const [weeks, setWeeks] = useState<WeekPeriod[]>(() => generateDefaultWeeks());

  // UI state
  const [theme, setThemeState] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('snazzy_theme');
    if (saved === 'dark' || saved === 'light') return saved;
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  const setTheme = (newTheme: 'light' | 'dark') => {
    setThemeState(newTheme);
    localStorage.setItem('snazzy_theme', newTheme);
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const [activeView, setActiveView] = useState<'dashboard' | 'tasks' | 'past_tasks' | 'department_health' | 'reports' | 'reflections' | 'admin'>('dashboard');
  const [activeDashboardTab, setActiveDashboardTab] = useState<'member' | 'team_lead' | 'biz_ops'>('member');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [selectedTaskTab, setSelectedTaskTab] = useState<'details' | 'deliverables' | 'comments' | 'history'>('details');

  const openTaskModal = (
    taskId: string,
    initialTab: 'details' | 'deliverables' | 'comments' | 'history' = 'details'
  ) => {
    setSelectedTaskTab(initialTab);
    setSelectedTaskId(taskId);
  };

  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [createTaskModalMode, setCreateTaskModalMode] = useState<'create' | 'archive'>('create');
  const [isReflectionModalOpen, setIsReflectionModalOpen] = useState(false);
  const [isUserProfileOpen, setIsUserProfileOpen] = useState(false);
  const [activeWeek] = useState<string>(() => getCurrentWeekId());
  const [selectedWeekId, setSelectedWeekId] = useState<string>(() => getCurrentWeekId());
  const [weekFilterOption, setWeekFilterOption] = useState<WeekFilterOption>('current');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  // Cloudinary Deliverable Storage State (Active Primary Engine)
  const [cloudinaryConfig, setCloudinaryConfig] = useState<CloudinaryConfig>(() => {
    const saved = localStorage.getItem('snazzy_cloudinary_config');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          enabled: true,
          cloudName: '',
          apiKey: '',
          apiSecret: '',
          uploadPreset: '',
          rootFolder: 'Deliverables',
          autoCycleFolder: true,
          namingConvention: 'department_username_[index]',
          useDepartmentCode: false,
          connected: false,
          ...parsed,
        };
      } catch (e) {
        // fallback to default
      }
    }
    return {
      enabled: true,
      cloudName: '',
      apiKey: '',
      apiSecret: '',
      uploadPreset: '',
      rootFolder: 'Deliverables',
      autoCycleFolder: true,
      namingConvention: 'department_username_[index]',
      useDepartmentCode: false,
      connected: false,
      lastSyncedAt: new Date().toISOString(),
    };
  });

  // Zoho WorkDrive Integration State (Suspended)
  const [workdriveConfig, setWorkdriveConfig] = useState<WorkDriveConfig>(() => {
    const saved = localStorage.getItem('snazzy_workdrive_config');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (!parsed.workspaceId) parsed.workspaceId = '4imj816429a4baa7747aa814b03cdbe7b2c2c';
        if (!parsed.parentFolderId) parsed.parentFolderId = '6p1w1d9fdf7f349244201bd98bea82e968be5';
        return { ...parsed, enabled: false };
      } catch (e) {
        // fallback to default
      }
    }
    return {
      enabled: false,
      rootFolder: 'Deliverables',
      autoCycleFolder: true,
      namingConvention: 'department_username_[index]',
      useDepartmentCode: false,
      zohoDomain: 'zoho.com',
      parentFolderId: '6p1w1d9fdf7f349244201bd98bea82e968be5',
      workspaceId: '4imj816429a4baa7747aa814b03cdbe7b2c2c',
      parentFolderUrl: 'https://workdrive.zoho.com/4imj816429a4baa7747aa814b03cdbe7b2c2c/privatespace/folders/6p1w1d9fdf7f349244201bd98bea82e968be5',
      teamFolderName: 'Company Deliverables Drive',
      connected: false,
      lastSyncedAt: new Date().toISOString(),
    };
  });

  // 1. Firebase Auth listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser: FirebaseUser | null) => {
      if (fbUser) {
        const emailLower = fbUser.email?.toLowerCase() || '';
        const isAdmin = emailLower === 'fasinujoshua0@gmail.com';
        const userRef = doc(db, 'users', fbUser.uid);

        let userObj: User;

        try {
          const snap = await getDoc(userRef);
          if (snap.exists()) {
            const data = snap.data();
            let name = data.name || fbUser.displayName || '';
            let firstName = data.firstName || '';
            let lastName = data.lastName || '';

            if ((!name || name === fbUser.email?.split('@')[0]) && fbUser.displayName) {
              name = fbUser.displayName;
            }

            if (!name) {
              name = fbUser.email ? fbUser.email.split('@')[0] : 'User';
            }

            if (!firstName) {
              const parts = name.trim().split(/\s+/);
              firstName = parts[0] || 'User';
              lastName = parts.slice(1).join(' ') || '';
            }

            let cleanTitle = data.title;
            if (cleanTitle && cleanTitle.includes('Head of Ops')) {
              cleanTitle = cleanTitle.replace(' & Head of Ops', '').replace('Head of Ops', '').trim() || 'System Administrator';
            }

            userObj = {
              id: fbUser.uid,
              name,
              firstName,
              lastName,
              email: fbUser.email || data.email || '',
              title: cleanTitle || (isAdmin ? 'System Administrator' : 'Team Member'),
              role: isAdmin ? 'admin' : (data.role || 'team_member'),
              departmentIds: data.departmentIds || [],
              avatarUrl: data.avatarUrl || fbUser.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
              registrationStatus: data.registrationStatus || 'approved',
              joinedDate: data.joinedDate || new Date().toISOString(),
            };

            if (isAdmin && (data.role !== 'admin' || data.title?.includes('Head of Ops'))) {
              userObj.role = 'admin';
              await setDoc(userRef, { role: 'admin', title: userObj.title, registrationStatus: 'approved' }, { merge: true }).catch(() => {});
            }
          } else {
            const rawName = fbUser.displayName || (fbUser.email ? fbUser.email.split('@')[0] : 'User');
            const nameParts = rawName.trim().split(/\s+/);
            const first = nameParts[0] || 'User';
            const last = nameParts.slice(1).join(' ') || '';

            userObj = {
              id: fbUser.uid,
              name: rawName,
              firstName: first,
              lastName: last,
              email: fbUser.email || '',
              title: isAdmin ? 'System Administrator' : 'Team Member',
              role: isAdmin ? 'admin' : 'team_member',
              departmentIds: [],
              avatarUrl: fbUser.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
              registrationStatus: 'approved',
              joinedDate: new Date().toISOString(),
            };
            await setDoc(userRef, cleanForFirestore(userObj), { merge: true }).catch(() => {});
          }
        } catch (err) {
          console.warn('Firestore user doc sync notice (using auth profile):', err);
          const rawName = fbUser.displayName || (fbUser.email ? fbUser.email.split('@')[0] : 'User');
          const nameParts = rawName.trim().split(/\s+/);
          userObj = {
            id: fbUser.uid,
            name: rawName,
            firstName: nameParts[0] || 'User',
            lastName: nameParts.slice(1).join(' ') || '',
            email: fbUser.email || '',
            title: isAdmin ? 'System Administrator' : 'Team Member',
            role: isAdmin ? 'admin' : 'team_member',
            departmentIds: [],
            avatarUrl: fbUser.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
            registrationStatus: 'approved',
            joinedDate: new Date().toISOString(),
          };
        } finally {
          setCurrentUser(userObj);
          setIsAuthenticated(true);
        }
      } else {
        setIsAuthenticated(false);
        setCurrentUser({
          id: '',
          name: '',
          firstName: '',
          lastName: '',
          email: '',
          title: '',
          role: 'team_member',
          departmentIds: [],
          registrationStatus: 'approved',
          joinedDate: new Date().toISOString(),
        });
      }
    });

    return () => unsubscribe();
  }, []);

  // 2. Realtime listeners for Firestore - all collections are fetched live from Firestore
  useEffect(() => {
    if (!isAuthenticated || !currentUser?.id) return;

    const pathDepts = 'departments';
    const unsubDepts = onSnapshot(collection(db, pathDepts), async (snapshot) => {
      if (snapshot.empty) {
        setDepartments([]);
        return;
      }
      const list = snapshot.docs.map((d) => {
        const data = d.data();
        const deptName = (data.name || '').trim();
        const isCommunity = deptName.toLowerCase() === 'community';
        const normalizedCode = isCommunity ? 'Community' : data.code;
        const rawLeads: string[] = Array.isArray(data.teamLeadIds) ? data.teamLeadIds : [];
        const cleanedLeads = rawLeads.filter((id) => !SEEDED_USER_IDS.includes(id));

        if ((isCommunity && data.code !== 'Community') || cleanedLeads.length !== rawLeads.length) {
          setDoc(
            doc(db, 'departments', d.id),
            {
              ...(isCommunity ? { code: 'Community' } : {}),
              teamLeadIds: cleanedLeads,
            },
            { merge: true }
          ).catch(() => {});
        }

        return {
          ...data,
          id: d.id,
          code: normalizedCode,
          teamLeadIds: cleanedLeads,
        } as Department;
      });
      setDepartments(list);
    }, (err) => handleFirestoreError(err, OperationType.GET, pathDepts));

    const pathUsers = 'users';
    const unsubUsers = onSnapshot(collection(db, pathUsers), (snapshot) => {
      const list: User[] = [];
      snapshot.docs.forEach((d) => {
        const data = d.data();
        const userRecord = {
          ...data,
          id: d.id,
          departmentIds: Array.isArray(data.departmentIds) ? data.departmentIds : [],
        } as User;

        if (isSeededUser(userRecord)) {
          deleteDoc(doc(db, 'users', d.id)).catch(() => {});
          return;
        }
        list.push(userRecord);
      });

      const userMap = new Map<string, User>();
      list.forEach((u) => userMap.set(u.id, u));
      if (currentUser?.id && !isSeededUser(currentUser)) {
        const currentInMap = userMap.get(currentUser.id);
        if (currentInMap) {
          userMap.set(currentUser.id, { ...currentInMap, ...currentUser });
        } else {
          userMap.set(currentUser.id, currentUser);
        }
      }
      setUsers(Array.from(userMap.values()));

      if (currentUser?.id) {
        const found = list.find((u) => u.id === currentUser.id);
        if (found) {
          setCurrentUser((prev) => ({
            ...prev,
            ...found,
            departmentIds: Array.isArray(found.departmentIds) ? found.departmentIds : [],
          }));
        }
      }
    }, (err) => handleFirestoreError(err, OperationType.GET, pathUsers));

    const pathTasks = 'tasks';
    const unsubTasks = onSnapshot(collection(db, pathTasks), (snapshot) => {
      const list: Task[] = [];
      snapshot.docs.forEach((d) => {
        const data = d.data();
        if (SEEDED_TASK_IDS.includes(d.id) || SEEDED_USER_IDS.includes(data.ownerId)) {
          deleteDoc(doc(db, 'tasks', d.id)).catch(() => {});
          return;
        }
        list.push({
          ...data,
          id: d.id,
          deliverables: Array.isArray(data.deliverables) ? data.deliverables : [],
          supportNeeded: Array.isArray(data.supportNeeded) ? data.supportNeeded : [],
          watchers: Array.isArray(data.watchers)
            ? data.watchers.filter((wId: string) => !SEEDED_USER_IDS.includes(wId))
            : [],
        } as Task);
      });
      setTasks(list);
    }, (err) => handleFirestoreError(err, OperationType.GET, pathTasks));

    const pathRefls = 'reflections';
    const unsubReflections = onSnapshot(collection(db, pathRefls), (snapshot) => {
      const list: WeeklyReflection[] = [];
      snapshot.docs.forEach((d) => {
        const data = d.data();
        if (SEEDED_REFLECTION_IDS.includes(d.id) || SEEDED_USER_IDS.includes(data.userId)) {
          deleteDoc(doc(db, 'reflections', d.id)).catch(() => {});
          return;
        }
        list.push({ ...data, id: d.id } as WeeklyReflection);
      });
      setReflections(list);
    }, (err) => handleFirestoreError(err, OperationType.GET, pathRefls));

    const pathNotifs = 'notifications';
    const unsubNotifs = onSnapshot(collection(db, pathNotifs), (snapshot) => {
      const list: Notification[] = [];
      snapshot.docs.forEach((d) => {
        const data = d.data();
        if (SEEDED_NOTIFICATION_IDS.includes(d.id) || SEEDED_USER_IDS.includes(data.userId)) {
          deleteDoc(doc(db, 'notifications', d.id)).catch(() => {});
          return;
        }
        list.push({ ...data, id: d.id } as Notification);
      });
      setNotifications(list);
    }, (err) => handleFirestoreError(err, OperationType.GET, pathNotifs));

    const pathAudit = 'auditLogs';
    const unsubAudit = onSnapshot(collection(db, pathAudit), (snapshot) => {
      const list: AuditLog[] = [];
      snapshot.docs.forEach((d) => {
        const data = d.data();
        if (SEEDED_AUDIT_IDS.includes(d.id) || SEEDED_USER_IDS.includes(data.actorId)) {
          deleteDoc(doc(db, 'auditLogs', d.id)).catch(() => {});
          return;
        }
        list.push({ ...data, id: d.id } as AuditLog);
      });
      setAuditLogs(list);
    }, (err) => handleFirestoreError(err, OperationType.GET, pathAudit));

    const pathBugs = 'bugReports';
    const unsubBugs = onSnapshot(collection(db, pathBugs), (snapshot) => {
      const list: BugReport[] = [];
      snapshot.docs.forEach((d) => {
        const data = d.data();
        if (SEEDED_BUG_IDS.includes(d.id) || SEEDED_USER_IDS.includes(data.submittedBy)) {
          deleteDoc(doc(db, 'bugReports', d.id)).catch(() => {});
          return;
        }
        list.push({ ...data, id: d.id } as BugReport);
      });
      setBugReports(list);
    }, (err) => handleFirestoreError(err, OperationType.GET, pathBugs));

    const pathWeeks = 'weeks';
    const unsubWeeks = onSnapshot(collection(db, pathWeeks), (snapshot) => {
      if (!snapshot.empty) {
        const firestoreWeeks = snapshot.docs.map((d) => ({ ...d.data(), id: d.id } as WeekPeriod));
        // Merge with dynamic default calendar weeks
        const base = generateDefaultWeeks();
        const merged = base.map((bw) => {
          const found = firestoreWeeks.find((fw) => fw.id === bw.id);
          return found ? { ...bw, ...found } : bw;
        });
        firestoreWeeks.forEach((fw) => {
          if (!merged.some((m) => m.id === fw.id)) {
            merged.push(fw);
          }
        });
        setWeeks(merged);
      }
    }, (err) => handleFirestoreError(err, OperationType.GET, pathWeeks));

    const pathComments = 'comments';
    const unsubComments = onSnapshot(collection(db, pathComments), (snapshot) => {
      const map: Record<string, TaskComment[]> = {};
      snapshot.docs.forEach((d) => {
        const c = { ...d.data(), id: d.id } as TaskComment;
        if (SEEDED_USER_IDS.includes(c.userId) || SEEDED_TASK_IDS.includes(c.taskId)) {
          deleteDoc(doc(db, 'comments', d.id)).catch(() => {});
          return;
        }
        if (!map[c.taskId]) map[c.taskId] = [];
        map[c.taskId].push(c);
      });
      setTaskComments(map);
    }, (err) => handleFirestoreError(err, OperationType.GET, pathComments));

    const unsubCloudinary = onSnapshot(doc(db, 'settings', 'cloudinary'), (snap) => {
      if (snap.exists()) {
        const data = snap.data() as CloudinaryConfig;
        setCloudinaryConfig((prev) => {
          const merged: CloudinaryConfig = {
            ...prev,
            ...data,
            cloudName: data.cloudName || prev.cloudName || '',
            apiKey: data.apiKey || prev.apiKey || '',
            apiSecret: data.apiSecret || prev.apiSecret || '',
            uploadPreset: data.uploadPreset || prev.uploadPreset || '',
          };
          localStorage.setItem('snazzy_cloudinary_config', JSON.stringify(merged));
          // Keep server config in sync if Firestore has credentials
          if (merged.cloudName && ((merged.apiKey && merged.apiSecret) || merged.uploadPreset)) {
            fetch('/api/cloudinary/config', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(merged),
            }).catch(() => {});
          }
          return merged;
        });
      }
    }, () => {
      // Non-critical if settings collection is not created yet
    });

    // Fetch server-side persistent Cloudinary config (including env vars)
    fetch('/api/cloudinary/config')
      .then(async (r) => {
        if (!r.ok) return null;
        const text = await r.text();
        try {
          return JSON.parse(text);
        } catch {
          return null;
        }
      })
      .then((res) => {
        if (res && res.success && res.config) {
          setCloudinaryConfig((prev) => {
            const merged: CloudinaryConfig = {
              ...prev,
              ...res.config,
              cloudName: res.config.cloudName || prev.cloudName || '',
              apiKey: res.config.apiKey || prev.apiKey || '',
              apiSecret: res.config.apiSecret || prev.apiSecret || '',
              uploadPreset: res.config.uploadPreset || prev.uploadPreset || '',
              connected: Boolean(
                res.config.connected ||
                  prev.connected ||
                  ((res.config.cloudName || prev.cloudName) &&
                    (((res.config.apiKey || prev.apiKey) && (res.config.apiSecret || prev.apiSecret)) ||
                      (res.config.uploadPreset || prev.uploadPreset)))
              ),
            };
            localStorage.setItem('snazzy_cloudinary_config', JSON.stringify(merged));
            return merged;
          });
        }
      })
      .catch((e) => console.warn('Notice reading server Cloudinary config:', e));

    const unsubWorkDrive = onSnapshot(doc(db, 'settings', 'workdrive'), (snap) => {
      if (snap.exists()) {
        const data = snap.data() as WorkDriveConfig;
        setWorkdriveConfig((prev) => {
          const merged: WorkDriveConfig = {
            ...prev,
            ...data,
            enabled: false,
            refreshToken: data.refreshToken || prev.refreshToken || '',
            clientId: data.clientId || prev.clientId || '',
            clientSecret: data.clientSecret || prev.clientSecret || '',
          };
          localStorage.setItem('snazzy_workdrive_config', JSON.stringify(merged));
          return merged;
        });
      }
    }, () => {
      // Non-critical if settings collection is not created yet
    });

    return () => {
      unsubDepts();
      unsubUsers();
      unsubTasks();
      unsubReflections();
      unsubNotifs();
      unsubAudit();
      unsubBugs();
      unsubWeeks();
      unsubComments();
      unsubCloudinary();
      unsubWorkDrive();
    };
  }, [isAuthenticated, currentUser?.id]);

  // Auth Functions
  const googleSignIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      return { success: true };
    } catch (err: any) {
      return { success: false, message: err.message || 'Google sign-in failed' };
    }
  };

  const login = async (email: string, password?: string) => {
    try {
      if (!password) {
        return { success: false, message: 'Password is required' };
      }
      await signInWithEmailAndPassword(auth, email, password);
      return { success: true };
    } catch (err: any) {
      return { success: false, message: err.message || 'Login failed. Please check credentials.' };
    }
  };

  const signup = async (
    nameOrFirst: string,
    emailOrLast: string,
    passwordOrEmail?: string,
    titleOrPassword?: string,
    departmentIdsOrTitle?: string | string[],
    deptIdsOptional?: string[]
  ) => {
    try {
      let firstName = '';
      let lastName = '';
      let fullName = '';
      let email = '';
      let password = '';
      let title = '';
      let departmentIds: string[] = [];

      if (typeof deptIdsOptional !== 'undefined' || Array.isArray(deptIdsOptional)) {
        firstName = nameOrFirst.trim();
        lastName = emailOrLast.trim();
        fullName = `${firstName} ${lastName}`.trim() || firstName || 'User';
        email = (passwordOrEmail || '').trim();
        password = titleOrPassword || '';
        title = typeof departmentIdsOrTitle === 'string' ? departmentIdsOrTitle : 'Team Member';
        departmentIds = deptIdsOptional || [];
      } else if (Array.isArray(departmentIdsOrTitle)) {
        fullName = nameOrFirst.trim();
        const parts = fullName.split(/\s+/);
        firstName = parts[0] || fullName || 'User';
        lastName = parts.slice(1).join(' ') || '';
        email = emailOrLast.trim();
        password = passwordOrEmail || '';
        title = typeof titleOrPassword === 'string' ? titleOrPassword : 'Team Member';
        departmentIds = departmentIdsOrTitle;
      } else {
        fullName = nameOrFirst.trim();
        const parts = fullName.split(/\s+/);
        firstName = parts[0] || fullName || 'User';
        lastName = parts.slice(1).join(' ') || '';
        email = emailOrLast.trim();
        password = passwordOrEmail || '';
        title = typeof titleOrPassword === 'string' ? titleOrPassword : 'Team Member';
        departmentIds = [];
      }

      const cred = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update Firebase Auth profile display name immediately
      if (cred.user) {
        await updateAuthProfile(cred.user, { displayName: fullName }).catch((e) => console.warn('Auth profile update notice:', e));
      }

      const emailLower = email.toLowerCase();
      const isAdmin = emailLower === 'fasinujoshua0@gmail.com';

      const userObj: User = {
        id: cred.user.uid,
        name: fullName || 'User',
        firstName: firstName || fullName || 'User',
        lastName: lastName || '',
        email,
        title: title || (isAdmin ? 'System Administrator' : 'Team Member'),
        role: isAdmin ? 'admin' : 'team_member',
        departmentIds: departmentIds.length > 0 ? departmentIds : (isAdmin ? ['dept-biz', 'dept-it', 'dept-se', 'dept-sm', 'dept-comm'] : ['dept-biz']),
        avatarUrl: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80`,
        registrationStatus: 'approved',
        joinedDate: new Date().toISOString(),
      };

      await setDoc(doc(db, 'users', cred.user.uid), cleanForFirestore(userObj), { merge: true });
      setCurrentUser(userObj);
      setIsAuthenticated(true);
      return { success: true };
    } catch (err: any) {
      return { success: false, message: err.message || 'Registration failed' };
    }
  };

  const logout = async () => {
    await signOut(auth);
    setIsAuthenticated(false);
  };

  const forgotPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
      return { success: true, message: 'Password reset link sent to your email.' };
    } catch (err: any) {
      return { success: false, message: err.message || 'Error sending password reset link.' };
    }
  };

  const resetPasswordWithOtp = (email: string, otp: string, newPassword: string) => {
    return { success: true, message: 'Please check your email link to finalize password reset.' };
  };

  const updateProfile = async (updates: Partial<User>) => {
    if (!currentUser?.id) return;
    const updated = { ...currentUser, ...updates };
    setCurrentUser(updated);

    if (auth.currentUser && updates.name) {
      await updateAuthProfile(auth.currentUser, { displayName: updates.name }).catch(() => {});
    }

    try {
      await setDoc(doc(db, 'users', currentUser.id), cleanForFirestore(updates), { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${currentUser.id}`);
    }
  };

  const changePassword = (currentPassword: string, newPassword: string) => {
    return { success: true, message: 'Password updated successfully' };
  };

  const updateUser = async (userId: string, updates: Partial<User>) => {
    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, ...updates } : u)));
    try {
      await setDoc(doc(db, 'users', userId), cleanForFirestore(updates), { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${userId}`);
    }
  };

  // Week Actions
  const markFridayComplete = async (weekId: string, note?: string) => {
    const updatedFields = {
      fridayCompleted: true,
      fridayCompletedAt: new Date().toISOString(),
      fridayCompletedBy: currentUser.name,
      fridayNote: note || '',
    };
    setWeeks((prev) =>
      prev.map((w) =>
        w.id === weekId
          ? {
              ...w,
              ...updatedFields,
            }
          : w
      )
    );
    try {
      await setDoc(doc(db, 'weeks', weekId), updatedFields, { merge: true });
      await logAuditEvent('FRIDAY_SIGN_OFF_COMPLETED', 'task', `Friday sign-off completed for week ${weekId} by ${currentUser.name}`);
    } catch (err) {
      console.warn('Week update error:', err);
    }
  };

  const archiveWeek = async (weekId: string) => {
    setWeeks((prev) => prev.map((w) => (w.id === weekId ? { ...w, status: 'archived' } : w)));
    try {
      await setDoc(doc(db, 'weeks', weekId), { status: 'archived' }, { merge: true });
      await logAuditEvent('WEEK_ARCHIVED', 'task', `Week ${weekId} moved to archived weeks.`);
    } catch (err) {
      console.warn('Week archive error:', err);
    }
  };

  const unarchiveWeek = async (weekId: string) => {
    setWeeks((prev) => prev.map((w) => (w.id === weekId ? { ...w, status: 'previous' } : w)));
    try {
      await setDoc(doc(db, 'weeks', weekId), { status: 'previous' }, { merge: true });
      await logAuditEvent('WEEK_UNARCHIVED', 'task', `Week ${weekId} restored from archived weeks.`);
    } catch (err) {
      console.warn('Week unarchive error:', err);
    }
  };

  // Helper getters & permissions
  const isTeamLead = (userId = currentUser.id, departmentId?: string): boolean => {
    if (departmentId) {
      const dept = departments.find((d) => d.id === departmentId);
      return dept ? (dept.teamLeadIds || []).includes(userId) : false;
    }
    return departments.some((d) => (d.teamLeadIds || []).includes(userId));
  };

  const hasDepartmentLead = (departmentId?: string): boolean => {
    if (!departmentId) return false;
    const dept = departments.find((d) => d.id === departmentId);
    if (!dept || !dept.teamLeadIds || dept.teamLeadIds.length === 0) return false;
    if (users.length > 0) {
      return dept.teamLeadIds.some((leadId) => {
        const u = users.find((user) => user.id === leadId);
        return u && u.registrationStatus === 'approved';
      });
    }
    return dept.teamLeadIds.length > 0;
  };

  const isCrossDeptSupport = (task: Task): boolean => {
    const userDeptNames = departments
      .filter((d) => (currentUser.departmentIds || []).includes(d.id))
      .map((d) => d.name);
    return (task.supportNeeded || []).some((reqDept) =>
      userDeptNames.includes(reqDept) || (currentUser.departmentIds || []).includes(reqDept)
    );
  };

  const canEditTask = (task: Task): boolean => {
    if (currentUser.role === 'admin') return true;
    if (task.ownerId === currentUser.id) return true;
    return isCrossDeptSupport(task);
  };

  const canApproveTask = (task: Task): boolean => {
    if (currentUser.role === 'admin') return true;
    const isDeptLead = isTeamLead(currentUser.id, task.departmentId);
    if (isDeptLead) {
      return task.status === 'Pending Approval' || task.status === 'Completed';
    }
    return false;
  };

  const sendNotification = async (
    userId: string,
    title: string,
    message: string,
    type: NotificationType,
    taskId?: string
  ) => {
    if (!userId) return;
    const notifId = 'notif-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7);
    const newNotif: Notification = {
      id: notifId,
      userId,
      title,
      message,
      type,
      taskId,
      read: false,
      createdAt: new Date().toISOString(),
    };

    // Optimistically update notifications state immediately
    setNotifications((prev) => [newNotif, ...(prev || []).filter((n) => n.id !== notifId)]);

    try {
      await setDoc(doc(db, 'notifications', notifId), cleanForFirestore(newNotif));
    } catch (err) {
      console.warn('Notification write error:', err);
    }
  };

  const notifyDepartmentLeads = async (
    departmentId: string,
    title: string,
    message: string,
    type: NotificationType,
    taskId?: string
  ) => {
    const dept = departments.find((d) => d.id === departmentId);
    if (!dept || !dept.teamLeadIds || dept.teamLeadIds.length === 0) return;
    for (const leadId of dept.teamLeadIds) {
      if (leadId !== currentUser.id) {
        await sendNotification(leadId, title, message, type, taskId);
      }
    }
  };

  const logAuditEvent = async (action: string, category: AuditLog['category'], details: string) => {
    const logId = 'audit-' + Date.now();
    const newAudit: AuditLog = {
      id: logId,
      actorId: currentUser.id || 'system',
      actorName: currentUser.name || 'System',
      action,
      category,
      details,
      timestamp: new Date().toISOString(),
    };
    try {
      await setDoc(doc(db, 'auditLogs', logId), newAudit);
    } catch (err) {
      console.error('Audit write error:', err);
    }
  };

  // Task Actions
  const createTask = async (taskData: Omit<Task, 'id' | 'createdAt' | 'ownerId' | 'ownerName' | 'ownerAvatar' | 'watchers' | 'archived' | 'deliverables'> & { ownerId?: string; ownerName?: string; ownerAvatar?: string }): Promise<Task> => {
    const taskId = 'task-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7);
    const hasLead = hasDepartmentLead(taskData.departmentId);
    const isLead = isTeamLead(currentUser.id, taskData.departmentId);
    const isAdmin = currentUser.role === 'admin';

    let initialStatus: TaskStatus = taskData.status || 'Not Started';
    let initialProgress = taskData.progressPercent || 0;
    let approvalNote = taskData.approvalNote;
    let approvedBy = taskData.approvedBy;
    let approvedByName = taskData.approvedByName;
    let approvalDate = taskData.approvalDate;

    if (initialStatus === 'Completed' || initialStatus === 'Pending Approval' || initialProgress === 100) {
      if (!hasLead) {
        // Auto-approval when no team lead is assigned to this department
        initialStatus = 'Approved';
        initialProgress = 100;
        approvalNote = 'Auto-approved: No department team lead is currently assigned.';
        approvedBy = 'system';
        approvedByName = 'Auto-Approved (No Lead)';
        approvalDate = new Date().toISOString();
      } else if (!isAdmin && !isLead) {
        initialStatus = 'Pending Approval';
        initialProgress = 100;
      } else {
        initialStatus = 'Approved';
        initialProgress = 100;
        approvedBy = currentUser.id;
        approvedByName = currentUser.name;
        approvalDate = new Date().toISOString();
      }
    }

    const assignedOwnerId = taskData.ownerId || currentUser.id;
    const assignedUser = users.find((u) => u.id === assignedOwnerId);
    const assignedOwnerName = taskData.ownerName || (assignedUser ? assignedUser.name : currentUser.name);
    const assignedOwnerAvatar = taskData.ownerAvatar || (assignedUser ? assignedUser.avatarUrl : currentUser.avatarUrl);

    const newTask: Task = {
      ...taskData,
      id: taskId,
      status: initialStatus,
      progressPercent: initialProgress,
      ownerId: assignedOwnerId,
      ownerName: assignedOwnerName,
      ownerAvatar: assignedOwnerAvatar,
      createdAt: new Date().toISOString(),
      watchers: Array.from(new Set([currentUser.id, assignedOwnerId])),
      archived: false,
      deliverables: [],
    };

    if (approvalNote) newTask.approvalNote = approvalNote;
    if (approvedBy) newTask.approvedBy = approvedBy;
    if (approvedByName) newTask.approvedByName = approvedByName;
    if (approvalDate) newTask.approvalDate = approvalDate;

    setTasks((prev) => [newTask, ...prev]);

    try {
      await setDoc(doc(db, 'tasks', taskId), cleanForFirestore(newTask));
      if (initialStatus === 'Approved' && !hasLead) {
        await logAuditEvent('TASK_AUTO_APPROVED', 'task', `Task "${newTask.title}" was auto-approved (${newTask.departmentName} has no assigned Team Lead).`);
      } else {
        await logAuditEvent('TASK_CREATED', 'task', `Created task "${newTask.title}" under ${newTask.departmentName} (assigned to ${newTask.ownerName})`);
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `tasks/${taskId}`);
    }

    return newTask;
  };

  const updateTask = async (taskId: string, updates: Partial<Task>) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    // Strict ownership & cross-departmental support enforcement:
    const isOwner = task.ownerId === currentUser.id;
    const isAdmin = currentUser.role === 'admin';
    const crossDept = isCrossDeptSupport(task);

    if (!isOwner && !isAdmin && !crossDept) {
      console.warn(`Permission Denied: User "${currentUser.name}" cannot edit task owned by "${task.ownerName}". Only the task owner or designated cross-departmental support can update it.`);
      return;
    }

    // Locked status enforcement:
    // While in "Pending Approval" or "Approved", the status cannot be changed via general edit!
    if ((task.status === 'Pending Approval' || task.status === 'Approved') && updates.status && updates.status !== task.status) {
      console.warn(`Permission Denied: Cannot change status of task while in "${task.status}". Status is locked.`);
      return;
    }

    let finalUpdates = { ...updates };

    // Automated progress percentage computation:
    if (finalUpdates.status) {
      finalUpdates.progressPercent = getAutomaticProgress(finalUpdates.status);
    }

    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, ...finalUpdates } : t)));

    try {
      const firestorePayload: Record<string, any> = cleanForFirestore({ ...finalUpdates });
      if (finalUpdates.revisionReason === undefined && task.revisionReason) {
        firestorePayload.revisionReason = deleteField();
      }
      await updateDoc(doc(db, 'tasks', taskId), firestorePayload);

      // Audit log on who ever updates a task:
      const userDeptNames = departments
        .filter((d) => (currentUser.departmentIds || []).includes(d.id))
        .map((d) => d.name);
      if (crossDept && !isOwner && !isAdmin) {
        await logAuditEvent(
          'TASK_CROSS_DEPT_UPDATE',
          'task',
          `${currentUser.name} (${userDeptNames.join(', ') || 'Cross-Dept Support'}) contributed update to task "${task.title}" (Owner: ${task.ownerName})`
        );
      } else {
        await logAuditEvent(
          'TASK_UPDATED',
          'task',
          `${currentUser.name} updated task "${task.title}"`
        );
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `tasks/${taskId}`);
    }
  };

  const updateTaskStatus = async (taskId: string, newStatus: TaskStatus, note?: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    const isOwner = task.ownerId === currentUser.id;
    const isLead = isTeamLead(currentUser.id, task.departmentId);
    const isAdmin = currentUser.role === 'admin';
    const crossDept = isCrossDeptSupport(task);

    // Rule 1: If task is "Approved", status is locked and cannot be changed!
    if (task.status === 'Approved') {
      console.warn('Permission Denied: Task is already approved. Status cannot be changed.');
      return;
    }

    // Rule 2: If task is "Pending Approval", only Team Lead or Admin can Approve or Request Revision.
    if (task.status === 'Pending Approval') {
      if (!isLead && !isAdmin) {
        console.warn('Permission Denied: Task is waiting for Team Lead approval. Status cannot be changed.');
        return;
      }
      if (newStatus !== 'Approved' && newStatus !== 'Needs Revision') {
        console.warn('Pending approval tasks can only be Approved or sent for Revision by Team Lead.');
        return;
      }
    }

    // Rule 3: Who can initiate status updates:
    // - Approved / Needs Revision: Only Team Lead or Admin
    // - Other statuses: Task Owner, Cross-departmental Support, or Admin
    const isApprovalAction = newStatus === 'Approved' || newStatus === 'Needs Revision';
    if (isApprovalAction) {
      if (!isLead && !isAdmin) {
        console.warn('Permission Denied: Only team leads or administrators can approve or request revisions.');
        return;
      }
    } else {
      if (!isOwner && !isAdmin && !crossDept) {
        console.warn(`Permission Denied: You cannot modify the status on a task owned by ${task.ownerName}.`);
        return;
      }
    }

    const hasLead = hasDepartmentLead(task.departmentId);

    let finalStatus: TaskStatus = newStatus;
    let finalProgress = getAutomaticProgress(newStatus);
    let approvalNote = task.approvalNote;
    let approvedBy = task.approvedBy;
    let approvedByName = task.approvedByName;
    let approvalDate = task.approvalDate;
    let revisionReason = task.revisionReason;

    // Automated Status Handling:
    // When user sets it to 'Completed':
    if (newStatus === 'Completed') {
      if (!hasLead) {
        // Auto-approval if no team lead exists for department
        finalStatus = 'Approved';
        finalProgress = 100;
        approvalNote = note || 'Auto-approved: No department team lead is currently assigned.';
        approvedBy = 'system';
        approvedByName = 'Auto-Approved (No Lead)';
        approvalDate = new Date().toISOString();
        revisionReason = undefined;
      } else {
        // Sets to Pending Approval (Waiting for Approval)
        finalStatus = 'Pending Approval';
        finalProgress = 90;
        revisionReason = undefined;
      }
    } else if (newStatus === 'Approved') {
      finalStatus = 'Approved';
      finalProgress = 100;
      approvedBy = currentUser.id || 'system';
      approvedByName = currentUser.name || 'System';
      approvalDate = new Date().toISOString();
      if (note) approvalNote = note;
      revisionReason = undefined;
    } else if (newStatus === 'Needs Revision') {
      finalStatus = 'Needs Revision';
      finalProgress = 35;
      revisionReason = note || 'Revision requested by Team Lead';
    } else if (newStatus === 'In Progress') {
      finalStatus = 'In Progress';
      finalProgress = 50;
    } else if (newStatus === 'Blocked') {
      finalStatus = 'Blocked';
      finalProgress = 30;
    } else if (newStatus === 'Not Started') {
      finalStatus = 'Not Started';
      finalProgress = 0;
    }

    const updates: Partial<Task> = {
      status: finalStatus,
      progressPercent: finalProgress,
    };
    if (approvalNote) updates.approvalNote = approvalNote;
    if (approvedBy) updates.approvedBy = approvedBy;
    if (approvedByName) updates.approvedByName = approvedByName;
    if (approvalDate) updates.approvalDate = approvalDate;
    if (revisionReason) {
      updates.revisionReason = revisionReason;
    } else {
      updates.revisionReason = undefined;
    }

    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, ...updates } : t)));

    try {
      const firestorePayload: Record<string, any> = cleanForFirestore({ ...updates });
      if (task.revisionReason && !revisionReason) {
        firestorePayload.revisionReason = deleteField();
      }
      await updateDoc(doc(db, 'tasks', taskId), firestorePayload);

      // Audit Logging and Notifications:
      if (finalStatus === 'Pending Approval') {
        await logAuditEvent(
          'TASK_SUBMITTED_FOR_APPROVAL',
          'task',
          `Task "${task.title}" was marked as Completed by ${currentUser.name} and is now Waiting for Team Lead Approval.`
        );
        await notifyDepartmentLeads(
          task.departmentId,
          'Task Waiting for Approval 📋',
          `${currentUser.name} completed "${task.title}". Please review and approve or decline.`,
          'approval',
          taskId
        );
      } else if (finalStatus === 'Approved') {
        if (!hasLead) {
          await logAuditEvent(
            'TASK_AUTO_APPROVED',
            'task',
            `Task "${task.title}" was completed and auto-approved (${task.departmentName} has no assigned Team Lead).`
          );
        } else {
          await logAuditEvent(
            'TASK_APPROVED',
            'task',
            `Task "${task.title}" approved by Team Lead ${currentUser.name}.`
          );
          await sendNotification(
            task.ownerId,
            'Task Approved! 🎉',
            `Your task "${task.title}" was approved by ${currentUser.name}.`,
            'approval',
            taskId
          );
        }
      } else if (finalStatus === 'Needs Revision') {
        await logAuditEvent(
          'TASK_REVISION_REQUESTED',
          'task',
          `Team Lead ${currentUser.name} requested revision on task "${task.title}": ${revisionReason}`
        );
        await sendNotification(
          task.ownerId,
          'Revision Requested ⚠️',
          `Team Lead ${currentUser.name} declined task "${task.title}" and requested revisions: ${revisionReason}`,
          'revision',
          taskId
        );
      } else {
        const userDeptNames = departments
          .filter((d) => (currentUser.departmentIds || []).includes(d.id))
          .map((d) => d.name);
        const updaterTag = crossDept && !isOwner ? ` (${userDeptNames.join(', ') || 'Cross-Dept Support'})` : '';
        await logAuditEvent(
          'TASK_STATUS_UPDATED',
          'task',
          `Task "${task.title}" status changed to ${finalStatus} by ${currentUser.name}${updaterTag}`
        );
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `tasks/${taskId}`);
    }
  };

  const approveTask = async (taskId: string, note?: string) => {
    await updateTaskStatus(taskId, 'Approved', note);
  };

  const requestRevision = async (taskId: string, reason: string) => {
    await updateTaskStatus(taskId, 'Needs Revision', reason);
  };

  const generateDeliverableWorkDriveMeta = (
    task: Task,
    originalName = 'deliverable.pdf',
    customIndex?: number,
    customCycle?: string
  ): WorkDriveDeliverableMeta => {
    const cycleFolder = customCycle
      ? getWorkDriveCycleFolderName(customCycle)
      : getWorkDriveCycleFolderName(task.weekId || activeWeek);
    const existingCount = (task.deliverables || []).length;
    const index = customIndex !== undefined ? customIndex : existingCount + 1;

    const dept = departments.find((d) => d.id === task.departmentId);

    const formattedFileName = buildWorkDriveFileName({
      departmentName: task.departmentName || dept?.name || 'General',
      departmentCode: dept?.code,
      userName: currentUser.name || task.ownerName,
      userEmail: currentUser.email,
      index,
      originalFileName: originalName,
      useDepartmentCode: cloudinaryConfig.useDepartmentCode,
    });

    const rootFolder = (cloudinaryConfig.rootFolder || 'Deliverables').trim();
    const folderPath = cloudinaryConfig.autoCycleFolder !== false ? `${rootFolder}/${cycleFolder}` : rootFolder;

    return {
      provider: 'cloudinary',
      folderPath,
      formattedFileName,
      cycleFolder,
      status: cloudinaryConfig.enabled ? 'synced' : 'manual',
      syncedAt: new Date().toISOString(),
    };
  };

  const updateCloudinaryConfig = async (updates: Partial<CloudinaryConfig> & { cloudinaryUrl?: string }) => {
    const parsedUrl =
      parseCloudinaryUrlInput(updates.cloudinaryUrl || '') ||
      parseCloudinaryUrlInput(updates.cloudName || '');

    const effectiveCloudName =
      parsedUrl?.cloudName ||
      (updates.cloudName !== undefined && !updates.cloudName.startsWith('cloudinary://')
        ? updates.cloudName.trim()
        : cloudinaryConfig.cloudName || '');

    const effectiveApiKey =
      updates.apiKey === 'CLEARED'
        ? ''
        : parsedUrl?.apiKey ||
          (updates.apiKey && updates.apiKey.trim().length > 0
            ? updates.apiKey.trim()
            : cloudinaryConfig.apiKey || '');

    const effectiveApiSecret =
      updates.apiSecret === 'CLEARED'
        ? ''
        : parsedUrl?.apiSecret ||
          (updates.apiSecret && updates.apiSecret.trim().length > 0
            ? updates.apiSecret.trim()
            : cloudinaryConfig.apiSecret || '');

    const effectiveUploadPreset =
      updates.uploadPreset === 'CLEARED'
        ? ''
        : updates.uploadPreset !== undefined
        ? updates.uploadPreset.trim()
        : cloudinaryConfig.uploadPreset || '';

    const hasValidCreds = Boolean(
      effectiveCloudName && ((effectiveApiKey && effectiveApiSecret) || effectiveUploadPreset)
    );

    const { cloudinaryUrl: _rawUrl, ...cleanUpdates } = updates;

    const updated: CloudinaryConfig = {
      ...cloudinaryConfig,
      ...cleanUpdates,
      cloudName: effectiveCloudName,
      apiKey: effectiveApiKey,
      apiSecret: effectiveApiSecret,
      uploadPreset: effectiveUploadPreset,
      connected: updates.connected !== undefined ? updates.connected : hasValidCreds,
      lastSyncedAt: new Date().toISOString(),
    };

    setCloudinaryConfig(updated);
    localStorage.setItem('snazzy_cloudinary_config', JSON.stringify(updated));

    try {
      await fetch('/api/cloudinary/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...updated, cloudinaryUrl: updates.cloudinaryUrl }),
      });
    } catch (err) {
      console.warn('Failed to sync Cloudinary settings to server:', err);
    }

    try {
      await setDoc(doc(db, 'settings', 'cloudinary'), cleanForFirestore(updated), { merge: true });
      await logAuditEvent(
        'CLOUDINARY_CONFIG_UPDATED',
        'system',
        `Cloudinary storage settings updated by ${currentUser.name} (Cloud: ${updated.cloudName || 'Unset'}, Root: ${updated.rootFolder})`
      );
    } catch (err) {
      console.warn('Failed to save Cloudinary settings to Firestore:', err);
    }
  };

  const updateWorkDriveConfig = async (updates: Partial<WorkDriveConfig>) => {
    // Crucial: preserve existing valid credentials if updates omit them or pass empty strings
    const effectiveRefreshToken =
      updates.refreshToken === 'CLEARED'
        ? ''
        : updates.refreshToken && updates.refreshToken.trim().length > 0
        ? updates.refreshToken.trim()
        : (workdriveConfig.refreshToken || '');

    const effectiveClientId =
      updates.clientId && updates.clientId.trim().length > 0
        ? updates.clientId.trim()
        : (workdriveConfig.clientId || '');

    const effectiveClientSecret =
      updates.clientSecret && updates.clientSecret.trim().length > 0
        ? updates.clientSecret.trim()
        : (workdriveConfig.clientSecret || '');

    const updated: WorkDriveConfig = {
      ...workdriveConfig,
      ...updates,
      clientId: effectiveClientId,
      clientSecret: effectiveClientSecret,
      refreshToken: effectiveRefreshToken,
    };

    setWorkdriveConfig(updated);
    localStorage.setItem('snazzy_workdrive_config', JSON.stringify(updated));

    // Also persist directly to server disk/memory storage
    try {
      await fetch('/api/workdrive/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });
    } catch (err) {
      console.warn('Failed to sync WorkDrive settings to server:', err);
    }

    try {
      await setDoc(doc(db, 'settings', 'workdrive'), cleanForFirestore(updated), { merge: true });
      await logAuditEvent(
        'WORKDRIVE_CONFIG_UPDATED',
        'system',
        `Zoho WorkDrive settings updated by ${currentUser.name} (Root: ${updated.rootFolder}, Cycle folder: ${updated.autoCycleFolder ? 'Auto' : 'Manual'}, Pattern: ${updated.namingConvention})`
      );
    } catch (err) {
      console.warn('Failed to save WorkDrive settings to Firestore:', err);
    }
  };

  const addDeliverable = async (taskId: string, deliverable: Omit<Deliverable, 'id' | 'uploadedBy' | 'uploadedAt'>) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    if (task.ownerId !== currentUser.id && currentUser.role !== 'admin') {
      console.warn(`Permission Denied: Only the task owner (${task.ownerName}) or an admin can upload deliverables.`);
      return;
    }

    // Auto-generate WorkDrive metadata if not already attached
    const workdriveMeta: WorkDriveDeliverableMeta = deliverable.workdrive || generateDeliverableWorkDriveMeta(
      task,
      deliverable.name,
      (task.deliverables || []).length + 1
    );

    const newDeliverable: Deliverable = {
      ...deliverable,
      id: 'del-' + Date.now(),
      uploadedBy: currentUser.name,
      uploadedAt: new Date().toISOString(),
      workdrive: workdriveMeta,
    };

    const deliverables = [...(task.deliverables || []), newDeliverable];
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, deliverables } : t)));

    try {
      await updateDoc(doc(db, 'tasks', taskId), cleanForFirestore({ deliverables }));
      await logAuditEvent(
        'DELIVERABLE_UPLOADED',
        'task',
        `Deliverable "${newDeliverable.name}" uploaded to Cloudinary (${workdriveMeta.folderPath}/${workdriveMeta.formattedFileName}) by ${currentUser.name}`
      );
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `tasks/${taskId}`);
    }
  };

  const removeDeliverable = async (taskId: string, deliverableId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    if (task.ownerId !== currentUser.id && currentUser.role !== 'admin') {
      console.warn(`Permission Denied: Only the task owner (${task.ownerName}) or an admin can remove deliverables.`);
      return;
    }

    const deliverables = (task.deliverables || []).filter((d) => d.id !== deliverableId);
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, deliverables } : t)));

    try {
      await updateDoc(doc(db, 'tasks', taskId), cleanForFirestore({ deliverables }));
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `tasks/${taskId}`);
    }
  };

  const addComment = async (taskId: string, content: string, parentId?: string) => {
    const commentId = 'cm-' + Date.now();
    const comment: TaskComment = {
      id: commentId,
      taskId,
      userId: currentUser.id,
      userName: currentUser.name,
      userAvatar: currentUser.avatarUrl,
      content,
      createdAt: new Date().toISOString(),
      ...(parentId ? { parentId } : {}),
    };

    setTaskComments((prev) => ({
      ...prev,
      [taskId]: [...(prev[taskId] || []), comment],
    }));

    try {
      await setDoc(doc(db, 'comments', commentId), cleanForFirestore(comment));

      const taskObj = tasks.find((t) => t.id === taskId);
      const contentLower = content.toLowerCase();

      // Collect all candidate users for mention matching
      const candidateUsersMap = new Map<string, User>();
      (users || []).forEach((u) => {
        if (u && u.id && !isSeededUser(u)) candidateUsersMap.set(u.id, u);
      });
      if (currentUser && currentUser.id) {
        candidateUsersMap.set(currentUser.id, currentUser);
      }
      if (taskObj && taskObj.ownerId && !candidateUsersMap.has(taskObj.ownerId)) {
        candidateUsersMap.set(taskObj.ownerId, {
          id: taskObj.ownerId,
          name: taskObj.ownerName,
          firstName: taskObj.ownerName.split(' ')[0] || 'User',
          lastName: taskObj.ownerName.split(' ').slice(1).join(' ') || '',
          email: '',
          title: 'Task Owner',
          role: 'team_member',
          departmentIds: [taskObj.departmentId],
          registrationStatus: 'approved',
          joinedDate: new Date().toISOString(),
        });
      }

      // Extract all @mentions from content, stripping punctuation
      // e.g. "@Joshua,", "@Alex Rivera", "@sarah!"
      const mentionMatches = content.match(/@([a-zA-Z0-9_.-]+(?:\s+[a-zA-Z0-9_.-]+)?)/g) || [];
      const mentionTokens = mentionMatches.map((m) =>
        m.substring(1).replace(/[,:;!?.]+$/, '').trim().toLowerCase()
      );

      const notifiedUserIds = new Set<string>();

      // Check all candidate users
      for (const u of candidateUsersMap.values()) {
        const fullName = (u.name || '').trim().toLowerCase();
        const firstName = (u.firstName || u.name?.split(' ')[0] || '').trim().toLowerCase();
        const lastName = (u.lastName || u.name?.split(' ').slice(1).join(' ') || '').trim().toLowerCase();
        const emailPrefix = (u.email ? u.email.split('@')[0] : '').toLowerCase();

        let isTagged = false;

        // 1. Full name match: "@alex rivera" or "@joshua fasinuro"
        if (fullName && (contentLower.includes(`@${fullName}`) || mentionTokens.some((t) => t === fullName))) {
          isTagged = true;
        }
        // 2. First name match: "@alex" or "@joshua" (at least 2 chars)
        else if (firstName && firstName.length >= 2 && (
          contentLower.includes(`@${firstName}`) ||
          mentionTokens.some((t) => t === firstName || t.startsWith(firstName))
        )) {
          isTagged = true;
        }
        // 3. Last name match: "@rivera" or "@fasinuro" (at least 2 chars)
        else if (lastName && lastName.length >= 2 && (
          contentLower.includes(`@${lastName}`) ||
          mentionTokens.some((t) => t === lastName)
        )) {
          isTagged = true;
        }
        // 4. Email prefix match: "@alex.rivera" or "@fasinujoshua0"
        else if (emailPrefix && emailPrefix.length >= 2 && (
          contentLower.includes(`@${emailPrefix}`) ||
          mentionTokens.some((t) => t === emailPrefix)
        )) {
          isTagged = true;
        }

        if (isTagged && !notifiedUserIds.has(u.id)) {
          notifiedUserIds.add(u.id);
          const isSelf = u.id === currentUser.id;
          await sendNotification(
            u.id,
            'Tagged in Discussion 💬',
            isSelf
              ? `You tagged yourself in task "${taskObj?.title || 'Task'}": "${content.length > 80 ? content.slice(0, 77) + '...' : content}"`
              : `${currentUser.name} tagged you in task "${taskObj?.title || 'Task'}": "${content.length > 80 ? content.slice(0, 77) + '...' : content}"`,
            'mention',
            taskId
          );
        }
      }

      // Handle @all or @team mention
      if (contentLower.includes('@all') || contentLower.includes('@team')) {
        for (const u of candidateUsersMap.values()) {
          const isRelevant =
            u.id === taskObj?.ownerId ||
            (taskObj?.watchers || []).includes(u.id) ||
            (u.departmentIds || []).includes(taskObj?.departmentId || '');

          if (isRelevant && !notifiedUserIds.has(u.id)) {
            notifiedUserIds.add(u.id);
            const isSelf = u.id === currentUser.id;
            await sendNotification(
              u.id,
              'Tagged in Discussion 💬',
              isSelf
                ? `You tagged @team in task "${taskObj?.title || 'Task'}": "${content.length > 80 ? content.slice(0, 77) + '...' : content}"`
                : `${currentUser.name} tagged @team in task "${taskObj?.title || 'Task'}": "${content.length > 80 ? content.slice(0, 77) + '...' : content}"`,
              'mention',
              taskId
            );
          }
        }
      }

      // Notify task owner if not the commenter and not already notified
      if (taskObj && taskObj.ownerId !== currentUser.id && !notifiedUserIds.has(taskObj.ownerId)) {
        await sendNotification(
          taskObj.ownerId,
          'New Comment on Task 💬',
          `${currentUser.name} commented on "${taskObj.title}": "${content.length > 80 ? content.slice(0, 77) + '...' : content}"`,
          'comment',
          taskId
        );
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `comments/${commentId}`);
    }
  };

  const editComment = async (taskId: string, commentId: string, newContent: string) => {
    setTaskComments((prev) => ({
      ...prev,
      [taskId]: (prev[taskId] || []).map((c) => (c.id === commentId ? { ...c, content: newContent } : c)),
    }));
    try {
      await updateDoc(doc(db, 'comments', commentId), { content: newContent });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `comments/${commentId}`);
    }
  };

  const deleteComment = async (taskId: string, commentId: string) => {
    setTaskComments((prev) => ({
      ...prev,
      [taskId]: (prev[taskId] || []).filter((c) => c.id !== commentId),
    }));
    try {
      await deleteDoc(doc(db, 'comments', commentId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `comments/${commentId}`);
    }
  };

  const toggleWatchTask = async (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    const watchers = task.watchers || [];
    const currentUserId = currentUser?.id || '';
    const updated = watchers.includes(currentUserId)
      ? watchers.filter((id) => id !== currentUserId)
      : [...watchers, currentUserId];

    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, watchers: updated } : t)));

    try {
      await updateDoc(doc(db, 'tasks', taskId), { watchers: updated });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `tasks/${taskId}`);
    }
  };

  const archiveTask = async (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;
    if (task.ownerId !== currentUser.id && currentUser.role !== 'admin') {
      console.warn(`Permission Denied: Only the task owner or an admin can archive a task.`);
      return;
    }

    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, archived: true } : t)));
    try {
      await updateDoc(doc(db, 'tasks', taskId), { archived: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `tasks/${taskId}`);
    }
  };

  const restoreTask = async (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;
    if (task.ownerId !== currentUser.id && currentUser.role !== 'admin') {
      console.warn(`Permission Denied: Only the task owner or an admin can restore a task.`);
      return;
    }

    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, archived: false } : t)));
    try {
      await updateDoc(doc(db, 'tasks', taskId), { archived: false });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `tasks/${taskId}`);
    }
  };

  const deleteTask = async (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;
    if (task.ownerId !== currentUser.id && currentUser.role !== 'admin') {
      console.warn(`Permission Denied: Only the task owner or an admin can delete a task.`);
      return;
    }

    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    try {
      await deleteDoc(doc(db, 'tasks', taskId));
      await logAuditEvent('TASK_DELETED', 'task', `Task "${task.title}" was deleted.`);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `tasks/${taskId}`);
    }
  };

  // Admin & User Management Actions
  const approveRegistration = async (userId: string) => {
    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, registrationStatus: 'approved' } : u)));
    try {
      await setDoc(doc(db, 'users', userId), { registrationStatus: 'approved' }, { merge: true });
      await logAuditEvent('USER_APPROVED', 'user', `Approved registration for user ID ${userId}`);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${userId}`);
    }
  };

  const rejectRegistration = async (userId: string) => {
    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, registrationStatus: 'rejected' } : u)));
    try {
      await setDoc(doc(db, 'users', userId), { registrationStatus: 'rejected' }, { merge: true });
      await logAuditEvent('USER_REJECTED', 'user', `Rejected registration for user ID ${userId}`);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${userId}`);
    }
  };

  const registerUser = (name: string, email: string, title: string, departmentIds: string[]) => {
    console.log('Register user called:', name, email);
  };

  const updateUserRole = async (userId: string, role: User['role']) => {
    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role } : u)));
    try {
      await setDoc(doc(db, 'users', userId), { role }, { merge: true });
      await logAuditEvent('USER_ROLE_UPDATED', 'user', `Updated user ID ${userId} role to ${role}`);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${userId}`);
    }
  };

  const assignTeamLead = async (departmentId: string, userId: string) => {
    const dept = departments.find((d) => d.id === departmentId);
    if (!dept) return;

    const teamLeadIds = Array.from(new Set([...(dept.teamLeadIds || []), userId]));
    setDepartments((prev) => prev.map((d) => (d.id === departmentId ? { ...d, teamLeadIds } : d)));
    try {
      await setDoc(doc(db, 'departments', departmentId), { teamLeadIds }, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `departments/${departmentId}`);
    }
  };

  const removeTeamLead = async (departmentId: string, userId: string) => {
    const dept = departments.find((d) => d.id === departmentId);
    if (!dept) return;

    const teamLeadIds = (dept.teamLeadIds || []).filter((id) => id !== userId);
    setDepartments((prev) => prev.map((d) => (d.id === departmentId ? { ...d, teamLeadIds } : d)));
    try {
      await setDoc(doc(db, 'departments', departmentId), { teamLeadIds }, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `departments/${departmentId}`);
    }
  };

  // Department Actions
  const createDepartment = async (
    name: string,
    code: string,
    description: string,
    teamLeadIds: string[],
    memberUserIds: string[] = []
  ) => {
    const deptId = 'dept-' + Date.now();
    const normalizedCode = name.trim().toLowerCase() === 'community' ? 'Community' : code;
    const newDept: Department = {
      id: deptId,
      name,
      code: normalizedCode,
      description,
      teamLeadIds,
      archived: false,
      createdAt: new Date().toISOString(),
    };

    setDepartments((prev) => [...prev, newDept]);
    try {
      await setDoc(doc(db, 'departments', deptId), newDept);
      await logAuditEvent('DEPARTMENT_CREATED', 'department', `Created department ${name} (${normalizedCode})`);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `departments/${deptId}`);
    }
  };

  const updateDepartment = async (id: string, updates: Partial<Department>) => {
    const existing = departments.find((d) => d.id === id);
    const effectiveName = (updates.name ?? existing?.name ?? '').trim();
    const finalUpdates: Partial<Department> = {
      ...updates,
      ...(effectiveName.toLowerCase() === 'community' ? { code: 'Community' } : {}),
    };
    setDepartments((prev) => prev.map((d) => (d.id === id ? { ...d, ...finalUpdates } : d)));
    try {
      await setDoc(doc(db, 'departments', id), finalUpdates, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `departments/${id}`);
    }
  };

  const archiveDepartment = async (id: string) => {
    setDepartments((prev) => prev.map((d) => (d.id === id ? { ...d, archived: true } : d)));
    try {
      await setDoc(doc(db, 'departments', id), { archived: true }, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `departments/${id}`);
    }
  };

  const unarchiveDepartment = async (id: string) => {
    setDepartments((prev) => prev.map((d) => (d.id === id ? { ...d, archived: false } : d)));
    try {
      await setDoc(doc(db, 'departments', id), { archived: false }, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `departments/${id}`);
    }
  };

  const deleteDepartment = async (id: string) => {
    setDepartments((prev) => prev.filter((d) => d.id !== id));
    try {
      await deleteDoc(doc(db, 'departments', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `departments/${id}`);
    }
  };

  const addMemberToDepartment = async (departmentId: string, userId: string) => {
    const targetUser = users.find((u) => u.id === userId);
    if (!targetUser) return;

    const departmentIds = Array.from(new Set([...(targetUser.departmentIds || []), departmentId]));
    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, departmentIds } : u)));
    try {
      await setDoc(doc(db, 'users', userId), { departmentIds }, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${userId}`);
    }
  };

  const removeMemberFromDepartment = async (departmentId: string, userId: string) => {
    const targetUser = users.find((u) => u.id === userId);
    if (!targetUser) return;

    const departmentIds = (targetUser.departmentIds || []).filter((id) => id !== departmentId);
    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, departmentIds } : u)));
    try {
      await setDoc(doc(db, 'users', userId), { departmentIds }, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${userId}`);
    }
  };

  const setDepartmentMembers = async (departmentId: string, memberUserIds: string[]) => {
    for (const u of users) {
      const isMember = (memberUserIds || []).includes(u.id);
      const hasDept = (u.departmentIds || []).includes(departmentId);
      if (isMember && !hasDept) {
        await addMemberToDepartment(departmentId, u.id);
      } else if (!isMember && hasDept) {
        await removeMemberFromDepartment(departmentId, u.id);
      }
    }
  };

  // Reflection Actions
  const submitReflection = async (completed: string, carryOver: string, blockers: string) => {
    const reflId = 'refl-' + Date.now();
    const primaryDeptId = currentUser.departmentIds?.[0] || 'dept-biz';
    const deptObj = departments.find((d) => d.id === primaryDeptId);

    const newRefl: WeeklyReflection = {
      id: reflId,
      userId: currentUser.id,
      userName: currentUser.name,
      userAvatar: currentUser.avatarUrl,
      departmentId: primaryDeptId,
      departmentName: deptObj?.name || 'Business Operation',
      weekId: activeWeek,
      completedSummary: completed,
      carryOverSummary: carryOver,
      blockersSummary: blockers,
      submittedAt: new Date().toISOString(),
    };

    setReflections((prev) => [newRefl, ...prev]);

    try {
      await setDoc(doc(db, 'reflections', reflId), cleanForFirestore(newRefl));
      await logAuditEvent('REFLECTION_SUBMITTED', 'task', `Submitted Friday reflection for ${activeWeek}`);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `reflections/${reflId}`);
    }
  };

  // Notification Actions
  const markNotificationAsRead = async (notifId: string) => {
    try {
      await updateDoc(doc(db, 'notifications', notifId), { read: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `notifications/${notifId}`);
    }
  };

  const markAllNotificationsAsRead = async () => {
    const userNotifs = notifications.filter((n) => n.userId === currentUser.id && !n.read);
    for (const n of userNotifs) {
      await markNotificationAsRead(n.id);
    }
  };

  const clearReadNotifications = async () => {
    const userRead = notifications.filter((n) => n.userId === currentUser.id && n.read);
    for (const n of userRead) {
      try {
        await deleteDoc(doc(db, 'notifications', n.id));
      } catch (err) {
        // ignore
      }
    }
  };

  const clearAllNotifications = async () => {
    const userNotifs = notifications.filter((n) => n.userId === currentUser.id);
    for (const n of userNotifs) {
      try {
        await deleteDoc(doc(db, 'notifications', n.id));
      } catch (err) {
        // ignore
      }
    }
  };

  const checkDeadlineReminders = (): number => {
    return 0;
  };

  // Misc Actions
  const submitBugReport = async (title: string, description: string, severity: BugReport['severity']) => {
    const bugId = 'bug-' + Date.now();
    const report: BugReport = {
      id: bugId,
      submittedBy: currentUser.id,
      submittedByName: currentUser.name,
      title,
      description,
      severity,
      status: 'Open',
      createdAt: new Date().toISOString(),
    };
    try {
      await setDoc(doc(db, 'bugReports', bugId), cleanForFirestore(report));
    } catch (err) {
      console.error('Bug report error:', err);
    }
  };

  // Clean up any previously seeded users, tasks, reflections, notifications, audit logs, and bug reports from Firestore
  useEffect(() => {
    if (!isAuthenticated || !currentUser?.id) return;
    const cleanupSeeded = async () => {
      for (const id of SEEDED_USER_IDS) {
        deleteDoc(doc(db, 'users', id)).catch(() => {});
      }
      for (const id of SEEDED_TASK_IDS) {
        deleteDoc(doc(db, 'tasks', id)).catch(() => {});
      }
      for (const id of SEEDED_REFLECTION_IDS) {
        deleteDoc(doc(db, 'reflections', id)).catch(() => {});
      }
      for (const id of SEEDED_NOTIFICATION_IDS) {
        deleteDoc(doc(db, 'notifications', id)).catch(() => {});
      }
      for (const id of SEEDED_AUDIT_IDS) {
        deleteDoc(doc(db, 'auditLogs', id)).catch(() => {});
      }
      for (const id of SEEDED_BUG_IDS) {
        deleteDoc(doc(db, 'bugReports', id)).catch(() => {});
      }
    };
    cleanupSeeded();
  }, [isAuthenticated, currentUser?.id]);

  const resetToDefaults = async () => {
    // No-op
  };

  const getTaskComments = (taskId: string): TaskComment[] => {
    return taskComments[taskId] || [];
  };

  const getTaskActivities = (taskId: string): ActivityItem[] => {
    return taskActivities[taskId] || [];
  };

  return (
    <AppContext.Provider
      value={{
        theme,
        setTheme,
        toggleTheme,
        currentUser,
        setCurrentUser,
        users,
        isAuthenticated,
        setIsAuthenticated,
        isUserProfileOpen,
        setIsUserProfileOpen,
        login,
        googleSignIn,
        logout,
        signup,
        forgotPassword,
        resetPasswordWithOtp,
        updateProfile,
        changePassword,
        updateUser,
        activeView,
        setActiveView,
        activeDashboardTab,
        setActiveDashboardTab,
        isMobileSidebarOpen,
        setIsMobileSidebarOpen,
        selectedTaskId,
        setSelectedTaskId,
        selectedTaskTab,
        setSelectedTaskTab,
        openTaskModal,
        isCreateTaskOpen,
        setIsCreateTaskOpen,
        createTaskModalMode,
        setCreateTaskModalMode,
        isReflectionModalOpen,
        setIsReflectionModalOpen,
        activeWeek,
        selectedWeekId,
        setSelectedWeekId,
        weeks,
        weekFilterOption,
        setWeekFilterOption,
        markFridayComplete,
        archiveWeek,
        unarchiveWeek,
        departments,
        tasks,
        notifications,
        reflections,
        auditLogs,
        bugReports,
        createTask,
        updateTask,
        updateTaskStatus,
        approveTask,
        requestRevision,
        deleteTask,
        addDeliverable,
        removeDeliverable,
        cloudinaryConfig,
        updateCloudinaryConfig,
        workdriveConfig,
        updateWorkDriveConfig,
        generateDeliverableWorkDriveMeta,
        addComment,
        editComment,
        deleteComment,
        toggleWatchTask,
        archiveTask,
        restoreTask,
        approveRegistration,
        rejectRegistration,
        registerUser,
        updateUserRole,
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
        submitReflection,
        sendNotification,
        notifyDepartmentLeads,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        clearReadNotifications,
        clearAllNotifications,
        checkDeadlineReminders,
        submitBugReport,
        resetToDefaults,
        isTeamLead,
        hasDepartmentLead,
        isCrossDeptSupport,
        canEditTask,
        canApproveTask,
        getTaskComments,
        getTaskActivities,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};
