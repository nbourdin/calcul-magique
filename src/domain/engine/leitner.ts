import { startOfLocalDayPlus } from '../time';
import type { FactState, LeitnerBox, SkillId } from '../types';

/** Intervalle de révision par boîte, en jours (boîte 0 : même séance). */
export const BOX_INTERVAL_DAYS: Readonly<Record<LeitnerBox, number>> = { 0: 0, 1: 1, 2: 3, 3: 7, 4: 21 };

/** Au-delà, une bonne réponse est « lente » : la boîte ne monte pas. */
export const SLOW_ANSWER_MS = 5000;

export const MASTERED_MIN_BOX = 3;
export const MASTERED_MIN_STREAK = 3;

/** Que faire d'une mauvaise réponse : retour en boîte 0 (défaut) ou recul de 2 boîtes. */
export type WrongAnswerPolicy = 'reset' | 'drop2';

export interface AnswerOutcome {
  correct: boolean;
  /** La réponse vient après l'aide (seconde chance) : ne compte pas comme « du premier coup ». */
  usedHelp: boolean;
  responseMs: number;
}

export function newFactState(profileId: string, factKey: string, skillId: SkillId, now: number): FactState {
  return {
    profileId,
    factKey,
    skillId,
    box: 0,
    dueAt: now,
    seenCount: 0,
    correctFirstTry: 0,
    consecutiveCorrect: 0,
    avgMs: 0,
    introducedAt: now,
  };
}

function toBox(n: number): LeitnerBox {
  return Math.min(4, Math.max(0, n)) as LeitnerBox;
}

export function nextBox(
  box: LeitnerBox,
  outcome: AnswerOutcome,
  policy: WrongAnswerPolicy = 'reset',
): LeitnerBox {
  if (!outcome.correct) return policy === 'reset' ? 0 : toBox(box - 2);
  if (!outcome.usedHelp && outcome.responseMs <= SLOW_ANSWER_MS) return toBox(box + 1);
  return box;
}

/** Date de prochaine révision : maintenant pour la boîte 0, sinon minuit local dans N jours. */
export function dueAtFor(box: LeitnerBox, now: number): number {
  const days = BOX_INTERVAL_DAYS[box];
  return days === 0 ? now : startOfLocalDayPlus(now, days);
}

export function applyAnswer(
  state: FactState,
  outcome: AnswerOutcome,
  now: number,
  policy: WrongAnswerPolicy = 'reset',
): FactState {
  const box = nextBox(state.box, outcome, policy);
  const seenCount = state.seenCount + 1;
  const firstTry = outcome.correct && !outcome.usedHelp;
  let consecutiveCorrect = state.consecutiveCorrect;
  if (!outcome.correct) consecutiveCorrect = 0;
  else if (firstTry) consecutiveCorrect += 1;

  return {
    ...state,
    box,
    dueAt: dueAtFor(box, now),
    seenCount,
    correctFirstTry: state.correctFirstTry + (firstTry ? 1 : 0),
    consecutiveCorrect,
    avgMs: Math.round(state.avgMs + (outcome.responseMs - state.avgMs) / seenCount),
  };
}

export function isDue(state: FactState, now: number): boolean {
  return state.dueAt <= now;
}

/** Maîtrisé : boîte 3 ou plus avec au moins 3 réussites consécutives. */
export function isMastered(state: FactState): boolean {
  return state.box >= MASTERED_MIN_BOX && state.consecutiveCorrect >= MASTERED_MIN_STREAK;
}
