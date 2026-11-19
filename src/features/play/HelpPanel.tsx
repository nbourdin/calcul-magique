import type { Question } from '@/domain/types';
import { fr } from '@/i18n/fr';
import { Button } from '@/ui/Button';
import { Icon } from '@/ui/Icon';

interface HelpPanelProps {
  question: Question;
  willRetry: boolean;
  onContinue: () => void;
}

/** Aide bienveillante après une erreur : la stratégie, sans son négatif ni pénalité. */
export function HelpPanel({ question, willRetry, onContinue }: HelpPanelProps) {
  return (
    <section
      role="status"
      aria-live="polite"
      className="flex w-full flex-col items-center gap-4 rounded-3xl border-4 border-help bg-help-soft p-5 text-center"
    >
      <h2 className="flex items-center gap-2 text-instruction font-extrabold text-ink">
        <Icon name="help" className="size-8 text-help" />
        {fr.play.helpTitle}
      </h2>
      <ol className="flex flex-col gap-2">
        {question.strategy?.steps.map((step) => (
          <li key={step} className="text-[2rem] leading-tight font-extrabold tabular-nums">
            {step}
          </li>
        ))}
      </ol>
      <p className="text-instruction text-ink">{willRetry ? fr.play.helpRetry : fr.play.helpLast}</p>
      <Button variant="help" onClick={onContinue} autoFocus>
        {fr.play.helpContinue}
      </Button>
    </section>
  );
}
