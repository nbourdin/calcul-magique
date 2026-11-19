import { range } from '../rng';
import { makeChoices, swapDigits } from './choices';
import { factInt, questionId, type SkillDefinition } from './skill';

/**
 * M9 — Soustraire 9 (−10 puis +1). Fait `m9:n`.
 * Niveau 1 : n de 10 à 29 ; niveau 2 : n de 30 à 99.
 */
export const m9: SkillDefinition = {
  id: 'M9',
  levels: [1, 2],
  facts: (level) => (level === 1 ? range(10, 29) : range(30, 99)).map((n) => `m9:${n}`),
  question(factKey, level, rng) {
    const n = factInt(factKey, 'm9', 10, 99);
    const answer = n - 9;
    return {
      id: questionId(factKey, rng),
      skillId: 'M9',
      factKey,
      level,
      display: { a: n, op: '−', b: 9, missing: 'result' },
      answer,
      // answer − 1 = oubli de la correction (23 − 9 → 13).
      choices: makeChoices(
        answer,
        [answer - 1, answer + 1, answer + 10, answer - 10, swapDigits(answer)],
        rng,
      ),
      strategy: { steps: [`${n} − 10 = ${n - 10}`, `${n - 10} + 1 = ${answer}`], visual: 'numberline' },
    };
  },
};
