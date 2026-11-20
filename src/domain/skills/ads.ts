import { range } from '../rng';
import { makeChoices } from './choices';
import { factArg, questionId, type SkillDefinition } from './skill';

/**
 * ADS — Plus et moins jusqu'à 10 : la toute première marche. `ads:5+2`, `ads:8-3`.
 * Niveau 1 : ajouter ou enlever 1, 2 ou 3 (on avance ou on recule pas à pas) ;
 * niveau 2 : les autres additions jusqu'à 10 ; niveau 3 : les autres soustractions.
 */
const SMALL = 3;

const additions = (bMin: number, bMax: number) =>
  range(bMin, bMax).flatMap((b) => range(1, 10 - b).map((a) => `ads:${a}+${b}`));
const subtractions = (bMin: number, bMax: number) =>
  range(bMin, bMax).flatMap((b) => range(b, 10).map((a) => `ads:${a}-${b}`));

/** Petits pas : la grenouille avance (ou recule) de 1 en 1. */
function stepByStep(a: number, b: number, plus: boolean): string[] {
  return range(1, b).map((i) => {
    const from = plus ? a + i - 1 : a - i + 1;
    return plus ? `${from} + 1 = ${from + 1}` : `${from} − 1 = ${from - 1}`;
  });
}

function strategy(a: number, b: number, plus: boolean): string[] {
  if (b <= SMALL) return stepByStep(a, b, plus);
  // Addition : on part du plus grand (2 + 6 → 6 + 2). Soustraction : on cherche le complément.
  if (plus) return a < b ? [`${b} + ${a} = ${a + b}`] : [`${a} + ${b} = ${a + b}`];
  return [`${b} + ${a - b} = ${a}`, `${a} − ${b} = ${a - b}`];
}

export const ads: SkillDefinition = {
  id: 'ADS',
  levels: [1, 2, 3],
  facts(level) {
    if (level === 1) return [...additions(1, SMALL), ...subtractions(1, SMALL)];
    if (level === 2) return additions(SMALL + 1, 9);
    return subtractions(SMALL + 1, 10);
  },
  question(factKey, level, rng) {
    const m = /^(\d+)([+-])(\d+)$/.exec(factArg(factKey, 'ads'));
    const a = Number(m?.[1]);
    const b = Number(m?.[3]);
    const plus = m?.[2] === '+';
    const valid = m && b >= 1 && (plus ? a >= 1 && a + b <= 10 : a >= b && a <= 10);
    if (!valid) throw new Error(`Fait invalide pour ads : ${factKey}`);
    const answer = plus ? a + b : a - b;
    return {
      id: questionId(factKey, rng),
      skillId: 'ADS',
      factKey,
      level,
      display: { a, op: plus ? '+' : '−', b, missing: 'result' },
      answer,
      // Erreurs typiques : un pas de trop ou de moins, mauvais sens (8 − 3 → 11).
      choices: makeChoices(answer, [answer + 1, answer - 1, plus ? a - b : a + b], rng, {
        max: plus ? 10 : 20,
      }),
      strategy: { steps: strategy(a, b, plus), visual: 'numberline' },
    };
  },
};
