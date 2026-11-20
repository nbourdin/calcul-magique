// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react';
import { createRng } from '@/domain/rng';
import { questionForFact } from '@/domain/skills';
import { fr } from '@/i18n/fr';
import { FrogGame } from './FrogGame';

const jumpButton = (label: string) => screen.getByRole('button', { name: fr.games.frog.jump(label) });

describe('Le Saut de la grenouille', () => {
  it('niveau 1 : les sauts se font dans l’ordre, avec une consigne à chaque étape', () => {
    const onAnswer = vi.fn();
    const question = questionForFact('P9', 'p9:7', 1, createRng(1));
    render(<FrogGame question={question} attempt={1} active onAnswer={onAnswer} />);

    expect(screen.getByText(fr.games.frog.forward(10))).toBeInTheDocument();
    expect(jumpButton('−1')).toBeDisabled();
    expect(screen.queryByRole('group', { name: fr.numpad.label })).not.toBeInTheDocument();

    fireEvent.click(jumpButton('+10'));
    expect(screen.getByText(fr.games.frog.backward(1))).toBeInTheDocument();
    fireEvent.click(jumpButton('−1'));

    expect(screen.getByText(fr.games.frog.landed)).toBeInTheDocument();
    for (const d of '16') fireEvent.keyDown(window, { key: d });
    fireEvent.keyDown(window, { key: 'Enter' });
    expect(onAnswer).toHaveBeenCalledWith(true, expect.any(Number));
  });

  it('niveaux 2-3 : on prévoit l’arrivée, le pavé est là tout de suite', () => {
    const onAnswer = vi.fn();
    const question = questionForFact('P9', 'p9:27', 2, createRng(1));
    render(<FrogGame question={question} attempt={1} active onAnswer={onAnswer} />);
    expect(screen.getByText(fr.games.frog.predict)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^Sauter/ })).not.toBeInTheDocument();
    for (const d of '35') fireEvent.keyDown(window, { key: d });
    fireEvent.keyDown(window, { key: 'Enter' });
    expect(onAnswer).toHaveBeenCalledWith(false, expect.any(Number));
  });
});
