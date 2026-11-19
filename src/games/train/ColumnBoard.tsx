import type { CSSProperties, ReactNode } from 'react';
import type { ColumnLayout } from '@/domain/column';
import { fr } from '@/i18n/fr';
import { Icon } from '@/ui/Icon';
import type { SlotTone } from '@/ui/Equation';
import { shownTop, type Entry, type Pending } from './entry';

interface ColumnBoardProps {
  layout: ColumnLayout;
  entry: Entry;
  /** Case du résultat à remplir (surbrillance), null si aucune. */
  activeCell?: number | null;
  /** Geste attendu : l'étoile de la retenue ou la dizaine à casser deviennent des boutons. */
  pending?: Pending;
  onResolve?: () => void;
  tone?: SlotTone;
  label: string;
}

/** Une couleur par wagon, toujours doublée de la lettre de la colonne (u, d, c). */
const WAGON_TONE = ['bg-sky', 'bg-rose', 'bg-mint'];
const ROW = { label: 1, carry: 2, top: 3, bottom: 4, result: 5, wheels: 6, rails: 7 } as const;

const toneClass: Record<SlotTone, string> = {
  idle: 'border-primary bg-surface text-primary',
  success: 'border-success bg-success-soft text-success',
  help: 'border-help bg-help-soft text-help',
};

function at(row: number, column: number, extra: CSSProperties = {}): CSSProperties {
  return { gridRow: row, gridColumn: column, ...extra };
}

function Locomotive() {
  return (
    <svg viewBox="0 0 120 120" className="h-full w-full" aria-hidden="true">
      <circle className="smoke" cx="86" cy="18" r="9" fill="#e8defa" />
      <circle className="smoke [animation-delay:-0.8s]" cx="80" cy="10" r="7" fill="#f3eefc" />
      <rect x="78" y="30" width="16" height="26" rx="4" fill="#2e2a4f" />
      <rect x="8" y="26" width="50" height="58" rx="10" fill="#6a4ab5" />
      <rect x="18" y="36" width="30" height="22" rx="6" fill="#d6ecfb" stroke="#2e2a4f" strokeWidth="3" />
      <rect x="50" y="52" width="58" height="34" rx="12" fill="#8a6fd0" />
      <circle cx="108" cy="68" r="7" fill="#ffd66b" stroke="#2e2a4f" strokeWidth="3" />
      <path d="M104 86 l14 16 h-30z" fill="#e76f8a" />
      <rect x="4" y="18" width="58" height="10" rx="5" fill="#e76f8a" />
      <circle cx="30" cy="96" r="13" fill="#2e2a4f" />
      <circle cx="30" cy="96" r="5" fill="#ffd66b" />
      <circle cx="76" cy="98" r="10" fill="#2e2a4f" />
      <circle cx="76" cy="98" r="4" fill="#ffd66b" />
    </svg>
  );
}

/**
 * Calcul posé dessiné comme un petit train : chaque wagon est une colonne (unités à droite,
 * contre la locomotive). En haut des wagons : la retenue ou la dizaine cassée.
 */
