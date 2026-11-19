import 'fake-indexeddb/auto';
import { currentItem } from '@/domain/engine/run';
import { createRng } from '@/domain/rng';
import { db } from '@/data/db';
import { listAttemptsOfSeries, listFactStates, listRecentSeries } from '@/data/progress';
import { useSession } from './sessionStore';

const NOW = new Date(2026, 10, 19, 17, 0).getTime();

async function startSeries() {
  await useSession.getState().start({
    profileId: 'p1',
    skillId: 'C10',
    gameId: 'house10',
    level: 1,
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
    expect(result).toMatchObject({ stars: 3, firstTryCorrect: 10, questionCount: 10, skillId: 'C10' });
    expect(await listAttemptsOfSeries(result?.id ?? '')).toHaveLength(10);
    expect(await listRecentSeries('p1')).toHaveLength(1);
    expect((await listFactStates('p1')).every((s) => s.box >= 1)).toBe(true);
  });

  it('3 erreurs : 3 secondes chances, 13 tentatives, 2 étoiles', async () => {
    await startSeries();
    await play((attempt, i) => attempt === 2 || i >= 3);
    const { result } = useSession.getState();
    expect(result).toMatchObject({ stars: 2, firstTryCorrect: 7 });
    const attempts = await listAttemptsOfSeries(result?.id ?? '');
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
    await useSession.getState().start({ profileId: 'p1', skillId: 'TAD', gameId: 'house10', level: 1 });
    expect(useSession.getState().status).toBe('error');
  });
});
