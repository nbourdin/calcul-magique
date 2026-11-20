// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react';
import { createRng } from '@/domain/rng';
import { questionForFact } from '@/domain/skills';
import { fr } from '@/i18n/fr';
import { aidMode } from './aid';
import { House10Game } from './house10/House10Game';
import { ShopGame } from './shop/ShopGame';

describe('réglage des aides visuelles', () => {
  it('au niveau 1 seulement, sur demande, ou cachées', () => {
    expect(aidMode('level', 1)).toBe('shown');
    expect(aidMode('level', 2)).toBe('hidden');
    expect(aidMode('ask', 1)).toBe('onDemand');
    expect(aidMode('ask', 3)).toBe('onDemand');
    expect(aidMode('off', 1)).toBe('hidden');
  });
});

const shopQuestion = questionForFact('C10', 'c10:3', 1, createRng(1));
const stripCells = (container: HTMLElement) => container.querySelectorAll('.grid-cols-10 > span').length;

describe('aides dans les jeux', () => {
  it('boutique : la bande de cases s’affiche, se demande ou reste cachée', () => {
    const shown = render(
      <ShopGame question={shopQuestion} attempt={1} active aid="shown" onAnswer={vi.fn()} />,
    );
    expect(stripCells(shown.container)).toBe(10);
    shown.unmount();

    const hidden = render(
      <ShopGame question={shopQuestion} attempt={1} active aid="hidden" onAnswer={vi.fn()} />,
    );
    expect(stripCells(hidden.container)).toBe(0);
    expect(screen.queryByRole('button', { name: fr.play.showAid })).not.toBeInTheDocument();
    hidden.unmount();

    const ask = render(
      <ShopGame question={shopQuestion} attempt={1} active aid="onDemand" onAnswer={vi.fn()} />,
    );
    expect(stripCells(ask.container)).toBe(0);
    fireEvent.click(screen.getByRole('button', { name: fr.play.showAid }));
    expect(stripCells(ask.container)).toBe(10);
    expect(screen.queryByRole('button', { name: fr.play.showAid })).not.toBeInTheDocument();
  });

  it('boutique : après une réponse, la bande montre toujours la bonne monnaie', () => {
    const { container } = render(
      <ShopGame question={shopQuestion} attempt={1} active aid="hidden" onAnswer={vi.fn()} />,
    );
    fireEvent.click(screen.getByRole('button', { name: fr.games.shop.submit }));
    expect(stripCells(container)).toBe(10);
  });

  it('maison du 10 : maison cachée, puis montrée sur demande', () => {
    render(<House10Game question={shopQuestion} attempt={1} active aid="onDemand" onAnswer={vi.fn()} />);
    expect(screen.queryByRole('img', { name: /fenêtres allumées/ })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: fr.play.showAid }));
    expect(screen.getAllByRole('img', { name: /fenêtres allumées/ }).length).toBeGreaterThan(0);
  });
});
