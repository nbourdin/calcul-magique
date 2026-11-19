import type { Stars } from '../types';

export const TWO_STARS_MIN = 7;
export const THREE_STARS_MIN = 9;

/** 1 étoile pour avoir terminé, 2 dès 7 bonnes réponses du premier coup, 3 dès 9 (PRD §5). */
export function starsForSeries(firstTryCorrect: number): Stars {
  if (firstTryCorrect >= THREE_STARS_MIN) return 3;
  if (firstTryCorrect >= TWO_STARS_MIN) return 2;
  return 1;
}
