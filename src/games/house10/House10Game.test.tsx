// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { questionForFact } from '@/domain/skills';
import { createRng } from '@/domain/rng';
import type { Level, SkillId } from '@/domain/types';
import { fr } from '@/i18n/fr';
import { House10Game } from './House10Game';

const q = (skillId: SkillId, factKey: string, level: Level) =>
  questionForFact(skillId, factKey, level, createRng(3));

describe('La Maison du 10', () => {
  it('niveau 1 : touche la bonne carte', async () => {
    const onAnswer = vi.fn();
    const question = q('C10', 'c10:7', 1);
    render(<House10Game question={question} attempt={1} active onAnswer={onAnswer} />);
    expect(screen.getByRole('img', { name: fr.games.house10.houseLabel(7, 10) })).toBeInTheDocument();
    await userEvent.setup().click(screen.getByRole('button', { name: fr.play.choiceLabel(3) }));
    expect(onAnswer).toHaveBeenCalledWith(true, expect.any(Number));
    expect(screen.getByRole('img', { name: fr.games.house10.houseLabel(10, 10) })).toBeInTheDocument();
  });

  it('niveau 1 : une mauvaise carte est signalée sans bloquer', async () => {
    const onAnswer = vi.fn();
    const question = q('C10', 'c10:7', 1);
    const wrong = question.choices?.find((c) => c !== 3) ?? 0;
    render(<House10Game question={question} attempt={1} active onAnswer={onAnswer} />);
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: fr.play.choiceLabel(wrong) }));
    await user.click(screen.getByRole('button', { name: fr.play.choiceLabel(3) }));
    expect(onAnswer).toHaveBeenCalledTimes(1);
    expect(onAnswer).toHaveBeenCalledWith(false, expect.any(Number));
  });

  it('niveau 2 : pavé numérique, maison masquée', async () => {
    const onAnswer = vi.fn();
    render(<House10Game question={q('C10', 'c10:4', 2)} attempt={1} active onAnswer={onAnswer} />);
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    await userEvent.setup().keyboard('6{Enter}');
    expect(onAnswer).toHaveBeenCalledWith(true, expect.any(Number));
  });

  it('niveau 3 : nombre manquant en premier', () => {
    render(<House10Game question={q('C10', 'c10:4', 3)} attempt={1} active onAnswer={vi.fn()} />);
    expect(screen.getByText(fr.games.house10.instructionMissingFirst)).toBeInTheDocument();
  });

  it('C20 : deux maisons ; CDS : consigne avec la dizaine visée', () => {
    const { unmount } = render(
      <House10Game question={q('C20', 'c20:13', 1)} attempt={1} active onAnswer={vi.fn()} />,
    );
    expect(screen.getAllByRole('img')).toHaveLength(2);
    unmount();
    const cds = q('CDS', 'cds:7', 1);
    render(<House10Game question={cds} attempt={1} active onAnswer={vi.fn()} />);
    expect(screen.getByText(fr.games.house10.instructionTarget(cds.display.a + 3))).toBeInTheDocument();
  });

  it('inactif : ne répond pas', async () => {
    const onAnswer = vi.fn();
    render(<House10Game question={q('C10', 'c10:7', 1)} attempt={1} active={false} onAnswer={onAnswer} />);
    await userEvent.setup().click(screen.getByRole('button', { name: fr.play.choiceLabel(3) }));
    expect(onAnswer).not.toHaveBeenCalled();
  });
});
