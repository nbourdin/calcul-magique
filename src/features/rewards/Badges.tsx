import { now as clock } from '@/app/clock';
import { flameStatus, type Streak } from '@/domain/rewards/streak';
import { dayKey } from '@/domain/time';
import { fr } from '@/i18n/fr';
import { Icon } from '@/ui/Icon';

export function StarCount({ stars }: { stars: number }) {
  return (
    <span className="inline-flex min-h-tap items-center gap-2 rounded-full bg-surface px-4 text-xl font-extrabold shadow-sm">
      <Icon name="star" filled className="size-7 text-[#f5b82e]" />
      <span className="sr-only">{fr.stars.total(stars)}</span>
      <span aria-hidden="true">{stars}</span>
    </span>
  );
}

/** Flamme : allumée, en attente ou en veille (jamais de message négatif). */
export function Flame({ streak, today = dayKey(clock()) }: { streak: Streak; today?: string }) {
  const status = flameStatus(streak, today);
  const asleep = status === 'asleep' || status === 'none';
  const label = asleep ? fr.flame.asleep : fr.flame.label(streak.count);
  return (
    <span
      title={label}
      className="inline-flex min-h-tap items-center gap-2 rounded-full bg-surface px-4 text-xl font-extrabold shadow-sm"
    >
      <svg
        viewBox="0 0 24 24"
        className={`size-7 ${asleep ? 'opacity-40 grayscale' : ''}`}
        aria-hidden="true"
      >
        <path
          d="M12 2c1 4 6 6 6 12a6 6 0 0 1-12 0c0-3 2-5 3-6 0 2 1 3 2 3 0-3-1-6 1-9z"
          fill={status === 'lit' ? '#f08a4b' : '#f5b82e'}
          stroke="#2e2a4f"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </svg>
      <span className="sr-only">{label}</span>
      <span aria-hidden="true">{asleep ? '·' : streak.count}</span>
    </span>
  );
}
