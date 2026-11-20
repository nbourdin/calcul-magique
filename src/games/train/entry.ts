import type { ColumnLayout } from '@/domain/column';

/**
 * Saisie d'un calcul posé, comme sur le cahier : on remplit le résultat de droite à gauche
 * (unités d'abord). Avant une colonne, il peut falloir envoyer la retenue (addition)
 * ou casser une dizaine de la colonne voisine (soustraction).
 */
export interface Entry {
  /** Chiffres saisis du résultat, unités d'abord (null = case vide). */
  digits: (number | null)[];
  /** Retenue posée en haut de la colonne k. */
  carriesSent: boolean[];
  /** La colonne k a reçu dix unités de sa voisine de gauche. */
  tensBroken: boolean[];
}

export type Pending = { kind: 'carry' | 'borrow'; column: number } | null;

export function emptyEntry(layout: ColumnLayout): Entry {
  return {
    digits: layout.result.map(() => null),
    carriesSent: Array.from({ length: layout.width }, () => false),
    tensBroken: Array.from({ length: layout.width }, () => false),
  };
}

/** Case à remplir : la première vide en partant des unités, null si tout est rempli. */
export function activeCell(entry: Entry): number | null {
  const k = entry.digits.indexOf(null);
  return k === -1 ? null : k;
}

/** Geste à faire avant de remplir la case active (retenue ou dizaine à casser). */
export function pendingAction(layout: ColumnLayout, entry: Entry): Pending {
  const k = activeCell(entry);
  if (k === null) return null;
  if (layout.op === '+' && layout.carries[k] && !entry.carriesSent[k]) return { kind: 'carry', column: k };
  if (layout.op === '−' && layout.borrows[k] && !entry.tensBroken[k]) return { kind: 'borrow', column: k };
  return null;
}

/** Fait le geste en attente (l'enfant a touché l'étoile ou la dizaine). */
export function resolvePending(layout: ColumnLayout, entry: Entry): Entry {
  const pending = pendingAction(layout, entry);
  if (!pending) return entry;
  const key = pending.kind === 'carry' ? 'carriesSent' : 'tensBroken';
  return { ...entry, [key]: entry[key].map((v, i) => v || i === pending.column) };
}

/** Pose un chiffre dans la case active ; le geste en attente se fait tout seul s'il a été oublié. */
export function typeDigit(layout: ColumnLayout, entry: Entry, digit: number): Entry {
  const ready = resolvePending(layout, entry);
  const k = activeCell(ready);
  if (k === null) return entry;
  return { ...ready, digits: ready.digits.map((d, i) => (i === k ? digit : d)) };
}

/** Efface le dernier chiffre posé (les retenues restent en place). */
export function eraseDigit(entry: Entry): Entry {
  const k = entry.digits.reduce<number>((last, d, i) => (d === null ? last : i), -1);
  if (k === -1) return entry;
  return { ...entry, digits: entry.digits.map((d, i) => (i === k ? null : d)) };
}

/** Nombre saisi, ou null tant qu'une case est vide. */
export function entryValue(entry: Entry): number | null {
  if (entry.digits.some((d) => d === null)) return null;
  return entry.digits.reduce<number>((sum, d, i) => sum + (d ?? 0) * 10 ** i, 0);
}

/** Chiffre du haut affiché après les échanges : 5 → 4 (a prêté), 3 → 13 (a reçu). */
export function shownTop(layout: ColumnLayout, entry: Entry, k: number): number | null {
  const top = layout.top[k] ?? null;
  if (top === null) return null;
  const lent = k > 0 && entry.tensBroken[k - 1] ? 1 : 0;
  return top - lent + (entry.tensBroken[k] ? 10 : 0);
}

/** Saisie complète et juste, colonne par colonne (démonstration de « Je découvre »). */
export function solvedEntry(layout: ColumnLayout, columns = layout.result.length): Entry {
  let entry = emptyEntry(layout);
  for (const digit of layout.result.slice(0, columns)) entry = typeDigit(layout, entry, digit);
  // La retenue de la colonne suivante apparaît avec le chiffre qui la produit.
  return columns > 0 ? resolvePending(layout, entry) : entry;
}
