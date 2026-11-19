import { Link } from 'react-router-dom';
import type { SkillId } from '@/domain/types';
import { fr } from '@/i18n/fr';
import { buttonClass } from '@/ui/buttonClass';

/** Monde 1 en attendant la carte des mondes (M3). */
const FOREST: readonly SkillId[] = ['C10', 'C20', 'CDS'];

export function HomeScreen() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 py-10 text-center">
      <h1 className="text-4xl font-extrabold text-primary">{fr.app.name}</h1>
      <p className="text-instruction">{fr.home.welcome}</p>
      <section className="flex w-full max-w-sm flex-col gap-4 rounded-3xl bg-mint p-5">
        <h2 className="text-2xl font-extrabold">{fr.home.forest}</h2>
        {FOREST.map((skillId) => (
          <Link key={skillId} to={`/jouer/${skillId}`} className={buttonClass()}>
            {fr.skills[skillId]}
          </Link>
        ))}
      </section>
    </main>
  );
}
