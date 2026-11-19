import { range } from '../rng';
import { makeChoices, swapDigits } from './choices';
import { factArg, questionId, type SkillDefinition } from './skill';

/**
 * TAD — Tables d'addition jusqu'à 20. `tad:8+5`, et en soustraction `tad:13-5`.
 * Niveau 1 : sommes ≤ 10 ; niveau 2 : sommes de 11 à 20 ; niveau 3 : soustractions associées.
 */
const pairs = (min: number, max: number) =>
  range(1, 10).flatMap((a) =>
    range(1, 10)
      .filter((b) => a + b >= min && a + b <= max)
      .map((b) => [a, b] as const),
  );

function additionSteps(a: number, b: number): string[] {
  const sum = a + b;
  if (a === b) return [`${a} + ${b} = ${sum}`];
  if (sum <= 10 || a === 10 || b === 10) return [`${a} + ${b} = ${sum}`];
  // Passage de la dizaine : on complète à 10 puis on ajoute le reste.
  return [`${a} + ${10 - a} = 10`, `10 + ${b - (10 - a)} = ${sum}`];
}

function subtractionSteps(total: number, b: number): string[] {
  const diff = total - b;
  if (total <= 10 || total - 10 >= b) return [`${total} − ${b} = ${diff}`];
  const down = total - 10;
  return [`${total} − ${down} = 10`, `10 − ${b - down} = ${diff}`];
}

export const tad: SkillDefinition = {
  id: 'TAD',
  levels: [1, 2, 3],
  facts(level) {
    if (level === 1) return pairs(2, 10).map(([a, b]) => `tad:${a}+${b}`);
    if (level === 2) return pairs(11, 20).map(([a, b]) => `tad:${a}+${b}`);
    return pairs(11, 20).map(([a, b]) => `tad:${a + b}-${b}`);
  },
  question(factKey, level, rng) {
    const m = /^(\d+)([+-])(\d+)$/.exec(factArg(factKey, 'tad'));
    const x = Number(m?.[1]);
    const y = Number(m?.[3]);
    const plus = m?.[2] === '+';
    const valid =
      m && (plus ? x >= 1 && y >= 1 && x <= 10 && y <= 10 : y >= 1 && y <= 10 && x - y >= 1 && x <= 20);
    if (!valid) throw new Error(`Fait invalide pour tad : ${factKey}`);
    const answer = plus ? x + y : x - y;
    return {
      id: questionId(factKey, rng),
      skillId: 'TAD',
      factKey,
      level,
      display: { a: x, op: plus ? '+' : '−', b: y, missing: 'result' },
      answer,
      choices: makeChoices(
        answer,
        [answer + 1, answer - 1, answer + 10, answer - 10, swapDigits(answer)],
        rng,
        {
          min: plus ? 1 : 0,
        },
      ),
      strategy: { steps: plus ? additionSteps(x, y) : subtractionSteps(x, y), visual: 'numberline' },
    };
  },
};
