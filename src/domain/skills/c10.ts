import { range } from '../rng';
import { makeChoices } from './choices';
import { factInt, questionId, type SkillDefinition } from './skill';

/**
 * C10 — Compléments à 10. Fait `c10:n` = « n pour aller à 10 ».
 * Niveau 1 : avec support visuel ; 2 : sans support ; 3 : à trous (`_ + 7 = 10`).
 */
export const c10: SkillDefinition = {
  id: 'C10',
  levels: [1, 2, 3],
  facts: () => range(0, 10).map((n) => `c10:${n}`),
  question(factKey, level, rng) {
    const n = factInt(factKey, 'c10', 0, 10);
    const answer = 10 - n;
    return {
      id: questionId(factKey, rng),
      skillId: 'C10',
      factKey,
      level,
      display:
        level === 3 ? { a: answer, op: '+', b: n, missing: 'a' } : { a: n, op: '+', b: answer, missing: 'b' },
      answer,
      choices: makeChoices(answer, [answer + 1, answer - 1, n], rng, { max: 10 }),
      strategy: { steps: [`${n} + ${answer} = 10`], visual: 'house10' },
    };
  },
};
