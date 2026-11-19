import { evaluate } from '@/domain/display';
import { createRng } from '@/domain/rng';
import { questionForFact } from '@/domain/skills';
import type { FactState } from '@/domain/types';
import { fr } from '@/i18n/fr';

/** Libellé lisible d'un fait pour le parent : « 7 + ? = 10 », « 47 + 9 », « Double de 8 ». */
export function factLabel(state: Pick<FactState, 'skillId' | 'factKey'>): string {
  try {
    const q = questionForFact(state.skillId, state.factKey, 2, createRng(0));
    const { a, op, b } = q.display;
    if (q.wording === 'double') return fr.equation.double(a);
    if (q.wording === 'half') return fr.equation.half(evaluate(q.display));
    const missing = q.display.missing ?? 'result';
    const show = (key: 'a' | 'b', v: number | null) => (missing === key ? '?' : String(v));
    return missing === 'result'
      ? `${a} ${op} ${b}`
      : `${show('a', a)} ${op} ${show('b', b)} = ${evaluate(q.display)}`;
  } catch {
    return state.factKey;
  }
}
