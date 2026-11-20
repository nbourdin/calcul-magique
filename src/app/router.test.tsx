// @vitest-environment jsdom
import 'fake-indexeddb/auto';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RouterProvider, createMemoryRouter } from 'react-router-dom';
import { routes } from '@/app/router';
import { db } from '@/data/db';
import { useProfile } from '@/features/profile/profileStore';
import { fr } from '@/i18n/fr';

function renderAt(path: string) {
  render(<RouterProvider router={createMemoryRouter(routes, { initialEntries: [path] })} />);
}

beforeEach(async () => {
  localStorage.clear();
  useProfile.setState({
    status: 'loading',
    profile: null,
    rewards: null,
    puzzles: [],
    skills: [],
    facts: [],
  });
  await db.delete();
  await db.open();
});

describe('parcours', () => {
  it('premier lancement : onboarding puis accueil', async () => {
    renderAt('/');
    const user = userEvent.setup();
    await user.type(await screen.findByRole('textbox'), 'Lila');
    await user.click(screen.getByRole('button', { name: fr.onboarding.next }));
    await user.click(screen.getByRole('radio', { name: fr.avatars.moon }));
    await user.click(screen.getByRole('button', { name: fr.onboarding.next }));
    await user.click(await screen.findByRole('button', { name: fr.reveal.choose('Iris') }));
    expect(await screen.findByText(fr.home.welcomeName('Lila'))).toBeInTheDocument();
    expect(screen.getByText(fr.home.puzzleOf('Iris'))).toBeInTheDocument();
    expect(screen.getByRole('link', { name: new RegExp(`^${fr.skills.C10}`) })).toHaveAttribute(
      'href',
      '/competence/C10',
    );
    expect(screen.getByRole('region', { name: fr.worlds.lockedLabel(fr.worlds.river) })).toBeInTheDocument();
  });

  it("affiche l'écran d'erreur sur une route inconnue", async () => {
    renderAt('/nulle-part');
    expect(await screen.findByText(fr.errors.notFound)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: fr.errors.backHome })).toHaveAttribute('href', '/');
  });
});
