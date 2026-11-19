import { range } from '../rng';
import { makeChoices, swapDigits } from './choices';
import { factArg, questionId, type SkillDefinition } from './skill';

/**
 * D10 — Ajouter ou retirer des dizaines entières. `d10:34+10`, `d10:58-30`.
 * Niveau 1 : ± 10 ; niveau 2 : ± 20, 30, 40.
 */
const facts = (k: number) => [
  ...range(1, 99 - k).map((n) => `d10:${n}+${k}`),
  ...range(k + 1, 99).map((n) => `d10:${n}-${k}`),
];

export const d10: SkillDefinition = {
  id: 'D10',
  levels: [1, 2],
  facts: (level) => (level === 1 ? facts(10) : [20, 30, 40].flatMap(facts)),
  question(factKey, level, rng) {
    const m = /^(\d+)([+-])(10|20|30|40)$/.exec(factArg(factKey, 'd10'));
    const n = Number(m?.[1]);
    const k = Number(m?.[3]);
    const plus = m?.[2] === '+';
    const answer = plus ? n + k : n - k;
    if (!m || n < 1 || answer < 1 || answer > 99) throw new Error(`Fait invalide pour d10 : ${factKey}`);
    const sign = plus ? '+' : '−';
    const steps = range(1, k / 10).map((i) => {
      const from = plus ? n + (i - 1) * 10 : n - (i - 1) * 10;
      return `${from} ${sign} 10 = ${plus ? from + 10 : from - 10}`;
    });
    return {
      id: questionId(factKey, rng),
      skillId: 'D10',
      factKey,
      level,
      display: { a: n, op: plus ? '+' : '−', b: k, missing: 'result' },
      answer,
      // Erreur typique : toucher aux unités au lieu des dizaines (34 + 10 → 35).
      choices: makeChoices(
        answer,
        [
          plus ? n + k / 10 : n - k / 10,
          answer + 10,
          answer - 10,
          answer + 1,
          answer - 1,
          swapDigits(answer),
        ],
        rng,
        { min: 1 },
      ),
      strategy: { steps, visual: 'numberline' },
    };
  },
};
