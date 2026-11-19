import { useId } from 'react';
import type { Character } from '@/assets/characters';
import { PUZZLE_PIECES } from '@/domain/rewards/puzzle';
import { fr } from '@/i18n/fr';

const SIZE = 300;
const CELL = SIZE / 3;

interface PuzzleProps {
  character: Character;
  /** Indices des pièces posées (0 à 8, ligne par ligne). */
  placed: readonly number[];
  /** Pièce qui vient d'être gagnée : elle « vole » vers sa place. */
  newPiece?: number | undefined;
  /** Masque le nom (personnage pas encore choisi). */
  mystery?: boolean;
  className?: string;
}

const cellRect = (i: number) => ({
  x: (i % 3) * CELL,
  y: Math.floor(i / 3) * CELL,
  width: CELL,
  height: CELL,
});

/**
 * Puzzle 3×3 : l'image est grisée et floutée, chaque pièce posée la colore.
 * L'illustration est un fichier quelconque : aucune dépendance au dessin précis.
 */
export function Puzzle({ character, placed, newPiece, mystery = false, className = 'w-full' }: PuzzleProps) {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const settled = placed.filter((i) => i !== newPiece);
  const complete = placed.length >= PUZZLE_PIECES;
  const name = mystery ? fr.puzzle.mystery : character.name;

  return (
    <svg
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      role="img"
      aria-label={fr.puzzle.label(name, placed.length)}
      className={`rounded-3xl ${className}`}
    >
      <defs>
        <filter id={`${uid}-grey`}>
          <feColorMatrix type="saturate" values="0" />
          <feGaussianBlur stdDeviation="5" />
        </filter>
        <clipPath id={`${uid}-placed`}>
          {settled.map((i) => (
            <rect key={i} {...cellRect(i)} />
          ))}
        </clipPath>
        {newPiece !== undefined && (
          <clipPath id={`${uid}-new`}>
            <rect {...cellRect(newPiece)} />
          </clipPath>
        )}
      </defs>
      <rect width={SIZE} height={SIZE} fill="#ffffff" />
      {!complete && (
        <image
          href={character.image}
          width={SIZE}
          height={SIZE}
          filter={`url(#${uid}-grey)`}
          opacity="0.45"
        />
      )}
      <image
        href={character.image}
        width={SIZE}
        height={SIZE}
        clipPath={complete && newPiece === undefined ? undefined : `url(#${uid}-placed)`}
      />
      {newPiece !== undefined && (
        <g className="anim-piece-fly">
          <image href={character.image} width={SIZE} height={SIZE} clipPath={`url(#${uid}-new)`} />
          <rect {...cellRect(newPiece)} fill="none" stroke="#ffd66b" strokeWidth="6" />
        </g>
      )}
      {!complete && (
        <g stroke="#ffffff" strokeWidth="3" opacity="0.9">
          <path d={`M${CELL} 0V${SIZE}M${2 * CELL} 0V${SIZE}M0 ${CELL}H${SIZE}M0 ${2 * CELL}H${SIZE}`} />
        </g>
      )}
    </svg>
  );
}
