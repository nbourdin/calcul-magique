import type { Series } from '../types';
import type { MedalId } from './medals';
import { placePiece, startPuzzle, type PuzzleProgress } from './puzzle';
import { EMPTY_STREAK, recordPlayDay, type Streak, type StreakChange } from './streak';
import { DEFAULT_THEME, newlyUnlockedThemes, type ThemeId } from './themes';

export interface RewardState {
  profileId: string;
  stars: number;
  badges: string[];
  streak: Streak;
  /** Puzzle en cours (un seul à la fois), null s'il faut en choisir un. */
  activeCharacterId: string | null;
  theme: ThemeId;
}

export function emptyRewards(profileId: string): RewardState {
  return {
    profileId,
    stars: 0,
    badges: [],
    streak: EMPTY_STREAK,
    activeCharacterId: null,
    theme: DEFAULT_THEME,
  };
}

export interface PieceOutcome {
  characterId: string;
  pieceIndex: number;
  piecesPlaced: number;
  completed: boolean;
}

export interface SeriesRewardOutcome {
  starsGained: number;
  starsTotal: number;
  newThemes: ThemeId[];
  streak: Streak;
  streakChange: StreakChange;
  piece: PieceOutcome | null;
  /** Médailles gagnées par cette série (calculées à l'enregistrement). */
  newMedals: MedalId[];
}

/** Choisit un personnage : démarre son puzzle (ou reprend celui commencé). */
export function chooseCharacter(
  reward: RewardState,
  existing: PuzzleProgress | undefined,
  characterId: string,
  now: number,
): { reward: RewardState; puzzle: PuzzleProgress } {
  return {
    reward: { ...reward, activeCharacterId: characterId },
    puzzle: existing ?? startPuzzle(reward.profileId, characterId, now),
  };
}

/**
 * Récompenses d'une série terminée (PRD §7) : la série donne toujours une pièce de puzzle
 * (s'il y a un puzzle actif), ses étoiles s'ajoutent au total, la flamme du jour s'allume.
 */
export function applySeriesRewards(input: {
  reward: RewardState;
  activePuzzle: PuzzleProgress | null;
  series: Pick<Series, 'stars' | 'bonusStars'>;
  today: string;
  now: number;
}): { reward: RewardState; puzzle: PuzzleProgress | null; outcome: SeriesRewardOutcome } {
  const { reward, activePuzzle, series, today, now } = input;
  const starsGained = series.stars + (series.bonusStars ?? 0);
  const starsTotal = reward.stars + starsGained;
  const { streak, change } = recordPlayDay(reward.streak, today);

  let puzzle: PuzzleProgress | null = null;
  let piece: PieceOutcome | null = null;
  let activeCharacterId = reward.activeCharacterId;
  if (activePuzzle && activePuzzle.characterId === reward.activeCharacterId) {
    const placed = placePiece(activePuzzle, now);
    puzzle = placed.progress;
    piece = {
      characterId: placed.progress.characterId,
      pieceIndex: placed.pieceIndex,
      piecesPlaced: placed.progress.piecesPlaced,
      completed: placed.completed,
    };
    if (placed.completed) activeCharacterId = null;
  }

  return {
    reward: { ...reward, stars: starsTotal, streak, activeCharacterId },
    puzzle,
    outcome: {
      starsGained,
      starsTotal,
      newThemes: newlyUnlockedThemes(reward.stars, starsTotal),
      streak,
      streakChange: change,
      piece,
      newMedals: [],
    },
  };
}
