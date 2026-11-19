import { range } from '../rng';
import { makeChoices } from './choices';
import { factArg, questionId, type SkillDefinition } from './skill';

/**
 * PDB — Presque-doubles (double ± 1). `pdb:7+8`.
 * Niveau 1 : n + (n+1) ; niveau 2 : aussi dans l'autre sens (8 + 7).
 */
const asc = range(1, 9).map((n) => `pdb:${n}+${n + 1}`);
const desc = range(1, 9).map((n) => `pdb:${n + 1}+${n}`);

export const pdb: SkillDefinition = {
  id: 'PDB',
  levels: [1, 2],
  facts: (level) => (level === 1 ? asc : [...asc, ...desc]),
  question(factKey, level, rng) {
    const m = /^(\d+)\+(\d+)$/.exec(factArg(factKey, 'pdb'));
    const a = Number(m?.[1]);
    const b = Number(m?.[2]);
    if (!m || Math.abs(a - b) !== 1 || Math.min(a, b) < 1 || Math.max(a, b) > 10) {
      throw new Error(`Fait invalide pour pdb : ${factKey}`);
    }
    const small = Math.min(a, b);
    const answer = a + b;
    return {
      id: questionId(factKey, rng),
      skillId: 'PDB',
      factKey,
      level,
      display: { a, op: '+', b, missing: 'result' },
      answer,
      // 2 × petit : oubli du « + 1 » ; 2 × grand : double du mauvais nombre.
      choices: makeChoices(answer, [2 * small, 2 * Math.max(a, b), answer + 10, answer - 10], rng),
      strategy: {
        steps: [`${small} + ${small} = ${2 * small}`, `${2 * small} + 1 = ${answer}`],
        visual: 'tenframe',
      },
    };
  },
};
