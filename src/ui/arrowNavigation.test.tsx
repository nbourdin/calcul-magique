// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react';
import { nextInDirection, useArrowNavigation, type Box } from './arrowNavigation';

const box = (left: number, top: number, width = 100, height = 60): Box => ({ left, top, width, height });

describe('choix du voisin (nextInDirection)', () => {
  // Grille 2 × 2 : A B / C D, plus E décalé à droite de D.
  const A = box(0, 0);
  const B = box(150, 0);
  const C = box(0, 100);
  const D = box(150, 100);
  const E = box(300, 140);

  it('va vers le voisin aligné dans chaque direction', () => {
    expect(nextInDirection(A, [B, C, D], 'right')).toBe(0);
    expect(nextInDirection(A, [B, C, D], 'down')).toBe(1);
    expect(nextInDirection(D, [A, B, C], 'up')).toBe(1);
    expect(nextInDirection(D, [A, B, C], 'left')).toBe(2);
  });

  it('préfère le voisin aligné au voisin en diagonale', () => {
    expect(nextInDirection(A, [D, B], 'right')).toBe(1);
  });

  it('rien dans cette direction : -1', () => {
    expect(nextInDirection(A, [B, C, D], 'up')).toBe(-1);
    expect(nextInDirection(E, [A, B, C, D], 'right')).toBe(-1);
  });
});

/** jsdom ne calcule pas la mise en page : on place chaque élément à la main. */
function place(el: HTMLElement, b: Box) {
  el.getBoundingClientRect = () =>
    ({
      ...b,
      x: b.left,
      y: b.top,
      right: b.left + b.width,
      bottom: b.top + b.height,
      toJSON: () => b,
    }) as DOMRect;
  el.getClientRects = () => [el.getBoundingClientRect()] as unknown as DOMRectList;
}

function Screen({ dialog = false }: { dialog?: boolean }) {
  useArrowNavigation();
  return (
    <main>
      <input aria-label="Prénom" />
      <button type="button">Un</button>
      <button type="button">Deux</button>
      <button type="button">Trois</button>
      {dialog && (
        <div role="dialog" aria-modal="true">
          <button type="button">Je continue</button>
          <button type="button">Oui, j’arrête</button>
        </div>
      )}
    </main>
  );
}

function layout() {
  place(screen.getByLabelText('Prénom'), box(0, 0, 100, 50));
  place(screen.getByRole('button', { name: 'Un' }), box(0, 100));
  place(screen.getByRole('button', { name: 'Deux' }), box(150, 100));
  place(screen.getByRole('button', { name: 'Trois' }), box(0, 200));
}

describe('flèches du clavier dans un écran', () => {
  it('sans sélection, une flèche sélectionne le premier élément ; puis on se déplace', () => {
    render(<Screen />);
    layout();
    fireEvent.keyDown(window, { key: 'ArrowDown' });
    expect(screen.getByLabelText('Prénom')).toHaveFocus();
    fireEvent.keyDown(window, { key: 'ArrowDown' });
    expect(screen.getByRole('button', { name: 'Un' })).toHaveFocus();
    fireEvent.keyDown(window, { key: 'ArrowRight' });
    expect(screen.getByRole('button', { name: 'Deux' })).toHaveFocus();
    fireEvent.keyDown(window, { key: 'ArrowDown' });
    expect(screen.getByRole('button', { name: 'Trois' })).toHaveFocus();
    fireEvent.keyDown(window, { key: 'ArrowUp' });
    expect(screen.getByRole('button', { name: 'Un' })).toHaveFocus();
  });

  it('dans un champ de texte, gauche et droite restent pour le curseur', () => {
    render(<Screen />);
    layout();
    const input = screen.getByLabelText('Prénom');
    input.focus();
    fireEvent.keyDown(input, { key: 'ArrowRight' });
    expect(input).toHaveFocus();
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    expect(screen.getByRole('button', { name: 'Un' })).toHaveFocus();
  });

  it('une fenêtre de dialogue garde la sélection pour elle', () => {
    render(<Screen dialog />);
    layout();
    place(screen.getByRole('button', { name: 'Je continue' }), box(0, 300));
    place(screen.getByRole('button', { name: 'Oui, j’arrête' }), box(150, 300));
    screen.getByRole('button', { name: 'Un' }).focus();
    fireEvent.keyDown(window, { key: 'ArrowRight' });
    expect(screen.getByRole('button', { name: 'Je continue' })).toHaveFocus();
    fireEvent.keyDown(window, { key: 'ArrowRight' });
    expect(screen.getByRole('button', { name: 'Oui, j’arrête' })).toHaveFocus();
  });
});