export function ColumnBoard({
  layout,
  entry,
  activeCell = null,
  pending = null,
  onResolve,
  tone = 'idle',
  label,
}: ColumnBoardProps) {
  const { width } = layout;
  // Colonne de grille : 1 = signe, puis les wagons de la plus grande colonne aux unités.
  const gridColumn = (k: number) => width - k + 1;
  const cells: ReactNode[] = [];

  for (let k = 0; k < width; k++) {
    const col = gridColumn(k);
    const top = layout.top[k] ?? null;
    const shown = shownTop(layout, entry, k);
    const changed = shown !== null && shown !== top;
    const bottom = layout.bottom[k] ?? null;
    const resultIndex = k < entry.digits.length ? k : null;
    const digit = resultIndex === null ? null : (entry.digits[resultIndex] ?? null);
    const isActive = activeCell === k && pending === null;
    const lender = pending?.kind === 'borrow' && pending.column + 1 === k;
    const carryPending = pending?.kind === 'carry' && pending.column === k;

    cells.push(
      <div
        key={`wagon-${k}`}
        aria-hidden="true"
        className={`mx-1 rounded-2xl border-4 border-ink/15 ${WAGON_TONE[k % WAGON_TONE.length]}`}
        style={at(ROW.label, col, { gridRowEnd: ROW.wheels })}
      />,
      <span
        key={`label-${k}`}
        aria-hidden="true"
        className="z-10 self-center text-center text-base font-extrabold text-ink-soft"
        style={at(ROW.label, col)}
      >
        {fr.games.train.columnShort[k]}
      </span>,
      <div key={`carry-${k}`} className="z-10 flex items-center justify-center" style={at(ROW.carry, col)}>
        {carryPending ? (
          <button
            type="button"
            onClick={onResolve}
            aria-label={fr.games.train.carryButton}
            className="anim-beckon flex size-tap items-center justify-center rounded-full bg-[#ffd66b] text-ink shadow-md focus-visible:outline-4 focus-visible:outline-primary"
          >
            <Icon name="star" filled className="size-8" />
          </button>
        ) : layout.op === '+' && entry.carriesSent[k] ? (
          <span className="anim-pop-in flex size-10 items-center justify-center rounded-full border-4 border-[#f5b82e] bg-[#fff1c9] text-2xl font-extrabold text-ink">
            1
          </span>
        ) : changed ? (
          <span className="anim-pop-in text-3xl font-extrabold text-help tabular-nums">{shown}</span>
        ) : null}
      </div>,
      <div
        key={`top-${k}`}
        className="z-10 flex items-center justify-center text-number font-extrabold tabular-nums"
        style={at(ROW.top, col)}
      >
        {lender ? (
          <button
            type="button"
            onClick={onResolve}
            aria-label={fr.games.train.borrowButton}
            className="anim-beckon flex min-h-tap min-w-tap items-center justify-center rounded-2xl bg-[#ffd66b] px-2 text-number font-extrabold text-ink shadow-md focus-visible:outline-4 focus-visible:outline-primary"
          >
            {shown}
          </button>
        ) : (
          <span className={changed ? 'text-ink-soft line-through decoration-help decoration-4' : ''}>
            {top}
          </span>
        )}
      </div>,
      <div
        key={`bottom-${k}`}
        className="z-10 mx-1 flex items-center justify-center border-b-4 border-ink text-number font-extrabold tabular-nums"
        style={at(ROW.bottom, col)}
      >
        {bottom}
      </div>,
      <div
        key={`result-${k}`}
        className="z-10 flex items-center justify-center p-1"
        style={at(ROW.result, col)}
      >
        {resultIndex !== null && (
          <span
            aria-label={fr.games.train.cell(
              fr.games.train.columns[k] ?? '',
              digit === null ? fr.games.train.empty : String(digit),
            )}
            className={`flex h-full w-full max-w-16 items-center justify-center rounded-2xl border-4 text-number font-extrabold tabular-nums ${
              isActive
                ? 'anim-beckon border-dashed border-primary bg-primary-soft text-primary'
                : toneClass[tone]
            }`}
          >
            {digit ?? ''}
          </span>
        )}
      </div>,
      <div key={`wheels-${k}`} aria-hidden="true" className="flex justify-around" style={at(ROW.wheels, col)}>
        <span className="size-6 rounded-full border-4 border-ink bg-[#ffd66b]" />
        <span className="size-6 rounded-full border-4 border-ink bg-[#ffd66b]" />
      </div>,
    );
  }

  return (
    <figure
      aria-label={label}
      className="grid items-stretch"
      style={{
        gridTemplateColumns: `2.5rem repeat(${width}, minmax(0, 5.5rem)) minmax(0, 7rem)`,
        gridTemplateRows: '1.75rem 3rem 3.75rem 3.75rem 4.75rem 1.75rem 0.75rem',
      }}
    >
      <span
        aria-hidden="true"
        className="z-10 flex items-center justify-center border-b-4 border-ink text-number font-extrabold"
        style={at(ROW.bottom, 1)}
      >
        {layout.op}
      </span>
      {cells}
      <div className="self-end" style={at(ROW.carry, width + 2, { gridRowEnd: ROW.wheels + 1 })}>
        <Locomotive />
      </div>
      {/* Les rails, sous tout le train. */}
      <div
        aria-hidden="true"
        className="mt-0.5 h-2 rounded-full bg-[repeating-linear-gradient(90deg,#8a6a4a_0_6px,transparent_6px_18px)] shadow-[0_3px_0_#57527a]"
        style={at(ROW.rails, 1, { gridColumnEnd: width + 3 })}
      />
    </figure>
  );
}
