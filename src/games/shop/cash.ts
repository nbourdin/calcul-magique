import type { Level } from '@/domain/types';

export type Money = 1 | 2 | 5 | 10 | 20;

export interface CashDrawer {
  /** Pièces et billets que l'enfant peut rendre. */
  available: Money[];
  /** Pièce ou billet épuisé dans la caisse (montré barré), ou null. */
  missing: Money | null;
}

/** Petit hachage stable d'une chaîne (identifiant de question) : même question, même caisse. */
export function seedOf(text: string): number {
  let h = 0;
  for (const ch of text) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return h;
}

/**
 * Caisse de la boutique. Au niveau 1, toute la monnaie est là. Ensuite, une question sur deux,
 * une pièce qui servirait à rendre la monnaie manque (ex. plus de 5 € pour rendre 7 €) :
 * il faut trouver une autre décomposition (2 + 2 + 2 + 1). La pièce de 1 € ne manque jamais,
 * donc on peut toujours rendre la monnaie.
 */
export function cashDrawer(note: number, change: number, level: Level, seed: number): CashDrawer {
  const all: Money[] = note > 10 ? [1, 2, 5, 10] : [1, 2, 5];
  const useful = all.filter((c) => c !== 1 && c <= change);
  if (level === 1 || useful.length === 0 || seed % 2 === 1) return { available: all, missing: null };
  const missing = useful[Math.floor(seed / 2) % useful.length] ?? null;
  return { available: all.filter((c) => c !== missing), missing };
}
