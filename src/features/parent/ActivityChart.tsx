import { useState } from 'react';
import type { DayActivity } from '@/domain/parent/dashboard';
import { fr } from '@/i18n/fr';

const W = 560;
const H = 180;
const PAD_LEFT = 32;
const PAD_BOTTOM = 26;
const GAP = 2;

const dayLabel = (day: string) =>
  new Intl.DateTimeFormat('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  }).format(new Date(`${day}T12:00:00Z`));
const minutesText = (m: number) => m.toLocaleString('fr-FR', { maximumFractionDigits: 1 });

/**
 * Barres « minutes par jour » sur 14 jours : une seule série (le titre la nomme, pas de légende),
 * barres fines arrondies posées sur la base, infobulle au survol ou au focus, tableau équivalent.
 */
export function ActivityChart({ days }: { days: readonly DayActivity[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(10, ...days.map((d) => d.minutes));
  const top = Math.ceil(max / 5) * 5;
  const plotW = W - PAD_LEFT;
  const plotH = H - PAD_BOTTOM - 8;
  const slot = plotW / days.length;
  const barW = Math.min(22, slot - GAP * 2);
  const y = (m: number) => 8 + plotH - (m / top) * plotH;
  const active = hover !== null ? days[hover] : undefined;

  return (
    <figure className="flex flex-col gap-2">
      <figcaption className="text-lg font-extrabold">{fr.parent.activityTitle}</figcaption>
      <p className="min-h-6 text-sm text-ink-soft" aria-live="polite">
        {active
          ? fr.parent.activityDay(dayLabel(active.day), minutesText(active.minutes), active.series)
          : ' '}
      </p>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="group" aria-label={fr.parent.activityTitle}>
        {[0, top / 2, top].map((t) => (
          <g key={t}>
            <line
              x1={PAD_LEFT}
              x2={W}
              y1={y(t)}
              y2={y(t)}
              stroke="currentColor"
              strokeOpacity={t === 0 ? 0.5 : 0.12}
            />
            <text x={PAD_LEFT - 6} y={y(t) + 4} textAnchor="end" fontSize="11" className="fill-ink-soft">
              {t}
            </text>
          </g>
        ))}
        {days.map((d, i) => {
          const x = PAD_LEFT + i * slot + (slot - barW) / 2;
          const h = Math.max(0, y(0) - y(d.minutes));
          const r = Math.min(4, h / 2, barW / 2);
          return (
            <g
              key={d.day}
              tabIndex={0}
              role="img"
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
              onFocus={() => setHover(i)}
              onBlur={() => setHover(null)}
              aria-label={fr.parent.activityDay(dayLabel(d.day), minutesText(d.minutes), d.series)}
              className="cursor-default outline-none"
            >
              {/* Zone de survol plus large que la barre. */}
              <rect x={PAD_LEFT + i * slot} y={8} width={slot} height={plotH} fill="transparent" />
              {h > 0 && (
                <path
                  d={`M${x} ${y(0)} V${y(d.minutes) + r} Q${x} ${y(d.minutes)} ${x + r} ${y(d.minutes)} H${x + barW - r} Q${x + barW} ${y(d.minutes)} ${x + barW} ${y(d.minutes) + r} V${y(0)} Z`}
                  fill="#6a4ab5"
                  opacity={hover === null || hover === i ? 1 : 0.45}
                />
              )}
              {/* Un jour sur deux, en finissant sur aujourd'hui. */}
              {(days.length - 1 - i) % 2 === 0 && (
                <text x={x + barW / 2} y={H - 8} textAnchor="middle" fontSize="11" className="fill-ink-soft">
                  {Number(d.day.slice(8))}
                </text>
              )}
            </g>
          );
        })}
      </svg>
      <details className="text-sm">
        <summary className="cursor-pointer font-bold text-primary">{fr.parent.activityTable}</summary>
        <table className="mt-2 w-full text-left">
          <thead>
            <tr>
              <th className="py-1">{fr.parent.columns.day}</th>
              <th>{fr.parent.columns.minutes}</th>
              <th>{fr.parent.columns.series}</th>
            </tr>
          </thead>
          <tbody>
            {days.map((d) => (
              <tr key={d.day} className="border-t border-ink/10">
                <td className="py-1">{dayLabel(d.day)}</td>
                <td>{minutesText(d.minutes)}</td>
                <td>{d.series}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  );
}
