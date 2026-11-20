import { useMemo, useState } from 'react';
import { playSound } from '@/app/audio';
import { evaluate } from '@/domain/display';
import { fr } from '@/i18n/fr';
import { Equation } from '@/ui/Equation';
import type { GameProps } from '../types';
import { useResponseTimer } from '../useResponseTimer';

const BUBBLE_COUNT = 5;
const COLORS = ['#bfe6ff', '#fbd3e3', '#d8f3e8', '#e8defa', '#fff1c9'];

/** Valeurs des bulles : la bonne, les propositions, puis des voisins (toutes différentes, ≥ 0). */
function bubbleValues(answer: number, choices: readonly number[], max: number): number[] {
  const values = new Set([answer, ...choices]);
  for (let k = 1; values.size < BUBBLE_COUNT && k < 20; k++) {
    for (const v of [answer + k, answer - k])
      if (v >= 0 && v <= max && values.size < BUBBLE_COUNT) values.add(v);
  }
  // Ordre mélangé mais stable pour la question.
  return [...values].sort((a, b) => ((a * 7919) % 13) - ((b * 7919) % 13));
}

/**
 * Jeu 3 — Les Bulles magiques (compléments à 10, à 20, dizaine suivante).
 * Le premier nombre est déjà dans le chaudron ; l'enfant éclate la bulle qui complète.
 * Les bulles flottent lentement sans jamais disparaître : aucune perte, aucune pression.
 */
export function BubblesGame({ question, active, onAnswer }: GameProps) {
  const elapsed = useResponseTimer();
  const target = evaluate(question.display);
  const values = useMemo(
    () => bubbleValues(question.answer, question.choices ?? [], target),
    [question.answer, question.choices, target],
  );
  const [picked, setPicked] = useState<number | null>(null);
  const answered = picked !== null;
  const correct = picked === question.answer;

  const pop = (value: number) => {
    if (!active || answered) return;
    setPicked(value);
    if (value === question.answer) playSound('bubble');
    onAnswer(value === question.answer, elapsed());
  };

  return (
    <div className="flex flex-1 flex-col items-center gap-4">
      <p className="text-center text-instruction font-bold">{fr.games.bubbles.instruction(target)}</p>
      <Equation
        display={question.display}
        slot={answered ? String(picked) : ''}
        tone={!answered ? 'idle' : correct ? 'success' : 'help'}
      />
      <div className="relative h-[22rem] w-full overflow-hidden rounded-3xl bg-gradient-to-b from-sky to-[#f3eefc]">
        {values.map((value, i) => {
          const isPicked = picked === value;
          return (
            <button
              data-answer
              key={value}
              type="button"
              disabled={!active || answered}
              onClick={() => pop(value)}
              aria-label={fr.games.bubbles.bubble(value)}
              className={`bubble absolute flex size-24 items-center justify-center rounded-full border-4 border-white/80 text-number font-extrabold text-ink shadow-[inset_-8px_-10px_0_rgb(255_255_255/0.5)] focus-visible:outline-4 focus-visible:outline-primary ${
                isPicked && correct ? 'bubble-pop' : isPicked ? 'anim-shake border-help' : ''
              }`}
              style={{
                left: `calc(${((i + 0.5) / values.length) * 100}% - 3rem)`,
                top: `calc(${i % 2 === 0 ? 30 : 62}% - 3rem)`,
                background: COLORS[i % COLORS.length],
                animationDuration: `${5 + (i % 3)}s`,
                animationDelay: `${-i * 1.7}s`,
              }}
            >
              {value}
            </button>
          );
        })}
      </div>
    </div>
  );
}
