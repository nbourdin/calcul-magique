import { fr } from '@/i18n/fr';

export function HomeScreen() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 py-10 text-center">
      <h1 className="text-4xl font-extrabold text-primary">{fr.app.name}</h1>
      <p className="text-instruction">{fr.home.welcome}</p>
      <p className="rounded-3xl bg-primary-soft px-6 py-4 text-instruction text-ink-soft">
        {fr.home.comingSoon}
      </p>
    </main>
  );
}
