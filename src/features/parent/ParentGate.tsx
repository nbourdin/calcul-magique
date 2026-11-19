import { useState } from 'react';
import { parentChallenge } from '@/domain/parent/gate';
import { createRng } from '@/domain/rng';
import { fr } from '@/i18n/fr';
import { Button } from '@/ui/Button';
import { useParentAccess } from './parentStore';

const newChallenge = () => parentChallenge(createRng(Math.floor(Math.random() * 2 ** 32)));

/** Porte de l'espace parent : une multiplication « adulte », sans mot de passe (PRD §9). */
export function ParentGate() {
  const unlock = useParentAccess((s) => s.unlock);
  const [challenge, setChallenge] = useState(newChallenge);
  const [value, setValue] = useState('');
  const [wrong, setWrong] = useState(false);

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-5 py-10 text-center">
      <h1 className="text-3xl font-extrabold text-primary">{fr.parent.gateTitle}</h1>
      <p className="text-xl">{fr.parent.gateText}</p>
      <form
        className="flex flex-col items-center gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (Number(value) === challenge.answer && value.trim() !== '') {
            unlock();
          } else {
            setWrong(true);
            setValue('');
            setChallenge(newChallenge());
          }
        }}
      >
        <label className="flex flex-col items-center gap-3">
          <span className="text-4xl font-extrabold tabular-nums">
            {fr.parent.gateQuestion(challenge.a, challenge.b)}
          </span>
          <span className="sr-only">{fr.parent.gateAnswer}</span>
          <input
            autoFocus
            inputMode="numeric"
            pattern="[0-9]*"
            value={value}
            onChange={(e) => setValue(e.target.value.replace(/\D/g, '').slice(0, 3))}
            aria-label={fr.parent.gateAnswer}
            className="min-h-tap w-32 rounded-2xl border-4 border-primary-soft bg-surface text-center text-3xl font-extrabold focus:border-primary focus:outline-none"
          />
        </label>
        {wrong && (
          <p role="alert" className="text-lg font-bold text-help">
            {fr.parent.gateWrong}
          </p>
        )}
        <Button type="submit">{fr.parent.gateSubmit}</Button>
      </form>
    </main>
  );
}
