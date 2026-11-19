import { create } from 'zustand';
import { composeSeries } from '@/domain/engine/series';
import {
  advance,
  currentItem,
  firstTryCorrectCount,
  startRun,
  submitAnswer,
  type RunState,
} from '@/domain/engine/run';
import { starsForSeries } from '@/domain/rewards/stars';
import { createRng, type Rng } from '@/domain/rng';
import type { GameId, Level, Series, SkillId } from '@/domain/types';
import { newId } from '@/data/db';
import { countNewFactsToday, listFactStates, recordAnswer } from '@/data/progress';
import { finishSeries, type FinishedSeries } from '@/data/rewards';
import type { SeriesRewardOutcome } from '@/domain/rewards/seriesRewards';

type Status = 'idle' | 'loading' | 'playing' | 'done' | 'error';

export interface SeriesResult {
  series: Series;
  /** null si l'enregistrement des récompenses a échoué. */
  outcome: SeriesRewardOutcome | null;
  seriesToday: number;
}

interface StartArgs {
  profileId: string;
  /** Identifiants des personnages, dans l'ordre de l'album. */
  catalogIds: readonly string[];
  skillId: SkillId;
  gameId: GameId;
  level: Level;
  rng?: Rng;
  now?: () => number;
}

interface SessionState {
  status: Status;
  run: RunState | null;
  result: SeriesResult | null;
  start: (args: StartArgs) => Promise<void>;
  answer: (correct: boolean, responseMs: number) => Promise<void>;
  next: () => Promise<void>;
  reset: () => void;
}

interface Context {
  profileId: string;
  catalogIds: readonly string[];
  skillId: SkillId;
  gameId: GameId;
  seriesId: string;
  startedAt: number;
  now: () => number;
}

/** Série en cours : seule la session courante peut écrire (évite les doubles démarrages). */
let context: Context | null = null;
let generation = 0;

export const useSession = create<SessionState>()((set, get) => ({
  status: 'idle',
  run: null,
  result: null,

  async start({ profileId, catalogIds, skillId, gameId, level, rng, now = Date.now }) {
    const token = ++generation;
    context = null;
    set({ status: 'loading', run: null, result: null });
    try {
      const t = now();
      const [states, newFactsIntroducedToday] = await Promise.all([
        listFactStates(profileId),
        countNewFactsToday(profileId, t),
      ]);
      const plan = composeSeries({
        skillId,
        level,
        states,
        now: t,
        newFactsIntroducedToday,
        rng: rng ?? createRng(Math.floor(Math.random() * 2 ** 32)),
      });
      if (token !== generation) return;
      context = { profileId, catalogIds, skillId, gameId, seriesId: newId(), startedAt: t, now };
      set({ status: 'playing', run: startRun(plan.questions) });
    } catch (error) {
      console.error(error);
      if (token === generation) set({ status: 'error' });
    }
  },

  async answer(correct, responseMs) {
    const { run } = get();
    const item = run && currentItem(run);
    if (!run || !item || run.phase !== 'question' || !context) return;
    const ctx = context;
    set({ run: submitAnswer(run, correct) });
    try {
      await recordAnswer({
        profileId: ctx.profileId,
        seriesId: ctx.seriesId,
        gameId: ctx.gameId,
        question: item.question,
        attempt: item.attempt,
        correct,
        responseMs,
        now: ctx.now(),
      });
    } catch (error) {
      // Le jeu continue même si l'écriture échoue (stockage plein, navigation privée…).
      console.error(error);
    }
  },

  async next() {
    const { run } = get();
    if (!run || !context) return;
    const nextRun = advance(run);
    if (nextRun === run) return;
    if (nextRun.phase !== 'done') {
      set({ run: nextRun });
      return;
    }
    const ctx = context;
    const firstTryCorrect = firstTryCorrectCount(nextRun);
    const series: Series = {
      id: ctx.seriesId,
      profileId: ctx.profileId,
      skillId: ctx.skillId,
      gameId: ctx.gameId,
      startedAt: ctx.startedAt,
      endedAt: ctx.now(),
      stars: starsForSeries(firstTryCorrect),
      mode: 'practice',
      firstTryCorrect,
      questionCount: nextRun.questionCount,
    };
    context = null;
    set({ run: nextRun });
    let finished: FinishedSeries | null = null;
    try {
      finished = await finishSeries(series, ctx.catalogIds, series.endedAt);
    } catch (error) {
      console.error(error);
    }
    set({
      status: 'done',
      result: { series, outcome: finished?.outcome ?? null, seriesToday: finished?.seriesToday ?? 1 },
    });
  },

  reset() {
    generation++;
    context = null;
    set({ status: 'idle', run: null, result: null });
  },
}));
