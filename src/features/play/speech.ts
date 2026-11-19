import { evaluate } from '@/domain/display';
import type { Question } from '@/domain/types';
import { fr } from '@/i18n/fr';

/** La question en phrase, pour la lecture à voix haute : « 7 plus combien, ça fait 10 ? ». */
export function spokenQuestion(q: Question): string {
  const { a, b, op } = q.display;
  const result = evaluate(q.display);
  if (q.wording === 'double') return fr.speech.double(a);
  if (q.wording === 'half') return fr.speech.half(result);
  const word = fr.speech.ops[op];
  switch (q.display.missing ?? 'result') {
    case 'a':
      return fr.speech.missingA(word, b ?? 0, result);
    case 'b':
      return fr.speech.missingB(a, word, result);
    case 'result':
      return fr.speech.result(a, word, b ?? 0);
  }
}
