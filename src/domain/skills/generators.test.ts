import { hiddenValue, evaluate } from '../display';
import { createRng } from '../rng';
import type { Level, Question, SkillId } from '../types';
import { factsFor, generateQuestion, getSkill, questionForFact, SKILLS } from './index';

const DRAWS = 1000;

/** Propriétés communes à toutes les questions (PRD §8 « tests obligatoires »). */
function checkCommon(q: Question, skillId: SkillId, level: Level) {
  expect(q.skillId).toBe(skillId);
  expect(factsFor(skillId, level)).toContain(q.factKey);
  expect(hiddenValue(q.display)).toBe(q.answer);
  expect(Number.isInteger(q.answer)).toBe(true);
  expect(q.answer).toBeGreaterThanOrEqual(0);
  expect(q.choices).toHaveLength(3);
  const choices = q.choices ?? [];
  expect(new Set(choices).size).toBe(3);
  expect(choices).toContain(q.answer);
  for (const c of choices) {
    expect(Number.isInteger(c)).toBe(true);
    expect(c).toBeGreaterThanOrEqual(0);
  }
  expect(q.strategy?.steps.length).toBeGreaterThan(0);
}

function draw(skillId: SkillId, level: Level, check: (q: Question) => void) {
  const rng = createRng(1234 + level);
  for (let i = 0; i < DRAWS; i++) {
    const q = generateQuestion(skillId, level, rng);
    checkCommon(q, skillId, level);
    check(q);
  }
}

const between = (n: number, min: number, max: number) => {
  expect(n).toBeGreaterThanOrEqual(min);
  expect(n).toBeLessThanOrEqual(max);
};

describe('C10 — compléments à 10', () => {
  it.each([1, 2] as const)('niveau %i : n + _ = 10', (level) =>
    draw('C10', level, (q) => {
      expect(q.display.missing).toBe('b');
      expect(evaluate(q.display)).toBe(10);
      between(q.display.a, 0, 10);
      for (const c of q.choices ?? []) between(c, 0, 10);
    }),
  );

  it('niveau 3 : à trous _ + n = 10', () =>
    draw('C10', 3, (q) => {
      expect(q.display.missing).toBe('a');
      expect(evaluate(q.display)).toBe(10);
      expect(q.factKey).toBe(`c10:${q.display.b}`);
    }));
});

describe('C20 — compléments à 20', () => {
  it('niveau 1 : de 11 à 19', () =>
    draw('C20', 1, (q) => {
      between(q.display.a, 11, 19);
      expect(evaluate(q.display)).toBe(20);
    }));

  it('niveau 2 : n’importe quel complément ≤ 20', () =>
    draw('C20', 2, (q) => {
      between(q.display.a, 0, 20);
      expect(evaluate(q.display)).toBe(20);
      for (const c of q.choices ?? []) between(c, 0, 20);
    }));

  it('ramène un niveau inexistant au dernier niveau', () => {
    expect(generateQuestion('C20', 3, createRng(1)).level).toBe(2);
  });

  it('montre le passage par 10 sous 10 aussi', () => {
    expect(questionForFact('C20', 'c20:4', 2, createRng(1)).strategy?.steps).toEqual([
      '4 + 6 = 10',
      '10 + 10 = 20',
      '4 + 16 = 20',
    ]);
  });
});

describe('CDS — dizaine supérieure', () => {
  it.each([
    [1, 11, 49],
    [2, 51, 99],
  ] as const)('niveau %i : nombres de %i à %i', (level, min, max) =>
    draw('CDS', level, (q) => {
      between(q.display.a, min, max);
      expect(q.display.a % 10).not.toBe(0);
      expect(evaluate(q.display) % 10).toBe(0);
      expect(evaluate(q.display) - q.display.a).toBeLessThan(10);
      expect(q.factKey).toBe(`cds:${q.display.a % 10}`);
      for (const c of q.choices ?? []) between(c, 1, 9);
    }),
  );
});

describe('P9 — ajouter 9', () => {
  it.each([
    [1, 1, 9],
    [2, 10, 89],
  ] as const)('niveau %i : n de %i à %i', (level, min, max) =>
    draw('P9', level, (q) => {
      expect(q.display).toMatchObject({ op: '+', b: 9, missing: 'result' });
      between(q.display.a, min, max);
    }),
  );

  it('niveau 3 : ajouter 19 ou 29', () =>
    draw('P9', 3, (q) => {
      expect([19, 29]).toContain(q.display.b);
      between(q.display.a, 1, 60);
      expect(q.answer).toBeLessThan(100);
    }));

  it('montre +10 puis −1 et propose l’oubli de la correction', () => {
    const q = questionForFact('P9', 'p9:6', 1, createRng(5));
    expect(q.answer).toBe(15);
    expect(q.strategy?.steps).toEqual(['6 + 10 = 16', '16 − 1 = 15']);
    const withForgot = Array.from({ length: 50 }, (_, i) => questionForFact('P9', 'p9:6', 1, createRng(i)));
    expect(withForgot.some((x) => x.choices?.includes(16))).toBe(true);
  });

  it('niveau 3 : +20 puis −1', () => {
    expect(questionForFact('P9', 'p9:7+19', 3, createRng(1)).strategy?.steps).toEqual([
      '7 + 20 = 27',
      '27 − 1 = 26',
    ]);
  });
});

describe('M9 — soustraire 9', () => {
  it.each([
    [1, 10, 29],
    [2, 30, 99],
  ] as const)('niveau %i : n de %i à %i', (level, min, max) =>
    draw('M9', level, (q) => {
      expect(q.display).toMatchObject({ op: '−', b: 9, missing: 'result' });
      between(q.display.a, min, max);
    }),
  );

  it('montre −10 puis +1', () => {
    expect(questionForFact('M9', 'm9:23', 1, createRng(1)).strategy?.steps).toEqual([
      '23 − 10 = 13',
      '13 + 1 = 14',
    ]);
  });
});

describe('registre et faits', () => {
  it('chaque compétence a des faits uniques à chaque niveau', () => {
    for (const def of Object.values(SKILLS)) {
      for (const level of def.levels) {
        const facts = def.facts(level);
        expect(facts.length).toBeGreaterThan(0);
        expect(new Set(facts).size).toBe(facts.length);
      }
    }
  });

  it('refuse une compétence non implémentée', () => {
    expect(() => getSkill('XYZ' as SkillId)).toThrow(/non implémentée/);
  });

  it.each([
    ['C10', 'c10:11'],
    ['C10', 'c20:5'],
    ['C10', 'c10:'],
    ['C10', 'c10:3:4'],
    ['C10', 'c10:abc'],
    ['CDS', 'cds:0'],
    ['P9', 'p9:0'],
    ['P9', 'p9:61+19'],
    ['P9', 'p9:5+39'],
    ['M9', 'm9:9'],
  ] as const)('%s refuse le fait invalide %s', (skillId, factKey) => {
    expect(() => questionForFact(skillId, factKey, 1, createRng(1))).toThrow();
  });

  it('est déterministe à graine égale', () => {
    expect(generateQuestion('P9', 2, createRng(99))).toEqual(generateQuestion('P9', 2, createRng(99)));
  });
});
