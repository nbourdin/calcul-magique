import { range } from '../rng';
import { makeChoices } from './choices';
import { factArg, questionId, type SkillDefinition } from './skill';

/**
 * DBL — Doubles et moitiés. `dbl:8` = double de 8, `dbl:h16` = moitié de 16.
 * Niveau 1 : doubles jusqu'à 10 ; 2 : doubles de 11 à 20 et des dizaines jusqu'à 50 ;
 * 3 : moitiés des nombres pairs jusqu'à 100.
 */
const LEVEL2 = [...range(11, 20), 25, 30, 40, 50];

function doubleSteps(n: number): string[] {
  if (n <= 10 || n % 10 === 0) return [`${n} + ${n} = ${2 * n}`];
  const tens = n - (n % 10);
  const units = n % 10;
  return [
    `${tens} + ${tens} = ${2 * tens}`,
    `${units} + ${units} = ${2 * units}`,
    `${2 * tens} + ${2 * units} = ${2 * n}`,
  ];
}

function halfSteps(m: number): string[] {
  const half = m / 2;
  const tens = m - (m % 10);
  if (m <= 20 || m % 10 === 0) return [`${half} + ${half} = ${m}`];
  return [
    `${tens / 2} + ${tens / 2} = ${tens}`,
    `${(m % 10) / 2} + ${(m % 10) / 2} = ${m % 10}`,
    `${half} + ${half} = ${m}`,
  ];
}

export const dbl: SkillDefinition = {
  id: 'DBL',
  levels: [1, 2, 3],
  facts(level) {
    if (level === 1) return range(1, 10).map((n) => `dbl:${n}`);
    if (level === 2) return LEVEL2.map((n) => `dbl:${n}`);
    return range(1, 50).map((h) => `dbl:h${2 * h}`);
  },
  question(factKey, level, rng) {
    const arg = factArg(factKey, 'dbl');
    const half = /^h(\d+)$/.exec(arg);
    if (half) {
      const m = Number(half[1]);
      if (m < 2 || m > 100 || m % 2 !== 0) throw new Error(`Fait hors limites pour dbl : ${factKey}`);
      const answer = m / 2;
      return {
        id: questionId(factKey, rng),
        skillId: 'DBL',
        factKey,
        level,
        wording: 'half',
        display: { a: answer, op: '+', b: answer, missing: 'a' },
        answer,
        choices: makeChoices(answer, [answer + 1, answer - 1, m, answer + 10, answer - 10], rng, { min: 1 }),
        strategy: { steps: halfSteps(m), visual: 'tenframe' },
      };
    }
    const n = Number(arg);
    if (!/^\d+$/.test(arg) || n < 1 || n > 50) throw new Error(`Fait hors limites pour dbl : ${factKey}`);
    const answer = 2 * n;
    return {
      id: questionId(factKey, rng),
      skillId: 'DBL',
      factKey,
      level,
      wording: 'double',
      display: { a: n, op: '+', b: n, missing: 'result' },
      answer,
      // n + 1 : confusion « double » / « suivant » ; 2n ± 1 et ± 10 : erreurs de calcul.
      choices: makeChoices(
        answer,
        [answer + 1, answer - 1, answer + 2, n + 1, answer + 10, answer - 10],
        rng,
        { min: 1 },
      ),
      strategy: { steps: doubleSteps(n), visual: 'tenframe' },
    };
  },
};
