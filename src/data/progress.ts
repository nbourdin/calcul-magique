import { applyAnswer, newFactState } from '@/domain/engine/leitner';
import { startOfLocalDayPlus } from '@/domain/time';
import type { Attempt, FactState, GameId, Level, Question, Series, SkillId } from '@/domain/types';
import { db, newId } from './db';

export function listFactStates(profileId: string): Promise<FactState[]> {
  return db.factStates.where('profileId').equals(profileId).toArray();
}

/** Faits introduits depuis minuit local (limite de 3 nouveaux faits par jour). */
export async function countNewFactsToday(profileId: string, now: number): Promise<number> {
  const midnight = startOfLocalDayPlus(now, 0);
  return db.factStates
    .where('profileId')
    .equals(profileId)
    .filter((s) => s.introducedAt >= midnight)
    .count();
}

export interface RecordAnswerInput {
  profileId: string;
  seriesId: string;
  gameId: GameId;
  question: Question;
  /** 2 = seconde chance, après l'aide. */
  attempt: 1 | 2;
  correct: boolean;
  responseMs: number;
  now: number;
}

/**
 * Enregistre immédiatement la tentative et met à jour l'état Leitner du fait,
 * dans une même transaction : une série interrompue conserve ses tentatives.
 */
export async function recordAnswer(
  input: RecordAnswerInput,
): Promise<{ attempt: Attempt; state: FactState }> {
  const { profileId, question, now } = input;
  const usedHelp = input.attempt === 2;
  const attempt: Attempt = {
    id: newId(),
    profileId,
    factKey: question.factKey,
    skillId: question.skillId,
    gameId: input.gameId,
    correctFirstTry: input.correct && !usedHelp,
    responseMs: Math.round(input.responseMs),
    usedHelp,
    ts: now,
    seriesId: input.seriesId,
  };
  return db.transaction('rw', db.attempts, db.factStates, async () => {
    const previous =
      (await db.factStates.get([profileId, question.factKey])) ??
      newFactState(profileId, question.factKey, question.skillId, now);
    const state = applyAnswer(
      previous,
      { correct: input.correct, usedHelp, responseMs: attempt.responseMs },
      now,
    );
    await db.attempts.add(attempt);
    await db.factStates.put(state);
    return { attempt, state };
  });
}

export function listAttemptsOfSeries(seriesId: string): Promise<Attempt[]> {
  return db.attempts.where('seriesId').equals(seriesId).sortBy('ts');
}

export async function saveSeries(series: Series): Promise<void> {
  await db.series.put(series);
}

/** Séries d'une compétence jouées à un niveau depuis une date, de la plus ancienne à la plus récente. */
export async function listLevelSeries(
  profileId: string,
  skillId: SkillId,
  level: Level,
  since: number,
): Promise<Series[]> {
  const all = await db.series
    .where('[profileId+endedAt]')
    .between([profileId, since], [profileId, Infinity], false, true)
    .toArray();
  return all.filter((s) => s.skillId === skillId && s.level === level);
}

export function listRecentSeries(profileId: string, limit = 10): Promise<Series[]> {
  return db.series
    .where('[profileId+endedAt]')
    .between([profileId, -Infinity], [profileId, Infinity])
    .reverse()
    .limit(limit)
    .toArray();
}
