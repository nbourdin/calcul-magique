import { columnLayout } from '../column';
import { hiddenValue } from '../display';
import { createRng } from '../rng';
import type { Level, Question, SkillId } from '../types';
import { factsFor, generateQuestion, questionForFact } from './index';

/** Propriétés communes (PRD §8), sur 1 000 tirages à graine fixe. */
function draw(skillId: SkillId, level: Level, check: (q: Question) => void) {
  const rng = createRng(2026 + level);
  for (let i = 0; i < 1000; i++) {
    const q = generateQuestion(skillId, level, rng);
    expect(factsFor(skillId, level)).toContain(q.factKey);
    expect(hiddenValue(q.display)).toBe(q.answer);
    const choices = q.choices ?? [];
    expect(choices).toHaveLength(3);
    expect(new Set(choices).size).toBe(3);
    expect(choices).toContain(q.answer);
    for (const c of choices) expect(c).toBeGreaterThanOrEqual(0);
    stepsAreCorrect(q);
    check(q);
  }
}

/** Chaque étape « x ± y (± z) = r » doit être juste. */
function stepsAreCorrect(q: Question) {
  const steps = q.strategy?.steps ?? [];
  expect(steps.length).toBeGreaterThan(0);
  for (const step of steps) {
    const m = /^(\d+(?: [+−] \d+)+) = (\d+)$/.exec(step);
    expect(m, step).not.toBeNull();
    const tokens = (m?.[1] ?? '').split(' ');
    let total = Number(tokens[0]);
    for (let i = 1; i < tokens.length; i += 2) {
      const n = Number(tokens[i + 1]);
      total = tokens[i] === '+' ? total + n : total - n;
    }
    expect(total, step).toBe(Number(m?.[2]));
  }
}

describe('ADS — plus et moins jusqu’à 10', () => {
  it('niveau 1 : on ajoute ou on enlève 1, 2 ou 3, pas à pas', () =>
    draw('ADS', 1, (q) => {
      expect(q.display.b).toBeLessThanOrEqual(3);
      expect(q.answer).toBeLessThanOrEqual(10);
      expect(q.strategy?.steps).toHaveLength(q.display.b ?? 0);
    }));

  it('niveau 2 : les autres additions jusqu’à 10', () =>
    draw('ADS', 2, (q) => {
      expect(q.display.op).toBe('+');
      expect(q.display.b).toBeGreaterThanOrEqual(4);
      expect(q.answer).toBeLessThanOrEqual(10);
      for (const c of q.choices ?? []) expect(c).toBeLessThanOrEqual(10);
    }));

  it('niveau 3 : les autres soustractions jusqu’à 10', () =>
    draw('ADS', 3, (q) => {
      expect(q.display.op).toBe('−');
      expect(q.display.a).toBeLessThanOrEqual(10);
      expect(q.display.b).toBeGreaterThanOrEqual(4);
    }));

  it('couvre chaque calcul une seule fois, du plus facile au plus dur', () => {
    const all = [1, 2, 3].flatMap((l) => factsFor('ADS', l as Level));
    expect(new Set(all).size).toBe(all.length);
    expect(factsFor('ADS', 1)).toContain('ads:7+3');
    expect(factsFor('ADS', 1)).toContain('ads:10-1');
    expect(factsFor('ADS', 2)).toContain('ads:2+6');
    expect(factsFor('ADS', 3)).toContain('ads:9-6');
  });

  it('montre la stratégie de chaque niveau', () => {
    const steps = (f: string) => questionForFact('ADS', f, 1, createRng(1)).strategy?.steps;
    expect(steps('ads:5+3')).toEqual(['5 + 1 = 6', '6 + 1 = 7', '7 + 1 = 8']);
    expect(steps('ads:8-2')).toEqual(['8 − 1 = 7', '7 − 1 = 6']);
    expect(steps('ads:2+6')).toEqual(['6 + 2 = 8']);
    expect(steps('ads:9-6')).toEqual(['6 + 3 = 9', '9 − 6 = 3']);
  });

  it.each(['ads:0+3', 'ads:8+3', 'ads:3-4', 'ads:11-1', 'ads:4+0', 'ads:x'])('refuse %s', (f) => {
    expect(() => questionForFact('ADS', f, 1, createRng(1))).toThrow();
  });
});

describe('APO — addition posée', () => {
  it('niveau 1 : deux chiffres, sans retenue', () =>
    draw('APO', 1, (q) => {
      const layout = columnLayout(q.display);
      expect(layout?.carries.every((c) => c === 0)).toBe(true);
      expect(q.display.a).toBeGreaterThanOrEqual(10);
      expect(q.answer).toBeLessThanOrEqual(99);
      expect(q.strategy?.visual).toBe('column');
      expect(q.factKey).toBe(`apo:${q.display.a % 10}+${(q.display.b ?? 0) % 10}`);
    }));

  it('niveau 2 : avec une retenue sur les dizaines', () =>
    draw('APO', 2, (q) => {
      const layout = columnLayout(q.display);
      expect(layout?.carries[1]).toBe(1);
      expect(q.answer).toBeLessThanOrEqual(99);
    }));

  it('l’oubli de la retenue fait partie des propositions possibles', () => {
    const rng = createRng(3);
    const seen = new Set<boolean>();
    for (let i = 0; i < 200; i++) {
      const q = questionForFact('APO', 'apo:7+5', 2, rng);
      seen.add((q.choices ?? []).includes(q.answer - 10));
    }
    expect(seen.has(true)).toBe(true);
  });

  it('pose les étapes colonne par colonne', () => {
    const q = questionForFact('APO', 'apo:7+5', 2, createRng(1));
    const [a, b] = [q.display.a, q.display.b ?? 0];
    expect(q.strategy?.steps[0]).toBe('7 + 5 = 12');
    expect(q.strategy?.steps.at(-1)).toBe(`${a} + ${b} = ${a + b}`);
  });

  it.each(['apo:0+0', 'apo:12+3', 'apo:7-5', 'apo:'])('refuse %s', (f) => {
    expect(() => questionForFact('APO', f, 1, createRng(1))).toThrow();
  });
});

describe('SPO — soustraction posée', () => {
  it('niveau 1 : sans emprunt, résultat ≥ 10', () =>
    draw('SPO', 1, (q) => {
      const layout = columnLayout(q.display);
      expect(layout?.borrows.every((b) => !b)).toBe(true);
      expect(q.answer).toBeGreaterThanOrEqual(10);
    }));

  it('niveau 2 : on casse une dizaine, résultat ≥ 10', () =>
    draw('SPO', 2, (q) => {
      const layout = columnLayout(q.display);
      expect(layout?.borrows[0]).toBe(true);
      expect(q.answer).toBeGreaterThanOrEqual(10);
    }));

  it('propose l’erreur classique « le petit ôté du grand »', () => {
    const rng = createRng(5);
    let found = false;
    for (let i = 0; i < 200 && !found; i++) {
      const q = questionForFact('SPO', 'spo:3-7', 2, rng);
      const [at, bt] = [Math.floor(q.display.a / 10), Math.floor((q.display.b ?? 0) / 10)];
      found = (q.choices ?? []).includes((at - bt) * 10 + 4);
    }
    expect(found).toBe(true);
  });

  it.each(['spo:0-0', 'spo:3+7', 'spo:13-7'])('refuse %s', (f) => {
    expect(() => questionForFact('SPO', f, 1, createRng(1))).toThrow();
  });
});
