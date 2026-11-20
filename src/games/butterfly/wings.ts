import { evaluate } from '@/domain/display';
import type { Question } from '@/domain/types';

/** Ce que portent les ailes : un double (6 | 6), un presque-double (6 | 6 + 1) ou une moitié. */
export interface Wings {
  mode: 'double' | 'near' | 'half';
  /** Nombre sur chaque aile (pour une moitié : la réponse, cachée jusqu'au bout). */
  wing: number;
  /** Total du papillon (pour un double : la réponse). */
  total: number;
}

export function wingsOf(question: Question): Wings {
  const { display } = question;
  const total = evaluate(display);
  if (question.wording === 'half') return { mode: 'half', wing: total / 2, total };
  if (question.wording === 'double') return { mode: 'double', wing: display.a, total };
  const small = Math.min(display.a, display.b ?? display.a);
  return { mode: total === 2 * small ? 'double' : 'near', wing: small, total };
}
