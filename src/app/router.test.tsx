// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { RouterProvider, createMemoryRouter } from 'react-router-dom';
import { routes } from '@/app/router';
import { fr } from '@/i18n/fr';

function renderAt(path: string) {
  render(<RouterProvider router={createMemoryRouter(routes, { initialEntries: [path] })} />);
}

describe('routage', () => {
  it("affiche l'accueil sur /", () => {
    renderAt('/');
    expect(screen.getByRole('heading', { name: fr.app.name })).toBeInTheDocument();
  });

  it("affiche l'écran d'erreur sur une route inconnue", () => {
    renderAt('/nulle-part');
    expect(screen.getByText(fr.errors.notFound)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: fr.errors.backHome })).toHaveAttribute('href', '/');
  });
});
