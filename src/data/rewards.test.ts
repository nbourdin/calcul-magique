import 'fake-indexeddb/auto';
import type { Series } from '@/domain/types';
import { db } from './db';
import {
  chooseNextCharacter,
  countSeriesToday,
  finishSeries,
  getActivePuzzle,
  getRewards,
  listPuzzles,
  setTheme,
} from './rewards';

const NOW = new Date(2026, 10, 19, 17, 0).getTime();
const CATALOG = ['fee', 'licorne', 'princesse', 'sirene'];

const series = (i: number, stars: 1 | 2 | 3 = 2, endedAt = NOW + i): Series => ({
  id: `s${i}`,
  profileId: 'p1',
  skillId: 'C10',
  gameId: 'house10',
  startedAt: endedAt - 60_000,
  endedAt,
  stars,
  mode: 'practice',
  firstTryCorrect: 7,
  questionCount: 10,
});

beforeEach(async () => {
  await db.delete();
  await db.open();
});

describe('récompenses en base', () => {
  it('9 séries terminées révèlent le personnage choisi', async () => {
    await chooseNextCharacter('p1', 'licorne', NOW);
    let last;
    for (let i = 1; i <= 9; i++) last = await finishSeries(series(i, 3), CATALOG, NOW + i);
    expect(last?.outcome.piece).toMatchObject({ characterId: 'licorne', piecesPlaced: 9, completed: true });
    expect((await getRewards('p1')).activeCharacterId).toBeNull();
    expect(await getActivePuzzle('p1')).toBeNull();
    const [puzzle] = await listPuzzles('p1');
    expect(puzzle?.completedAt).toBeDefined();
    expect((await getRewards('p1')).stars).toBe(27);
  });

  it('sans choix préalable, le premier personnage est pris d’office', async () => {
    const { outcome } = await finishSeries(series(1), CATALOG, NOW);
    expect(outcome.piece?.characterId).toBe('fee');
    expect((await getActivePuzzle('p1'))?.piecesPlaced).toBe(1);
  });

  it('reprend un puzzle commencé quand on le rechoisit', async () => {
    await chooseNextCharacter('p1', 'sirene', NOW);
    await finishSeries(series(1), CATALOG, NOW);
    await chooseNextCharacter('p1', 'fee', NOW);
    await chooseNextCharacter('p1', 'sirene', NOW);
    expect((await getActivePuzzle('p1'))?.piecesPlaced).toBe(1);
  });

  it('compte les séries du jour et la flamme', async () => {
    const yesterday = NOW - 86_400_000;
    await finishSeries(series(1, 2, yesterday), CATALOG, yesterday);
    await finishSeries(series(2), CATALOG, NOW);
    const { seriesToday, outcome } = await finishSeries(series(3), CATALOG, NOW + 10);
    expect(seriesToday).toBe(2);
    expect(await countSeriesToday('p1', NOW)).toBe(2);
    expect(outcome.streak.count).toBe(2);
    expect(outcome.streakChange).toBe('same');
  });

  it('les fonds se choisissent seulement une fois débloqués', async () => {
    await expect(setTheme('p1', 'mint')).rejects.toThrow();
    for (let i = 1; i <= 5; i++) await finishSeries(series(i, 3), CATALOG, NOW);
    await setTheme('p1', 'mint');
    expect((await getRewards('p1')).theme).toBe('mint');
  });
});
