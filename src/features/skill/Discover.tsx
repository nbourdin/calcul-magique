import { useEffect, useMemo, useState } from 'react';
import { evaluate } from '@/domain/display';
import { createRng } from '@/domain/rng';
import { factsFor, questionForFact } from '@/domain/skills';
import type { SkillId } from '@/domain/types';
import { frogJumps } from '@/games/frog/jumps';
import { NumberLine } from '@/games/frog/NumberLine';
import { House } from '@/games/house10/House';
import { fr } from '@/i18n/fr';
import { Button } from '@/ui/Button';
import { Equation } from '@/ui/Equation';

/** Exemple montré pour chaque compétence (toujours le même, au niveau 1). */
const DEMO_FACTS: Record<SkillId, string> = {
  C10: 'c10:7',
  C20: 'c20:13',
  CDS: 'cds:7',
  DBL: 'dbl:6',
  PDB: 'pdb:6+7',
  TAD: 'tad:8+5',
  P9: 'p9:6',
  M9: 'm9:23',
  D10: 'd10:34+10',
  T2: 'x:2x4',
  T5: 'x:5x3',
  T10: 'x:10x4',
  T3: 'x:3x4',
  T4: 'x:4x3',
};

const HOUSE_SKILLS: readonly SkillId[] = ['C10', 'C20', 'CDS'];
/** Rythme de la démonstration : 20 à 30 s en tout avec l'essai (PRD §5). */
const STEP_MS = 4000;

/**
 * « Je découvre » (PRD §5) : la stratégie animée sur un exemple (environ 20 à 30 s),
 * puis l'enfant répond elle-même à l'exemple guidé.
 */
export function Discover({ skillId, onDone }: { skillId: SkillId; onDone: () => void }) {
  const [demo, practice] = useMemo(() => {
    // Exemple montré, puis un second exemple que l'enfant résout elle-même.
    const facts = factsFor(skillId, 1);
    const next = facts[(facts.indexOf(DEMO_FACTS[skillId]) + 1) % facts.length] ?? DEMO_FACTS[skillId];
    return [
      questionForFact(skillId, DEMO_FACTS[skillId], 1, createRng(7)),
      questionForFact(skillId, next, 1, createRng(8)),
    ];
  }, [skillId]);
  const [shown, setShown] = useState(0);
  const [phase, setPhase] = useState<'demo' | 'try' | 'done'>('demo');
  const [wrong, setWrong] = useState<number | null>(null);
  const question = phase === 'demo' ? demo : practice;
  const steps = question.strategy?.steps ?? [];
  const allShown = shown >= steps.length;

  // Les étapes apparaissent une à une ; « Et ensuite ? » permet d'aller plus vite.
  useEffect(() => {
    if (phase !== 'demo' || allShown) return;
    const timer = setTimeout(() => setShown((n) => n + 1), STEP_MS);
    return () => clearTimeout(timer);
  }, [phase, allShown, shown]);

  // À l'essai, la stratégie ne se montre qu'après une erreur.
  const ratio =
    phase === 'try' && wrong === null ? 0 : steps.length === 0 ? 1 : Math.min(1, shown / steps.length);
  const visual = HOUSE_SKILLS.includes(skillId) ? (
    <HouseDemo
      given={question.display.a}
      target={evaluate(question.display)}
      reveal={ratio >= 1 ? question.answer : 0}
    />
  ) : (
    <FrogDemo question={question} ratio={ratio} />
  );

  return (
    <section className="flex w-full flex-col items-center gap-5 text-center">
      <h1 className="text-3xl font-extrabold text-primary">{fr.discover.title}</h1>
      <p className="text-2xl font-bold">{fr.discover.intro[skillId]}</p>
      <Equation
        display={question.display}
        wording={question.wording}
        slot={phase === 'done' || (phase === 'demo' && allShown) ? String(question.answer) : ''}
        tone={phase === 'done' ? 'success' : 'idle'}
      />
      <div className="w-full max-w-2xl">{visual}</div>

      {phase !== 'try' && (
        <ol className="flex flex-wrap justify-center gap-x-6 gap-y-2" aria-live="polite">
          {steps.slice(0, shown).map((step) => (
            <li
              key={step}
              className="anim-pop-in rounded-2xl bg-surface px-4 py-2 text-2xl font-extrabold tabular-nums shadow-sm"
            >
              {step}
            </li>
          ))}
        </ol>
      )}

      {phase === 'demo' && (
        <div className="flex flex-wrap justify-center gap-4">
          {allShown ? (
            <Button
              onClick={() => {
                setPhase('try');
                setShown(0);
              }}
              autoFocus
            >
              {fr.discover.yourTurn}
            </Button>
          ) : (
            <Button variant="soft" onClick={() => setShown((n) => n + 1)}>
              {fr.discover.next}
            </Button>
          )}
          <button type="button" onClick={onDone} className="text-lg font-bold text-ink-soft underline">
            {fr.discover.skip}
          </button>
        </div>
      )}

      {phase === 'try' && (
        <>
          <p className="text-instruction font-bold">
            {wrong === null ? fr.discover.yourTurn : fr.discover.tryAgain}
          </p>
          <div className="flex justify-center gap-4">
            {(question.choices ?? []).map((c) => (
              <button
                key={c}
                type="button"
                aria-label={fr.play.choiceLabel(c)}
                onClick={() => {
                  if (c === question.answer) {
                    setPhase('done');
                  } else {
                    setWrong(c);
                    setShown(steps.length);
                  }
                }}
                className={`min-h-touch min-w-touch rounded-3xl px-6 py-3 text-number font-extrabold shadow-[0_6px_0_rgb(0_0_0/0.15)] focus-visible:outline-4 focus-visible:outline-primary ${
                  wrong === c ? 'anim-shake bg-help-soft' : 'bg-surface'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
          {wrong !== null && (
            <ol className="flex flex-wrap justify-center gap-x-6">
              {steps.map((step) => (
                <li key={step} className="text-2xl font-extrabold tabular-nums">
                  {step}
                </li>
              ))}
            </ol>
          )}
        </>
      )}

      {phase === 'done' && (
        <>
          <p className="text-3xl font-extrabold text-success">{fr.discover.great}</p>
          <Button onClick={onDone} autoFocus>
            {fr.discover.go}
          </Button>
        </>
      )}
    </section>
  );
}

function HouseDemo({ given, target, reveal }: { given: number; target: number; reveal: number }) {
  // Une maison par dizaine à remplir (2 pour aller à 20) ; pour la dizaine suivante, on regarde les unités.
  const lit = target === 20 ? [Math.min(given, 10), Math.max(given - 10, 0)] : [given % 10];
  const added = lit.reduce<{ out: number[]; left: number }>(
    (acc, n) => {
      const add = Math.min(acc.left, 10 - n);
      return { out: [...acc.out, add], left: acc.left - add };
    },
    { out: [], left: reveal },
  ).out;
  return (
    <div className="flex justify-center gap-4">
      {lit.map((n, i) => (
        <House key={i} lit={n} added={added[i] ?? 0} />
      ))}
    </div>
  );
}

function FrogDemo({ question, ratio }: { question: Parameters<typeof frogJumps>[0]; ratio: number }) {
  const { start, jumps } = frogJumps(question);
  return (
    <NumberLine
      start={start}
      jumps={jumps}
      done={Math.round(ratio * jumps.length)}
      revealPosition={ratio >= 1}
    />
  );
}
