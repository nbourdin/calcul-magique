import { shuffle, type Rng } from '../rng';

export const CHOICE_COUNT = 3;

/** Inversion des chiffres d'un nombre à deux chiffres (ex. 15 → 51), sinon null. */
export function swapDigits(n: number): number | null {
  if (n < 10 || n > 99) return null;
  const tens = Math.floor(n / 10);
  const units = n % 10;
  return units === tens ? null : units * 10 + tens;
}

/** Voisins de la réponse ajoutés aux erreurs typiques pour compléter les propositions. */
const NEIGHBOR_REACH = 5;

/**
 * 3 propositions uniques et positives, dont la bonne, dans un ordre mélangé.
 * Les mauvaises viennent d'abord des erreurs typiques fournies (±1, ±10, oubli de correction,
 * inversion des chiffres…), complétées par des voisins de la réponse.
 *
 * Pour qu'on ne puisse pas deviner sans calculer :
 * - la bonne réponse est la plus petite, celle du milieu ou la plus grande, au hasard ;
 * - jamais trois nombres qui se suivent (6, 7, 8), sauf si les bornes l'imposent.
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

  const typical = [...new Set(typicalErrors.filter(ok))];
  const pool = [...typical];
  for (let k = 1; k <= NEIGHBOR_REACH || pool.length < CHOICE_COUNT - 1; k++) {
    for (const n of [answer + k, answer - k]) if (ok(n) && !pool.includes(n)) pool.push(n);
    if (k > 1000) throw new Error(`makeChoices : intervalle trop étroit pour ${answer}`);
  }

  const pairs: [number, number][] = pool.flatMap((x, i) =>
    pool.slice(i + 1).map((y) => [x, y] as [number, number]),
  );
  const isRun = ([x, y]: [number, number]) => {
    const [a, b, c] = [answer, x, y].sort((u, v) => u - v) as [number, number, number];
    return b === a + 1 && c === b + 1;
  };
  const allowed = pairs.some((p) => !isRun(p)) ? pairs.filter((p) => !isRun(p)) : pairs;
  // Rang de la bonne réponse parmi les trois : 0 = la plus petite, 2 = la plus grande.
  const rank = ([x, y]: [number, number]) => (x < answer ? 1 : 0) + (y < answer ? 1 : 0);
  const ranks = [...new Set(allowed.map(rank))];
  const wanted = ranks[Math.floor(rng() * ranks.length)];
  const inRank = allowed.filter((p) => rank(p) === wanted);
  const typicalCount = (p: [number, number]) => p.filter((v) => typical.includes(v)).length;
  const best = Math.max(...inRank.map(typicalCount));
  const top = inRank.filter((p) => typicalCount(p) === best);
  const pair = top[Math.floor(rng() * top.length)] as [number, number];
  return shuffle(rng, [answer, ...pair]);
}
