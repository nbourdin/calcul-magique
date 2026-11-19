// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react';
import type { Question } from '@/domain/types';
import { fr } from '@/i18n/fr';
import { TrainGame } from './TrainGame';

const question = (a: number, op: '+' | '−', b: number): Question => ({
  id: 'q1',
  skillId: op === '+' ? 'APO' : 'SPO',
  factKey: op === '+' ? `apo:${a % 10}+${b % 10}` : `spo:${a % 10}-${b % 10}`,
  level: 2,
  display: { a, op, b, missing: 'result' },
  answer: op === '+' ? a + b : a - b,
});

const key = (k: string) => fireEvent.keyDown(window, { key: k });
const cell = (column: number, value: string) =>
  screen.getByLabelText(fr.games.train.cell(fr.games.train.columns[column] ?? '', value));

describe('Le Petit Train', () => {
  it('addition avec retenue : on touche l’étoile, puis on finit les dizaines', () => {
    const onAnswer = vi.fn();
    render(<TrainGame question={question(27, '+', 15)} attempt={1} active onAnswer={onAnswer} />);
    expect(screen.getByText(fr.games.train.instruction)).toBeInTheDocument();

    key('2');
    expect(cell(0, '2')).toBeInTheDocument();
    expect(screen.getByText(fr.games.train.carry)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: fr.games.train.carryButton }));
    expect(screen.queryByRole('button', { name: fr.games.train.carryButton })).not.toBeInTheDocument();

    key('4');
    expect(screen.getByText(fr.games.train.check)).toBeInTheDocument();
    key('Enter');
    expect(onAnswer).toHaveBeenCalledWith(true, expect.any(Number));
    expect(screen.getByText(fr.games.train.departed)).toBeInTheDocument();
  });

  it('soustraction : on casse une dizaine avant les unités', () => {
    const onAnswer = vi.fn();
    render(<TrainGame question={question(53, '−', 27)} attempt={1} active onAnswer={onAnswer} />);
    expect(screen.getByText(fr.games.train.borrow)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: fr.games.train.borrowButton }));
    // Le 3 devient 13 (et le 5 devient 4).
    expect(screen.getByText('13')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: fr.games.train.borrowButton })).not.toBeInTheDocument();

    key('6');
    key('2');
    key('Enter');
    expect(onAnswer).toHaveBeenCalledWith(true, expect.any(Number));
  });

  it('on peut effacer, et une erreur est signalée une seule fois', () => {
    const onAnswer = vi.fn();
    render(<TrainGame question={question(23, '+', 14)} attempt={1} active onAnswer={onAnswer} />);
    key('8');
    key('Backspace');
    expect(cell(0, fr.games.train.empty)).toBeInTheDocument();
    key('7');
    key('4');
    key('Enter');
    key('Enter');
    expect(onAnswer).toHaveBeenCalledTimes(1);
    expect(onAnswer).toHaveBeenCalledWith(false, expect.any(Number));
  });

  it('ne valide pas tant qu’une case est vide', () => {
    const onAnswer = vi.fn();
    render(<TrainGame question={question(23, '+', 14)} attempt={1} active onAnswer={onAnswer} />);
    key('7');
    key('Enter');
    expect(onAnswer).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: fr.numpad.submit })).toBeDisabled();
  });
});
