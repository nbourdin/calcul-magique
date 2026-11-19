import { create } from 'zustand';
import { levelAdvice } from '@/domain/engine/progression';
import { composeSeries } from '@/domain/engine/series';
import {
  advance,
  currentItem,
  firstTryCorrectCount,
  startRun,
  submitAnswer,
  type RunState,
} from '@/domain/engine/run';
import { chronoBonus } from '@/domain/rewards/chrono';
import { starsForSeries } from '@/domain/rewards/stars';
import { createRng, type Rng } from '@/domain/rng';
import { clampLevel, getSkill } from '@/domain/skills';
import type { GameId, Level, Series, Settings, SkillId } from '@/domain/types';
import { newId } from '@/data/db';
import { countNewFactsToday, listFactStates, listLevelSeries, recordAnswer } from '@/data/progress';
import { finishSeries, type FinishedSeries } from '@/data/rewards';
import { getSkillProgress, setSkillLevel } from '@/data/skills';
import type { SeriesRewardOutcome } from '@/domain/rewards/seriesRewards';

type Status = 'idle' | 'loading' | 'playing' | 'done' | 'error';

export interface SeriesResult {
  series: Series;
  /** null si l'enregistrement des récompenses a échoué. */
  outcome: SeriesRewardOutcome | null;
  seriesToday: number;
  minutesToday: number;
  /**
   * « up » : niveau supérieur proposé à l'enfant (elle accepte ou non) ;
   * « down » : on est déjà revenu au niveau précédent, avec un message encourageant.
   */
  levelChange: { kind: 'up' | 'down'; level: Level } | null;
}

interface StartArgs {
  profileId: string;
  /** Identifiants des personnages, dans l'ordre de l'album. */
  catalogIds: readonly string[];
  skillId: SkillId;
  gameId: GameId;
  level: Level;
  chronoMode?: Settings['chronoMode'];
  /** Faux quand le niveau est imposé (lien de dev) : pas de conseil de niveau en fin de série. */
  adaptive?: boolean;
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
  level: Level;
  adaptive: boolean;
  chronoMode: Settings['chronoMode'];
  seriesId: string;
  startedAt: number;
  now: () => number;
}

/**
 * Conseil de niveau après une série (la série vient d'être enregistrée) : on propose de monter,
 * ou on redescend d'un niveau tout de suite après deux séries difficiles.
 */
async function adviseLevel(ctx: Context, now: number): Promise<SeriesResult['levelChange']> {
  const { profileId, skillId, level } = ctx;
  const [progress, states] = await Promise.all([
    getSkillProgress(profileId, skillId),
    listFactStates(profileId),
  ]);
  const played = await listLevelSeries(profileId, skillId, level, progress?.levelSince ?? 0);
  const rates = played.map((s) => s.firstTryCorrect / s.questionCount);
  const advice = levelAdvice({ skillId, level, states, rates });
  const { levels } = getSkill(skillId);
  if (advice === 'up') {
    const up = levels.find((l) => l > level);
    return up ? { kind: 'up', level: up } : null;
  }
  if (advice === 'down') {
    const down = [...levels].reverse().find((l) => l < level);
    if (!down) return null;
    await setSkillLevel(profileId, skillId, down, now);
    return { kind: 'down', level: down };
  }
  return null;
}

/** Série en cours : seule la session courante peut écrire (évite les doubles démarrages). */
let context: Context | null = null;
let generation = 0;

export const useSession = create<SessionState>()((set, get) => ({
  status: 'idle',
  run: null,
  result: null,

  async start({
    profileId,
    catalogIds,
    skillId,
    gameId,
    level: wanted,
    chronoMode = 'off',
    adaptive = true,
    rng,
    now = Date.now,
  }) {
    const token = ++generation;
    context = null;
    set({ status: 'loading', run: null, result: null });
    try {
      const level = clampLevel(getSkill(skillId), wanted);
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
      context = {
        profileId,
        catalogIds,
        skillId,
        gameId,
        level,
        adaptive,
        chronoMode,
        seriesId: newId(),
        startedAt: t,
        now,
      };
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
    set({ run: submitAnswer(run, correct, responseMs) });
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
      bonusStars: chronoBonus(ctx.chronoMode, nextRun.correctFirstTryMs),
      mode: ctx.chronoMode === 'off' ? 'practice' : 'chrono',
      firstTryCorrect,
      questionCount: nextRun.questionCount,
      level: ctx.level,
    };
    context = null;
    set({ run: nextRun });
    let finished: FinishedSeries | null = null;
    try {
      finished = await finishSeries(series, ctx.catalogIds, series.endedAt);
    } catch (error) {
      console.error(error);
    }
    let levelChange: SeriesResult['levelChange'] = null;
    try {
      if (ctx.adaptive && finished) levelChange = await adviseLevel(ctx, series.endedAt);
    } catch (error) {
      console.error(error);
    }
    set({
      status: 'done',
      result: {
        series,
        outcome: finished?.outcome ?? null,
        seriesToday: finished?.seriesToday ?? 1,
        minutesToday: finished?.minutesToday ?? 0,
        levelChange,
      },
    });
  },

  reset() {
    generation++;
    context = null;
    set({ status: 'idle', run: null, result: null });
  },
}));
