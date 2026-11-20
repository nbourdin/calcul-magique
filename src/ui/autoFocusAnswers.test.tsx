// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react';
import { useRef, useState } from 'react';
import { setKeyboardMode, useAutoFocusAnswers } from './autoFocusAnswers';

function Game({ active = true }: { active?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState(0);
  useAutoFocusAnswers(ref, active, 'q1');
  return (
    <div ref={ref}>
      <button type="button">Écouter</button>
      <button type="button" data-answer disabled={step > 0} onClick={() => setStep(1)}>
        Sauter +10
      </button>
      <button type="button" data-answer disabled={step === 0}>
        Sauter −1
      </button>
    </div>
  );
}

afterEach(() => setKeyboardMode(false));

describe('sélection automatique des réponses', () => {
  it('au clavier : la première réponse possible, puis la suivante quand elle se désactive', async () => {
    setKeyboardMode(true);
    render(<Game />);
    expect(screen.getByRole('button', { name: 'Sauter +10' })).toHaveFocus();
    fireEvent.click(screen.getByRole('button', { name: 'Sauter +10' }));
    // L'observateur de la page remet la sélection sur la réponse suivante.
    await vi.waitFor(() => expect(screen.getByRole('button', { name: 'Sauter −1' })).toHaveFocus());
  });

  it('au doigt ou à la souris : rien n’est sélectionné (pas d’indice)', () => {
    setKeyboardMode(false);
    render(<Game />);
    expect(document.body).toHaveFocus();
  });

  it('ne prend pas la sélection hors des questions, ni à une fenêtre ouverte', () => {
    setKeyboardMode(true);
    render(
      <>
        <button type="button" autoFocus>
          Je continue
        </button>
        <Game />
      </>,
    );
    expect(screen.getByRole('button', { name: 'Je continue' })).toHaveFocus();
  });

  it('question inactive (retour, pause) : rien', () => {
    setKeyboardMode(true);
    render(<Game active={false} />);
    expect(document.body).toHaveFocus();
  });
});
