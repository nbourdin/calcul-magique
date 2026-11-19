import type { FactState, LeitnerBox } from '../types';
import {
  applyAnswer,
  BOX_INTERVAL_DAYS,
  dueAtFor,
  isDue,
  isMastered,
  newFactState,
  nextBox,
  SLOW_ANSWER_MS,
  type AnswerOutcome,
} from './leitner';

const NOW = new Date(2026, 10, 19, 17, 45).getTime();
const fast: AnswerOutcome = { correct: true, usedHelp: false, responseMs: 2000 };
const slow: AnswerOutcome = { correct: true, usedHelp: false, responseMs: SLOW_ANSWER_MS + 1 };
const helped: AnswerOutcome = { correct: true, usedHelp: true, responseMs: 1500 };
const wrong: AnswerOutcome = { correct: false, usedHelp: false, responseMs: 3000 };

const state = (patch: Partial<FactState> = {}): FactState => ({
  ...newFactState('p1', 'p9:6', 'P9', NOW),
  ...patch,
});

describe('nextBox', () => {
  it.each([0, 1, 2, 3] as const)('bonne réponse rapide : boîte %i → +1', (box) => {
    expect(nextBox(box, fast)).toBe(box + 1);
  });

  it('plafonne à la boîte 4', () => {
    expect(nextBox(4, fast)).toBe(4);
  });

  it('5 secondes pile compte encore comme rapide', () => {
    expect(nextBox(1, { ...fast, responseMs: SLOW_ANSWER_MS })).toBe(2);
  });

  it.each([0, 2, 4] as const)('bonne réponse lente ou après aide : boîte %i inchangée', (box) => {
    expect(nextBox(box, slow)).toBe(box);
    expect(nextBox(box, helped)).toBe(box);
  });

  it.each([0, 1, 3, 4] as const)('mauvaise réponse : boîte %i → 0 par défaut', (box) => {
    expect(nextBox(box, wrong)).toBe(0);
  });

  it.each([
    [4, 2],
    [3, 1],
    [1, 0],
    [0, 0],
  ] as const)('mauvaise réponse en mode « −2 » : %i → %i', (from, to) => {
    expect(nextBox(from, wrong, 'drop2')).toBe(to);
  });
});

describe('intervalles', () => {
  it('correspondent au PRD', () => {
    expect(BOX_INTERVAL_DAYS).toEqual({ 0: 0, 1: 1, 2: 3, 3: 7, 4: 21 });
  });

  it('boîte 0 : à revoir dans la même séance', () => {
    expect(dueAtFor(0, NOW)).toBe(NOW);
  });

  it.each([
    [1, 20],
    [2, 22],
    [3, 26],
  ] as const)('boîte %i : dû le %i novembre à minuit', (box, day) => {
    expect(dueAtFor(box as LeitnerBox, NOW)).toBe(new Date(2026, 10, day).getTime());
  });

  it('boîte 4 : dû 21 jours plus tard', () => {
    expect(dueAtFor(4, NOW)).toBe(new Date(2026, 11, 10).getTime());
  });
});

describe('applyAnswer', () => {
  it('met à jour boîte, échéance et compteurs', () => {
    const s = applyAnswer(state(), fast, NOW);
    expect(s).toMatchObject({ box: 1, seenCount: 1, correctFirstTry: 1, consecutiveCorrect: 1, avgMs: 2000 });
    expect(s.dueAt).toBe(new Date(2026, 10, 20).getTime());
  });

  it('calcule le temps moyen sur toutes les tentatives', () => {
    const s = applyAnswer(applyAnswer(state(), fast, NOW), { ...wrong, responseMs: 4000 }, NOW);
    expect(s.avgMs).toBe(3000);
  });

  it('une erreur remet la série de réussites à zéro', () => {
    const s = applyAnswer(state({ box: 3, consecutiveCorrect: 4 }), wrong, NOW);
    expect(s).toMatchObject({ box: 0, consecutiveCorrect: 0, correctFirstTry: 0, dueAt: NOW });
  });

  it('une réussite après aide ne compte pas comme du premier coup', () => {
    const s = applyAnswer(state({ box: 2, consecutiveCorrect: 1 }), helped, NOW);
    expect(s).toMatchObject({ box: 2, consecutiveCorrect: 1, correctFirstTry: 0 });
  });

  it('une réussite lente compte dans la série mais ne fait pas monter', () => {
    const s = applyAnswer(state({ box: 2, consecutiveCorrect: 1 }), slow, NOW);
    expect(s).toMatchObject({ box: 2, consecutiveCorrect: 2, correctFirstTry: 1 });
  });

  it('revu avant son échéance, un fait ne monte pas (mais une erreur le fait redescendre)', () => {
    const early = state({ box: 2, dueAt: NOW + 1000, consecutiveCorrect: 1 });
    expect(applyAnswer(early, fast, NOW)).toMatchObject({
      box: 2,
      consecutiveCorrect: 2,
      dueAt: dueAtFor(2, NOW),
    });
    expect(applyAnswer(early, wrong, NOW).box).toBe(0);
  });

  it('il faut des jours différents pour atteindre la boîte 3', () => {
    let s = state();
    s = applyAnswer(s, fast, NOW); // boîte 1, dû demain
    s = applyAnswer(s, fast, NOW + 60_000); // même séance : reste en boîte 1
    expect(s.box).toBe(1);
    s = applyAnswer(s, fast, s.dueAt); // le lendemain : boîte 2
    s = applyAnswer(s, fast, s.dueAt); // 3 jours plus tard : boîte 3
    expect(s.box).toBe(3);
    expect(isMastered(s)).toBe(true);
  });

  it('applique la politique « −2 »', () => {
    expect(applyAnswer(state({ box: 4 }), wrong, NOW, 'drop2').box).toBe(2);
  });

  it('ne modifie pas l’état d’origine', () => {
    const original = state();
    applyAnswer(original, fast, NOW);
    expect(original.box).toBe(0);
  });
});

describe('isDue et isMastered', () => {
  it('un fait est dû quand son échéance est passée', () => {
    expect(isDue(state({ dueAt: NOW }), NOW)).toBe(true);
    expect(isDue(state({ dueAt: NOW + 1 }), NOW)).toBe(false);
  });

  it('maîtrisé = boîte ≥ 3 et au moins 3 réussites consécutives', () => {
    expect(isMastered(state({ box: 3, consecutiveCorrect: 3 }))).toBe(true);
    expect(isMastered(state({ box: 4, consecutiveCorrect: 5 }))).toBe(true);
    expect(isMastered(state({ box: 2, consecutiveCorrect: 5 }))).toBe(false);
    expect(isMastered(state({ box: 4, consecutiveCorrect: 2 }))).toBe(false);
  });

  it('3 réponses rapides, chacune à échéance, mènent à la boîte 3 maîtrisée', () => {
    let s = state();
    for (let i = 0; i < 3; i++) s = applyAnswer(s, fast, Math.max(NOW, s.dueAt));
    expect(isMastered(s)).toBe(true);
  });
});
