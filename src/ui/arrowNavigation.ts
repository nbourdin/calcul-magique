import { useEffect } from 'react';

export type Direction = 'up' | 'down' | 'left' | 'right';

export interface Box {
  left: number;
  top: number;
  width: number;
  height: number;
}

const KEYS: Record<string, Direction> = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
};

/** Un écart de côté compte double : on préfère le voisin aligné au voisin en diagonale. */
const SIDE_WEIGHT = 2;

/**
 * Navigation « spatiale » : parmi les boîtes candidates, celle qui est vraiment dans la direction
 * demandée (son centre est au-delà du bord de départ) et la plus proche, en pénalisant l'écart
 * de côté. Renvoie son indice, ou -1 s'il n'y a rien dans cette direction.
 */
export function nextInDirection(from: Box, candidates: readonly Box[], dir: Direction): number {
  const cx = from.left + from.width / 2;
  const cy = from.top + from.height / 2;
  let best = -1;
  let bestScore = Infinity;
  candidates.forEach((box, i) => {
    const bx = box.left + box.width / 2;
    const by = box.top + box.height / 2;
    const ahead =
      dir === 'right'
        ? bx - (from.left + from.width)
        : dir === 'left'
          ? from.left - bx
          : dir === 'down'
            ? by - (from.top + from.height)
            : from.top - by;
    if (ahead <= 0) return;
    const side = dir === 'left' || dir === 'right' ? Math.abs(by - cy) : Math.abs(bx - cx);
    const score = ahead + SIDE_WEIGHT * side;
    if (score < bestScore) {
      bestScore = score;
      best = i;
    }
  });
  return best;
}

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

function focusables(root: ParentNode): HTMLElement[] {
  return [...root.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(
    (el) => el.getClientRects().length > 0 && !el.closest('[aria-hidden="true"], [inert]'),
  );
}

/** Dans un champ de texte, gauche et droite déplacent le curseur : on ne les prend pas. */
function keepsArrows(el: Element | null, dir: Direction): boolean {
  if (el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement) return true;
  if (el instanceof HTMLInputElement) {
    const textual = !['button', 'checkbox', 'radio', 'submit', 'reset', 'file', 'range', 'color'].includes(
      el.type,
    );
    return textual && (dir === 'left' || dir === 'right');
  }
  return false;
}

/**
 * Flèches du clavier : la sélection passe au bouton ou lien le plus proche dans la direction
 * choisie (Entrée ou Espace l'active, comme d'habitude). Sans sélection, une flèche sélectionne
 * le premier élément de l'écran. Une fenêtre de dialogue ouverte garde la sélection pour elle.
 */
export function useArrowNavigation(): void {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const dir = KEYS[e.key];
      if (!dir || e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
      const active = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      if (keepsArrows(active, dir)) return;
      const root = document.querySelector<HTMLElement>('[role="dialog"][aria-modal="true"]') ?? document.body;
      const items = focusables(root);
      if (items.length === 0) return;
      e.preventDefault();
      if (!active || active === document.body || !root.contains(active)) {
        items[0]?.focus();
        return;
      }
      const others = items.filter((el) => el !== active);
      const i = nextInDirection(
        active.getBoundingClientRect(),
        others.map((el) => el.getBoundingClientRect()),
        dir,
      );
      others[i]?.focus();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
}
