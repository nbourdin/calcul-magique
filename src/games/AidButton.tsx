import { fr } from '@/i18n/fr';
import { Icon } from '@/ui/Icon';

/** « Montre-moi » : l'enfant choisit d'afficher l'aide visuelle (réglage « sur demande »). */
export function AidButton({ onClick, disabled = false }: { onClick: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex min-h-tap items-center gap-2 rounded-full border-4 border-dashed border-help bg-help-soft px-5 text-xl font-extrabold text-ink transition hover:bg-[#fbdcb8] focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-40"
    >
      <Icon name="help" className="size-7 text-help" />
      {fr.play.showAid}
    </button>
  );
}
