import { pick, type Rng } from '../rng';
import type { Level, Question, SkillId } from '../types';
import { c10 } from './c10';
import { c20 } from './c20';
import { cds } from './cds';
import { m9 } from './m9';
import { p9 } from './p9';
import { clampLevel, type SkillDefinition } from './skill';

export type { SkillDefinition } from './skill';

/** Compétences implémentées. Les autres (DBL, TAD, tables…) arrivent aux jalons suivants. */
export const SKILLS: Partial<Record<SkillId, SkillDefinition>> = {
  C10: c10,
  C20: c20,
  CDS: cds,
  P9: p9,
  M9: m9,
};

export function getSkill(skillId: SkillId): SkillDefinition {
  const def = SKILLS[skillId];
  if (!def) throw new Error(`Compétence non implémentée : ${skillId}`);
  return def;
}

export function isSkillAvailable(skillId: SkillId): boolean {
  return SKILLS[skillId] !== undefined;
}

export function factsFor(skillId: SkillId, level: Level): string[] {
  const def = getSkill(skillId);
  return def.facts(clampLevel(def, level));
}

export function questionForFact(skillId: SkillId, factKey: string, level: Level, rng: Rng): Question {
  const def = getSkill(skillId);
  return def.question(factKey, clampLevel(def, level), rng);
}

/** Générateur pur du PRD : `(skillId, difficulty, rng) → Question`. */
export function generateQuestion(skillId: SkillId, level: Level, rng: Rng): Question {
  return questionForFact(skillId, pick(rng, factsFor(skillId, level)), level, rng);
}
