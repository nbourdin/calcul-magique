import { Link } from 'react-router-dom';
import { getCharacter } from '@/assets/characters';
import { placedPieces, PUZZLE_PIECES } from '@/domain/rewards/puzzle';
import { unlockedWorlds, WORLDS } from '@/domain/worlds';
import { useProfile } from '@/features/profile/profileStore';
import { Flame, StarCount } from '@/features/rewards/Badges';
import { Puzzle } from '@/features/rewards/Puzzle';
import { fr } from '@/i18n/fr';
import { Avatar } from '@/ui/Avatar';
import { Icon } from '@/ui/Icon';
import { buttonClass } from '@/ui/buttonClass';

const WORLD_TONE = ['bg-mint', 'bg-sky', 'bg-rose', 'bg-[#fff1c9]', 'bg-primary-soft'];

export function HomeScreen() {
  const { profile, rewards, puzzles, facts } = useProfile();
  if (!profile || !rewards) return null;
  const open = unlockedWorlds(facts, profile.settings.unlockAll);
  const active = rewards.activeCharacterId ? getCharacter(rewards.activeCharacterId) : undefined;
  const activeProgress = puzzles.find((p) => p.characterId === rewards.activeCharacterId);
  const placed = activeProgress ? placedPieces(activeProgress) : [];

  return (
    <main className="flex flex-1 flex-col gap-6 py-6">
      <header className="flex flex-wrap items-center justify-between gap-3 pr-14">
        <Link
          to="/profils"
          title={fr.home.switchProfile}
          className="flex items-center gap-3 rounded-full pr-4 transition hover:bg-surface focus-visible:outline-4 focus-visible:outline-primary"
        >
          <Avatar id={profile.avatar} className="size-14" />
          <span className="text-2xl font-extrabold">{fr.home.welcomeName(profile.name)}</span>
          <span className="sr-only">{fr.home.switchProfile}</span>
        </Link>
        <div className="flex items-center gap-3">
          <StarCount stars={rewards.stars} />
          <Flame streak={rewards.streak} />
          <Link
            to="/parent"
            aria-label={fr.parent.open}
            title={fr.parent.open}
            className="flex size-tap items-center justify-center rounded-full text-ink-soft opacity-70 transition hover:bg-surface hover:opacity-100 focus-visible:outline-4 focus-visible:outline-primary"
          >
            <Icon name="gear" className="size-6" />
          </Link>
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

        <nav aria-label={fr.home.map} className="flex flex-col gap-4">
          {WORLDS.map((world, i) => {
            const unlocked = open.includes(world.id);
            return (
              <section
                key={world.id}
                aria-label={unlocked ? fr.worlds[world.id] : fr.worlds.lockedLabel(fr.worlds[world.id])}
                className={`flex flex-col gap-3 rounded-3xl p-4 ${WORLD_TONE[i]} ${unlocked ? '' : 'border-4 border-dashed border-ink/15'}`}
              >
                <h2 className="text-xl font-extrabold">{fr.worlds[world.id]}</h2>
                {unlocked ? (
                  <div className="flex flex-wrap gap-3">
                    {world.skills.map((skillId) => (
                      <Link
                        key={skillId}
                        to={`/competence/${skillId}`}
                        className={`${buttonClass()} grow basis-44 px-5 text-xl leading-tight`}
                      >
                        {fr.skills[skillId]}
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="text-lg font-bold text-ink-soft">{fr.worlds.locked}</p>
                )}
              </section>
            );
          })}
        </nav>
      </div>
    </main>
  );
}
