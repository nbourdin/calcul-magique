import { fr } from '@/i18n/fr';
import { jumpLabel, labelStep, lineBounds, type Jump } from './jumps';

interface NumberLineProps {
  start: number;
  jumps: readonly Jump[];
  /** Nombre de sauts déjà faits. */
  done: number;
  /** Afficher le nombre d'arrivée (sinon c'est à l'enfant de le trouver). */
  revealPosition?: boolean;
  /** Montrer en pointillés clairs les sauts encore à faire (le plan de la grenouille). */
  showPlan?: boolean;
}

const W = 400;
const PAD = 24;
const LINE_Y = 118;

function Frog() {
  return (
    <g transform="translate(0 98) scale(1.35)">
      <ellipse cx="0" cy="0" rx="17" ry="13" fill="#6ccf93" stroke="#2e2a4f" strokeWidth="2.5" />
      <circle cx="-8" cy="-11" r="6" fill="#fff" stroke="#2e2a4f" strokeWidth="2" />
      <circle cx="8" cy="-11" r="6" fill="#fff" stroke="#2e2a4f" strokeWidth="2" />
      <circle cx="-7" cy="-11" r="2.5" fill="#2e2a4f" />
      <circle cx="9" cy="-11" r="2.5" fill="#2e2a4f" />
      <path d="M-7 3 q7 6 14 0" fill="none" stroke="#2e2a4f" strokeWidth="2" strokeLinecap="round" />
    </g>
  );
}

/**
 * Droite numérique zoomée sur le trajet : nénuphars, sauts faits (violet) et à faire
 * (pointillés clairs), grenouille. Le nombre d'arrivée reste caché jusqu'à la réponse.
 */
export function NumberLine({
  start,
  jumps,
  done,
  revealPosition = false,
  showPlan = false,
}: NumberLineProps) {
  const points = [start, ...jumps.map((j) => j.to)];
  const end = points[points.length - 1] ?? start;
  const { lo, hi } = lineBounds(points);
  const span = hi - lo;
  const unit = (W - 2 * PAD) / span;
  const x = (v: number) => PAD + (v - lo) * unit;
  const pos = done === 0 ? start : (jumps[done - 1]?.to ?? start);
  const every = labelStep(span);
  const visited = new Set(points.slice(0, done + 1));
  const ticks = Array.from({ length: span + 1 }, (_, i) => lo + i).filter((t) => span <= 40 || t % 5 === 0);
  const hidden = (t: number) => t === end && !revealPosition && end !== start;

  const arc = (j: Jump, i: number, planned: boolean) => {
    const x1 = x(j.from);
    const x2 = x(j.to);
    const h = Math.min(70, 22 + Math.abs(x2 - x1) / 3);
    // Étiquette au-dessus du sommet de l'arc, et toujours plus haut que la tête de la grenouille.
    const labelY = Math.min(LINE_Y - 8 - h / 2 - 8, 62);
    const color = planned ? '#b9a3e3' : '#6a4ab5';
    return (
      <g key={`${planned ? 'plan' : 'done'}-${i}`}>
        <path
          d={`M${x1} ${LINE_Y - 8} Q${(x1 + x2) / 2} ${LINE_Y - 8 - h} ${x2} ${LINE_Y - 8}`}
          fill="none"
          stroke={color}
          strokeWidth={planned ? 3 : 4}
          strokeDasharray={planned ? '4 6' : undefined}
          strokeLinecap="round"
        />
        <text x={(x1 + x2) / 2} y={labelY} textAnchor="middle" fontSize="22" fontWeight="800" fill={color}>
          {jumpLabel(j)}
        </text>
      </g>
    );
  };

  return (
    <svg
      viewBox={`0 0 ${W} 190`}
      className="w-full max-w-2xl"
      role="img"
      aria-label={fr.games.frog.line(pos)}
    >
      <rect x="0" y={LINE_Y} width={W} height="72" rx="16" fill="#cdeef0" />
      <line
        x1={PAD / 2}
        y1={LINE_Y}
        x2={W - PAD / 2}
        y2={LINE_Y}
        stroke="#2e2a4f"
        strokeWidth="4"
        strokeLinecap="round"
      />
      {ticks.map((t) => {
        const major = t % 10 === 0;
        const key = visited.has(t) || t === start;
        const labelled = (t % every === 0 || key) && !hidden(t);
        return (
          <g key={t}>
            <line
              x1={x(t)}
              y1={LINE_Y - (major ? 12 : 7)}
              x2={x(t)}
              y2={LINE_Y + (major ? 12 : 7)}
              stroke="#2e2a4f"
              strokeWidth={major ? 3 : 2}
            />
            {labelled && (
              <text
                x={x(t)}
                y={LINE_Y + 38}
                textAnchor="middle"
                fontSize={key ? 22 : 18}
                fontWeight={key || major ? 800 : 600}
                fill={visited.has(t) ? '#2f8f5b' : '#2e2a4f'}
              >
                {t}
              </text>
            )}
          </g>
        );
      })}
      {/* Nombre d'arrivée à trouver : un « ? » à sa place. */}
      {hidden(end) && (
        <text x={x(end)} y={LINE_Y + 38} textAnchor="middle" fontSize="22" fontWeight="800" fill="#6a4ab5">
          ?
        </text>
      )}
      {showPlan && jumps.slice(done).map((j, i) => arc(j, done + i, true))}
      {jumps.slice(0, done).map((j, i) => arc(j, i, false))}
      {points.slice(0, done + 1).map((p, i) => (
        <ellipse
          key={i}
          cx={x(p)}
          cy={LINE_Y}
          rx="18"
          ry="7"
          fill="#6ccf93"
          stroke="#2f8f5b"
          strokeWidth="2"
        />
      ))}
      <g
        style={{
          transform: `translateX(${x(pos)}px)`,
          transition: 'transform 450ms cubic-bezier(0.3, 1.4, 0.5, 1)',
        }}
      >
        <Frog />
      </g>
    </svg>
  );
}
