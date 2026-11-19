/** Générateur pseudo-aléatoire injectable : renvoie un nombre dans [0, 1). */
export type Rng = () => number;

/** mulberry32 : rapide, reproductible à partir d'une graine. */
export function createRng(seed: number): Rng {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Entier dans [min, max], bornes incluses. */
export function randInt(rng: Rng, min: number, max: number): number {
  return min + Math.floor(rng() * (max - min + 1));
}

export function pick<T>(rng: Rng, items: readonly T[]): T {
  if (items.length === 0) throw new Error('pick : liste vide');
  return items[Math.floor(rng() * items.length)] as T;
}

/** Mélange de Fisher-Yates ; ne modifie pas la liste d'origine. */
export function shuffle<T>(rng: Rng, items: readonly T[]): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j] as T, out[i] as T];
  }
  return out;
}

/** Entiers de min à max, bornes incluses. */
export function range(min: number, max: number): number[] {
  return Array.from({ length: Math.max(0, max - min + 1) }, (_, i) => min + i);
}
