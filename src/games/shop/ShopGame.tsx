import { useEffect, useState } from 'react';
import { CHARACTERS } from '@/assets/characters';
import { evaluate } from '@/domain/display';
import { fr } from '@/i18n/fr';
import { Icon } from '@/ui/Icon';
import type { GameProps } from '../types';
import { AidButton } from '../AidButton';
import { useAid } from '../useAid';
import { useResponseTimer } from '../useResponseTimer';

import { cashDrawer, seedOf, type Money } from './cash';

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
        <circle cx="72" cy="28" r="13" fill="none" stroke="#2e2a4f" strokeWidth="2" opacity=".35" />
        <text x="32" y="38" textAnchor="middle" fontSize="26" fontWeight="800" fill="#2e2a4f">
          {value} €
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
      <text x="28" y="35" textAnchor="middle" fontSize="18" fontWeight="800" fill="#2e2a4f">
        {value}€
      </text>
    </svg>
  );
}

/** Objets de la boutique : dessin + nom (dans fr.games.shop.items, même ordre). */
const ITEM_ART = [
  'M20 70 L62 28 M60 14 l4 9 10 2-7 7 2 10-9-5-9 5 2-10-7-7 10-2z',
  'M38 20 h20 v14 q16 8 16 26 a26 26 0 0 1 -52 0 q0-18 16-26z',
  'M16 62 l6-34 14 14 12-22 12 22 14-14 6 34z',
  'M18 22 h30 q6 0 6 6 v44 q0-6-6-6 h-30z M78 22 h-30 q-6 0-6 6 v44 q0-6 6-6 h30z',
];

/**
 * Bande de cases (une case = 1 €) : le prix, puis la monnaie rendue, jusqu'au billet.
 * C'est la stratégie « compléter jusqu'à 10 (ou 20) » rendue visible.
 */
function ChangeStrip({ price, given, note }: { price: number; given: number; note: number }) {
  return (
    <div className="grid w-full max-w-xl grid-cols-10 gap-1.5" aria-hidden="true">
      {Array.from({ length: note }, (_, i) => {
        const kind = i < price ? 'price' : i < price + given ? 'given' : 'empty';
        return (
          <span
            key={i}
            className={`h-9 rounded-lg border-2 transition-colors ${
              kind === 'price'
                ? 'border-[#d99ab3] bg-rose'
                : kind === 'given'
                  ? 'border-[#c9971c] bg-[#f5cf6b]'
                  : 'border-dashed border-ink/25 bg-surface'
            }`}
          />
        );
      })}
    </div>
  );
}

/**
 * Jeu 5 — La Boutique de la fée (compléments à 10 et à 20 en contexte).
 * L'enfant tient la boutique : la fée achète un objet et paie avec un billet de 10 ou 20 €,
 * l'enfant lui rend la monnaie. L'opération « prix + monnaie = billet » se remplit au fil des pièces.
 * Aide visuelle (niveau 1 par défaut, réglable) : une bande de cases montre le prix et la
 * monnaie jusqu'au billet ; après la réponse, elle montre la bonne monnaie.
 * Au clavier : 1, 2, 5 (et 0 pour 10 €) ajoutent, Retour arrière retire, Entrée valide.
 */
