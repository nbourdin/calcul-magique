import { useEffect, useState } from 'react';
import { evaluate } from '@/domain/display';
import { fr } from '@/i18n/fr';
import { Icon } from '@/ui/Icon';
import type { GameProps } from '../types';
import { useResponseTimer } from '../useResponseTimer';

type Money = 1 | 2 | 5 | 10 | 20;

function MoneyArt({ value, className = 'h-16' }: { value: Money; className?: string }) {
  if (value >= 5) {
    return (
      <svg viewBox="0 0 96 56" className={className} aria-hidden="true">
        <rect
          x="2"
          y="2"
          width="92"
          height="52"
          rx="8"
          fill={value === 5 ? '#d8e6f5' : value === 10 ? '#f6d3d9' : '#cfeedd'}
          stroke="#2e2a4f"
          strokeWidth="3"
        />
        <circle cx="70" cy="28" r="14" fill="none" stroke="#2e2a4f" strokeWidth="2" opacity=".4" />
        <text x="30" y="38" textAnchor="middle" fontSize="26" fontWeight="800" fill="#2e2a4f">
          {value}
        </text>
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 56 56" className={className} aria-hidden="true">
      <circle
        cx="28"
        cy="28"
        r="25"
        fill={value === 2 ? '#e0e3ea' : '#f5cf6b'}
        stroke="#2e2a4f"
        strokeWidth="3"
      />
      <circle
        cx="28"
        cy="28"
        r="17"
        fill={value === 2 ? '#f5cf6b' : '#e0e3ea'}
        stroke="#2e2a4f"
        strokeWidth="2"
      />
      <text x="28" y="36" textAnchor="middle" fontSize="22" fontWeight="800" fill="#2e2a4f">
        {value}
      </text>
    </svg>
  );
}

const ITEMS = [
  // Baguette, potion, couronne, livre de sorts : objets génériques de la boutique.
  'M20 70 L62 28 M60 14 l4 9 10 2-7 7 2 10-9-5-9 5 2-10-7-7 10-2z',
  'M38 20 h20 v14 q16 8 16 26 a26 26 0 0 1 -52 0 q0-18 16-26z',
  'M16 62 l6-34 14 14 12-22 12 22 14-14 6 34z',
  'M18 22 h30 q6 0 6 6 v44 q0-6-6-6 h-30z M78 22 h-30 q-6 0-6 6 v44 q0-6 6-6 h30z',
];

/**
 * Jeu 5 — La Boutique de la fée (compléments à 10 et à 20 en contexte).
 * L'enfant paie avec un billet de 10 ou 20 € et doit rendre la monnaie avec des pièces et billets.
 * Au clavier : 1, 2, 5 (et 0 pour 10 €) ajoutent, Retour arrière retire, Entrée valide.
 */
export function ShopGame({ question, active, onAnswer }: GameProps) {
  const elapsed = useResponseTimer();
  const note = evaluate(question.display);
  const price = question.display.missing === 'a' ? (question.display.b ?? 0) : question.display.a;
  const coins: Money[] = note > 10 ? [1, 2, 5, 10] : [1, 2, 5];
  const item = ITEMS[(price + note) % ITEMS.length] ?? '';
  const [tray, setTray] = useState<Money[]>([]);
  const [picked, setPicked] = useState<number | null>(null);
  const total = tray.reduce((sum, c) => sum + c, 0);
  const answered = picked !== null;
  const correct = picked === question.answer;

  const add = (c: Money) => !answered && active && total + c <= note && setTray([...tray, c]);
  const removeAt = (i: number) => !answered && active && setTray(tray.filter((_, j) => j !== i));
  const validate = () => {
    if (!active || answered) return;
    setPicked(total);
    onAnswer(total === question.answer, elapsed());
  };

  useEffect(() => {
    if (!active || answered) return;
    const keys: Record<string, Money> = { '1': 1, '2': 2, '5': 5, '0': 10 };
    const onKey = (e: KeyboardEvent) => {
      const coin = keys[e.key];
      if (coin && coins.includes(coin)) add(coin);
      else if (e.key === 'Backspace') setTray(tray.slice(0, -1));
      else if (e.key === 'Enter') validate();
      else return;
      e.preventDefault();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  return (
    <div className="flex flex-1 flex-col items-center gap-4">
      <div className="flex w-full flex-wrap items-center justify-center gap-6 rounded-3xl bg-rose p-4">
        <svg viewBox="0 0 96 96" className="size-24" aria-hidden="true">
          <path
            d={item}
            fill="#e8defa"
            stroke="#7b5cc4"
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <div className="flex flex-col items-start gap-2 text-left">
          <p className="rounded-xl bg-surface px-4 py-1 text-3xl font-extrabold">
            {fr.games.shop.price(price)}
          </p>
          <p className="flex items-center gap-2 text-instruction font-bold">
            {fr.games.shop.gives(note)} <MoneyArt value={note > 10 ? 20 : 10} className="h-10" />
          </p>
        </div>
      </div>
      <p className="text-instruction font-bold">{fr.games.shop.instruction}</p>

      <div
        className={`flex min-h-28 w-full flex-wrap items-center justify-center gap-2 rounded-3xl border-4 border-dashed p-3 ${
          !answered
            ? 'border-primary-soft'
            : correct
              ? 'border-success bg-success-soft'
              : 'border-help bg-help-soft'
        }`}
        aria-live="polite"
      >
        {tray.length === 0 && <span className="text-xl text-ink-soft">{fr.games.shop.dropHere}</span>}
        {tray.map((c, i) => (
          <button
            key={i}
            type="button"
            onClick={() => removeAt(i)}
            aria-label={fr.games.shop.remove(c)}
            disabled={answered}
          >
            <MoneyArt value={c} className="h-14" />
          </button>
        ))}
      </div>
      <p className="text-3xl font-extrabold">{fr.games.shop.tray(total)}</p>

      <div className="mt-auto flex w-full flex-wrap items-center justify-center gap-3 pb-4">
        {coins.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => add(c)}
            disabled={!active || answered || total + c > note}
            aria-label={fr.games.shop.coin(c)}
            className="rounded-2xl bg-surface p-2 shadow-[0_5px_0_rgb(0_0_0/0.12)] transition active:translate-y-1 disabled:opacity-40 focus-visible:outline-4 focus-visible:outline-primary"
          >
            <MoneyArt value={c} />
          </button>
        ))}
        <button
          type="button"
          onClick={validate}
          disabled={!active || answered}
          aria-label={fr.numpad.submit}
          className="flex min-h-touch min-w-touch items-center justify-center rounded-2xl bg-success px-6 text-white shadow-[0_5px_0_rgb(0_0_0/0.15)] disabled:opacity-40 focus-visible:outline-4 focus-visible:outline-primary"
        >
          <Icon name="check" className="size-10" />
        </button>
      </div>
    </div>
  );
}
