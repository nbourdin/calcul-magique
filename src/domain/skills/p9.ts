import { range } from '../rng';
import { makeChoices, swapDigits } from './choices';
import { factArg, questionId, type SkillDefinition } from './skill';

/**
 * P9 — Ajouter 9 (+10 puis −1).
 * Niveau 1 : `p9:n`, n de 1 à 9 ; niveau 2 : n de 10 à 89 ;
 * niveau 3 : ajouter 19 ou 29 (+20/+30 puis −1), faits `p9:n+19` et `p9:n+29`, n de 1 à 60.
 */
const ADDENDS_L3 = [19, 29] as const;

function parse(factKey: string): { n: number; addend: number } {
  const arg = factArg(factKey, 'p9');
  const m = /^(\d+)(?:\+(19|29))?$/.exec(arg);
  const n = Number(m?.[1]);
  const addend = m?.[2] ? Number(m[2]) : 9;
  const valid = m && (addend === 9 ? n >= 1 && n <= 89 : n >= 1 && n <= 60);
  if (!valid) throw new Error(`Fait hors limites pour p9 : ${factKey}`);
  return { n, addend };
}

export const p9: SkillDefinition = {
  id: 'P9',
  levels: [1, 2, 3],
  facts(level) {
    if (level === 1) return range(1, 9).map((n) => `p9:${n}`);
    if (level === 2) return range(10, 89).map((n) => `p9:${n}`);
    return ADDENDS_L3.flatMap((add) => range(1, 60).map((n) => `p9:${n}+${add}`));
  },
  question(factKey, level, rng) {
    const { n, addend } = parse(factKey);
    const round = addend + 1;
    const answer = n + addend;
    return {
      id: questionId(factKey, rng),
      skillId: 'P9',
      factKey,
      level,
      display: { a: n, op: '+', b: addend, missing: 'result' },
      answer,
      // answer + 1 = oubli de la correction (6 + 9 → 16).
      choices: makeChoices(
        answer,
        [answer + 1, answer - 1, answer + 10, answer - 10, swapDigits(answer)],
        rng,
      ),
      strategy: {
        steps: [`${n} + ${round} = ${n + round}`, `${n + round} − 1 = ${answer}`],
        visual: 'numberline',
      },
    };
  },
};
