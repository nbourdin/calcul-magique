import { evaluate } from '@/domain/display';
import type { Question } from '@/domain/types';

export interface Jump {
  from: number;
  to: number;
}

export const jumpLabel = (j: Jump) => (j.to >= j.from ? `+${j.to - j.from}` : `−${j.from - j.to}`);

const STEP = /^(\d+) ([+−]) (\d+) = (\d+)$/;

function chainFromSteps(steps: readonly string[], start: number, end: number): Jump[] | null {
  const jumps: Jump[] = [];
  let at = start;
  for (const step of steps) {
    const m = STEP.exec(step);
    if (!m) return null;
    const from = Number(m[1]);
    const to = Number(m[4]);
    if (from !== at) return null;
    jumps.push({ from, to });
    at = to;
  }
  return jumps.length > 0 && at === end ? jumps : null;
}

/** Découpe un saut en dizaines puis unités (ex. +13 → +10 puis +3). */
function splitJump(from: number, delta: number): Jump[] {
  const sign = Math.sign(delta);
  const tens = sign * Math.floor(Math.abs(delta) / 10) * 10;
  const units = delta - tens;
  const jumps: Jump[] = [];
  if (tens !== 0) jumps.push({ from, to: from + tens });
  if (units !== 0) jumps.push({ from: from + tens, to: from + delta });
  return jumps;
}

/**
 * Sauts de la grenouille pour une question : ceux de la stratégie quand elle forme une
 * chaîne (6 → 16 → 15), sinon un découpage dizaines / unités.
 */
export function frogJumps(question: Question): { start: number; jumps: Jump[] } {
  const { display } = question;
  if (question.wording === 'half') {
    const whole = evaluate(display);
    return {
      start: 0,
      jumps: [
        { from: 0, to: whole / 2 },
        { from: whole / 2, to: whole },
      ],
    };
  }
  const start = display.op === '×' ? 0 : display.a;
  const end = evaluate(display);
  const chain = chainFromSteps(question.strategy?.steps ?? [], start, end);
  return { start, jumps: chain ?? splitJump(start, end - start) };
}

/** Écart minimal affiché, pour que la droite garde l'allure d'une règle. */
export const MIN_SPAN = 8;

/**
 * Bornes de la droite : zoomée sur les positions visitées (une case de marge de chaque côté),
 * pour que les nombres restent gros sur un téléphone.
 */
export function lineBounds(points: readonly number[]): { lo: number; hi: number } {
  const lo = Math.max(0, Math.min(...points) - 1);
  const hi = Math.max(Math.max(...points) + 1, lo + MIN_SPAN);
  return { lo, hi };
}

/** Pas entre deux nombres écrits sous la droite : 1, 5 ou 10 selon la longueur. */
export function labelStep(span: number): number {
  return span <= 14 ? 1 : span <= 40 ? 5 : 10;
}
