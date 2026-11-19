/** Icônes SVG embarquées (aucun contenu externe). Décoratives : le texte voisin porte le sens. */
type IconName = 'check' | 'help' | 'star' | 'erase' | 'home' | 'replay' | 'pause' | 'gear';

const paths: Record<IconName, string> = {
  check: 'M5 12.5l4.5 4.5L19 7.5',
  help: 'M12 3a6 6 0 0 0-3.5 10.9V16h7v-2.1A6 6 0 0 0 12 3zM9.5 19h5M10.5 21.5h3',
  star: 'M12 2.8l2.8 5.9 6.4.8-4.7 4.4 1.2 6.4L12 17.2l-5.7 3.1 1.2-6.4-4.7-4.4 6.4-.8z',
  erase: 'M21 5H9l-6 7 6 7h12zM12 9l6 6M18 9l-6 6',
  home: 'M3 11l9-7.5 9 7.5M5.5 9.5V20h13V9.5M10 20v-5.5h4V20',
  replay: 'M4 12a8 8 0 1 0 2.4-5.7M4 4v4.5h4.5',
  pause: 'M8.5 5v14M15.5 5v14',
  gear: 'M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1',
};

export function Icon({
  name,
  className = 'size-7',
  filled = false,
}: {
  name: IconName;
  className?: string;
  filled?: boolean;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      aria-hidden="true"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={filled ? 1 : 2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={paths[name]} />
    </svg>
  );
}