export function ShopGame({ question, active, aid, onAnswer }: GameProps) {
  const elapsed = useResponseTimer();
  const help = useAid(aid, question.level);
  const note = evaluate(question.display);
  const price = question.display.missing === 'a' ? (question.display.b ?? 0) : question.display.a;
  const { available: coins, missing } = cashDrawer(
    note,
    question.answer,
    question.level,
    seedOf(question.id),
  );
  const itemIndex = (price + note) % ITEM_ART.length;
  // Un client différent selon la question, pris dans l'album.
  const customer = CHARACTERS[(price * 3 + note) % Math.max(1, CHARACTERS.length)];
  const item = fr.games.shop.items[itemIndex] ?? '';
  const [tray, setTray] = useState<Money[]>([]);
  const [picked, setPicked] = useState<number | null>(null);
  const total = tray.reduce((sum, c) => sum + c, 0);
  const answered = picked !== null;
  const correct = picked === question.answer;
  const locked = !active || answered;

  const add = (c: Money) => !locked && total + c <= note && setTray([...tray, c]);
  const removeAt = (i: number) => !locked && setTray(tray.filter((_, j) => j !== i));
  const clear = () => !locked && setTray([]);
  const validate = () => {
    if (locked) return;
    setPicked(total);
    onAnswer(total === question.answer, elapsed());
  };

  useEffect(() => {
    if (locked) return;
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

  const slotTone = !answered
    ? 'border-primary bg-primary-soft text-primary'
    : correct
      ? 'border-success bg-success-soft text-success'
      : 'border-help bg-help-soft text-help';

  return (
    <div className="flex flex-1 flex-col items-center gap-4">
      {/* Le client en face : il dit ce qu'il achète et avec quoi il paie. */}
      <div className="flex w-full flex-wrap items-end justify-center gap-4 rounded-3xl bg-rose p-4">
        {customer && (
          <img
            src={customer.image}
            alt={customer.name}
            className="size-28 shrink-0 rounded-full border-4 bg-surface object-cover"
            style={{ borderColor: customer.color }}
          />
        )}
        <div className="flex flex-col items-start gap-3">
          <p className="relative rounded-3xl bg-surface px-5 py-3 text-left text-2xl font-extrabold shadow-md before:absolute before:bottom-4 before:-left-3 before:border-y-8 before:border-r-12 before:border-y-transparent before:border-r-surface">
            {answered && correct ? fr.games.shop.thanks : fr.games.shop.says(item, note)}
          </p>
          <div className="flex items-center gap-4">
            <div className="relative">
              <svg viewBox="0 0 96 96" className="size-16" aria-hidden="true">
                <path
                  d={ITEM_ART[itemIndex]}
                  fill="#e8defa"
                  stroke="#6a4ab5"
                  strokeWidth="5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span className="absolute -right-4 -bottom-1 rotate-6 rounded-lg bg-[#fff1c9] px-2 text-lg font-extrabold shadow">
                {fr.games.shop.euros(price)}
              </span>
            </div>
            <MoneyArt value={note > 10 ? 20 : 10} className="h-12" />
          </div>
        </div>
      </div>

      <p className="text-instruction font-bold">{fr.games.shop.instruction}</p>

      {/* L'opération travaillée : prix + monnaie = billet, la case se remplit avec les pièces. */}
      <p
        className="flex items-center gap-3 text-[2.5rem] leading-none font-extrabold tabular-nums"
        data-testid="equation"
      >
        <span>{fr.games.shop.euros(price)}</span>
        <span aria-hidden="true">+</span>
        <span
          className={`inline-flex min-w-[3.2em] items-center justify-center rounded-2xl border-4 border-dashed px-2 ${slotTone}`}
          aria-label={fr.games.shop.tray(total)}
        >
          {tray.length === 0 && !answered ? '?' : fr.games.shop.euros(total)}
        </span>
        <span aria-hidden="true">=</span>
        <span>{fr.games.shop.euros(note)}</span>
      </p>

      {help.visible || answered ? (
        <ChangeStrip
          price={price}
          given={answered ? (correct ? total : question.answer) : total}
          note={note}
        />
      ) : (
        help.canAsk && <AidButton onClick={help.ask} disabled={locked} />
      )}

      {/* Monnaie rendue : on retire une pièce en la touchant. */}
      <div className="flex min-h-20 w-full max-w-xl flex-wrap items-center justify-center gap-2 rounded-3xl bg-surface/70 p-3">
        {tray.length === 0 ? (
          <span className="text-lg text-ink-soft">{fr.games.shop.trayEmpty}</span>
        ) : (
          tray.map((c, i) => (
            <button
              key={i}
              type="button"
              onClick={() => removeAt(i)}
              aria-label={fr.games.shop.remove(c)}
              disabled={locked}
              className="rounded-xl transition hover:-translate-y-0.5 focus-visible:outline-4 focus-visible:outline-primary"
            >
              <MoneyArt value={c} className="h-12" />
            </button>
          ))
        )}
      </div>

      <div className="mt-auto flex w-full flex-col items-center gap-3 pb-4">
        <p className={`text-lg font-bold ${missing ? 'text-help' : 'text-ink-soft'}`}>
          {missing ? fr.games.shop.coinsMissing(missing) : fr.games.shop.coinsHint}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          {coins.map((c) => (
            <button
              data-answer
              key={c}
              type="button"
              onClick={() => add(c)}
              disabled={locked || total + c > note}
              aria-label={fr.games.shop.coin(c)}
              className="relative rounded-2xl border-4 border-primary-soft bg-surface p-2 shadow-[0_5px_0_rgb(0_0_0/0.12)] transition hover:-translate-y-0.5 hover:border-primary active:translate-y-1 disabled:opacity-40 focus-visible:outline-4 focus-visible:outline-primary"
            >
              <MoneyArt value={c} />
              <span
                className="absolute -top-2 -right-2 flex size-7 items-center justify-center rounded-full bg-primary text-lg font-extrabold text-white"
                aria-hidden="true"
              >
                +
              </span>
            </button>
          ))}
          {/* Monnaie épuisée : visible mais barrée, pour comprendre pourquoi elle manque. */}
          {missing && (
            <span
              role="img"
              aria-label={fr.games.shop.noCoin(missing)}
              className="relative rounded-2xl border-4 border-dashed border-ink/20 p-2 opacity-50 grayscale"
            >
              <MoneyArt value={missing} />
              <svg viewBox="0 0 10 10" className="absolute inset-0 size-full" aria-hidden="true">
                <path d="M1 9L9 1" stroke="#c96a12" strokeWidth="0.8" strokeLinecap="round" />
              </svg>
            </span>
          )}
        </div>
        <div className="flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={clear}
            disabled={locked || tray.length === 0}
            className="flex min-h-touch items-center gap-2 rounded-full bg-help-soft px-6 text-xl font-extrabold text-ink disabled:opacity-40 focus-visible:outline-4 focus-visible:outline-primary"
          >
            <Icon name="erase" />
            {fr.numpad.erase}
          </button>
          <button
            type="button"
            onClick={validate}
            disabled={locked}
            className="flex min-h-touch items-center gap-2 rounded-full bg-success px-8 text-xl font-extrabold text-white shadow-[0_5px_0_rgb(0_0_0/0.15)] disabled:opacity-40 focus-visible:outline-4 focus-visible:outline-primary"
          >
            <Icon name="check" />
            {fr.games.shop.submit}
          </button>
        </div>
      </div>
    </div>
  );
}
