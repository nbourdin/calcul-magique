import 'fake-indexeddb/auto';
import { createRng } from '@/domain/rng';
import { generateQuestion } from '@/domain/skills';
import type { Series } from '@/domain/types';
import { db } from './db';
import { createProfile, ensureActiveProfile, getActiveProfileId, listProfiles } from './profiles';
import {
  countNewFactsToday,
  listAttemptsOfSeries,
  listFactStates,
  listRecentSeries,
  recordAnswer,
  saveSeries,
} from './progress';

const NOW = new Date(2026, 10, 19, 17, 0).getTime();
const store = new Map<string, string>();

beforeAll(() => {
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
  });
});

beforeEach(async () => {
  store.clear();
  await db.delete();
  await db.open();
});

describe('profils', () => {
  it('crée un profil par défaut au premier lancement puis le retrouve', async () => {
    const first = await ensureActiveProfile(NOW);
    expect(first.settings.startLevel).toBe(1);
    expect(getActiveProfileId()).toBe(first.id);
    expect((await ensureActiveProfile(NOW + 1)).id).toBe(first.id);
    expect(await listProfiles()).toHaveLength(1);
  });

  it('deux appels simultanés au premier lancement ne créent qu’un profil', async () => {
    const [a, b] = await Promise.all([ensureActiveProfile(NOW), ensureActiveProfile(NOW)]);
    expect(a.id).toBe(b.id);
    expect(await listProfiles()).toHaveLength(1);
  });

  it('reprend un profil existant si le profil actif a disparu', async () => {
    const lila = await createProfile({ name: 'Lila', avatar: 'unicorn' }, NOW);
    store.set('calcul-magique.activeProfile', 'inconnu');
    expect((await ensureActiveProfile(NOW)).id).toBe(lila.id);
  });

  it('fonctionne sans localStorage', async () => {
    vi.stubGlobal('localStorage', {
      getItem: () => {
        throw new Error('bloqué');
      },
      setItem: () => {
        throw new Error('bloqué');
      },
    });
    const p = await ensureActiveProfile(NOW);
    expect(p.id).toBeTruthy();
    vi.stubGlobal('localStorage', {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => void store.set(k, v),
    });
  });
});

describe('tentatives et faits', () => {
  const question = { ...generateQuestion('P9', 1, createRng(1)), id: '1-x' };
  const base = { profileId: 'p1', seriesId: 's1', gameId: 'house10' as const, question, now: NOW };

  it('enregistre chaque tentative et met à jour la boîte', async () => {
    await recordAnswer({ ...base, attempt: 1, correct: true, responseMs: 1800.4 });
    const [state] = await listFactStates('p1');
    expect(state).toMatchObject({ factKey: question.factKey, box: 1, seenCount: 1, introducedAt: NOW });
    const [attempt] = await listAttemptsOfSeries('s1');
    expect(attempt).toMatchObject({ correctFirstTry: true, usedHelp: false, responseMs: 1800 });
  });

  it('une erreur puis une seconde chance : boîte 0, aide utilisée', async () => {
    await recordAnswer({ ...base, attempt: 1, correct: false, responseMs: 4000 });
    await recordAnswer({ ...base, attempt: 2, correct: true, responseMs: 2000, now: NOW + 60_000 });
    const attempts = await listAttemptsOfSeries('s1');
    expect(attempts.map((a) => [a.correctFirstTry, a.usedHelp])).toEqual([
      [false, false],
      [false, true],
    ]);
    const [state] = await listFactStates('p1');
    expect(state).toMatchObject({ box: 0, seenCount: 2, correctFirstTry: 0, introducedAt: NOW });
  });

  it('compte les faits introduits aujourd’hui', async () => {
    const yesterday = NOW - 86_400_000;
    await recordAnswer({ ...base, attempt: 1, correct: true, responseMs: 1000, now: yesterday });
    const other = { ...generateQuestion('C10', 1, createRng(2)), id: '2-y' };
    await recordAnswer({ ...base, question: other, attempt: 1, correct: true, responseMs: 1000 });
    expect(await countNewFactsToday('p1', NOW)).toBe(1);
  });
});

describe('séries', () => {
  it('liste les séries les plus récentes d’abord', async () => {
    const series = (i: number, profileId = 'p1'): Series => ({
      id: `s${i}`,
      profileId,
      skillId: 'C10',
      gameId: 'house10',
      startedAt: NOW + i,
      endedAt: NOW + i,
      stars: 2,
      mode: 'practice',
      firstTryCorrect: 7,
      questionCount: 10,
    });
    for (const i of [1, 3, 2]) await saveSeries(series(i));
    await saveSeries(series(4, 'p2'));
    expect((await listRecentSeries('p1', 2)).map((s) => s.id)).toEqual(['s3', 's2']);
  });
});
