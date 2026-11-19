import { newMedals, type MedalContext } from '@/domain/rewards/medals';
import { nextCharacterChoices, type PuzzleProgress } from '@/domain/rewards/puzzle';
import {
  applySeriesRewards,
  chooseCharacter,
  emptyRewards,
  type RewardState,
  type SeriesRewardOutcome,
} from '@/domain/rewards/seriesRewards';
import { isThemeUnlocked, type ThemeId } from '@/domain/rewards/themes';
import { minutesOnDay } from '@/domain/parent/dashboard';
import { dayKey, startOfLocalDayPlus } from '@/domain/time';
import type { Series } from '@/domain/types';
import { db } from './db';

export async function getRewards(profileId: string): Promise<RewardState> {
  return (await db.rewards.get(profileId)) ?? emptyRewards(profileId);
}

export function listPuzzles(profileId: string): Promise<PuzzleProgress[]> {
  return db.puzzles.where('profileId').equals(profileId).toArray();
}

export async function getActivePuzzle(profileId: string): Promise<PuzzleProgress | null> {
  const { activeCharacterId } = await getRewards(profileId);
  return activeCharacterId ? ((await db.puzzles.get([profileId, activeCharacterId])) ?? null) : null;
}

/** Choix du prochain personnage par l'enfant (parmi les 3 proposés). */
export async function chooseNextCharacter(
  profileId: string,
  characterId: string,
  now: number,
): Promise<void> {
  await db.transaction('rw', db.rewards, db.puzzles, async () => {
    const chosen = chooseCharacter(
      await getRewards(profileId),
      await db.puzzles.get([profileId, characterId]),
      characterId,
      now,
    );
    await db.rewards.put(chosen.reward);
    await db.puzzles.put(chosen.puzzle);
  });
}

export async function setTheme(profileId: string, theme: ThemeId): Promise<void> {
  await db.transaction('rw', db.rewards, async () => {
    const reward = await getRewards(profileId);
    if (!isThemeUnlocked(theme, reward.stars)) throw new Error(`Fond verrouillé : ${theme}`);
    await db.rewards.put({ ...reward, theme });
  });
}

/** Le défi du jour a déjà été relevé aujourd'hui (une fois par jour, PRD §5). */
export async function dailyDoneToday(profileId: string, now: number): Promise<boolean> {
  const today = await db.series
    .where('[profileId+endedAt]')
    .between([profileId, startOfLocalDayPlus(now, 0)], [profileId, Infinity])
    .toArray();
  return today.some((s) => s.mode === 'daily');
}

export async function countSeriesToday(profileId: string, now: number): Promise<number> {
  return db.series
    .where('[profileId+endedAt]')
    .between([profileId, startOfLocalDayPlus(now, 0)], [profileId, Infinity])
    .count();
}

/** Ce qu'il faut savoir du profil pour attribuer les médailles (dans la transaction de fin de série). */
async function medalContext(series: Series, outcome: SeriesRewardOutcome): Promise<MedalContext> {
  const { profileId } = series;
  const [allSeries, facts, frogAnswers, puzzles] = await Promise.all([
    db.series.where('profileId').equals(profileId).toArray(),
    db.factStates.where('profileId').equals(profileId).toArray(),
    db.attempts
      .where('profileId')
      .equals(profileId)
      .filter((a) => a.gameId === 'frog')
      .count(),
    db.puzzles.where('profileId').equals(profileId).toArray(),
  ]);
  return {
    series,
    seriesCount: allSeries.length,
    streak: outcome.streak,
    streakChange: outcome.streakChange,
    facts,
    frogAnswers,
    completedPuzzles: puzzles.filter((p) => p.completedAt !== undefined).length,
    dailyQuestions: allSeries.filter((s) => s.mode === 'daily').reduce((n, s) => n + s.questionCount, 0),
  };
}

export interface FinishedSeries {
  outcome: SeriesRewardOutcome;
  /** Séries terminées aujourd'hui, celle-ci comprise (message « à demain »). */
  seriesToday: number;
  /** Minutes jouées aujourd'hui, celle-ci comprise (durée recommandée par le parent). */
  minutesToday: number;
}

/**
 * Enregistre une série terminée et ses récompenses en une seule transaction.
 * S'il n'y a pas de puzzle actif (ancien profil), le premier personnage proposé est
 * choisi d'office pour que la série donne bien sa pièce.
 */
export async function finishSeries(
  series: Series,
  catalogIds: readonly string[],
  now: number,
): Promise<FinishedSeries> {
  const { profileId } = series;
  return db.transaction('rw', [db.series, db.rewards, db.puzzles, db.attempts, db.factStates], async () => {
    await db.series.put(series);
    let reward = await getRewards(profileId);
    let activePuzzle = reward.activeCharacterId
      ? ((await db.puzzles.get([profileId, reward.activeCharacterId])) ?? null)
      : null;
    if (!activePuzzle) {
      const [first] = nextCharacterChoices(catalogIds, await listPuzzles(profileId));
      if (first) {
        const chosen = chooseCharacter(reward, await db.puzzles.get([profileId, first]), first, now);
        reward = chosen.reward;
        activePuzzle = chosen.puzzle;
      }
    }
    const applied = applySeriesRewards({ reward, activePuzzle, series, today: dayKey(now), now });
    if (applied.puzzle) await db.puzzles.put(applied.puzzle);
    const medals = newMedals(applied.reward.badges, await medalContext(series, applied.outcome));
    await db.rewards.put({ ...applied.reward, badges: [...applied.reward.badges, ...medals] });
    const today = await db.series
      .where('[profileId+endedAt]')
      .between([profileId, startOfLocalDayPlus(now, 0)], [profileId, Infinity])
      .toArray();
    return {
      outcome: { ...applied.outcome, newMedals: medals },
      seriesToday: today.length,
      minutesToday: minutesOnDay(today, dayKey(now)),
    };
  });
}
