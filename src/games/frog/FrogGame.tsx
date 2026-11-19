import { useEffect, useMemo, useState } from 'react';
import { fr } from '@/i18n/fr';
import { Equation } from '@/ui/Equation';
import { NumPad } from '@/ui/NumPad';
import type { GameProps } from '../types';
import { useResponseTimer } from '../useResponseTimer';
import { frogJumps, jumpLabel } from './jumps';
import { NumberLine } from './NumberLine';

const REPLAY_STEP_MS = 650;

/**
 * Jeu 2 — Le Saut de la grenouille (P9, M9, D10, TAD, doubles, tables).
 * Niveau 1 : l'enfant fait les sauts (+10 puis −1) puis tape le résultat.
 * Niveaux 2-3 : réponse directe ; les sauts s'animent ensuite, comme aide ou comme bravo.
 */
export function FrogGame({ question, active, onAnswer }: GameProps) {
  const elapsed = useResponseTimer();
  const { start, jumps } = useMemo(() => frogJumps(question), [question]);
  const guided = question.level === 1;
  const [done, setDone] = useState(0);
  const [shake, setShake] = useState<string | null>(null);
  const [typed, setTyped] = useState('');
  const [picked, setPicked] = useState<number | null>(null);

  const answered = picked !== null;
  const tone = !answered ? 'idle' : picked === question.answer ? 'success' : 'help';
  const jumpsDone = guided && done === jumps.length;

  // Boutons de saut : les sauts distincts, dans un ordre stable propre à la question.
  const buttons = useMemo(() => {
    const labels = [...new Set(jumps.map(jumpLabel))];
    return question.id.length % 2 === 0 ? labels : [...labels].reverse();
  }, [jumps, question.id]);

  // Après la réponse, la grenouille rejoue les sauts (aide ou célébration).
  useEffect(() => {
    if (!answered || done >= jumps.length) return;
    const timer = setTimeout(() => setDone((d) => d + 1), done === 0 ? 150 : REPLAY_STEP_MS);
    return () => clearTimeout(timer);
  }, [answered, done, jumps.length]);

  const tapJump = (label: string) => {
    if (!active || answered) return;
    const next = jumps[done];
    if (next && jumpLabel(next) === label) {
      setDone(done + 1);
    } else {
      // Mauvais ordre : petit refus, sans pénalité.
      setShake(label);
      setTimeout(() => setShake(null), 400);
    }
  };

  const submit = () => {
    if (!active || answered || typed === '') return;
    const value = Number(typed);
    setPicked(value);
    if (!guided) setDone(0);
    onAnswer(value === question.answer, elapsed());
  };

  return (
    <div className="flex flex-1 flex-col items-center gap-4">
      <p className="text-center text-instruction font-bold">
        {guided && !jumpsDone ? fr.games.frog.guided : fr.games.frog.answer}
      </p>
      <Equation
        display={question.display}
        wording={question.wording}
        slot={answered ? String(picked) : typed}
        tone={tone}
      />
      <NumberLine start={start} jumps={jumps} done={done} revealPosition={answered} />

      <div className="mt-auto w-full">
        {guided && !jumpsDone ? (
          <div className="flex flex-wrap justify-center gap-4 pb-4">
            {buttons.map((label) => (
              <button
                key={label}
                type="button"
                disabled={!active}
                onClick={() => tapJump(label)}
                aria-label={fr.games.frog.jump(label)}
                className={`min-h-touch min-w-32 rounded-3xl bg-primary px-6 text-number font-extrabold text-white shadow-[0_6px_0_rgb(0_0_0/0.18)] transition active:translate-y-1 focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-primary ${
                  shake === label ? 'anim-shake' : ''
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        ) : (
          <NumPad value={typed} onChange={setTyped} onSubmit={submit} disabled={!active || answered} />
        )}
      </div>
    </div>
  );
}
