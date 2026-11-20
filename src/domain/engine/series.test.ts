import { createRng, range } from '../rng';
import { factsFor } from '../skills';
import type { FactState, LeitnerBox, Question, SkillId } from '../types';
import { newFactState } from './leitner';
import {
  canPlayDaily,
  composeDailySeries,
  composeSeries,
  orderWithoutAdjacentRepeats,
  SERIES_SIZE,
  spreadAnswerPositions,
  type ComposeSeriesInput,
} from './series';

const NOW = new Date(2026, 10, 19, 17, 0).getTime();
const DAY = 86_400_000;

function fact(factKey: string, skillId: SkillId, box: LeitnerBox, dueAt: number, streak = 0): FactState {
  return {
    ...newFactState('p1', factKey, skillId, NOW),
    box,
    dueAt,
    seenCount: 4,
    consecutiveCorrect: streak,
  };
}

function compose(patch: Partial<ComposeSeriesInput> = {}) {
  return composeSeries({
    skillId: 'P9',
    level: 2,
    states: [],
    now: NOW,
    newFactsIntroducedToday: 0,
    rng: createRng(1),
    ...patch,
  });
}

/** Invariants de toute série (PRD §8). */
function checkInvariants(questions: Question[]) {
  expect(questions.length).toBeLessThanOrEqual(SERIES_SIZE);
  const counts = new Map<string, number>();
  questions.forEach((q, i) => {
    counts.set(q.factKey, (counts.get(q.factKey) ?? 0) + 1);
    if (i > 0) expect(q.factKey).not.toBe(questions[i - 1]?.factKey);
  });
  for (const n of counts.values()) expect(n).toBeLessThanOrEqual(2);
  expect(new Set(questions.map((q) => q.id)).size).toBe(questions.length);
  const positions = questions.map((q) => q.choices?.indexOf(q.answer));
  for (let i = 2; i < positions.length; i++) {
    expect(positions[i] === positions[i - 1] && positions[i] === positions[i - 2]).toBe(false);
  }
  for (const q of questions) expect(q.choices).toContain(q.answer);
}

// P9 niveau 2 : faits p9:10 … p9:89.
const dueLow = range(10, 14).map((n) => fact(`p9:${n}`, 'P9', 0, NOW - DAY));
const dueHigh = range(15, 17).map((n) => fact(`p9:${n}`, 'P9', 2, NOW - DAY));
const learning = range(20, 25).map((n) => fact(`p9:${n}`, 'P9', 1, NOW + DAY));
const mastered = range(30, 34).map((n) => fact(`p9:${n}`, 'P9', 4, NOW + 10 * DAY, 5));
const richStates = [...dueHigh, ...learning, ...mastered, ...dueLow];

const keys = (list: FactState[]) => new Set(list.map((s) => s.factKey));
const countIn = (questions: Question[], set: Set<string>) =>
  questions.filter((q) => set.has(q.factKey)).length;

