import { evaluate } from '@/domain/display';
import type { QuestionDisplay } from '@/domain/types';
import { fr } from '@/i18n/fr';

export type SlotTone = 'idle' | 'success' | 'help';

interface EquationProps {
  display: QuestionDisplay;
  wording?: 'double' | 'half' | undefined;
  /** Ce que l'enfant a saisi ou choisi pour le terme caché. */
  slot?: string;
  tone?: SlotTone;
}

const toneClass: Record<SlotTone, string> = {
  idle: 'border-primary bg-primary-soft text-primary',
  success: 'border-success bg-success-soft text-success',
  help: 'border-help bg-help-soft text-help',
};

/** Affiche « a op b = résultat » avec une case pour le terme à trouver. */
export function Equation({ display, wording, slot = '', tone = 'idle' }: EquationProps) {
  const missing = display.missing ?? 'result';
  const terms = { a: display.a, b: display.b, result: evaluate(display) };
  const render = (key: 'a' | 'b' | 'result') =>
    key === missing ? (
      <span
        className={`inline-flex min-w-[2.2em] items-center justify-center rounded-2xl border-4 border-dashed px-2 ${toneClass[tone]}`}
        aria-label={slot === '' ? fr.play.missing : slot}
      >
        {slot === '' ? '?' : slot}
      </span>
    ) : (
      <span>{terms[key]}</span>
    );

  if (wording) {
    // « Double de 8 = ? » / « Moitié de 16 = ? » : la case à trouver est toujours à droite.
    const text = wording === 'double' ? fr.equation.double(display.a) : fr.equation.half(terms.result);
    return (
      <p
        className="flex flex-wrap items-center justify-center gap-3 text-[2.5rem] leading-none font-extrabold tabular-nums"
        data-testid="equation"
      >
        <span>{text}</span>
        <span aria-hidden="true">=</span>
        {render(missing)}
      </p>
    );
  }

  return (
    <p
      className="flex items-center justify-center gap-3 text-[3rem] leading-none font-extrabold tabular-nums"
      data-testid="equation"
    >
      {render('a')}
      <span aria-hidden="true">{display.op}</span>
      {display.b !== null && render('b')}
      <span aria-hidden="true">=</span>
      {render('result')}
    </p>
  );
}
