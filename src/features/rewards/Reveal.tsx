import { useEffect } from 'react';
import { playSound } from '@/app/audio';
import type { Character } from '@/assets/characters';
import { fr } from '@/i18n/fr';
import { Button } from '@/ui/Button';

/** Révélation du personnage complété : courte, passable d'un tap. */
export function Reveal({ character, onContinue }: { character: Character; onContinue: () => void }) {
  useEffect(() => playSound('complete'), []);

  return (
    <section
      className="flex flex-col items-center gap-5 text-center"
      onClick={(e) => {
        if (e.target === e.currentTarget) onContinue();
      }}
    >
      <h1 className="text-4xl font-extrabold text-primary">{fr.reveal.title}</h1>
      <div className="anim-pop-in w-full max-w-80">
        <img
          src={character.image}
          alt={`${character.name}, ${character.title}`}
          className="anim-wiggle anim-glow w-full rounded-3xl shadow-lg"
          style={{ border: `8px solid ${character.color}` }}
        />
      </div>
      <p className="anim-pop-in relative rounded-3xl bg-surface px-6 py-4 text-2xl font-extrabold shadow-md [animation-delay:600ms]">
        {character.greeting}
      </p>
      <Button onClick={onContinue} autoFocus>
        {fr.reveal.continue}
      </Button>
    </section>
  );
}
