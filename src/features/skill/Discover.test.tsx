// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react';
import { getSkill, SKILLS } from '@/domain/skills';
import type { SkillId } from '@/domain/types';
import { fr } from '@/i18n/fr';
import { Discover } from './Discover';
import { discoverIntro } from './discoverIntro';

// Chaque niveau de chaque compétence a sa démonstration.
const cases = (Object.keys(SKILLS) as SkillId[]).flatMap((skillId) =>
  getSkill(skillId).levels.map((level) => ({ skillId, level })),
);

describe('Je découvre', () => {
  it.each(cases)('$skillId niveau $level : démonstration, essai guidé, puis le jeu', ({ skillId, level }) => {
    const onDone = vi.fn();
    render(<Discover skillId={skillId} level={level} onDone={onDone} />);
    expect(screen.getByText(discoverIntro(skillId, level))).toBeInTheDocument();

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
  });

  it('une phrase différente quand la stratégie change de niveau', () => {
    expect(discoverIntro('TAD', 1)).not.toBe(discoverIntro('TAD', 2));
    expect(discoverIntro('C10', 3)).toBe(fr.discover.intro.C10);
    expect(discoverIntro('APO', 3)).toBe(discoverIntro('APO', 2));
  });

  it('peut être passée', () => {
    const onDone = vi.fn();
    render(<Discover skillId="C10" onDone={onDone} />);
    fireEvent.click(screen.getByRole('button', { name: fr.discover.skip }));
    expect(onDone).toHaveBeenCalled();
  });
});
