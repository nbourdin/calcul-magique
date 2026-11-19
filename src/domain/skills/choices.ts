import { shuffle, type Rng } from '../rng';

export const CHOICE_COUNT = 3;

/** Inversion des chiffres d'un nombre à deux chiffres (ex. 15 → 51), sinon null. */
export function swapDigits(n: number): number | null {
  if (n < 10 || n > 99) return null;
  const tens = Math.floor(n / 10);
  const units = n % 10;
  return units === tens ? null : units * 10 + tens;
}

/**
 * 3 propositions uniques et positives, dont la bonne, dans un ordre mélangé.
 * Les mauvaises viennent des erreurs typiques fournies (±1, ±10, oubli de correction,
 * inversion des chiffres…) ; à défaut, on complète avec des voisins de la réponse.
 */
export function makeChoices(
  answer: number,
  typicalErrors: readonly (number | null)[],
  rng: Rng,
  bounds: { min?: number; max?: number } = {},
): number[] {
  const min = Math.max(0, bounds.min ?? 0);
  const max = bounds.max ?? Number.MAX_SAFE_INTEGER;
  const ok = (n: number | null): n is number =>
    n !== null && Number.isInteger(n) && n >= min && n <= max && n !== answer;

  const distractors = shuffle(rng, [...new Set(typicalErrors.filter(ok))]).slice(0, CHOICE_COUNT - 1);
  for (let k = 2; distractors.length < CHOICE_COUNT - 1; k++) {
    for (const n of [answer + k, answer - k]) {
      if (ok(n) && !distractors.includes(n) && distractors.length < CHOICE_COUNT - 1) distractors.push(n);
    }
    if (k > 1000) throw new Error(`makeChoices : intervalle trop étroit pour ${answer}`);
  }
  return shuffle(rng, [answer, ...distractors]);
}
