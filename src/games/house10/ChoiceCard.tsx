import { useRef, useState, type RefObject } from 'react';
import { fr } from '@/i18n/fr';

interface ChoiceCardProps {
  value: number;
  disabled: boolean;
  state: 'idle' | 'success' | 'help';
  dropTarget: RefObject<HTMLElement | null>;
  onPick: (value: number) => void;
  onDragOver: (over: boolean) => void;
}

const DRAG_THRESHOLD = 12;

const tone = {
  idle: 'bg-surface text-ink',
  success: 'bg-success text-white',
  help: 'bg-help text-white',
};

/** Carte-nombre : on la pose sur la maison (glisser) ou on la touche simplement. */
export function ChoiceCard({ value, disabled, state, dropTarget, onPick, onDragOver }: ChoiceCardProps) {
  const start = useRef<{ x: number; y: number } | null>(null);
  const dragged = useRef(false);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  const overTarget = (x: number, y: number) => {
    const r = dropTarget.current?.getBoundingClientRect();
    return !!r && x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
  };

  return (
    <button
      type="button"
      disabled={disabled}
      aria-label={fr.play.choiceLabel(value)}
      className={`min-h-touch min-w-touch touch-none rounded-3xl px-6 py-4 text-number font-extrabold shadow-[0_6px_0_rgb(0_0_0/0.15)] select-none focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-primary ${tone[state]} ${
        offset.x || offset.y ? 'relative z-10 scale-110' : 'transition'
      }`}
      style={{ transform: `translate(${offset.x}px, ${offset.y}px)` }}
      onPointerDown={(e) => {
        if (disabled) return;
        e.currentTarget.setPointerCapture(e.pointerId);
        start.current = { x: e.clientX, y: e.clientY };
        dragged.current = false;
      }}
      onPointerMove={(e) => {
        if (!start.current) return;
        const dx = e.clientX - start.current.x;
        const dy = e.clientY - start.current.y;
        if (!dragged.current && Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
        dragged.current = true;
        setOffset({ x: dx, y: dy });
        onDragOver(overTarget(e.clientX, e.clientY));
      }}
      onPointerUp={(e) => {
        if (start.current && dragged.current && overTarget(e.clientX, e.clientY)) onPick(value);
        start.current = null;
        setOffset({ x: 0, y: 0 });
        onDragOver(false);
      }}
      onPointerCancel={() => {
        start.current = null;
        dragged.current = false;
        setOffset({ x: 0, y: 0 });
        onDragOver(false);
      }}
      onClick={() => {
        // Un glisser se termine aussi par un clic : on ne le compte pas deux fois.
        if (dragged.current) {
          dragged.current = false;
          return;
        }
        onPick(value);
      }}
    >
      {value}
    </button>
  );
}
