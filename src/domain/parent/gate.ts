import { randInt, type Rng } from '../rng';

export interface ParentChallenge {
  a: number;
  b: number;
  answer: number;
}

/** Question d'accès à l'espace parent : une multiplication des tables de 6 à 9 (PRD §9). */
export function parentChallenge(rng: Rng): ParentChallenge {
  const a = randInt(rng, 6, 9);
  const b = randInt(rng, 6, 9);
  return { a, b, answer: a * b };
}
