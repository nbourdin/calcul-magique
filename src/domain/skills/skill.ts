import type { Rng } from '../rng';
import type { Level, Question, SkillId } from '../types';

export interface SkillDefinition {
  id: SkillId;
  /** Niveaux disponibles, du plus facile au plus difficile. */
  levels: readonly Level[];
  /** Faits suivis par le moteur pour un niveau donné. */
  facts(level: Level): string[];
  /** Construit une question pour un fait précis ; le niveau règle la présentation. */
  question(factKey: string, level: Level, rng: Rng): Question;
}

/** Niveau effectif : ramené dans les niveaux proposés par la compétence. */
export function clampLevel(def: SkillDefinition, level: Level): Level {
  const max = def.levels[def.levels.length - 1] ?? 1;
  return level > max ? max : level;
}

/** "p9:47" → "47" ; vérifie le préfixe. */
export function factArg(factKey: string, prefix: string): string {
  const [p, arg, ...rest] = factKey.split(':');
  if (p !== prefix || arg === undefined || arg === '' || rest.length > 0) {
    throw new Error(`Fait invalide pour ${prefix} : ${factKey}`);
  }
  return arg;
}

/** "c10:7" → 7, borné. */
export function factInt(factKey: string, prefix: string, min: number, max: number): number {
  const arg = factArg(factKey, prefix);
  const n = Number(arg);
  if (!/^\d+$/.test(arg) || n < min || n > max) {
    throw new Error(`Fait hors limites pour ${prefix} : ${factKey}`);
  }
  return n;
}

/** Identifiant de question ; la composition de série le remplace par un id ordonné. */
export function questionId(factKey: string, rng: Rng): string {
  return `${factKey}#${Math.floor(rng() * 2 ** 32).toString(36)}`;
}
