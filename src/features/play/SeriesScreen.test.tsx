// @vitest-environment jsdom
import 'fake-indexeddb/auto';
import { fireEvent, render, screen } from '@testing-library/react';
import { RouterProvider, createMemoryRouter } from 'react-router-dom';
import { routes } from '@/app/router';
import { db } from '@/data/db';
import { saveNewProfile } from '@/data/profiles';
import { useProfile } from '@/features/profile/profileStore';
import { fr } from '@/i18n/fr';

beforeEach(async () => {
  localStorage.clear();
  await db.delete();
  await db.open();
  await saveNewProfile({ name: 'Lila', avatar: 'moon' }, Date.now());
  useProfile.setState({
    status: 'loading',
    profile: null,
    rewards: null,
    puzzles: [],
    skills: [],
    facts: [],
  });
});

async function openGame() {
  render(<RouterProvider router={createMemoryRouter(routes, { initialEntries: ['/jouer/C10'] })} />);
  await screen.findByTestId('equation');
}

describe('arrêter une partie', () => {
  it('le bouton « Arrêter » demande confirmation, « Je continue » reprend', async () => {
    await openGame();
    fireEvent.click(screen.getByRole('button', { name: fr.play.stop }));
    expect(screen.getByRole('dialog', { name: fr.play.stopTitle })).toBeInTheDocument();
    // Le jeu est figé pendant la question.
    for (const b of screen.getAllByRole('button', { name: /^Répondre / })) expect(b).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: fr.play.stopCancel }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /^Répondre / })[0]).toBeEnabled();
  });

  it('Échap ouvre la demande, « Oui, j’arrête » revient à l’accueil', async () => {
    await openGame();
    fireEvent.keyDown(window, { key: 'Escape' });
    fireEvent.click(screen.getByRole('button', { name: fr.play.stopConfirm }));
    expect(await screen.findByText(fr.home.welcomeName('Lila'))).toBeInTheDocument();
  });
});
