import { now } from '@/app/clock';
import { CHARACTER_IDS, getCharacter } from '@/assets/characters';
import { nextCharacterChoices, placedPieces } from '@/domain/rewards/puzzle';
import { chooseNextCharacter } from '@/data/rewards';
import { useProfile } from '@/features/profile/profileStore';
import { fr } from '@/i18n/fr';
import { Puzzle } from './Puzzle';

/** L'enfant choisit son prochain personnage parmi les 3 prochains (PRD §7). */
export function ChooseCharacter({ onChosen }: { onChosen: () => void }) {
  const { profile, puzzles, load } = useProfile();
  const choices = nextCharacterChoices(CHARACTER_IDS, puzzles);

  if (choices.length === 0) return <p className="text-instruction">{fr.reveal.allDone}</p>;

  const choose = async (characterId: string) => {
    if (!profile) return;
    await chooseNextCharacter(profile.id, characterId, now());
    await load();
    onChosen();
  };

  return (
    <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-3">
      {choices.map((id) => {
        const character = getCharacter(id);
        if (!character) return null;
        const progress = puzzles.find((p) => p.characterId === id);
        return (
          <button
            key={id}
            type="button"
            onClick={() => void choose(id)}
            aria-label={fr.reveal.choose(character.name)}
            className="flex flex-col items-center gap-2 rounded-3xl bg-surface p-4 shadow-md transition hover:-translate-y-1 focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-primary"
            style={{ borderBottom: `8px solid ${character.color}` }}
          >
            <Puzzle
              character={character}
              placed={progress ? placedPieces(progress) : []}
              className="w-full max-w-48"
            />
            <span className="text-2xl font-extrabold">{character.name}</span>
            <span className="text-lg text-ink-soft">{character.title}</span>
          </button>
        );
      })}
    </div>
  );
}
