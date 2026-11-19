// @vitest-environment jsdom
import 'fake-indexeddb/auto';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { RouterProvider, createMemoryRouter } from 'react-router-dom';
import { db } from '@/data/db';
import { saveNewProfile } from '@/data/profiles';
import { getSkillProgress } from '@/data/skills';
import { useProfile } from '@/features/profile/profileStore';
import { fr } from '@/i18n/fr';
import { LevelCard } from './LevelCard';

let profileId = '';

beforeEach(async () => {
  localStorage.clear();
  await db.delete();
  await db.open();
  profileId = (await saveNewProfile({ name: 'Lila', avatar: 'moon' }, Date.now())).id;
  await useProfile.getState().load();
});

function renderCard(kind: 'up' | 'down', level: 1 | 2) {
  const router = createMemoryRouter(
    [
      { path: '/fin', element: <LevelCard skillId="ADS" change={{ kind, level }} /> },
      { path: '/competence/:skillId', element: <p>écran compétence</p> },
    ],
    { initialEntries: ['/fin'] },
  );
  render(<RouterProvider router={router} />);
  return router;
}

describe('carte de niveau en fin de série', () => {
  it('« Oui » passe au niveau suivant et ouvre la compétence (Je découvre)', async () => {
    const router = renderCard('up', 2);
    fireEvent.click(await screen.findByRole('button', { name: fr.level.upYes(2) }));
    await screen.findByText('écran compétence');
    expect(router.state.location.pathname).toBe('/competence/ADS');
    expect((await getSkillProgress(profileId, 'ADS'))?.level).toBe(2);
  });

  it('« Pas encore » garde le niveau et attend de nouvelles séries', async () => {
    renderCard('up', 2);
    fireEvent.click(await screen.findByRole('button', { name: fr.level.upNo }));
    await waitFor(async () =>
      expect(await getSkillProgress(profileId, 'ADS')).toMatchObject({
        level: 1,
        levelSince: expect.any(Number),
      }),
    );
    expect(screen.queryByText(fr.level.upTitle)).not.toBeInTheDocument();
  });

  it('retour au niveau précédent : message doux et astuce à revoir', async () => {
    renderCard('down', 1);
    expect(await screen.findByText(fr.level.downTitle)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: fr.level.rewatch })).toHaveAttribute(
      'href',
      '/competence/ADS?revoir=1',
    );
  });
});
