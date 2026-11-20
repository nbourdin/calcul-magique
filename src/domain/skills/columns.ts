import { columnSteps } from '../column';
import { randInt, range, type Rng } from '../rng';
import type { Level, Question, SkillId } from '../types';
import { makeChoices, swapDigits } from './choices';
import { factArg, questionId, type SkillDefinition } from './skill';

/**
 * Calcul posé (nombres à deux chiffres). Comme pour CDS, le fait suivi ne dépend que des
 * unités, là où se joue la retenue ou l'emprunt ; les dizaines sont tirées au hasard.
 *
 * APO — Addition posée. `apo:7+5` = unités 7 et 5.
 * Niveau 1 : sans retenue (unités ≤ 9) ; niveau 2 : avec retenue.
 *
 * SPO — Soustraction posée. `spo:3-7` = unités 3 en haut, 7 en bas.
 * Niveau 1 : sans emprunt ; niveau 2 : on casse une dizaine.
 * Le résultat garde toujours au moins une dizaine (≥ 10).
 */
const digitPairs = (keep: (u: number, v: number) => boolean) =>
  range(0, 9).flatMap((u) =>
    range(0, 9)
      .filter((v) => (u > 0 || v > 0) && keep(u, v))
      .map((v) => [u, v] as const),
  );

function parseUnits(factKey: string, prefix: 'apo' | 'spo'): { u: number; v: number } {
  const sign = prefix === 'apo' ? '\\+' : '-';
  const m = new RegExp(`^(\\d)${sign}(\\d)$`).exec(factArg(factKey, prefix));
  if (!m || (m[1] === '0' && m[2] === '0')) throw new Error(`Fait invalide pour ${prefix} : ${factKey}`);
  return { u: Number(m[1]), v: Number(m[2]) };
}

function columnQuestion(
  skillId: SkillId,
  factKey: string,
  level: Level,
  rng: Rng,
  a: number,
  b: number,
  plus: boolean,
  typicalErrors: (answer: number) => (number | null)[],
): Question {
  const display = { a, op: plus ? ('+' as const) : ('−' as const), b, missing: 'result' as const };
  const answer = plus ? a + b : a - b;
  return {
    id: questionId(factKey, rng),
    skillId,
    factKey,
    level,
    display,
    answer,
    choices: makeChoices(answer, typicalErrors(answer), rng, { min: 1 }),
    strategy: { steps: columnSteps(display), visual: 'column' },
  };
}

export const apo: SkillDefinition = {
  id: 'APO',
  levels: [1, 2],
  facts: (level) =>
    digitPairs((u, v) => (level === 1 ? u + v <= 9 : u + v >= 10)).map(([u, v]) => `apo:${u}+${v}`),
  question(factKey, level, rng) {
    const { u, v } = parseUnits(factKey, 'apo');
    const carry = u + v >= 10 ? 1 : 0;
    // Dizaines : la somme reste sous 100 ; le second nombre peut n'avoir qu'un chiffre.
    const at = randInt(rng, 1, 8 - carry);
    const bt = randInt(rng, v === 0 ? 1 : 0, 9 - carry - at);
    const a = at * 10 + u;
    const b = bt * 10 + v;
    return columnQuestion('APO', factKey, level, rng, a, b, true, (answer) => [
      // Oubli de la retenue, retenue en trop, erreur d'un chiffre, chiffres inversés.
      carry ? answer - 10 : answer + 10,
      answer + 1,
      answer - 1,
      swapDigits(answer),
    ]);
  },
};

export const spo: SkillDefinition = {
  id: 'SPO',
  levels: [1, 2],
  facts: (level) => digitPairs((u, v) => (level === 1 ? u >= v : u < v)).map(([u, v]) => `spo:${u}-${v}`),
  question(factKey, level, rng) {
    const { u, v } = parseUnits(factKey, 'spo');
    const borrow = u < v ? 1 : 0;
    const at = randInt(rng, 2, 9);
    const bt = randInt(rng, v === 0 ? 1 : 0, at - 1 - borrow);
    const a = at * 10 + u;
    const b = bt * 10 + v;
    return columnQuestion('SPO', factKey, level, rng, a, b, false, (answer) => [
      // Erreur classique : le petit chiffre ôté du grand dans chaque colonne (53 − 27 → 34).
      borrow ? (at - bt) * 10 + (v - u) : null,
      // Dizaine cassée mais pas retirée.
      borrow ? answer + 10 : answer - 10,
      answer + 1,
      answer - 1,
      swapDigits(answer),
    ]);
  },
};
