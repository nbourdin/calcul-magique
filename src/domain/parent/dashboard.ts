import { isMastered } from '../engine/leitner';
import { factsFor } from '../skills';
import { dayKey, daysBetween } from '../time';
import type { FactState, Level, Series, SkillId } from '../types';

/** Au-delà de ce taux de faits maîtrisés au niveau courant, la compétence est « solide ». */
export const SOLID_RATIO = 0.8;
export const SLOW_FACT_MS = 5000;

export type SkillStatus = 'new' | 'learning' | 'solid';

export interface SkillSummary {
  skillId: SkillId;
  level: Level;
  status: SkillStatus;
  mastered: number;
  total: number;
}

/** Statut d'une compétence (Non commencé / En cours / Solide) et faits maîtrisés au niveau courant. */
export function skillSummary(skillId: SkillId, level: Level, states: readonly FactState[]): SkillSummary {
  const facts = factsFor(skillId, level);
  const bySkill = states.filter((s) => s.skillId === skillId && s.seenCount > 0);
  const index = new Map(bySkill.map((s) => [s.factKey, s]));
  const mastered = facts.filter((k) => {
    const s = index.get(k);
    return s !== undefined && isMastered(s);
  }).length;
  const status: SkillStatus =
    bySkill.length === 0 ? 'new' : mastered / Math.max(1, facts.length) >= SOLID_RATIO ? 'solid' : 'learning';
  return { skillId, level, status, mastered, total: facts.length };
}

export function errorRate(s: FactState): number {
  return s.seenCount === 0 ? 0 : 1 - s.correctFirstTry / s.seenCount;
}

/** Les faits les plus ratés, puis les plus lents (au-delà de 5 s), pour guider le parent. */
export function factsToWork(states: readonly FactState[], limit = 10): FactState[] {
  return states
    .filter((s) => s.seenCount > 0 && (errorRate(s) > 0 || s.avgMs > SLOW_FACT_MS))
    .sort((a, b) => errorRate(b) - errorRate(a) || b.avgMs - a.avgMs)
    .slice(0, limit);
}

export interface DayActivity {
  day: string;
  minutes: number;
  series: number;
}

/** Minutes jouées et séries terminées par jour, sur les `days` derniers jours (le plus ancien d'abord). */
export function activityByDay(
  series: readonly Series[],
  today: string,
  days = 14,
  timeZone?: string,
): DayActivity[] {
  const out: DayActivity[] = Array.from({ length: days }, (_, i) => ({
    day: shiftDay(today, i - (days - 1)),
    minutes: 0,
    series: 0,
  }));
  for (const s of series) {
    const day = dayKey(s.endedAt, timeZone);
    const index = days - 1 - daysBetween(day, today);
    const slot = out[index];
    if (!slot) continue;
    slot.minutes += Math.max(0, s.endedAt - s.startedAt) / 60_000;
    slot.series += 1;
  }
  return out.map((d) => ({ ...d, minutes: Math.round(d.minutes * 10) / 10 }));
}

/** Jour décalé de `delta` jours (calendrier, sans fuseau). */
export function shiftDay(day: string, delta: number): string {
  const [y, m, d] = day.split('-').map(Number);
  const date = new Date(Date.UTC(y ?? 0, (m ?? 1) - 1, (d ?? 1) + delta));
  return date.toISOString().slice(0, 10);
}

/** Minutes jouées un jour donné (pour le message « à demain » selon la durée recommandée). */
export function minutesOnDay(series: readonly Series[], day: string, timeZone?: string): number {
  return series
    .filter((s) => dayKey(s.endedAt, timeZone) === day)
    .reduce((sum, s) => sum + Math.max(0, s.endedAt - s.startedAt) / 60_000, 0);
}
