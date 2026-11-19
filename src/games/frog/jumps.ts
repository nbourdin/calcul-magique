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

/** Bornes de la droite : dizaines entières autour des positions visitées. */
export function lineBounds(points: readonly number[]): { lo: number; hi: number } {
  const lo = Math.floor(Math.min(...points) / 10) * 10;
  const hi = Math.max(lo + 10, Math.ceil(Math.max(...points) / 10) * 10);
  return { lo, hi };
}
