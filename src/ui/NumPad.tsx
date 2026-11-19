import { useEffect } from 'react';
import { playSound } from '@/app/audio';
import { fr } from '@/i18n/fr';
import { Icon } from './Icon';

interface NumPadProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  maxLength?: number;
  disabled?: boolean;
}

const KEY =
  'flex min-h-touch items-center justify-center rounded-2xl text-number font-extrabold shadow-[0_4px_0_rgb(0_0_0/0.12)] transition active:translate-y-1 active:shadow-none disabled:opacity-40 focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-primary';

/**
 * Pavé numérique personnalisé (pas le clavier du système) : 0–9, effacer, valider.
 * Au clavier : chiffres, Retour arrière et Entrée.
 */
export function NumPad({ value, onChange, onSubmit, maxLength = 3, disabled = false }: NumPadProps) {
  const type = (d: number) => {
    if (disabled || value.length >= maxLength) return;
    playSound('click');
    onChange(value === '0' ? String(d) : value + d);
  };
  const erase = () => !disabled && onChange(value.slice(0, -1));
  const submit = () => !disabled && value !== '' && onSubmit();

  useEffect(() => {
    if (disabled) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.altKey || e.ctrlKey || e.metaKey) return;
      if (/^\d$/.test(e.key)) {
        type(Number(e.key));
      } else if (e.key === 'Backspace') {
        erase();
      } else if (e.key === 'Enter') {
        submit();
      } else {
        return;
      }
      e.preventDefault();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  return (
    <div role="group" aria-label={fr.numpad.label} className="grid grid-cols-3 gap-3">
      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => (
        <button
          key={d}
          type="button"
          className={`${KEY} bg-surface text-ink`}
          onClick={() => type(d)}
          disabled={disabled}
        >
          {fr.numpad.digit(d)}
        </button>
      ))}
      <button
        type="button"
        className={`${KEY} bg-help-soft text-ink`}
        onClick={erase}
        disabled={disabled || value === ''}
        aria-label={fr.numpad.erase}
      >
        <Icon name="erase" className="size-9" />
      </button>
      <button
        type="button"
        className={`${KEY} bg-surface text-ink`}
        onClick={() => type(0)}
        disabled={disabled}
      >
        {fr.numpad.digit(0)}
      </button>
      <button
        type="button"
        className={`${KEY} bg-success text-white`}
        onClick={submit}
        disabled={disabled || value === ''}
        aria-label={fr.numpad.submit}
      >
        <Icon name="check" className="size-10" />
      </button>
    </div>
  );
}
