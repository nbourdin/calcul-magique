import { useCallback, useEffect } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { answeredCount, currentItem } from '@/domain/engine/run';
import { isSkillAvailable } from '@/domain/skills';
import type { Level, SkillId } from '@/domain/types';
import { CHARACTER_IDS } from '@/assets/characters';
import { useProfile } from '@/features/profile/profileStore';
import { gamesForSkill, isGameId } from '@/games';
import { fr } from '@/i18n/fr';
import { Icon } from '@/ui/Icon';
import { EndScreen } from './EndScreen';
import { HelpPanel } from './HelpPanel';
import { useSession } from './sessionStore';

/** Délai avant la question suivante après une bonne réponse (PRD §5). */
const SUCCESS_DELAY_MS = 700;

function parseLevel(raw: string | null): Level | null {
  return raw === '1' || raw === '2' || raw === '3' ? (Number(raw) as Level) : null;
}

export function SeriesScreen() {
  const { skillId: rawSkill = '' } = useParams();
  const [search] = useSearchParams();
  const skillId = rawSkill as SkillId;
  const compatible = isSkillAvailable(skillId) ? gamesForSkill(skillId) : [];
  const wanted = search.get('jeu') ?? '';
  const game = compatible.find((g) => isGameId(wanted) && g.id === wanted) ?? compatible[0];
  const forcedLevel = parseLevel(search.get('niveau'));

  const { status, run, result, start, answer, next, reset } = useSession();
  const profileId = useProfile((s) => s.profile?.id);
  // Niveau de la compétence pour ce profil, à défaut le niveau de départ réglé par le parent.
  const startLevel = useProfile(
    (s) => s.skills.find((p) => p.skillId === skillId)?.level ?? s.profile?.settings.startLevel ?? 1,
  );
  const seriesBeforeBreak = useProfile((s) => s.profile?.settings.seriesBeforeBreak ?? 3);
  const reloadProfile = useProfile((s) => s.load);

  const begin = useCallback(async () => {
    if (!game || !profileId) return;
    await start({
      profileId,
      catalogIds: CHARACTER_IDS,
      skillId,
      gameId: game.id,
      level: forcedLevel ?? startLevel,
    });
  }, [game, profileId, skillId, forcedLevel, startLevel, start]);

  useEffect(() => {
    void begin();
    return () => reset();
  }, [begin, reset]);

  // Étoiles, flamme et puzzle ont changé : l'accueil doit les refléter.
  useEffect(() => {
    if (status === 'done') void reloadProfile();
  }, [status, reloadProfile]);

  const phase = run?.phase;
  useEffect(() => {
    if (phase !== 'success') return;
    const timer = setTimeout(() => void next(), SUCCESS_DELAY_MS);
    return () => clearTimeout(timer);
  }, [phase, run, next]);

  if (!game) throw new Response('', { status: 404 });

  if (status === 'error') {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-6 text-center">
        <p className="text-instruction">{fr.errors.loadFailed}</p>
        <Link to="/" className="text-xl font-bold text-primary underline">
          {fr.errors.backHome}
        </Link>
      </main>
    );
  }

  if (status === 'done' && result) {
    return (
      <EndScreen
        key={result.series.id}
        series={result.series}
        outcome={result.outcome}
        suggestBreak={result.seriesToday >= seriesBeforeBreak}
        onReplay={() => void begin()}
      />
    );
  }

  const item = run ? currentItem(run) : undefined;
  if (status !== 'playing' || !run || !item) {
    return (
      <main className="flex flex-1 items-center justify-center">
        <p className="text-instruction text-ink-soft">{fr.play.loading}</p>
      </main>
    );
  }

  const done = answeredCount(run);
  const Game = game.Component;
  const successWord = fr.play.success[done % fr.play.success.length];

  return (
    <main className="flex flex-1 flex-col gap-4 py-4">
      <header className="flex items-center gap-4">
        <Link
          to="/"
          aria-label={fr.play.quit}
          className="flex size-tap shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary"
        >
          <Icon name="home" />
        </Link>
        <div
          role="progressbar"
          aria-label={fr.play.progress(Math.min(done + 1, run.questionCount), run.questionCount)}
          aria-valuemin={0}
          aria-valuemax={run.questionCount}
          aria-valuenow={done}
          className="flex flex-1 gap-1.5"
        >
          {Array.from({ length: run.questionCount }, (_, i) => (
            <span
              key={i}
              className={`h-3 flex-1 rounded-full ${i < done ? 'bg-primary' : 'bg-primary-soft'}`}
            />
          ))}
        </div>
      </header>

      <Game
        key={`${item.question.id}-${item.attempt}`}
        question={item.question}
        attempt={item.attempt}
        active={run.phase === 'question'}
        progress={done / run.questionCount}
        onAnswer={(correct, ms) => void answer(correct, ms)}
      />

      {run.phase === 'success' && (
        <p
          role="status"
          className="fixed inset-x-0 bottom-[22%] z-20 mx-auto flex w-fit items-center gap-3 rounded-full bg-success px-8 py-4 text-3xl font-extrabold text-white shadow-lg"
        >
          <Icon name="check" className="size-9" />
          {successWord}
        </p>
      )}

      {run.phase === 'help' && (
        <div className="fixed inset-x-0 bottom-0 mx-auto max-w-screen-md p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <HelpPanel question={item.question} willRetry={item.attempt === 1} onContinue={() => void next()} />
        </div>
      )}
    </main>
  );
}
