import { fr } from '@/i18n/fr';
import { Button } from '@/ui/Button';

interface StopDialogProps {
  onContinue: () => void;
  onStop: () => void;
}

/**
 * « On s'arrête ? » : confirmation douce, pour éviter une sortie par erreur.
 * Rien n'est perdu : les réponses déjà données restent enregistrées.
 */
export function StopDialog({ onContinue, onStop }: StopDialogProps) {
  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-ink/40 p-4" onClick={onContinue}>
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="stop-title"
        aria-describedby="stop-text"
        onClick={(e) => e.stopPropagation()}
        className="anim-pop-in flex w-full max-w-md flex-col items-center gap-5 rounded-3xl bg-surface p-6 text-center shadow-xl"
      >
        <h2 id="stop-title" className="text-3xl font-extrabold text-primary">
          {fr.play.stopTitle}
        </h2>
        <p id="stop-text" className="text-instruction">
          {fr.play.stopText}
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Button onClick={onContinue} autoFocus>
            {fr.play.stopCancel}
          </Button>
          <Button variant="soft" onClick={onStop}>
            {fr.play.stopConfirm}
          </Button>
        </div>
      </section>
    </div>
  );
}
