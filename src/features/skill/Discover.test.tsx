// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react';
import type { SkillId } from '@/domain/types';
import { fr } from '@/i18n/fr';
import { Discover } from './Discover';

describe('Je découvre', () => {
  it.each(['C10', 'C20', 'P9', 'DBL', 'T3'] as SkillId[])(
    '%s : démonstration, essai guidé, puis le jeu',
    (skillId) => {
      const onDone = vi.fn();
      render(<Discover skillId={skillId} onDone={onDone} />);
      expect(screen.getByText(fr.discover.intro[skillId])).toBeInTheDocument();

      // Démonstration pas à pas.
      while (screen.queryByRole('button', { name: fr.discover.next })) {
        fireEvent.click(screen.getByRole('button', { name: fr.discover.next }));
      }
      fireEvent.click(screen.getByRole('button', { name: fr.discover.yourTurn }));

      // Essai : une erreur affiche l'aide, sans bloquer ; on finit par trouver.
      let errors = 0;
      for (const button of screen.getAllByRole('button', { name: /^Répondre / })) {
        fireEvent.click(button);
        if (screen.queryByText(fr.discover.great)) break;
        expect(screen.getByText(fr.discover.tryAgain)).toBeInTheDocument();
        errors++;
      }
      expect(errors).toBeLessThan(3);
      fireEvent.click(screen.getByRole('button', { name: fr.discover.go }));
      expect(onDone).toHaveBeenCalledTimes(1);
    },
  );

  it('peut être passée', () => {
    const onDone = vi.fn();
    render(<Discover skillId="C10" onDone={onDone} />);
    fireEvent.click(screen.getByRole('button', { name: fr.discover.skip }));
    expect(onDone).toHaveBeenCalled();
  });
});
