import 'fake-indexeddb/auto';
import { currentItem } from '@/domain/engine/run';
import { createRng } from '@/domain/rng';
import type { SkillId } from '@/domain/types';
import { db } from '@/data/db';
import { listAttemptsOfSeries, listFactStates, listRecentSeries } from '@/data/progress';
import { getSkillProgress } from '@/data/skills';
import { useSession } from './sessionStore';

const NOW = new Date(2026, 10, 19, 17, 0).getTime();

async function startSeries(level: 1 | 2 | 3 = 1, adaptive = true) {
  await useSession.getState().start({
    profileId: 'p1',
    catalogIds: ['fee', 'licorne'],
    skillId: 'C10',
    gameId: 'house10',
    level,
    adaptive,
    rng: createRng(1),
    now: () => NOW,
  });
}

/** Répond à la question courante puis passe à la suivante. */
async function play(correct: (attempt: 1 | 2, index: number) => boolean) {
  let index = 0;
  for (;;) {
    const { run } = useSession.getState();
    const item = run && currentItem(run);
    if (!item) break;
    await useSession.getState().answer(correct(item.attempt, index++), 1500);
    await useSession.getState().next();
  }
}

beforeEach(async () => {
  useSession.getState().reset();
  await db.delete();
  await db.open();
});

describe('session de jeu', () => {
  it('une série parfaite : 10 tentatives, série enregistrée avec 3 étoiles', async () => {
    await startSeries();
    expect(useSession.getState().status).toBe('playing');
    await play(() => true);
    const { status, result } = useSession.getState();
    expect(status).toBe('done');
    expect(result?.series).toMatchObject({
      stars: 3,
      firstTryCorrect: 10,
      questionCount: 10,
      skillId: 'C10',
    });
    expect(result?.outcome?.piece).toMatchObject({ characterId: 'fee', piecesPlaced: 1 });
    expect(result?.seriesToday).toBe(1);
    expect(await listAttemptsOfSeries(result?.series.id ?? '')).toHaveLength(10);
    expect(await listRecentSeries('p1')).toHaveLength(1);
    expect((await listFactStates('p1')).every((s) => s.box >= 1)).toBe(true);
  });

  it('mode chrono : étoile bonus si rapide', async () => {
    await useSession.getState().start({
      profileId: 'p1',
      catalogIds: ['fee'],
      skillId: 'C10',
      gameId: 'house10',
      level: 1,
      chronoMode: 'soft',
      rng: createRng(1),
      now: () => NOW,
    });
    await play(() => true);
    const { result } = useSession.getState();
    expect(result?.series).toMatchObject({ mode: 'chrono', bonusStars: 1 });
    expect(result?.outcome?.starsGained).toBe(4);
    expect(result?.minutesToday).toBe(0);
  });

  it('3 erreurs : 3 secondes chances, 13 tentatives, 2 étoiles', async () => {
    await startSeries();
    await play((attempt, i) => attempt === 2 || i >= 3);
    const { result } = useSession.getState();
    expect(result?.series).toMatchObject({ stars: 2, firstTryCorrect: 7 });
    const attempts = await listAttemptsOfSeries(result?.series.id ?? '');
    expect(attempts).toHaveLength(13);
    expect(attempts.filter((a) => a.usedHelp)).toHaveLength(3);
  });

  it('une série interrompue garde ses tentatives mais n’est pas enregistrée', async () => {
    await startSeries();
    await useSession.getState().answer(true, 1000);
    await useSession.getState().next();
    useSession.getState().reset();
    expect(await db.attempts.count()).toBe(1);
    expect(await listRecentSeries('p1')).toHaveLength(0);
  });

  it('ignore une réponse en dehors d’une question', async () => {
    await useSession.getState().answer(true, 1000);
    await useSession.getState().next();
    expect(await db.attempts.count()).toBe(0);
  });

  it('passe en erreur si la compétence est inconnue', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    await useSession
      .getState()
      .start({ profileId: 'p1', catalogIds: [], skillId: 'XYZ' as SkillId, gameId: 'house10', level: 1 });
    expect(useSession.getState().status).toBe('error');
  });

  describe('niveau conseillé en fin de série', () => {
    it('3 séries très réussies : le niveau suivant est proposé, sans changer tout seul', async () => {
      for (let i = 0; i < 2; i++) {
        await startSeries();
        await play(() => true);
        expect(useSession.getState().result?.levelChange).toBeNull();
      }
      await startSeries();
      await play(() => true);
      const { result } = useSession.getState();
      expect(result?.series.level).toBe(1);
      expect(result?.levelChange).toEqual({ kind: 'up', level: 2 });
      expect((await getSkillProgress('p1', 'C10'))?.level ?? 1).toBe(1);
    });

    it('2 séries difficiles : retour au niveau précédent', async () => {
      for (let i = 0; i < 2; i++) {
        await startSeries(2);
        await play((attempt) => attempt === 2);
      }
      expect(useSession.getState().result?.levelChange).toEqual({ kind: 'down', level: 1 });
      expect(await getSkillProgress('p1', 'C10')).toMatchObject({ level: 1, levelSince: NOW });
    });

    it('pas de conseil quand le niveau est imposé', async () => {
      for (let i = 0; i < 3; i++) {
        await startSeries(1, false);
        await play(() => true);
      }
      expect(useSession.getState().result?.levelChange).toBeNull();
    });

    it('un niveau trop haut pour la compétence est ramené au dernier', async () => {
      await startSeries(3);
      await play(() => true);
      expect(useSession.getState().result?.series.level).toBe(3);
      await useSession.getState().start({
        profileId: 'p1',
        catalogIds: ['fee'],
        skillId: 'C20',
        gameId: 'house10',
        level: 3,
        rng: createRng(1),
        now: () => NOW,
      });
      await play(() => true);
      expect(useSession.getState().result?.series.level).toBe(2);
    });
  });
});
