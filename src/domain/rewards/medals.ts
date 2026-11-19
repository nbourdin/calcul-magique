import type { FactState, Series } from '../types';
import type { Streak, StreakChange } from './streak';

/**
 * Les 8 médailles du MVP (PRD §7). Elles se gagnent en jouant, ne se perdent jamais
 * et ne sont jamais présentées comme une obligation (pas de liste « à faire »).
 */
export const MEDALS = [
  'firstSeries',
  'streak3',
  'master10',
  'frogJumper',
  'perfectRace',
  'album3',
  'daily100',
  'comeback',
] as const;

export type MedalId = (typeof MEDALS)[number];

export const MEDAL_THRESHOLDS = {
  streakDays: 3,
  /** « Maître du 10 » : tous les faits C10 en boîte 4. */
  master10Box: 4,
  frogAnswers: 50,
  albumCharacters: 3,
  /** « 100 questions du jour » : 100 questions jouées en défis du jour. */
  dailyQuestions: 100,
} as const;

/** C10 : les compléments de 0 à 10. */
const C10_FACTS = Array.from({ length: 11 }, (_, n) => `c10:${n}`);

export interface MedalContext {
  /** La série qui vient de se terminer. */
  series: Pick<Series, 'gameId' | 'firstTryCorrect' | 'questionCount'>;
  /** Séries terminées, celle-ci comprise. */
  seriesCount: number;
  streak: Streak;
  streakChange: StreakChange;
  /** États Leitner du profil (après la série). */
  facts: readonly FactState[];
  /** Réponses données au Saut de la grenouille, toutes séries confondues. */
  frogAnswers: number;
  /** Personnages entrés dans l'album. */
  completedPuzzles: number;
  /** Questions jouées en défis du jour, celle-ci comprise. */
  dailyQuestions: number;
}

const rules: Record<MedalId, (c: MedalContext) => boolean> = {
  firstSeries: (c) => c.seriesCount >= 1,
  streak3: (c) => c.streak.count >= MEDAL_THRESHOLDS.streakDays,
  master10: (c) => {
    const boxes = new Map(c.facts.map((s) => [s.factKey, s.box]));
    return C10_FACTS.every((k) => (boxes.get(k) ?? 0) >= MEDAL_THRESHOLDS.master10Box);
  },
  frogJumper: (c) => c.frogAnswers >= MEDAL_THRESHOLDS.frogAnswers,
  perfectRace: (c) =>
    c.series.gameId === 'race' &&
    c.series.questionCount > 0 &&
    c.series.firstTryCorrect === c.series.questionCount,
  album3: (c) => c.completedPuzzles >= MEDAL_THRESHOLDS.albumCharacters,
  daily100: (c) => c.dailyQuestions >= MEDAL_THRESHOLDS.dailyQuestions,
  comeback: (c) => c.streakChange === 'woke',
};

/** Médailles gagnées par cette série, dans l'ordre du catalogue (celles déjà obtenues exclues). */
export function newMedals(owned: readonly string[], context: MedalContext): MedalId[] {
  return MEDALS.filter((id) => !owned.includes(id) && rules[id](context));
}

export function isMedalId(id: string): id is MedalId {
  return (MEDALS as readonly string[]).includes(id);
}
