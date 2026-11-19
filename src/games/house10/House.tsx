import { forwardRef } from 'react';
import { fr } from '@/i18n/fr';

interface HouseProps {
  /** Fenêtres déjà allumées. */
  lit: number;
  /** Fenêtres ajoutées par la réponse (affichées après coup). */
  added?: number;
  highlight?: boolean;
}

const WINDOW_COUNT = 10;

/** Maison à 10 fenêtres (2 rangées de 5, comme une boîte de dix). */
export const House = forwardRef<HTMLDivElement, HouseProps>(function House(
  { lit, added = 0, highlight = false },
  ref,
) {
  const windows = Array.from({ length: WINDOW_COUNT }, (_, i) =>
    i < lit ? 'lit' : i < lit + added ? 'added' : 'off',
  );
  return (
    <div
      ref={ref}
      role="img"
      aria-label={fr.games.house10.houseLabel(Math.min(lit + added, WINDOW_COUNT), WINDOW_COUNT)}
      className={`w-full max-w-[15rem] rounded-3xl transition ${highlight ? 'scale-105 ring-4 ring-primary ring-offset-4 ring-offset-bg' : ''}`}
    >
      <svg viewBox="0 0 200 170" className="w-full">
        <path
          d="M100 6 L192 66 H8 Z"
          fill="#e9a6c1"
          stroke="#2e2a4f"
          strokeWidth="4"
          strokeLinejoin="round"
        />
        <rect
          x="18"
          y="64"
          width="164"
          height="100"
          rx="10"
          fill="#fbe0ea"
          stroke="#2e2a4f"
          strokeWidth="4"
        />
        {windows.map((state, i) => {
          const x = 30 + (i % 5) * 29;
          const y = 78 + Math.floor(i / 5) * 42;
          return (
            <g key={i} data-window={state}>
              <rect
                x={x}
                y={y}
                width="23"
                height="32"
                rx="5"
                fill={state === 'lit' ? '#ffd66b' : state === 'added' ? '#8fdcb4' : '#4a457a'}
                stroke="#2e2a4f"
                strokeWidth="3"
              />
              {state === 'added' && (
                <path
                  d={`M${x + 6} ${y + 16} l4 5 l8 -10`}
                  fill="none"
                  stroke="#1f5e3d"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
});
