import { fr } from '@/i18n/fr';
import { jumpLabel, lineBounds, type Jump } from './jumps';

interface NumberLineProps {
  start: number;
  jumps: readonly Jump[];
  /** Nombre de sauts déjà faits. */
  done: number;
  /** Afficher le nombre sous la grenouille (sinon l'enfant doit le trouver). */
  revealPosition?: boolean;
}

const W = 640;
const PAD = 30;

/** Droite numérique avec nénuphars et grenouille qui saute. */
export function NumberLine({ start, jumps, done, revealPosition = false }: NumberLineProps) {
  const points = [start, ...jumps.map((j) => j.to)];
  const { lo, hi } = lineBounds(points);
  const span = hi - lo;
  const x = (v: number) => PAD + ((v - lo) / span) * (W - 2 * PAD);
  const pos = done === 0 ? start : (jumps[done - 1]?.to ?? start);
  const labelEvery = span <= 20 ? 1 : span <= 50 ? 5 : 10;
  const ticks = Array.from({ length: span + 1 }, (_, i) => lo + i);

  return (
    <svg viewBox={`0 0 ${W} 190`} className="w-full" role="img" aria-label={fr.games.frog.line(pos)}>
      <rect x="0" y="120" width={W} height="70" rx="16" fill="#cdeef0" />
      <line x1={PAD} y1="120" x2={W - PAD} y2="120" stroke="#2e2a4f" strokeWidth="4" strokeLinecap="round" />
      {ticks.map((t) => {
        const major = t % 10 === 0;
        const labelled = t % labelEvery === 0 && (t !== pos || revealPosition || t === start);
        return (
          <g key={t}>
            <line
              x1={x(t)}
              y1={major ? 108 : 113}
              x2={x(t)}
              y2={major ? 132 : 127}
              stroke="#2e2a4f"
              strokeWidth={major ? 3 : 1.5}
            />
            {labelled && (
              <text
                x={x(t)}
                y="156"
                textAnchor="middle"
                fontSize={major ? 20 : 15}
                fontWeight={major ? 800 : 600}
                fill="#2e2a4f"
              >
                {t}
              </text>
            )}
          </g>
        );
      })}
      {jumps.slice(0, done).map((j, i) => {
        const x1 = x(j.from);
        const x2 = x(j.to);
        const h = Math.min(80, 20 + Math.abs(x2 - x1) / 3);
        // Petit saut : l'étiquette passe au-dessus de la grenouille.
        const labelY = Math.abs(x2 - x1) < 60 ? 58 : 104 - h / 2;
        return (
          <g key={i}>
            <path
              d={`M${x1} 112 Q${(x1 + x2) / 2} ${112 - h} ${x2} 112`}
              fill="none"
              stroke="#6a4ab5"
              strokeWidth="3.5"
              strokeDasharray="6 5"
            />
            <text
              x={(x1 + x2) / 2}
              y={labelY}
              textAnchor="middle"
              fontSize="20"
              fontWeight="800"
              fill="#6a4ab5"
            >
              {jumpLabel(j)}
            </text>
          </g>
        );
      })}
      {points.slice(0, done + 1).map((p, i) => (
        <ellipse key={i} cx={x(p)} cy="120" rx="16" ry="6" fill="#6ccf93" stroke="#2f8f5b" strokeWidth="2" />
      ))}
      <g
        style={{
          transform: `translateX(${x(pos)}px)`,
          transition: 'transform 450ms cubic-bezier(0.3, 1.4, 0.5, 1)',
        }}
      >
        <g transform="translate(0 100)">
          <ellipse cx="0" cy="0" rx="17" ry="13" fill="#6ccf93" stroke="#2e2a4f" strokeWidth="2.5" />
          <circle cx="-8" cy="-11" r="6" fill="#fff" stroke="#2e2a4f" strokeWidth="2" />
          <circle cx="8" cy="-11" r="6" fill="#fff" stroke="#2e2a4f" strokeWidth="2" />
          <circle cx="-7" cy="-11" r="2.5" fill="#2e2a4f" />
          <circle cx="9" cy="-11" r="2.5" fill="#2e2a4f" />
          <path d="M-7 3 q7 6 14 0" fill="none" stroke="#2e2a4f" strokeWidth="2" strokeLinecap="round" />
        </g>
      </g>
      {revealPosition && (
        <text x={x(pos)} y="182" textAnchor="middle" fontSize="20" fontWeight="800" fill="#2f8f5b">
          {pos}
        </text>
      )}
    </svg>
  );
}