describe('composeSeries — quotas', () => {
  it('5 révisions (boîtes basses d’abord), 3 en cours, 2 nouveaux', () => {
    const { questions, newFactKeys } = compose({ states: richStates });
    expect(questions).toHaveLength(10);
    expect(countIn(questions, keys(dueLow))).toBe(5);
    expect(countIn(questions, keys(dueHigh))).toBe(0);
    expect(countIn(questions, keys(learning))).toBe(3);
    expect(newFactKeys).toHaveLength(2);
    expect(countIn(questions, new Set(newFactKeys))).toBe(2);
    checkInvariants(questions);
  });

  it.each([
    [0, 2],
    [1, 2],
    [2, 1],
    [3, 0],
    [5, 0],
  ])('avec %i nouveaux déjà vus aujourd’hui : %i nouveaux', (today, expected) => {
    const { newFactKeys, questions } = compose({ states: richStates, newFactsIntroducedToday: today });
    expect(newFactKeys).toHaveLength(expected);
    expect(questions).toHaveLength(10);
  });

  it('moins de 4 faits échus : complète avec la compétence choisie', () => {
    const states = [...dueLow.slice(0, 2), ...learning, ...mastered];
    const { questions, newFactKeys } = compose({ states });
    expect(questions).toHaveLength(10);
    expect(countIn(questions, keys(dueLow.slice(0, 2)))).toBe(2);
    expect(newFactKeys).toHaveLength(2);
    expect(questions.every((q) => q.skillId === 'P9')).toBe(true);
    checkInvariants(questions);
  });

  it('les faits maîtrisés ne servent qu’en complément', () => {
    const { questions } = compose({ states: [...learning, ...mastered], newFactsIntroducedToday: 3 });
    expect(countIn(questions, keys(learning))).toBe(6);
    expect(countIn(questions, keys(mastered))).toBe(4);
  });

  it('toute première série : 10 questions, nouveaux faits signalés', () => {
    const { questions, newFactKeys } = compose({ skillId: 'C10', level: 1 });
    expect(questions).toHaveLength(10);
    expect(new Set(newFactKeys).size).toBe(newFactKeys.length);
    expect(new Set(questions.map((q) => q.factKey))).toEqual(new Set(newFactKeys));
    checkInvariants(questions);
  });

  it('compétence à peu de faits : répète sans dépasser 2 fois', () => {
    // CDS n'a que 9 faits ; tous connus et maîtrisés, aucun nouveau possible.
    const states = factsFor('CDS', 1).map((k) => fact(k, 'CDS', 4, NOW + DAY, 5));
    const { questions, newFactKeys } = compose({ skillId: 'CDS', level: 1, states });
    expect(questions).toHaveLength(10);
    expect(newFactKeys).toHaveLength(0);
    checkInvariants(questions);
  });

  it('révise d’autres compétences au niveau indiqué', () => {
    const otherDue = range(10, 14).map((n) => fact(`m9:${n}`, 'M9', 0, NOW - DAY));
    const { questions } = compose({
      skillId: 'C10',
      level: 1,
      states: otherDue,
      reviewSkills: ['C10', 'M9'],
      levels: { M9: 1 },
    });
    const m9 = questions.filter((q) => q.skillId === 'M9');
    expect(m9).toHaveLength(5);
    expect(m9.every((q) => q.level === 1)).toBe(true);
  });

  it('ignore les faits échus des autres compétences par défaut', () => {
    const otherDue = range(10, 14).map((n) => fact(`m9:${n}`, 'M9', 0, NOW - DAY));
    const { questions } = compose({ skillId: 'C10', level: 1, states: otherDue });
    expect(questions.every((q) => q.skillId === 'C10')).toBe(true);
  });

  it('ignore les faits jamais vus et les compétences non implémentées', () => {
    const states = [
      { ...fact('p9:10', 'P9', 0, NOW - DAY), seenCount: 0 },
      fact('zz:1', 'XYZ' as SkillId, 0, NOW - DAY),
    ];
    const { questions } = compose({ states, reviewSkills: ['P9', 'XYZ' as SkillId] });
    expect(questions.some((q) => q.skillId === ('XYZ' as SkillId))).toBe(false);
  });

  it('refuse une compétence non implémentée', () => {
    expect(() => compose({ skillId: 'XYZ' as SkillId })).toThrow();
  });

  it('est reproductible à graine égale', () => {
    expect(compose({ states: richStates, rng: createRng(7) })).toEqual(
      compose({ states: richStates, rng: createRng(7) }),
    );
  });
});

describe('composeSeries — invariants sur 300 tirages', () => {
  it('jamais plus de 10, 2 fois max, jamais deux fois d’affilée, positions variées', () => {
    for (let seed = 0; seed < 300; seed++) {
      const rng = createRng(seed);
      const skillId = (['C10', 'C20', 'CDS', 'P9', 'M9'] as const)[seed % 5] as SkillId;
      const facts = factsFor(skillId, 1);
      const states = facts
        .filter(() => rng() < 0.6)
        .map((k) => fact(k, skillId, Math.floor(rng() * 5) as LeitnerBox, NOW + (rng() - 0.5) * 10 * DAY));
      const { questions } = composeSeries({
        skillId,
        level: 1,
        states,
        now: NOW,
        newFactsIntroducedToday: seed % 4,
        rng,
      });
      expect(questions.length).toBe(10);
      checkInvariants(questions);
    }
  });
});

