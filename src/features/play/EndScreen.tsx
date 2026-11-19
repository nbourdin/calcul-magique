import { useEffect, useState } from 'react';
import { playSound } from '@/app/audio';
import { Link } from 'react-router-dom';
import { getCharacter } from '@/assets/characters';
import { pieceOrder } from '@/domain/rewards/puzzle';
import type { SeriesRewardOutcome } from '@/domain/rewards/seriesRewards';
import type { Series } from '@/domain/types';
import { ChooseCharacter } from '@/features/rewards/ChooseCharacter';
import { Puzzle } from '@/features/rewards/Puzzle';
import { Reveal } from '@/features/rewards/Reveal';
import { fr } from '@/i18n/fr';
import { Button } from '@/ui/Button';
import { buttonClass } from '@/ui/buttonClass';
import { Icon } from '@/ui/Icon';
import type { SeriesResult } from './sessionStore';
import { LevelCard } from './LevelCard';

interface EndScreenProps {
  series: Series;
  outcome: SeriesRewardOutcome | null;
  /** Assez de séries aujourd'hui : on encourage à s'arrêter (« à demain »). */
  suggestBreak: boolean;
  /** Niveau suivant proposé, ou retour au niveau précédent (absent : rien à dire). */
  levelChange?: SeriesResult['levelChange'];
  /** Absent pour le défi du jour (une fois par jour). */
  onReplay?: (() => void) | undefined;
}

type Stage = 'summary' | 'reveal' | 'choose' | 'chosen';

function streakMessage(outcome: SeriesRewardOutcome): string | null {
  switch (outcome.streakChange) {
    case 'started':
      return fr.flame.started;
    case 'grew':
    case 'grace':
      return fr.flame.grew(outcome.streak.count);
    case 'woke':
      return fr.flame.woke;
    case 'same':
      return null;
  }
}

/** Fin de série : étoiles, pièce de puzzle qui vole à sa place, puis révélation si le puzzle est fini. */
export function EndScreen({ series, outcome, suggestBreak, levelChange = null, onReplay }: EndScreenProps) {
  const [stage, setStage] = useState<Stage>('summary');
  const piece = outcome?.piece ?? null;
  const character = piece ? getCharacter(piece.characterId) : undefined;

  // Étoiles puis pièce qui vole vers sa place.
  useEffect(() => {
    playSound('star');
    if (!piece) return;
    const timer = setTimeout(() => playSound('piece'), 900);
    return () => clearTimeout(timer);
  }, [piece]);

  if (stage === 'reveal' && character) {
    return (
      <main className="flex flex-1 items-center justify-center py-8">
        <Reveal character={character} onContinue={() => setStage('choose')} />
      </main>
    );
  }

  if (stage === 'choose') {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-6 py-8 text-center">
        <h1 className="text-3xl font-extrabold text-primary">{fr.reveal.chooseTitle}</h1>
        <ChooseCharacter onChosen={() => setStage('chosen')} />
      </main>
    );
  }

  const title = suggestBreak ? fr.tomorrow.title : fr.end.title;
  const streakText = outcome ? streakMessage(outcome) : null;

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-5 py-8 text-center">
      <h1 className="text-4xl font-extrabold text-primary">{title}</h1>
      <div role="img" aria-label={fr.end.stars(series.stars)} className="flex gap-3">
        {[1, 2, 3].map((i) => (
          <Icon
            key={i}
            name="star"
            filled
            className={`size-16 ${i <= series.stars ? 'anim-pop-in text-[#f5b82e]' : 'text-primary-soft'}`}
          />
        ))}
      </div>
      <p className="text-3xl font-extrabold">
        {suggestBreak ? fr.tomorrow.text : fr.end.message[series.stars]}
      </p>
      <p className="text-instruction text-ink-soft">
        {fr.end.summary(series.firstTryCorrect, series.questionCount)}
      </p>

      {character && piece && stage === 'summary' && (
        <div className="flex flex-col items-center gap-2">
          <p className="text-instruction font-bold">{fr.puzzle.newPiece}</p>
          <Puzzle
            character={character}
            placed={pieceOrder(character.id).slice(0, piece.piecesPlaced)}
            newPiece={piece.pieceIndex}
            className="w-56"
          />
        </div>
      )}
      {(series.bonusStars ?? 0) > 0 && (
        <p className="flex items-center gap-2 text-instruction font-bold">
          <Icon name="star" filled className="size-7 text-[#f5b82e]" />
          {series.mode === 'daily' ? fr.end.dailyBonus : fr.end.bonus}
        </p>
      )}
      {streakText && <p className="text-instruction font-bold text-help">{streakText}</p>}
      {levelChange && stage === 'summary' && !piece?.completed && (
        <LevelCard skillId={series.skillId} change={levelChange} />
      )}

      <div className="mt-2 flex flex-wrap items-center justify-center gap-4">
        {piece?.completed && stage === 'summary' ? (
          <Button onClick={() => setStage('reveal')} autoFocus>
            {fr.end.seeFriend}
          </Button>
        ) : suggestBreak ? (
          <>
            <Link to="/" className={buttonClass()}>
              <Icon name="home" />
              {fr.end.home}
            </Link>
            {onReplay && (
              <button type="button" onClick={onReplay} className="text-lg font-bold text-ink-soft underline">
                {fr.tomorrow.more}
              </button>
            )}
          </>
        ) : (
          <>
            {onReplay && (
              <Button onClick={onReplay}>
                <Icon name="replay" />
                {fr.end.again}
              </Button>
            )}
            <Link to="/" className={buttonClass(onReplay ? 'soft' : 'primary')}>
              <Icon name="home" />
              {fr.end.home}
            </Link>
          </>
        )}
      </div>
    </main>
  );
}
