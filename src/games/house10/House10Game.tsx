import { useRef, useState } from 'react';
import { evaluate } from '@/domain/display';
import { fr } from '@/i18n/fr';
import { Equation } from '@/ui/Equation';
import { NumPad } from '@/ui/NumPad';
import type { GameProps } from '../types';
import { useResponseTimer } from '../useResponseTimer';
import { ChoiceCard } from './ChoiceCard';
import { House } from './House';

/** Fenêtres allumées au départ et nombre de maisons selon la compétence. */
function houseSetup(question: GameProps['question']): { lit: number[]; target: number } {
  const target = evaluate(question.display);
  const given = question.display.missing === 'a' ? (question.display.b ?? 0) : question.display.a;
  if (question.skillId === 'C20') return { lit: [Math.min(given, 10), Math.max(given - 10, 0)], target };
  if (question.skillId === 'CDS') return { lit: [given % 10], target };
  return { lit: [given], target };
}

/** Répartit `count` fenêtres à allumer de maison en maison. */
function fillWindows(lit: readonly number[], count: number): number[] {
  return lit.reduce<{ out: number[]; left: number }>(
    (acc, n) => {
      const add = Math.min(acc.left, 10 - n);
      return { out: [...acc.out, add], left: acc.left - add };
    },
    { out: [], left: count },
  ).out;
}

function instruction(question: GameProps['question'], target: number): string {
  const t = fr.games.house10;
  if (question.display.missing === 'a') return t.instructionMissingFirst;
  return target === 10 ? t.instruction : t.instructionTarget(target);
}

/**
 * Jeu 1 — La Maison du 10 (C10, C20, CDS).
 * Niveau 1 : maison visible, on pose la bonne carte-nombre sur la maison.
 * Niveaux 2-3 : pavé numérique, maison masquée jusqu'à la réponse.
 */
export function House10Game({ question, active, onAnswer }: GameProps) {
  const elapsed = useResponseTimer();
  const houseRef = useRef<HTMLDivElement>(null);
  const [typed, setTyped] = useState('');
  const [picked, setPicked] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const { lit, target } = houseSetup(question);
  const useChoices = question.level === 1 && question.choices !== undefined;

  const answered = picked !== null;
  const correct = picked === question.answer;
  const tone = !answered ? 'idle' : correct ? 'success' : 'help';
  const showHouse = question.level === 1 || answered;

  const answer = (value: number) => {
    if (!active || answered) return;
    setPicked(value);
    onAnswer(value === question.answer, elapsed());
  };

  // Après la réponse, la maison montre toujours la bonne solution (fenêtres ajoutées par maison).
  const added = fillWindows(lit, answered ? question.answer : 0);

  return (
    <div className="flex flex-1 flex-col items-center gap-5">
      <p className="text-center text-instruction font-bold">{instruction(question, target)}</p>

      {showHouse && (
        <div ref={houseRef} className="flex w-full justify-center gap-3">
          {lit.map((n, i) => (
            <House key={i} lit={n} added={added[i] ?? 0} highlight={dragOver} />
          ))}
        </div>
      )}

      <Equation display={question.display} slot={answered ? String(picked) : typed} tone={tone} />

      <div className="mt-auto w-full">
        {useChoices ? (
          <>
            <p className="sr-only">{fr.games.house10.dropHere}</p>
            <div className="flex justify-center gap-4 pb-4">
              {question.choices?.map((c) => (
                <ChoiceCard
                  key={c}
                  value={c}
                  disabled={!active || answered}
                  state={picked === c ? tone : 'idle'}
                  dropTarget={houseRef}
                  onPick={answer}
                  onDragOver={setDragOver}
                />
              ))}
            </div>
          </>
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
