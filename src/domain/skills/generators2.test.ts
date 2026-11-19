import { evaluate, hiddenValue } from '../display';
import { createRng } from '../rng';
import type { Level, Question, SkillId } from '../types';
import { factsFor, generateQuestion, questionForFact } from './index';

/** Mêmes propriétés que pour les premières compétences, sur 1 000 tirages à graine fixe. */
function draw(skillId: SkillId, level: Level, check: (q: Question) => void = () => {}) {
  const rng = createRng(77 + level);
  for (let i = 0; i < 1000; i++) {
    const q = generateQuestion(skillId, level, rng);
    expect(factsFor(skillId, level)).toContain(q.factKey);
    expect(hiddenValue(q.display)).toBe(q.answer);
    expect(q.answer).toBeGreaterThanOrEqual(0);
    const choices = q.choices ?? [];
    expect(choices).toHaveLength(3);
    expect(new Set(choices).size).toBe(3);
    expect(choices).toContain(q.answer);
    for (const c of choices) expect(c).toBeGreaterThanOrEqual(0);
    expect(q.strategy?.steps.length).toBeGreaterThan(0);
    check(q);
  }
}

/** Chaque étape « x op y = z » de la stratégie doit être juste. */
function stepsAreCorrect(q: Question) {
  for (const step of q.strategy?.steps ?? []) {
    const m = /^(\d+) ([+−]) (\d+) = (\d+)$/.exec(step);
    expect(m, step).not.toBeNull();
    const [x, op, y, z] = [Number(m?.[1]), m?.[2], Number(m?.[3]), Number(m?.[4])];
    expect(op === '+' ? x + y : x - y, step).toBe(z);
  }
}

describe('DBL — doubles et moitiés', () => {
  it('niveau 1 : doubles jusqu’à 10', () =>
    draw('DBL', 1, (q) => {
      expect(q.wording).toBe('double');
      expect(q.display.a).toBe(q.display.b);
      expect(q.display.a).toBeLessThanOrEqual(10);
      stepsAreCorrect(q);
    }));
  it('niveau 2 : moitiés des doubles déjà vus (pairs jusqu’à 20)', () =>
    draw('DBL', 2, (q) => {
      expect(q.wording).toBe('half');
      expect(evaluate(q.display) % 2).toBe(0);
      expect(evaluate(q.display)).toBeLessThanOrEqual(20);
      stepsAreCorrect(q);
    }));
  it('niveau 3 : doubles jusqu’à 50, moitiés des dizaines paires', () =>
    draw('DBL', 3, (q) => {
      if (q.wording === 'double') {
        expect(q.display.a).toBeGreaterThan(10);
        expect(q.answer).toBeLessThanOrEqual(100);
      } else {
        expect(q.wording).toBe('half');
        expect(evaluate(q.display) % 20).toBe(0);
      }
      stepsAreCorrect(q);
    }));
  it('chaque niveau s’appuie sur le précédent : moitiés des doubles du niveau 1', () => {
    const doubles = factsFor('DBL', 1).map((f) => 2 * Number(f.slice(4)));
    const halves = factsFor('DBL', 2).map((f) => Number(f.slice(5)));
    expect(halves).toEqual(doubles);
  });
  it('décompose les doubles en dizaines et unités', () => {
    expect(questionForFact('DBL', 'dbl:13', 2, createRng(1)).strategy?.steps).toEqual([
      '10 + 10 = 20',
      '3 + 3 = 6',
      '20 + 6 = 26',
    ]);
    expect(questionForFact('DBL', 'dbl:h34', 3, createRng(1)).strategy?.steps).toEqual([
      '15 + 15 = 30',
      '2 + 2 = 4',
      '17 + 17 = 34',
    ]);
  });
  it.each(['dbl:0', 'dbl:51', 'dbl:h7', 'dbl:h102', 'dbl:x'])('refuse %s', (f) => {
    expect(() => questionForFact('DBL', f, 1, createRng(1))).toThrow();
  });
});

