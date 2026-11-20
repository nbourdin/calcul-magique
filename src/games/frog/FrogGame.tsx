import { useEffect, useMemo, useState } from 'react';
import { playSound } from '@/app/audio';
import { fr } from '@/i18n/fr';
import { Equation } from '@/ui/Equation';
import { Icon } from '@/ui/Icon';
import { NumPad } from '@/ui/NumPad';
import type { GameProps } from '../types';
import { AidButton } from '../AidButton';
import { useAid } from '../useAid';
import { useResponseTimer } from '../useResponseTimer';
import { frogJumps, jumpLabel, type Jump } from './jumps';
import { NumberLine } from './NumberLine';

const REPLAY_STEP_MS = 650;

/** Consigne d'un saut : « Avance de 10 ! », « Recule de 1 ! ». */
function stepInstruction(j: Jump): string {
  return j.to >= j.from ? fr.games.frog.forward(j.to - j.from) : fr.games.frog.backward(j.from - j.to);
}

/**
 * Jeu 2 — Le Saut de la grenouille (P9, M9, D10, TAD, doubles, tables…).
 * Le trajet est dessiné en pointillés sur la droite : la stratégie se voit avant de calculer.
 * Niveau 1 : l'enfant fait les sauts un par un, dans l'ordre, puis lit le nombre d'arrivée.
 * Niveaux 2-3 : l'enfant prévoit l'arrivée ; la grenouille saute ensuite (bravo ou aide).
 */
export function FrogGame({ question, active, aid, onAnswer }: GameProps) {
  const elapsed = useResponseTimer();
  const help = useAid(aid, question.level);
  const { start, jumps } = useMemo(() => frogJumps(question), [question]);
  const guided = question.level === 1;
  const [done, setDone] = useState(0);
  const [typed, setTyped] = useState('');
  const [picked, setPicked] = useState<number | null>(null);

  const answered = picked !== null;
  const tone = !answered ? 'idle' : picked === question.answer ? 'success' : 'help';
  const jumping = guided && done < jumps.length && !answered;
  const next = jumps[done];

  useEffect(() => {
    if (done > 0) playSound('jump');
  }, [done]);

  // Après la réponse, la grenouille fait (ou refait) les sauts : aide ou célébration.
  useEffect(() => {
    if (!answered || done >= jumps.length) return;
    const timer = setTimeout(() => setDone((d) => d + 1), done === 0 ? 150 : REPLAY_STEP_MS);
    return () => clearTimeout(timer);
  }, [answered, done, jumps.length]);

  const tapJump = (index: number) => {
    if (!active || answered || index !== done) return;
    setDone(done + 1);
  };

  const submit = () => {
    if (!active || answered || typed === '') return;
    const value = Number(typed);
    setPicked(value);
    if (!guided) setDone(0);
    onAnswer(value === question.answer, elapsed());
  };

  const instruction =
    jumping && next ? stepInstruction(next) : guided ? fr.games.frog.landed : fr.games.frog.predict;

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
      {/* Au niveau 1, les boutons de saut sont le jeu : le trajet reste dessiné. */}
      <NumberLine
        start={start}
        jumps={jumps}
        done={done}
        revealPosition={answered}
        showPlan={!answered && (guided || help.visible)}
      />
      {!guided && !answered && help.canAsk && <AidButton onClick={help.ask} disabled={!active} />}

      {guided && (
        // Les sauts du trajet, dans l'ordre : faits (✓), à faire maintenant, puis les suivants.
        <ol className="flex flex-wrap justify-center gap-3">
          {jumps.map((j, i) => {
            const label = jumpLabel(j);
            const state = i < done ? 'done' : i === done && jumping ? 'now' : 'later';
            return (
              <li key={i}>
                <button
                  type="button"
                  disabled={!active || state !== 'now'}
                  onClick={() => tapJump(i)}
                  aria-label={fr.games.frog.jump(label)}
                  className={`flex min-h-touch min-w-28 items-center justify-center gap-2 rounded-3xl px-5 text-number font-extrabold transition focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-primary ${
                    state === 'now'
                      ? 'anim-beckon bg-primary text-white shadow-[0_6px_0_rgb(0_0_0/0.18)] active:translate-y-1'
                      : state === 'done'
                        ? 'bg-success-soft text-success'
                        : 'border-4 border-dashed border-primary-soft bg-surface text-ink-soft'
                  }`}
                >
                  {state === 'done' && <Icon name="check" className="size-7" />}
                  {label}
                </button>
              </li>
            );
          })}
        </ol>
      )}

      {!jumping && (
        <div className="mt-auto w-full">
          <NumPad value={typed} onChange={setTyped} onSubmit={submit} disabled={!active || answered} />
        </div>
      )}
    </div>
  );
}
