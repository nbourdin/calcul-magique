import { Link, useParams } from 'react-router-dom';
import { getCharacter } from '@/assets/characters';
import { isComplete } from '@/domain/rewards/puzzle';
import { useProfile } from '@/features/profile/profileStore';
import { fr } from '@/i18n/fr';
import { Icon } from '@/ui/Icon';

export function CharacterScreen() {
  const { characterId = '' } = useParams();
  const puzzles = useProfile((s) => s.puzzles);
  const character = getCharacter(characterId);
  const progress = puzzles.find((p) => p.characterId === characterId);
  if (!character) throw new Response('', { status: 404 });
  // Un personnage non débloqué reste secret.
  if (!progress || !isComplete(progress)) throw new Response('', { status: 404 });

  return (
    <main className="flex flex-1 flex-col items-center gap-6 py-6 text-center">
      <Link
        to="/album"
        aria-label={fr.album.back}
        className="flex size-tap items-center justify-center self-start rounded-full bg-primary-soft text-primary"
      >
        <Icon name="home" />
      </Link>
      <img
        src={character.image}
        alt={`${character.name}, ${character.title}`}
        className="anim-pop-in w-full max-w-96 rounded-3xl shadow-lg"
        style={{ border: `8px solid ${character.color}` }}
      />
      {/* Couleur du personnage en soulignement seulement : le texte garde un contraste AA. */}
      <h1 className="border-b-8 px-2 text-4xl font-extrabold" style={{ borderColor: character.color }}>
        {character.name}
      </h1>
      <p className="text-instruction text-ink-soft">{character.title}</p>
      <p className="rounded-3xl bg-surface px-6 py-4 text-2xl font-extrabold shadow-md">
        {character.greeting}
      </p>
    </main>
  );
}
