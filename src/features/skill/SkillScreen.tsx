import { useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { now } from '@/app/clock';
import { clampLevel, getSkill, isSkillAvailable } from '@/domain/skills';
import type { GameId, SkillId } from '@/domain/types';
import { markDiscovered } from '@/data/skills';
import { useProfile } from '@/features/profile/profileStore';
import { gamesForSkill } from '@/games';
import { fr } from '@/i18n/fr';
import { buttonClass } from '@/ui/buttonClass';
import { Icon } from '@/ui/Icon';
import { Discover } from './Discover';

/**
 * Écran d'une compétence : « Je découvre » la première fois (ou sur « revoir »),
 * puis choix du jeu (proposé automatiquement, modifiable) avant de lancer la série.
 */
export function SkillScreen() {
  const { skillId: raw = '' } = useParams();
  const [search, setSearch] = useSearchParams();
  const skillId = raw as SkillId;
  const { profile, skills, load } = useProfile();
  const games = isSkillAvailable(skillId) ? gamesForSkill(skillId) : [];
  const [chosen, setChosen] = useState<GameId | null>(null);

  if (games.length === 0) throw new Response('', { status: 404 });
  if (!profile) return null;

  const progress = skills.find((s) => s.skillId === skillId);
  const level = clampLevel(getSkill(skillId), progress?.level ?? profile.settings.startLevel);
  // Première fois, « revoir », ou nouveau niveau pas encore découvert.
  const showDiscover =
    !progress?.discoveredAt || search.has('revoir') || (progress.discoveredLevel ?? 1) < level;
  const game = chosen ?? games[0]?.id;

  if (showDiscover) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center py-6">
        <Discover
          key={`${skillId}-${level}`}
          skillId={skillId}
          level={level}
          onDone={async () => {
            await markDiscovered(profile.id, skillId, profile.settings.startLevel, now(), level);
            await load();
            setSearch({}, { replace: true });
          }}
        />
      </main>
    );
  }

  return (
    <main className="flex flex-1 flex-col items-center gap-6 py-6 text-center">
      <Link
        to="/"
        aria-label={fr.skill.back}
        className="flex size-tap items-center justify-center self-start rounded-full bg-primary-soft text-primary"
      >
        <Icon name="home" />
      </Link>
      <h1 className="text-4xl font-extrabold text-primary">{fr.skills[skillId]}</h1>
      <button type="button" onClick={() => setSearch({ revoir: '1' })} className={buttonClass('soft')}>
        <Icon name="replay" />
        {fr.skill.rewatch} : {fr.skill.discover}
      </button>

      <h2 className="text-2xl font-extrabold">{fr.skill.chooseGame}</h2>
      <div role="radiogroup" aria-label={fr.skill.chooseGame} className="flex flex-wrap justify-center gap-4">
        {games.map((g) => (
          <button
            key={g.id}
            type="button"
            role="radio"
            aria-checked={game === g.id}
            onClick={() => setChosen(g.id)}
            className={`min-h-touch rounded-3xl px-6 py-4 text-2xl font-extrabold shadow-md transition focus-visible:outline-4 focus-visible:outline-primary ${
              game === g.id
                ? 'bg-primary text-white ring-4 ring-primary-soft'
                : 'bg-surface text-ink hover:-translate-y-0.5'
            }`}
          >
            {fr.games[g.id].name}
          </button>
        ))}
      </div>

      <Link to={`/jouer/${skillId}?jeu=${game}`} className={`${buttonClass()} mt-2 px-12 text-3xl`}>
        {fr.skill.play}
      </Link>
    </main>
  );
}
