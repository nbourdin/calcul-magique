import { randInt, range } from '../rng';
import { makeChoices } from './choices';
import { factInt, questionId, type SkillDefinition } from './skill';

/**
 * CDS — Complément à la dizaine supérieure. Le fait ne dépend que des unités :
 * `cds:7` couvre 27 → 30 comme 67 → 70.
 * Niveau 1 : nombres de 11 à 49 ; niveau 2 : de 51 à 99.
 */
export const cds: SkillDefinition = {
  id: 'CDS',
  levels: [1, 2],
  facts: () => range(1, 9).map((u) => `cds:${u}`),
  question(factKey, level, rng) {
    const units = factInt(factKey, 'cds', 1, 9);
    const tens = level === 1 ? randInt(rng, 1, 4) : randInt(rng, 5, 9);
    const n = tens * 10 + units;
    const answer = 10 - units;
    const target = (tens + 1) * 10;
    return {
      id: questionId(factKey, rng),
      skillId: 'CDS',
      factKey,
      level,
      display: { a: n, op: '+', b: answer, missing: 'b' },
      answer,
      // Erreur typique : répondre le chiffre des unités au lieu du complément.
      choices: makeChoices(answer, [answer + 1, answer - 1, units], rng, { min: 1, max: 9 }),
      strategy: {
        steps: [
          `${n} = ${tens * 10} + ${units}`,
          `${units} + ${answer} = 10`,
          `${n} + ${answer} = ${target}`,
        ],
        visual: 'numberline',
      },
    };
  },
};
