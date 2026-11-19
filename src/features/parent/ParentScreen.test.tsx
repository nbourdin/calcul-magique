// @vitest-environment jsdom
import 'fake-indexeddb/auto';
import { fireEvent, render, screen } from '@testing-library/react';
import { RouterProvider, createMemoryRouter } from 'react-router-dom';
import { routes } from '@/app/router';
import { db } from '@/data/db';
import { getProfile, saveNewProfile } from '@/data/profiles';
import { useProfile } from '@/features/profile/profileStore';
import { fr } from '@/i18n/fr';
import { useParentAccess } from './parentStore';

let profileId = '';

beforeEach(async () => {
  localStorage.clear();
  await db.delete();
  await db.open();
  profileId = (await saveNewProfile({ name: 'Lila', avatar: 'moon' }, Date.now())).id;
  useProfile.setState({
    status: 'loading',
    profile: null,
    rewards: null,
    puzzles: [],
    skills: [],
    facts: [],
  });
  useParentAccess.setState({ unlocked: false });
});

function renderAt(path: string) {
  render(<RouterProvider router={createMemoryRouter(routes, { initialEntries: [path] })} />);
}

/** Lit « a × b = ? » à l'écran et renvoie le produit. */
function currentAnswer(): number {
  const text = screen.getByText(/× \d = \?/).textContent ?? '';
  const [a, b] = text.match(/\d+/g)?.map(Number) ?? [];
  return (a ?? 0) * (b ?? 0);
}

function answerGate(value: number) {
  fireEvent.change(screen.getByRole('textbox', { name: fr.parent.gateAnswer }), {
    target: { value: String(value) },
  });
  fireEvent.click(screen.getByRole('button', { name: fr.parent.gateSubmit }));
}

describe('espace parent', () => {
  it('est accessible depuis l’accueil par l’engrenage', async () => {
    renderAt('/');
    expect(await screen.findByRole('link', { name: fr.parent.open })).toHaveAttribute('href', '/parent');
  });

  it('une mauvaise réponse refuse l’accès et change de calcul ; la bonne ouvre l’espace', async () => {
    renderAt('/parent');
    await screen.findByText(fr.parent.gateText);
    answerGate(currentAnswer() + 1);
    expect(screen.getByRole('alert')).toHaveTextContent(fr.parent.gateWrong);
    expect(screen.queryByRole('tablist')).not.toBeInTheDocument();
    answerGate(currentAnswer());
    expect(await screen.findByRole('tab', { name: fr.parent.tabs.dashboard })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(await screen.findByText(fr.parent.skillsTitle)).toBeInTheDocument();
  });

  it('les réglages sont enregistrés et pris en compte côté enfant', async () => {
    useParentAccess.setState({ unlocked: true });
    renderAt('/parent');
    fireEvent.click(await screen.findByRole('tab', { name: fr.parent.tabs.settings }));
    fireEvent.click(await screen.findByRole('radio', { name: fr.parent.settings.chronoModes.on }));
    fireEvent.click(screen.getByRole('button', { name: fr.parent.settings.unlockAll }));
    expect(await screen.findByText(fr.parent.settings.unlocked)).toBeInTheDocument();
    const saved = await getProfile(profileId);
    expect(saved?.settings).toMatchObject({ chronoMode: 'on', unlockAll: true });

    fireEvent.click(screen.getByRole('link', { name: fr.parent.back }));
    // Tous les mondes sont ouverts sur l'accueil.
    expect(await screen.findByRole('link', { name: fr.skills.T5 })).toBeInTheDocument();
    expect(useParentAccess.getState().unlocked).toBe(false);
  });

  it('la réinitialisation demande une confirmation', async () => {
    useParentAccess.setState({ unlocked: true });
    renderAt('/parent');
    fireEvent.click(await screen.findByRole('tab', { name: fr.parent.tabs.data }));
    fireEvent.click(await screen.findByRole('button', { name: fr.parent.data.resetButton }));
    expect(screen.getByRole('alertdialog')).toHaveTextContent(fr.parent.data.resetConfirm('Lila'));
    fireEvent.click(screen.getByRole('button', { name: fr.parent.data.cancel }));
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  });
});
