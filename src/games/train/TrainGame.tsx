import { useMemo, useState } from 'react';
import { playSound } from '@/app/audio';
import { columnLayout, type ColumnLayout } from '@/domain/column';
import { fr } from '@/i18n/fr';
import { NumPad } from '@/ui/NumPad';
import type { GameProps } from '../types';
import { useResponseTimer } from '../useResponseTimer';
import { ColumnBoard } from './ColumnBoard';
import {
  activeCell,
  emptyEntry,
  entryValue,
  eraseDigit,
  pendingAction,
  resolvePending,
  typeDigit,
  type Entry,
} from './entry';

/**
 * Jeu 6 — Le Petit Train (additions et soustractions posées).
 * Chaque wagon porte une colonne ; l'enfant remplit le résultat de droite à gauche.
 * Retenue : une étoile à toucher pour la poser sur le wagon des dizaines.
 * Emprunt : on touche la dizaine du wagon voisin pour la casser en dix unités.
 * Bonne réponse : le train part en sifflant, un nouveau train arrive à la question suivante.
 */
export function TrainGame(props: GameProps) {
  const { display, factKey } = props.question;
  const layout = useMemo(() => columnLayout(display), [display]);
  if (!layout) throw new Error(`Le Petit Train ne sait pas poser ${factKey}`);
  return <Train {...props} layout={layout} />;
}

function Train({ question, active, onAnswer, layout }: GameProps & { layout: ColumnLayout }) {
  const elapsed = useResponseTimer();
  const [entry, setEntry] = useState<Entry>(() => emptyEntry(layout));
  const [picked, setPicked] = useState<number | null>(null);

  const answered = picked !== null;
  const correct = picked === question.answer;
  const pending = pendingAction(layout, entry);
  const value = entryValue(entry);
  const locked = !active || answered;

  const resolve = () => {
    if (locked) return;
    playSound('bubble');
    setEntry(resolvePending(layout, entry));
  };

  const submit = () => {
    if (locked || value === null) return;
    setPicked(value);
    onAnswer(value === question.answer, elapsed());
  };

  const instruction = answered
    ? correct
      ? fr.games.train.departed
      : fr.games.train.instruction
    : pending?.kind === 'carry'
      ? fr.games.train.carry
      : pending?.kind === 'borrow'
        ? fr.games.train.borrow
        : value !== null
          ? fr.games.train.check
          : fr.games.train.instruction;

  return (
    <div className="flex flex-1 flex-col items-center gap-4">
      <p className="text-center text-instruction font-bold" aria-live="polite">
        {instruction}
      </p>
      <div className="w-full overflow-hidden py-2">
        <div
          className={`mx-auto w-fit ${answered && correct ? 'anim-train-out' : answered ? 'anim-shake' : 'anim-train-in'}`}
        >
          <ColumnBoard
            layout={layout}
            entry={entry}
            activeCell={locked ? null : activeCell(entry)}
            pending={locked ? null : pending}
            onResolve={resolve}
            tone={!answered ? 'idle' : correct ? 'success' : 'help'}
            label={fr.games.train.board(question.display.a, question.display.op, question.display.b ?? 0)}
          />
        </div>
      </div>
      <div className="mt-auto w-full">
        <NumPad
          value=""
          onChange={() => undefined}
          onSubmit={submit}
          disabled={locked}
          custom={{
            onDigit: (d) => setEntry(typeDigit(layout, entry, d)),
            onErase: () => setEntry(eraseDigit(entry)),
            canErase: entry.digits.some((d) => d !== null),
            canSubmit: value !== null,
          }}
        />
      </div>
    </div>
  );
}
