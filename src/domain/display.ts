import type { Op, QuestionDisplay } from './types';

export function applyOp(a: number, op: Op, b: number): number {
  switch (op) {
    case '+':
      return a + b;
    case '−':
      return a - b;
    case '×':
      return a * b;
  }
}

/** Résultat de l'opération affichée (a op b). */
export function evaluate(display: QuestionDisplay): number {
  if (display.b === null) throw new Error('evaluate : opération sans second terme');
  return applyOp(display.a, display.op, display.b);
}

/** Valeur du terme caché. */
export function hiddenValue(display: QuestionDisplay): number {
  switch (display.missing ?? 'result') {
    case 'a':
      return display.a;
    case 'b':
      if (display.b === null) throw new Error('hiddenValue : b absent');
      return display.b;
    case 'result':
      return evaluate(display);
  }
}
