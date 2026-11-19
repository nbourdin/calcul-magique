import type { MedalId } from '@/domain/rewards/medals';
import { fr } from '@/i18n/fr';

/** Couleur du médaillon et petit dessin propre à chaque médaille (le nom est toujours écrit à côté). */
const LOOK: Record<MedalId, { color: string; glyph: string }> = {
  firstSeries: { color: '#f5b82e', glyph: 'M32 20l4 8 9 1-7 6 2 9-8-5-8 5 2-9-7-6 9-1z' },
  streak3: {
    color: '#e76f8a',
    glyph: 'M32 18c6 7 9 12 9 18a9 9 0 0 1-18 0c0-4 2-7 4-9 0 4 2 6 4 6-1-6 0-10 1-15z',
  },
  master10: { color: '#6a4ab5', glyph: 'M22 26l10-8 10 8v16H22zM29 42v-8h6v8' },
  frogJumper: { color: '#2f8f5b', glyph: 'M20 40q12-22 24 0M24 40a3 3 0 1 0 0 .1M40 40a3 3 0 1 0 0 .1' },
  perfectRace: { color: '#3b8ed0', glyph: 'M22 20v24M22 20h20l-4 6 4 6H22' },
  album3: { color: '#c96a12', glyph: 'M20 22h24v20H20zM32 22v20M24 28h4M36 28h4' },
  daily100: { color: '#d4a017', glyph: 'M32 18a14 14 0 1 0 0.1 0M32 24v8l6 4' },
  comeback: { color: '#8a6fd0', glyph: 'M44 32a12 12 0 1 1-4-9M40 18v6h6' },
};

/** Une médaille (PRD §7) : décorative, son nom est écrit dessous. */
export function Medal({ id, className = 'size-20' }: { id: MedalId; className?: string }) {
  const { color, glyph } = LOOK[id];
  return (
    <svg viewBox="0 0 64 80" className={className} aria-hidden="true">
      <path d="M20 2h10l6 22H26zM34 2h10l-6 22H28z" fill={color} opacity="0.6" />
      <circle cx="32" cy="48" r="26" fill={color} stroke="#2e2a4f" strokeWidth="3" />
      <circle cx="32" cy="48" r="19" fill="#fff" opacity="0.9" />
      <g transform="translate(0 16)">
        <path
          d={glyph}
          fill="none"
          stroke="#2e2a4f"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
    </svg>
  );
}

export function MedalName({ id }: { id: MedalId }) {
  return <span className="text-lg leading-tight font-bold">{fr.medals.names[id]}</span>;
}
