import { range } from '../rng';
import type { SkillId } from '../types';
import { makeChoices } from './choices';
import { factArg, questionId, type SkillDefinition } from './skill';

/** Table de multiplication de `k` (une table par compétence), stratégie : sauts de `k`. Fait `x:3x7`. */
export function tableSkill(id: SkillId, k: number): SkillDefinition {
  return {
    id,
    levels: [1],
    facts: () => range(1, 10).map((m) => `x:${k}x${m}`),
    question(factKey, level, rng) {
      const m = /^(\d+)x(\d+)$/.exec(factArg(factKey, 'x'));
      const table = Number(m?.[1]);
      const n = Number(m?.[2]);
      if (!m || table !== k || n < 1 || n > 10) throw new Error(`Fait invalide pour ${id} : ${factKey}`);
      const answer = k * n;
      return {
        id: questionId(factKey, rng),
        skillId: id,
        factKey,
        level,
        display: { a: k, op: '×', b: n, missing: 'result' },
        answer,
        // Erreurs typiques : un saut de trop ou de moins, addition au lieu de multiplication.
        choices: makeChoices(answer, [answer + k, answer - k, k + n, answer + 1, answer - 1], rng, {
          min: 1,
        }),
        strategy: { steps: range(1, n).map((i) => `${(i - 1) * k} + ${k} = ${i * k}`), visual: 'numberline' },
      };
    },
  };
}
