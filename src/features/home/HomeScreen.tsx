import { Link } from 'react-router-dom';
import { getCharacter } from '@/assets/characters';
import { placedPieces, PUZZLE_PIECES } from '@/domain/rewards/puzzle';
import type { SkillId } from '@/domain/types';
import { useProfile } from '@/features/profile/profileStore';
import { Flame, StarCount } from '@/features/rewards/Badges';
import { Puzzle } from '@/features/rewards/Puzzle';
import { fr } from '@/i18n/fr';
import { Avatar } from '@/ui/Avatar';
import { buttonClass } from '@/ui/buttonClass';

/** Monde 1 en attendant la carte des mondes. */
const FOREST: readonly SkillId[] = ['C10', 'C20', 'CDS'];

export function HomeScreen() {
  const { profile, rewards, puzzles } = useProfile();
  if (!profile || !rewards) return null;
  const active = rewards.activeCharacterId ? getCharacter(rewards.activeCharacterId) : undefined;
  const activeProgress = puzzles.find((p) => p.characterId === rewards.activeCharacterId);
  const placed = activeProgress ? placedPieces(activeProgress) : [];

  return (
    <main className="flex flex-1 flex-col gap-6 py-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <Link
          to="/profils"
          aria-label={fr.home.switchProfile}
          className="flex items-center gap-3 rounded-full pr-4 transition hover:bg-surface focus-visible:outline-4 focus-visible:outline-primary"
        >
          <Avatar id={profile.avatar} className="size-14" />
          <span className="text-2xl font-extrabold">{fr.home.welcomeName(profile.name)}</span>
        </Link>
        <div className="flex gap-3">
          <StarCount stars={rewards.stars} />
          <Flame streak={rewards.streak} />
        </div>
      </header>

      <div className="grid flex-1 items-start gap-6 md:grid-cols-2">
        <section className="flex flex-col items-center gap-3 rounded-3xl bg-surface p-5 shadow-md">
          {active ? (
            <>
              <h2 className="text-2xl font-extrabold">{fr.home.puzzleOf(active.name)}</h2>
              <Link to="/album" aria-label={fr.home.album} className="w-full max-w-72">
                <Puzzle character={active} placed={placed} />
              </Link>
              <p className="text-instruction text-ink-soft">
                {fr.home.puzzleProgress(placed.length, PUZZLE_PIECES)}
              </p>
            </>
          ) : (
            <Link to="/choisir" className={buttonClass()}>
              {fr.home.chooseNext}
            </Link>
          )}
          <Link to="/album" className={buttonClass('soft')}>
            {fr.home.album}
          </Link>
        </section>

        <section className="flex flex-col gap-4 rounded-3xl bg-mint p-5">
          <h2 className="text-center text-2xl font-extrabold">{fr.home.forest}</h2>
          {FOREST.map((skillId) => (
            <Link key={skillId} to={`/jouer/${skillId}`} className={buttonClass()}>
              {fr.skills[skillId]}
            </Link>
          ))}
        </section>
      </div>
    </main>
  );
}
