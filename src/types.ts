export type UserRole = 'admin' | 'team_member' | 'business_ops';
export type RegistrationStatus = 'approved' | 'pending' | 'rejected';

export interface User {
  id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  email: string;
  role: UserRole;
  registrationStatus: RegistrationStatus;
  departmentIds: string[]; // Many-to-many department membership
  avatarUrl?: string;
  title: string;
  joinedDate: string;
  password?: string;
}

export interface Department {
  id: string;
  name: string;
  code: string;
  description: string;
  archived: boolean;
  teamLeadIds: string[]; // Users who lead this department
  createdAt: string;
}

export type TaskPriority = 'Critical' | 'High' | 'Medium' | 'Low';

export type TaskStatus =
  | 'Not Started'
  | 'In Progress'
  | 'Blocked'
  | 'Completed'
  | 'Pending Approval'
  | 'Approved'
  | 'Needs Revision';

export const getAutomaticProgress = (status: TaskStatus): number => {
  switch (status) {
    case 'Not Started':
      return 0;
    case 'In Progress':
      return 50;
    case 'Blocked':
      return 30;
    case 'Needs Revision':
      return 35;
    case 'Pending Approval':
    case 'Completed':
      return 90;
    case 'Approved':
      return 100;
    default:
      return 0;
  }
};

export type ChallengeCategory =
  | 'Technical'
  | 'Resource'
  | 'Inter-departmental'
  | 'External'
  | 'Scope/Requirements'
  | 'Time Constraint'
  | 'None';

export type DeliverableType =
  | 'Image'
  | 'PDF'
  | 'Document'
  | 'Video'
  | 'External Link'
  | 'Other';

export interface WorkDriveDeliverableMeta {
  fileId?: string;
  publicId?: string;
  provider?: 'cloudinary' | 'workdrive' | 'manual';
  folderPath: string; // e.g. "Deliverables/Cycle-2026-08-W2"
  formattedFileName: string; // e.g. "SoftwareEngineering_joshuafasinuro_[1].pdf"
  cycleFolder: string; // e.g. "Cycle-2026-08-W2"
  status: 'synced' | 'pending' | 'manual';
  syncedAt?: string;
  workdriveUrl?: string;
  documentUrl?: string;
  folderUrl?: string;
  resourceType?: string;
  format?: string;
  bytes?: number;
}

export interface Deliverable {
  id: string;
  name: string;
  url: string;
  type: DeliverableType;
  uploadedBy: string;
  uploadedAt: string;
  size?: string;
  workdrive?: WorkDriveDeliverableMeta;
}

export interface CloudinaryConfig {
  enabled: boolean;
  cloudName: string;
  apiKey?: string;
  apiSecret?: string;
  uploadPreset?: string;
  rootFolder: string; // Default: 'Deliverables'
  autoCycleFolder: boolean; // Default: true
  namingConvention: 'department_username_[index]';
  useDepartmentCode: boolean;
  connected: boolean;
  lastSyncedAt?: string;
}

export interface WorkDriveConfig {
  enabled: boolean;
  rootFolder: string; // Default: 'Deliverables'
  autoCycleFolder: boolean; // Default: true
  namingConvention: 'department_username_[index]';
  useDepartmentCode: boolean; // true for "SE", false for "SoftwareEngineering"
  zohoDomain: 'zoho.com' | 'zoho.eu' | 'zoho.in' | 'zoho.com.au' | 'zoho.jp';
  parentFolderId?: string; // e.g. "6p1w1d9fdf7f349244201bd98bea82e968be5"
  workspaceId?: string; // e.g. "4imj816429a4baa7747aa814b03cdbe7b2c2c"
  parentFolderUrl?: string; // e.g. "https://workdrive.zoho.com/4imj816429a4baa7747aa814b03cdbe7b2c2c/privatespace/folders/6p1w1d9fdf7f349244201bd98bea82e968be5"
  teamFolderId?: string;
  teamFolderName?: string;
  clientId?: string;
  clientSecret?: string;
  refreshToken?: string;
  redirectUri?: string;
  connected: boolean;
  lastSyncedAt?: string;
}

