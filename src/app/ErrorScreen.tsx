import { Link, isRouteErrorResponse, useRouteError } from 'react-router-dom';
import { fr } from '@/i18n/fr';

export function ErrorScreen() {
  const error = useRouteError();
  const notFound = isRouteErrorResponse(error) && error.status === 404;

  return (
    <main className="flex min-h-full flex-col items-center justify-center gap-6 p-6 text-center">
      <h1 className="text-3xl font-extrabold">{fr.errors.title}</h1>
      {notFound && <p className="text-instruction text-ink-soft">{fr.errors.notFound}</p>}
      <Link
        to="/"
        className="min-h-tap rounded-full bg-primary px-8 py-3 text-xl font-bold text-white focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-primary"
      >
        {fr.errors.backHome}
      </Link>
    </main>
  );
}
