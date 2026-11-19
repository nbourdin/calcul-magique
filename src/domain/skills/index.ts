import { pick, type Rng } from '../rng';
import type { Level, Question, SkillId } from '../types';
import { c10 } from './c10';
import { c20 } from './c20';
import { cds } from './cds';
import { d10 } from './d10';
import { dbl } from './dbl';
import { m9 } from './m9';
import { p9 } from './p9';
import { pdb } from './pdb';
import { tableSkill } from './tables';
import { tad } from './tad';
import { clampLevel, type SkillDefinition } from './skill';

export type { SkillDefinition } from './skill';

/** Toutes les compétences du référentiel (PRD §4). */
export const SKILLS: Partial<Record<SkillId, SkillDefinition>> = {
  C10: c10,
  C20: c20,
  CDS: cds,
  DBL: dbl,
  PDB: pdb,
  TAD: tad,
  P9: p9,
  M9: m9,
  D10: d10,
  T2: tableSkill('T2', 2),
  T5: tableSkill('T5', 5),
  T10: tableSkill('T10', 10),
  T3: tableSkill('T3', 3),
  T4: tableSkill('T4', 4),
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