describe('PDB — presque-doubles', () => {
  it.each([1, 2] as const)('niveau %i', (level) =>
    draw('PDB', level, (q) => {
      expect(Math.abs(q.display.a - (q.display.b ?? 0))).toBe(1);
      stepsAreCorrect(q);
    }),
  );
  it('niveau 2 propose aussi le sens décroissant', () => {
    expect(factsFor('PDB', 2)).toContain('pdb:8+7');
    expect(factsFor('PDB', 1)).not.toContain('pdb:8+7');
  });
  it.each(['pdb:7+9', 'pdb:0+1', 'pdb:10+11'])('refuse %s', (f) => {
    expect(() => questionForFact('PDB', f, 1, createRng(1))).toThrow();
  });
});

describe('TAD — tables d’addition', () => {
  it('niveau 1 : dans la deuxième dizaine, sans la franchir', () =>
    draw('TAD', 1, (q) => {
      expect(Math.floor(q.display.a / 10)).toBe(1);
      expect(Math.floor(q.answer / 10)).toBe(1);
      expect(q.display.b).toBeLessThanOrEqual(9);
      stepsAreCorrect(q);
    }));
  it('niveau 1 : on calcule les unités, la dizaine reste', () => {
    expect(questionForFact('TAD', 'tad:12+5', 1, createRng(1)).strategy?.steps).toEqual([
      '2 + 5 = 7',
      '10 + 7 = 17',
    ]);
    expect(questionForFact('TAD', 'tad:17-4', 1, createRng(1)).strategy?.steps).toEqual([
      '7 − 4 = 3',
      '10 + 3 = 13',
    ]);
  });
  it('niveau 2 : sommes de 11 à 20, passage de la dizaine', () =>
    draw('TAD', 2, (q) => {
      expect(q.answer).toBeGreaterThanOrEqual(11);
      expect(q.answer).toBeLessThanOrEqual(20);
      stepsAreCorrect(q);
    }));
  it('niveau 3 : soustractions', () =>
    draw('TAD', 3, (q) => {
      expect(q.display.op).toBe('−');
      stepsAreCorrect(q);
    }));
  it('montre le passage par 10', () => {
    expect(questionForFact('TAD', 'tad:8+5', 2, createRng(1)).strategy?.steps).toEqual([
      '8 + 2 = 10',
      '10 + 3 = 13',
    ]);
    expect(questionForFact('TAD', 'tad:13-5', 3, createRng(1)).strategy?.steps).toEqual([
      '13 − 3 = 10',
      '10 − 2 = 8',
    ]);
  });
  it.each(['tad:15+6', 'tad:5-5', 'tad:21-3', 'tad:3*4', 'tad:20+1'])('refuse %s', (f) => {
    expect(() => questionForFact('TAD', f, 1, createRng(1))).toThrow();
  });
});

describe('D10 — dizaines', () => {
  it.each([1, 2] as const)('niveau %i', (level) =>
    draw('D10', level, (q) => {
      expect([10, 20, 30, 40]).toContain(q.display.b);
      if (level === 1) expect(q.display.b).toBe(10);
      expect(q.answer).toBeGreaterThanOrEqual(1);
      expect(q.answer).toBeLessThanOrEqual(99);
      stepsAreCorrect(q);
    }),
  );
  it('saute de 10 en 10', () => {
    expect(questionForFact('D10', 'd10:58-30', 2, createRng(1)).strategy?.steps).toEqual([
      '58 − 10 = 48',
      '48 − 10 = 38',
      '38 − 10 = 28',
    ]);
  });
  it.each(['d10:95+10', 'd10:5-10', 'd10:3+15'])('refuse %s', (f) => {
    expect(() => questionForFact('D10', f, 1, createRng(1))).toThrow();
  });
});

describe('Tables de multiplication', () => {
  it.each([
    ['T2', 2],
    ['T5', 5],
    ['T10', 10],
    ['T3', 3],
    ['T4', 4],
  ] as const)('%s : table de %i, sauts réguliers', (skillId, k) =>
    draw(skillId, 1, (q) => {
      expect(q.display).toMatchObject({ a: k, op: '×' });
      expect(q.strategy?.steps).toHaveLength(q.display.b ?? 0);
      stepsAreCorrect(q);
    }),
  );
  it('refuse un fait d’une autre table', () => {
    expect(() => questionForFact('T2', 'x:3x4', 1, createRng(1))).toThrow();
    expect(() => questionForFact('T2', 'x:2x11', 1, createRng(1))).toThrow();
  });
});
