import { evaluate } from './display';
import type { QuestionDisplay } from './types';

/**
 * Calcul posé en colonnes (addition ou soustraction d'entiers positifs).
 * Tous les tableaux sont indexés depuis les unités : [unités, dizaines, centaines…].
 */
export interface ColumnLayout {
  op: '+' | '−';
  /** Nombre de colonnes affichées. */
  width: number;
  /** Chiffres du premier nombre (null au-delà de son dernier chiffre). */
  top: (number | null)[];
  /** Chiffres du second nombre. */
  bottom: (number | null)[];
  /** Chiffres du résultat (autant que de chiffres dans le résultat). */
  result: number[];
  /** Addition : retenue reçue par chaque colonne (0 ou 1). */
  carries: number[];
  /** Soustraction : la colonne casse une dizaine de sa voisine de gauche. */
  borrows: boolean[];
  /** Soustraction : chiffre du haut une fois les échanges faits (ex. 3 → 13, 5 → 4). */
  topAfter: (number | null)[];
}

/** 427 → [7, 2, 4]. */
export function digitsOf(n: number): number[] {
  return [...String(n)].reverse().map(Number);
}

const pad = (digits: readonly number[], width: number): (number | null)[] =>
  Array.from({ length: width }, (_, k) => digits[k] ?? null);

/**
 * Disposition en colonnes d'une question « a ± b = ? ».
 * Renvoie null si l'opération ne se pose pas (multiplication, terme caché, résultat négatif).
 */
export function columnLayout(display: QuestionDisplay): ColumnLayout | null {
  const { a, b, op } = display;
  if ((display.missing ?? 'result') !== 'result' || b === null || op === '×') return null;
  const answer = evaluate(display);
  if (a < 0 || b < 0 || answer < 0) return null;

  const result = digitsOf(answer);
  const width = Math.max(digitsOf(a).length, digitsOf(b).length, result.length);
  const top = pad(digitsOf(a), width);
  const bottom = pad(digitsOf(b), width);
  const carries = Array.from({ length: width }, () => 0);
  const borrows = Array.from({ length: width }, () => false);
  const topAfter = [...top];

  for (let k = 0; k < width; k++) {
    const t = top[k] ?? 0;
    const u = bottom[k] ?? 0;
    if (op === '+') {
      if (k + 1 < width) carries[k + 1] = t + u + (carries[k] ?? 0) >= 10 ? 1 : 0;
    } else {
      const lent = k > 0 && borrows[k - 1] ? 1 : 0;
      const borrow = t - lent < u;
      borrows[k] = borrow;
      if (top[k] !== null) topAfter[k] = t - lent + (borrow ? 10 : 0);
    }
  }
  return { op, width, top, bottom, result, carries, borrows, topAfter };
}

/**
 * Étapes de la stratégie, colonne par colonne puis le résultat :
 * 27 + 15 → « 7 + 5 = 12 », « 1 + 2 + 1 = 4 », « 27 + 15 = 42 ».
 * 53 − 27 → « 13 − 7 = 6 », « 4 − 2 = 2 », « 53 − 27 = 26 ».
 */
export function columnSteps(display: QuestionDisplay): string[] {
  const layout = columnLayout(display);
  if (!layout) return [];
  const steps: string[] = [];
  for (let k = 0; k < layout.width; k++) {
    const top = layout.top[k] ?? null;
    const bottom = layout.bottom[k] ?? null;
    if (layout.op === '+') {
      const terms = [layout.carries[k] ? 1 : null, top, bottom].filter((t): t is number => t !== null);
      if (terms.length >= 2) steps.push(`${terms.join(' + ')} = ${terms.reduce((s, t) => s + t, 0)}`);
    } else {
      const after = layout.topAfter[k] ?? null;
      if (after === null) continue;
      if (bottom !== null) steps.push(`${after} − ${bottom} = ${after - bottom}`);
      else if (top !== null && top !== after) steps.push(`${top} − 1 = ${after}`);
    }
  }
  steps.push(`${display.a} ${display.op} ${display.b} = ${evaluate(display)}`);
  return steps;
}
