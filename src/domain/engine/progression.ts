import { factsFor, getSkill } from '../skills';
import type { FactState, Level, SkillId } from '../types';
import { isMastered, MASTERED_MIN_BOX } from './leitner';

/** Passage au niveau suivant : 80 % des faits du niveau en boîte 3 ou plus. */
export const LEVEL_UP_RATIO = 0.8;
/** Déblocage du monde suivant : 60 % de la compétence précédente maîtrisée. */
export const WORLD_UNLOCK_RATIO = 0.6;
export const SUGGEST_UP_RATE = 0.9;
export const SUGGEST_UP_STREAK = 3;
export const SUGGEST_DOWN_RATE = 0.5;
export const SUGGEST_DOWN_STREAK = 2;

function stateIndex(states: readonly FactState[], skillId: SkillId): Map<string, FactState> {
  return new Map(states.filter((s) => s.skillId === skillId).map((s) => [s.factKey, s]));
}

function ratio(facts: readonly string[], ok: (key: string) => boolean): number {
  return facts.length === 0 ? 0 : facts.filter(ok).length / facts.length;
}

/** Part des faits d'un niveau en boîte 3 ou plus. */
export function levelBoxRatio(skillId: SkillId, level: Level, states: readonly FactState[]): number {
  const index = stateIndex(states, skillId);
  return ratio(factsFor(skillId, level), (k) => (index.get(k)?.box ?? 0) >= MASTERED_MIN_BOX);
}

export function canLevelUp(skillId: SkillId, level: Level, states: readonly FactState[]): boolean {
  const def = getSkill(skillId);
  const hasNext = def.levels.some((l) => l > level);
  return hasNext && levelBoxRatio(skillId, level, states) >= LEVEL_UP_RATIO;
}

/** Faits uniques d'une compétence, tous niveaux confondus. */
export function allFacts(skillId: SkillId): string[] {
  return [...new Set(getSkill(skillId).levels.flatMap((l) => factsFor(skillId, l)))];
}

/** Part des faits maîtrisés sur l'ensemble de la compétence. */
export function skillMasteryRatio(skillId: SkillId, states: readonly FactState[]): number {
  const index = stateIndex(states, skillId);
  return ratio(allFacts(skillId), (k) => {
    const s = index.get(k);
    return s !== undefined && isMastered(s);
  });
}

export function isNextWorldUnlocked(previousSkillId: SkillId, states: readonly FactState[]): boolean {
  return skillMasteryRatio(previousSkillId, states) >= WORLD_UNLOCK_RATIO;
}

export type LevelSuggestion = 'up' | 'down' | null;

/**
 * Difficulté adaptative légère, à partir des taux de réussite du premier coup des dernières
 * séries (la plus récente en dernier). « up » se propose à l'enfant, jamais automatiquement.
 */
export function suggestLevelChange(firstTryRates: readonly number[]): LevelSuggestion {
  const lastUp = firstTryRates.slice(-SUGGEST_UP_STREAK);
  if (lastUp.length === SUGGEST_UP_STREAK && lastUp.every((r) => r >= SUGGEST_UP_RATE)) return 'up';
  const lastDown = firstTryRates.slice(-SUGGEST_DOWN_STREAK);
  if (lastDown.length === SUGGEST_DOWN_STREAK && lastDown.every((r) => r < SUGGEST_DOWN_RATE)) return 'down';
  return null;
}
