import { useEffect, useState } from 'react';
import { fr } from '@/i18n/fr';
import { Equation } from '@/ui/Equation';
import type { GameProps } from '../types';
import { useResponseTimer } from '../useResponseTimer';

/** Avancée du poney par bonne réponse, en % de la piste. */
const STRIDE = 7;
const LANE_TONE = ['bg-sky', 'bg-mint', 'bg-rose'];

function Pony({ tripped }: { tripped: boolean }) {
  return (
    <svg viewBox="0 0 80 64" className={`w-24 ${tripped ? 'anim-shake' : ''}`} aria-hidden="true">
      <path d="M14 30 q-10 4-10 16" stroke="#e76f8a" strokeWidth="6" fill="none" strokeLinecap="round" />
      <ellipse cx="36" cy="34" rx="22" ry="13" fill="#fff" stroke="#2e2a4f" strokeWidth="3" />
      <path d="M22 44v14M30 44v14M44 44v14M52 44v14" stroke="#2e2a4f" strokeWidth="4" strokeLinecap="round" />
      <path
        d="M50 28 q4-20 18-20 q8 2 6 12 q-4 6-12 6 l-4 8z"
        fill="#fff"
        stroke="#2e2a4f"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <path d="M56 10 q6-8 14-4 q-6 2-6 8z" fill="#b9a3e3" stroke="#2e2a4f" strokeWidth="2" />
      <circle cx="66" cy="14" r="2.2" fill="#2e2a4f" />
    </svg>
  );
}

/**
 * Jeu 4 — La Course des doubles (doubles, presque-doubles, tables… toute question à 3 propositions).
 * Le poney avance d'une foulée par bonne réponse ; une erreur le fait trébucher gentiment.
 * Au clavier : touches 1, 2, 3.
 */
export function RaceGame({ question, active, progress = 0, onAnswer }: GameProps) {
  const elapsed = useResponseTimer();
  const choices = question.choices ?? [];
  const [lane, setLane] = useState(1);
  const [picked, setPicked] = useState<number | null>(null);
  const answered = picked !== null;
  const correct = picked === question.answer;
  const x = 4 + progress * 70 + (answered && correct ? STRIDE : 0);

  const choose = (index: number) => {
    const value = choices[index];
    if (!active || answered || value === undefined) return;
    setLane(index);
    setPicked(value);
    onAnswer(value === question.answer, elapsed());
  };

  useEffect(() => {
    if (!active || answered) return;
    const onKey = (e: KeyboardEvent) => {
      const n = Number(e.key);
      if (n >= 1 && n <= choices.length) {
        e.preventDefault();
        choose(n - 1);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  return (
    <div className="flex flex-1 flex-col items-center gap-5">
      <p className="text-center text-instruction font-bold">{fr.games.race.instruction}</p>
      <Equation
        display={question.display}
        wording={question.wording}
        slot={answered ? String(picked) : ''}
        tone={!answered ? 'idle' : correct ? 'success' : 'help'}
      />
      <div className="relative flex w-full flex-col gap-2 rounded-3xl bg-[#f3e3c7] p-2">
        {choices.map((value, i) => (
          <div key={i} className={`relative flex h-20 items-center rounded-2xl ${LANE_TONE[i % 3]}`}>
            {lane === i && (
              <div
                className="absolute top-1/2 -translate-y-1/2 transition-[left] duration-700 ease-out"
                style={{ left: `${x}%` }}
                aria-label={fr.games.race.pony}
                role="img"
              >
                <Pony tripped={answered && !correct} />
              </div>
            )}
            <button
              type="button"
              disabled={!active || answered}
              onClick={() => choose(i)}
              aria-label={fr.games.race.lane(value, i + 1)}
              className={`absolute right-2 flex min-h-touch min-w-24 items-center justify-center gap-2 rounded-2xl border-4 px-4 text-number font-extrabold shadow-[0_5px_0_rgb(0_0_0/0.15)] transition focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-primary ${
                picked === value
                  ? correct
                    ? 'border-success bg-success text-white'
                    : 'border-help bg-help text-white'
                  : 'border-ink/20 bg-surface text-ink'
              }`}
            >
              <span className="text-base font-bold text-ink-soft" aria-hidden="true">
                {i + 1}
              </span>
              {value}
            </button>
          </div>
        ))}
        <div className="pointer-events-none absolute inset-y-2 right-32 w-2 rounded bg-[repeating-linear-gradient(#2e2a4f_0_8px,#fff_8px_16px)]" />
      </div>
    </div>
  );
}
