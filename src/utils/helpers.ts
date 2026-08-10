import { Activity, ActivityStep } from '../types';

/**
 * Calculates the progress percentage of an activity based on the average of its steps.
 * If no steps exist, returns 0.
 */
export function getActivityProgress(activity: Activity): number {
  if (!activity.etapes || activity.etapes.length === 0) {
    return 0;
  }
  const sum = activity.etapes.reduce((acc, step) => acc + (step.progression || 0), 0);
  return Math.round(sum / activity.etapes.length);
}

/**
 * Calculates the global implementation level of the entire work plan.
 * Average of the implementation levels of all steps across all activities.
 */
export function getGlobalWorkPlanProgress(activities: Activity[]): number {
  let totalSteps = 0;
  let totalStepProgression = 0;

  activities.forEach(act => {
    if (act.etapes && act.etapes.length > 0) {
      act.etapes.forEach(step => {
        totalSteps += 1;
        totalStepProgression += (step.progression || 0);
      });
    }
  });

  if (totalSteps === 0) {
    // Fallback to average of activity progress if no steps exist anywhere
    if (activities.length === 0) return 0;
    const actSum = activities.reduce((acc, act) => acc + getActivityProgress(act), 0);
    return Math.round(actSum / activities.length);
  }

  return Math.round(totalStepProgression / totalSteps);
}

/**
 * Checks if a user is authorized to download the full database (Administrator or Operator).
 */
export function isAuthorizedForDatabaseDownload(user: any): boolean {
  if (!user) return false;
  const hab = (user.habilitation || user.role || '').toLowerCase();
  return hab.includes('admin') || hab.includes('opérat') || hab.includes('operat') || hab === 'administrateur' || hab === 'opérateur';
}

export type DeadlineStatus = 'completed' | 'overdue' | 'due_soon' | 'normal';

/**
 * Determines the deadline status for an activity or step:
 * - 'completed': progress === 100
 * - 'overdue': deadline passed and progress < 100
 * - 'due_soon': deadline within 7 days from today and progress < 100
 * - 'normal': deadline more than 7 days away and progress < 100
 */
export function getItemDeadlineStatus(deadlineStr: string, progression: number): DeadlineStatus {
  if (progression >= 100) {
    return 'completed';
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const deadlineDate = new Date(deadlineStr);
  deadlineDate.setHours(0, 0, 0, 0);

  if (isNaN(deadlineDate.getTime())) {
    return 'normal';
  }

  const diffTime = deadlineDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return 'overdue';
  } else if (diffDays <= 7) {
    return 'due_soon';
  } else {
    return 'normal';
  }
}

/**
 * Returns Tailwind CSS class names for background, border, text, and badge based on status
 */
export function getStatusStyle(status: DeadlineStatus) {
  switch (status) {
    case 'completed':
      return {
        cardBorder: 'border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/20',
        badgeBg: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200 border-emerald-300',
        barColor: 'bg-emerald-500',
        textColor: 'text-emerald-700 dark:text-emerald-400',
        label: 'Complété',
      };
    case 'overdue':
      return {
        cardBorder: 'border-rose-500 bg-rose-50/40 dark:bg-rose-950/20 ring-1 ring-rose-300 dark:ring-rose-800',
        badgeBg: 'bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-200 border-rose-300',
        barColor: 'bg-rose-500',
        textColor: 'text-rose-700 dark:text-rose-400',
        label: 'En retard',
      };
    case 'due_soon':
      return {
        cardBorder: 'border-amber-500 bg-amber-50/40 dark:bg-amber-950/20 ring-1 ring-amber-300 dark:ring-amber-800',
        badgeBg: 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200 border-amber-300',
        barColor: 'bg-amber-500',
        textColor: 'text-amber-700 dark:text-amber-400',
        label: 'Échéance imminente (<= 7j)',
      };
    case 'normal':
    default:
      return {
        cardBorder: 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900',
        badgeBg: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200',
        barColor: 'bg-sky-500',
        textColor: 'text-slate-600 dark:text-slate-400',
        label: 'En cours',
      };
  }
}

/**
 * Format ISO date string into readable French format (e.g., "15 oct. 2026")
 */
export function formatDateFr(dateStr: string): string {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(d);
}

/**
 * Calculates remaining days from today
 */
export function getDaysRemaining(deadlineStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const deadlineDate = new Date(deadlineStr);
  deadlineDate.setHours(0, 0, 0, 0);
  const diffTime = deadlineDate.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}
