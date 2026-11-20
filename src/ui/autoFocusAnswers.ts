import { useEffect, type RefObject } from 'react';

/** Attribut posé par les jeux sur leurs boutons de réponse (cartes, chemins, bulles, pièces…). */
export const ANSWER_ATTR = 'data-answer';

let keyboardMode = false;
let listening = false;

/** Clavier ou souris/doigt ? Retenu d'après la dernière interaction. */
function listenModality() {
  if (listening || typeof window === 'undefined') return;
  listening = true;
  window.addEventListener(
    'keydown',
    (e) => {
      if (!e.altKey && !e.ctrlKey && !e.metaKey) keyboardMode = true;
    },
    true,
  );
  window.addEventListener(
    'pointerdown',
    () => {
      keyboardMode = false;
    },
    true,
  );
}

export function isKeyboardMode(): boolean {
  return keyboardMode;
}

/** Pour les tests. */
export function setKeyboardMode(on: boolean): void {
  keyboardMode = on;
}

/**
 * Au clavier, la première réponse possible d'une question est sélectionnée d'office (les
 * flèches passent ensuite aux autres). Si la sélection se perd (bouton désactivé ou remplacé,
 * ex. après un saut de la grenouille), elle revient sur la prochaine réponse possible.
 * Au doigt ou à la souris, rien n'est sélectionné : le cadre ne doit pas passer pour un indice.
 */
export function useAutoFocusAnswers(root: RefObject<HTMLElement | null>, active: boolean, key: string): void {
  useEffect(() => {
    listenModality();
    const container = root.current;
    if (!container || !active) return;
    const focusFirst = () => {
      if (!keyboardMode) return;
      const current = document.activeElement;
      const lost =
        !current ||
        current === document.body ||
        !current.isConnected ||
        (current instanceof HTMLButtonElement && current.disabled);
      // Sélection ailleurs (fenêtre « On s'arrête ? », aide…) : on n'y touche pas.
      if (!lost) return;
      container.querySelector<HTMLElement>(`[${ANSWER_ATTR}]:not([disabled])`)?.focus();
    };
    focusFirst();
    const observer = new MutationObserver(focusFirst);
    observer.observe(container, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ['disabled'],
    });
    return () => observer.disconnect();
  }, [root, active, key]);
}
