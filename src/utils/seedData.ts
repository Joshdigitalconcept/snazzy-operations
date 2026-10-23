import { Department } from '../types';

export const DEFAULT_DEPARTMENTS: Department[] = [];

export const SEEDED_USER_IDS: string[] = [
  'user-alex-rivera',
  'user-sarah-jenkins',
  'user-marcus-chen',
  'user-elena-rostova',
  'user-david-kim',
  'user-1',
  'user-2',
  'user-3',
  'user-4',
  'user-5',
  'user-6',
  'user-7',
  'user-8',
];

export const SEEDED_TASK_IDS: string[] = [
  'task-biz-1',
  'task-it-1',
  'task-se-1',
  'task-sm-1',
  'task-comm-1',
  'task-biz-2',
  'task-it-2',
  'task-1',
  'task-2',
  'task-3',
  'task-4',
  'task-5',
  'task-6',
  'task-7',
  'task-8',
];

export const SEEDED_REFLECTION_IDS: string[] = [
  'refl-1',
  'refl-2',
  'refl-3',
  'refl-4',
  'refl-5',
];

export const SEEDED_NOTIFICATION_IDS: string[] = [
  'notif-1',
  'notif-2',
  'notif-3',
  'notif-4',
  'notif-5',
];

export const SEEDED_AUDIT_IDS: string[] = [
  'audit-1',
  'audit-2',
  'audit-3',
  'audit-4',
  'audit-5',
];

export const SEEDED_BUG_IDS: string[] = [
  'bug-1',
  'bug-2',
  'bug-3',
];

export function isSeededUser(u?: { id?: string; email?: string; name?: string } | null): boolean {
  if (!u) return false;
  if (u.id && SEEDED_USER_IDS.includes(u.id)) return true;
  const email = (u.email || '').trim().toLowerCase();
  if (email.endsWith('@snazzy.internal') || email.endsWith('@snazzy.com') || email.endsWith('@example.com')) {
    return true;
  }
  return false;
}

