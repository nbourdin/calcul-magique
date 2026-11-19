import { daysBetween, isoWeekKey } from '../time';

/** Série de jours (« flamme ») : +1 par jour avec au moins une série terminée. */
export interface Streak {
  count: number;
  best: number;
  lastDay: string | null;
  /** Semaine ISO où le jour de répit a déjà servi. */
  graceUsedWeek: string | null;
}

export const EMPTY_STREAK: Streak = { count: 0, best: 0, lastDay: null, graceUsedWeek: null };

/**
 * none : jamais joué · lit : déjà joué aujourd'hui · waiting : jouer aujourd'hui la fait grandir
 * (hier, ou avant-hier avec le répit de la semaine) · asleep : en veille, sans message négatif.
 */
export type FlameStatus = 'none' | 'lit' | 'waiting' | 'asleep';

export type StreakChange = 'same' | 'started' | 'grew' | 'grace' | 'woke';

function graceAvailable(streak: Streak, today: string): boolean {
  return streak.graceUsedWeek !== isoWeekKey(today);
}

export function flameStatus(streak: Streak, today: string): FlameStatus {
  if (streak.lastDay === null || streak.count === 0) return 'none';
  const gap = daysBetween(streak.lastDay, today);
  if (gap <= 0) return 'lit';
  if (gap === 1 || (gap === 2 && graceAvailable(streak, today))) return 'waiting';
  return 'asleep';
}

/** Met à jour la flamme quand une série est terminée `today`. */
export function recordPlayDay(streak: Streak, today: string): { streak: Streak; change: StreakChange } {
  const status = flameStatus(streak, today);
  const grow = (count: number, patch: Partial<Streak> = {}): Streak => ({
    ...streak,
    ...patch,
    count,
    best: Math.max(streak.best, count),
    lastDay: today,
  });
  switch (status) {
    case 'lit':
      return { streak, change: 'same' };
    case 'none':
      return { streak: grow(1), change: 'started' };
    case 'asleep':
      // La flamme se réveille : on repart de 1, le record est conservé.
      return { streak: grow(1), change: 'woke' };
    case 'waiting': {
      const usedGrace = daysBetween(streak.lastDay ?? today, today) === 2;
      return usedGrace
        ? { streak: grow(streak.count + 1, { graceUsedWeek: isoWeekKey(today) }), change: 'grace' }
        : { streak: grow(streak.count + 1), change: 'grew' };
    }
  }
}
