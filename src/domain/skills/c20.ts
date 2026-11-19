import { range } from '../rng';
import { makeChoices } from './choices';
import { factInt, questionId, type SkillDefinition } from './skill';

/**
 * C20 — Compléments à 20, en passant par 10. Fait `c20:n` = « n pour aller à 20 ».
 * Niveau 1 : n de 11 à 19 ; niveau 2 : n de 0 à 20.
 */
export const c20: SkillDefinition = {
  id: 'C20',
  levels: [1, 2],
  facts: (level) => (level === 1 ? range(11, 19) : range(0, 20)).map((n) => `c20:${n}`),
  question(factKey, level, rng) {
    const n = factInt(factKey, 'c20', 0, 20);
    const answer = 20 - n;
    const steps =
      n >= 10
        ? [`${n} = 10 + ${n - 10}`, `${n - 10} + ${answer} = 10`, `${n} + ${answer} = 20`]
        : [`${n} + ${10 - n} = 10`, `10 + 10 = 20`, `${n} + ${answer} = 20`];
    return {
      id: questionId(factKey, rng),
      skillId: 'C20',
      factKey,
      level,
      display: { a: n, op: '+', b: answer, missing: 'b' },
      answer,
      // Erreur typique : oublier ou ajouter une dizaine (7 au lieu de 17).
      choices: makeChoices(answer, [answer + 1, answer - 1, answer + 10, answer - 10], rng, { max: 20 }),
      strategy: { steps, visual: 'tenframe' },
    };
  },
};
