import { fr } from '@/i18n/fr';

/**
 * Mode chrono « actif » : un sablier doux qui se remplit, sans limite ni conséquence.
 * Il ne fait que rappeler qu'aller vite peut rapporter une étoile bonus.
 */
export function ChronoBar() {
  return (
    <div
      className="h-2 w-full overflow-hidden rounded-full bg-primary-soft"
      role="img"
      aria-label={fr.play.chrono}
    >
      <div className="chrono-fill h-full rounded-full bg-[#f5b82e]" />
    </div>
  );
}
