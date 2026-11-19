/** Horloge de l'app (un seul point d'accès, remplaçable dans les tests). */
export function now(): number {
  return Date.now();
}
