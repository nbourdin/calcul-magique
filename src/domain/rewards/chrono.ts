import type { Settings } from '../types';

/** Mode chrono : jamais de limite de temps, seulement une étoile bonus si l'enfant est rapide et juste. */
export const CHRONO_FAST_MEDIAN_MS = 4000;
export const CHRONO_MIN_CORRECT = 7;

function median(values: readonly number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? (sorted[mid] ?? 0) : ((sorted[mid - 1] ?? 0) + (sorted[mid] ?? 0)) / 2;
}

/**
 * @param correctFirstTryMs temps de réponse des bonnes réponses du premier coup
 */
export function chronoBonus(mode: Settings['chronoMode'], correctFirstTryMs: readonly number[]): 0 | 1 {
  if (mode === 'off' || correctFirstTryMs.length < CHRONO_MIN_CORRECT) return 0;
  return median(correctFirstTryMs) <= CHRONO_FAST_MEDIAN_MS ? 1 : 0;
}