export interface CommentAttachment {
  id: string;
  name: string;
  url: string;
}

export interface TaskComment {
  id: string;
  taskId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  content: string;
  createdAt: string;
  updatedAt?: string;
  edited?: boolean;
  parentId?: string; // For nested replies
  attachments?: CommentAttachment[];
}

export type ActivityType =
  | 'created'
  | 'status_changed'
  | 'progress_updated'
  | 'priority_changed'
  | 'deliverable_uploaded'
  | 'comment_added'
  | 'approved'
  | 'revision_requested'
  | 'archived'
  | 'restored';

export interface ActivityItem {
  id: string;
  taskId: string;
  userId: string;
  userName: string;
  type: ActivityType;
  details: string;
  timestamp: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  departmentId: string;
  departmentName: string;
  ownerId: string;
  ownerName: string;
  ownerAvatar?: string;
  createdAt: string;
  weekId: string; // e.g. "2026-08-W2"

  // Planning
  objective: string;
  priority: TaskPriority;
  startDate: string;
  deadline: string;

  // Progress
  status: TaskStatus;
  progressPercent: number; // 0 - 100
  challengeCategory: ChallengeCategory;
  challengeDescription?: string;
  supportNeeded: string[]; // Department names

  // Deliverables
  deliverables: Deliverable[];

  // Approval
  approvedBy?: string;
  approvedByName?: string;
  approvalDate?: string;
  approvalNote?: string;
  revisionReason?: string;

  // Watchers & Archiving
  watchers: string[]; // User IDs following this task
  archived: boolean;
  archivedAt?: string;
  archivedBy?: string;
}

export type NotificationType =
  | 'deadline'
  | 'overdue'
  | 'comment'
  | 'mention'
  | 'approval'
  | 'revision'
  | 'registration'
  | 'watch_update';

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  taskId?: string;
  read: boolean;
  createdAt: string;
}

export interface WeeklyReflection {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  departmentId: string;
  departmentName: string;
  weekId: string;
  completedSummary: string;
  carryOverSummary: string;
  blockersSummary: string;
  submittedAt: string;
}

export interface AuditLog {
  id: string;
  actorId: string;
  actorName: string;
  action: string;
  category: 'user' | 'department' | 'system' | 'security' | 'task';
  details: string;
  timestamp: string;
  ipAddress?: string;
}

export interface BugReport {
  id: string;
  submittedBy: string;
  submittedByName: string;
  title: string;
  description: string;
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  status: 'Open' | 'In Investigation' | 'Resolved';
  createdAt: string;
}

export interface WeekPeriod {
  id: string; // e.g. "2026-08-W2"
  label: string; // e.g. "2026-08-W2 (Aug 10 - Aug 14, 2026)"
  startDate: string; // "2026-08-03"
  endDate: string; // "2026-08-07"
  status: 'current' | 'previous' | 'archived';
  fridayCompleted: boolean;
  fridayCompletedAt?: string;
  fridayCompletedBy?: string;
  fridayNote?: string;
}

export type WeekFilterOption =
  | 'current'
  | 'previous'
  | 'archived'
  | 'all'
  | string;

export interface TaskFilterState {
  searchQuery: string;
  departmentId: string;
  ownerId: string;
  priority: string;
  status: string;
  challengeType: string;
  supportNeeded: string;
  weekFilter: WeekFilterOption;
  showArchived: boolean;
  sortBy: 'deadline' | 'priority' | 'created' | 'progress';
  sortOrder: 'asc' | 'desc';
}

export interface SavedFilterPreset {
  id: string;
  name: string;
  deptFilter: string;
  ownerFilter: string;
  priorityFilter: string;
  statusFilter: string;
  challengeFilter: string;
  sortBy: 'deadline' | 'priority' | 'created' | 'progress';
  showArchived: boolean;
  isBuiltIn?: boolean;
}

export type ThemeMode = 'light' | 'dark' | 'system';
