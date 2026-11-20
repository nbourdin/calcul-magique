import { useState } from 'react';
import { fr } from '@/i18n/fr';
import { Equation } from '@/ui/Equation';
import { NumPad } from '@/ui/NumPad';
import { AidButton } from '../AidButton';
import type { GameProps } from '../types';
import { useAid } from '../useAid';
import { useResponseTimer } from '../useResponseTimer';
import { wingsOf, type Wings } from './wings';

const WING_FILL = '#e8defa';
const DOT_LIMIT = 10;

/** Points d'une aile, en colonnes de 5 (comme une boîte de dix), si le nombre est petit. */
function Dots({ n, cx, mirror }: { n: number; cx: number; mirror: boolean }) {
  if (n > DOT_LIMIT) return null;
  return (
    <g>
      {Array.from({ length: n }, (_, i) => {
        const col = Math.floor(i / 5);
        const row = i % 5;
        const dx = (col === 0 ? -16 : 16) * (mirror ? -1 : 1);
        return <circle key={i} cx={cx + dx} cy={70 + row * 28} r="10" fill="#6a4ab5" />;
      })}
    </g>
  );
}

/** Le papillon : deux ailes identiques de part et d'autre du corps. */
function Butterfly({ wings, dots, revealTotal }: { wings: Wings; dots: boolean; revealTotal: boolean }) {
  const { mode, wing, total } = wings;
  const half = mode === 'half';
  const leftValue = half ? (revealTotal ? String(wing) : '?') : String(wing);
  const rightValue = leftValue;
  const label = half
    ? fr.games.butterfly.halfLabel(total)
    : fr.games.butterfly.wingsLabel(wing, wing, mode === 'near');
  return (
    <svg viewBox="0 0 400 300" className="w-full max-w-md" role="img" aria-label={label}>
      {/* Ailes : à gauche l'original, à droite le reflet. */}
      <path
        d="M196 150 C120 10 20 20 30 120 C36 175 110 190 196 160 Z"
        fill={WING_FILL}
        stroke="#6a4ab5"
        strokeWidth="4"
      />
      <path
        d="M196 165 C120 175 50 230 90 270 C130 300 185 240 196 180 Z"
        fill={WING_FILL}
        stroke="#6a4ab5"
        strokeWidth="4"
      />
      {/* Le reflet se déplie à l'arrivée de la question : l'aile droite copie la gauche. */}
      <g className="anim-mirror">
        <path
          d="M204 150 C280 10 380 20 370 120 C364 175 290 190 204 160 Z"
          fill={WING_FILL}
          stroke="#6a4ab5"
          strokeWidth="4"
        />
        <path
          d="M204 165 C280 175 350 230 310 270 C270 300 215 240 204 180 Z"
          fill={WING_FILL}
          stroke="#6a4ab5"
          strokeWidth="4"
        />
      </g>
      {/* Corps et antennes. */}
      <ellipse cx="200" cy="165" rx="12" ry="80" fill="#2e2a4f" />
      <path
        d="M196 90 Q180 50 166 40 M204 90 Q220 50 234 40"
        stroke="#2e2a4f"
        strokeWidth="4"
        fill="none"
        strokeLinecap="round"
      />
      {/* Aide : des points à compter (pour une moitié, déjà partagés entre les ailes). */}
      {dots && <Dots n={wing} cx={110} mirror={false} />}
      {dots && <Dots n={wing} cx={290} mirror />}
      <text x="110" y="250" textAnchor="middle" fontSize="44" fontWeight="800" fill="#2e2a4f">
        {leftValue}
      </text>
      <text x="290" y="250" textAnchor="middle" fontSize="44" fontWeight="800" fill="#2e2a4f">
        {rightValue}
      </text>
      {/* Presque-double : le petit +1 en plus du reflet. */}
      {mode === 'near' && (
        <g className="anim-pop-in [animation-delay:600ms]">
          <circle cx="352" cy="40" r="26" fill="#ffd66b" stroke="#2e2a4f" strokeWidth="3" />
          <text x="352" y="50" textAnchor="middle" fontSize="28" fontWeight="800" fill="#2e2a4f">
            +1
          </text>
        </g>
      )}
      {/* Moitié : le total est porté par le papillon, à partager entre les deux ailes. */}
      {half && (
        <g>
          <rect
            x="160"
            y="8"
            width="80"
            height="44"
            rx="22"
            fill="#fff1c9"
            stroke="#2e2a4f"
            strokeWidth="3"
          />
          <text x="200" y="40" textAnchor="middle" fontSize="28" fontWeight="800" fill="#2e2a4f">
            {total}
          </text>
        </g>
      )}
    </svg>
  );
}

/**
 * Jeu 7 — Le Papillon des doubles (doubles, moitiés, presque-doubles).
 * Les deux ailes d'un papillon sont identiques : le double se voit.
 * À l'arrivée de la question, l'aile droite se déplie en reflet de la gauche (puis « +1 » pour
 * un presque-double). Niveau 1 : 3 propositions ; niveaux 2-3 : pavé numérique.
 * Moitié : le total est sur le papillon, combien sur chaque aile ?
 * Les points sur les ailes sont l'aide visuelle (réglable) ; les nombres restent toujours.
 */
export function ButterflyGame({ question, active, aid, onAnswer }: GameProps) {
  const elapsed = useResponseTimer();
  const help = useAid(aid, question.level);
  const wings = wingsOf(question);
  const guided = question.level === 1;
  const [typed, setTyped] = useState('');
  const [picked, setPicked] = useState<number | null>(null);
  const answered = picked !== null;
  const correct = picked === question.answer;
  const tone = !answered ? 'idle' : correct ? 'success' : 'help';

  const answer = (value: number) => {
    if (!active || answered) return;
    setPicked(value);
    onAnswer(value === question.answer, elapsed());
  };

  const instruction =
    wings.mode === 'half'
      ? fr.games.butterfly.half
      : wings.mode === 'near'
        ? fr.games.butterfly.near
        : fr.games.butterfly.double;

  return (
    <div className="flex flex-1 flex-col items-center gap-4">
      <Equation
        display={question.display}
        wording={question.wording}
        slot={answered ? String(picked) : typed}
        tone={tone}
      />
      <p className="text-center text-instruction font-bold" aria-live="polite">
        {instruction}
      </p>
      <Butterfly wings={wings} dots={help.visible || answered} revealTotal={answered} />
      {!answered && help.canAsk && <AidButton onClick={help.ask} disabled={!active} />}

      <div className="mt-auto w-full">
        {guided && question.choices ? (
          <div className="flex justify-center gap-4 pb-4">
            {question.choices.map((c) => (
              <button
                data-answer
                key={c}
                type="button"
                disabled={!active || answered}
                onClick={() => answer(c)}
                aria-label={fr.play.choiceLabel(c)}
                className={`min-h-touch min-w-touch rounded-3xl px-6 text-number font-extrabold shadow-[0_6px_0_rgb(0_0_0/0.15)] focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-primary ${
                  picked === c
                    ? correct
                      ? 'bg-success text-white'
                      : 'anim-shake bg-help-soft'
                    : 'bg-surface'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        ) : (
          <NumPad
            value={typed}
            onChange={setTyped}
            onSubmit={() => answer(Number(typed))}
            disabled={!active || answered}
          />
        )}
      </div>
    </div>
  );
}