describe('orderWithoutAdjacentRepeats', () => {
  it('accepte la répétition quand elle est inévitable', () => {
    const items = [{ factKey: 'a' }, { factKey: 'a' }];
    expect(orderWithoutAdjacentRepeats(items, createRng(1))).toHaveLength(2);
  });

  it('intercale les doublons', () => {
    const items = ['a', 'a', 'b', 'b', 'c'].map((factKey) => ({ factKey }));
    for (let seed = 0; seed < 50; seed++) {
      const out = orderWithoutAdjacentRepeats(items, createRng(seed)).map((i) => i.factKey);
      for (let i = 1; i < out.length; i++) expect(out[i]).not.toBe(out[i - 1]);
    }
  });
});

describe('spreadAnswerPositions', () => {
  const q = (i: number, choices?: number[]): Question => ({
    id: String(i),
    skillId: 'C10',
    factKey: `c10:${i}`,
    level: 1,
    display: { a: i, op: '+', b: 10 - i, missing: 'b' },
    answer: 10 - i,
    ...(choices ? { choices } : {}),
  });

  it('déplace la bonne réponse après 2 fois à la même place', () => {
    const questions = range(1, 8).map((i) => q(i, [10 - i, 20, 30]));
    const positions = spreadAnswerPositions(questions, createRng(3)).map((x) => x.choices?.indexOf(x.answer));
    for (let i = 2; i < positions.length; i++) {
      expect(positions[i] === positions[i - 1] && positions[i] === positions[i - 2]).toBe(false);
    }
  });

  it('laisse passer les questions sans propositions', () => {
    expect(spreadAnswerPositions([q(1)], createRng(1))[0]?.choices).toBeUndefined();
  });
});

describe('défi du jour', () => {
  const NOW_D = 1_000_000_000;
  const known = (skillId: SkillId, factKey: string, box: LeitnerBox, dueAt: number): FactState => ({
    ...newFactState('p1', factKey, skillId, 0),
    box,
    dueAt,
    seenCount: 2,
  });

  it('demande quelques faits déjà rencontrés', () => {
    const four = ['c10:1', 'c10:2', 'c10:3', 'c10:4'].map((k) => known('C10', k, 1, NOW_D));
    expect(canPlayDaily(four)).toBe(false);
    expect(canPlayDaily([...four, known('ADS', 'ads:5+3', 1, NOW_D)])).toBe(true);
    expect(canPlayDaily([{ ...known('C10', 'c10:5', 0, 0), seenCount: 0 }, ...four])).toBe(false);
  });

  it('10 questions mixtes, les faits échus d’abord, jamais de fait nouveau', () => {
    const due = [
      known('C10', 'c10:3', 1, NOW_D - 10),
      known('ADS', 'ads:5+3', 0, NOW_D - 10),
      known('P9', 'p9:6', 2, NOW_D - 10),
    ];
    const later = range(0, 9).map((n) => known('C20', `c20:${n}`, 3, NOW_D + 1e9));
    const questions = composeDailySeries({ states: [...later, ...due], now: NOW_D, rng: createRng(4) });
    expect(questions).toHaveLength(SERIES_SIZE);
    const keys = questions.map((q) => q.factKey);
    for (const d of due) expect(keys).toContain(d.factKey);
    expect(new Set(questions.map((q) => q.skillId)).size).toBeGreaterThanOrEqual(3);
    for (const k of keys) expect([...due, ...later].map((s) => s.factKey)).toContain(k);
  });

  it('peu de faits connus : chacun revient au plus 2 fois, jamais d’affilée', () => {
    const five = range(1, 5).map((n) => known('C10', `c10:${n}`, 1, NOW_D));
    const keys = composeDailySeries({ states: five, now: NOW_D, rng: createRng(9) }).map((q) => q.factKey);
    expect(keys).toHaveLength(10);
    for (const k of new Set(keys)) expect(keys.filter((x) => x === k)).toHaveLength(2);
    for (let i = 1; i < keys.length; i++) expect(keys[i]).not.toBe(keys[i - 1]);
  });

  it('présente chaque compétence à son niveau', () => {
    const states = range(1, 5).map((n) => known('C10', `c10:${n}`, 1, NOW_D));
    const questions = composeDailySeries({ states, now: NOW_D, rng: createRng(1), levels: { C10: 3 } });
    expect(questions.every((q) => q.level === 3 && q.display.missing === 'a')).toBe(true);
  });
});
