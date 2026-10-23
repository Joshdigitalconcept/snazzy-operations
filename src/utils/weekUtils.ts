import { WeekPeriod } from '../types';

/**
 * Dynamically generates current and neighboring operational week cycles based on calendar dates.
 */
export function generateDefaultWeeks(): WeekPeriod[] {
  const weeks: WeekPeriod[] = [];
  const now = new Date();

  // Generate 2 past weeks, current week, and 3 future weeks
  for (let offset = -2; offset <= 3; offset++) {
    const d = new Date(now);
    d.setDate(d.getDate() + offset * 7);

    // Calculate Monday of that week
    const day = d.getDay();
    const diffToMon = d.getDate() - day + (day === 0 ? -6 : 1);
    const mon = new Date(d.setDate(diffToMon));
    const fri = new Date(mon);
    fri.setDate(mon.getDate() + 4);

    const year = mon.getFullYear();
    const month = String(mon.getMonth() + 1).padStart(2, '0');

    // Calculate week number in month
    const firstDayOfMonth = new Date(year, mon.getMonth(), 1);
    const weekNum = Math.ceil((mon.getDate() + firstDayOfMonth.getDay()) / 7);
    const id = `${year}-${month}-W${weekNum}`;

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const label = `${id} (${monthNames[mon.getMonth()]} ${mon.getDate()} - ${monthNames[fri.getMonth()]} ${fri.getDate()}, ${year})`;

    const startStr = mon.toISOString().split('T')[0];
    const endStr = fri.toISOString().split('T')[0];

    const isCurrent = offset === 0;
    const isPast = offset < 0;

    weeks.push({
      id,
      label,
      startDate: startStr,
      endDate: endStr,
      status: isCurrent ? 'current' : isPast ? 'previous' : 'current',
      fridayCompleted: false,
    });
  }

  return weeks;
}

export function getCurrentWeekId(): string {
  const weeks = generateDefaultWeeks();
  const current = weeks.find((w) => w.status === 'current') || weeks[2] || weeks[0];
  return current ? current.id : '2026-08-W2';
}

/**
 * Checks whether a task belongs to the currently active operational week.
 * Tasks are only active for the week they belong to; after that week ends,
 * they become past tasks regardless of completion status.
 */
export function isTaskInActiveWeek(
  task: { weekId?: string; deadline?: string; createdAt?: string },
  activeWeek: string
): boolean {
  if (!task) return false;
  if (task.weekId) {
    return task.weekId === activeWeek;
  }
  return false;
}

/**
 * Checks whether a task is from a past operational week (no longer active, whether completed or not).
 */
export function isPastTask(
  task: { weekId?: string; deadline?: string; createdAt?: string },
  activeWeek: string
): boolean {
  if (!task) return false;
  if (!task.weekId) return true;
  if (task.weekId === activeWeek) return false;
  return task.weekId < activeWeek || task.weekId !== activeWeek;
}

/**
 * Checks whether a task is currently active (in the current active week, not archived, and not yet approved).
 */
export function isTaskCurrentlyActive(
  task: { weekId?: string; deadline?: string; createdAt?: string; archived?: boolean; status?: string },
  activeWeek: string
): boolean {
  if (!task || task.archived) return false;
  if (!isTaskInActiveWeek(task, activeWeek)) return false;
  return task.status !== 'Approved';
}

