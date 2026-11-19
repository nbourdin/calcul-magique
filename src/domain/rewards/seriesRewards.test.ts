import { startPuzzle } from './puzzle';
import { applySeriesRewards, chooseCharacter, emptyRewards } from './seriesRewards';

const NOW = 1_000;

describe('récompenses d’une série', () => {
  it('ajoute étoiles, flamme et une pièce', () => {
    const { reward, puzzle } = chooseCharacter(emptyRewards('p1'), undefined, 'fee', NOW);
    const r = applySeriesRewards({
      reward,
      activePuzzle: puzzle,
      series: { stars: 3 },
      today: '2026-11-19',
      now: NOW,
    });
    expect(r.reward).toMatchObject({ stars: 3, activeCharacterId: 'fee', streak: { count: 1 } });
    expect(r.puzzle?.piecesPlaced).toBe(1);
    expect(r.outcome).toMatchObject({
      starsGained: 3,
      starsTotal: 3,
      streakChange: 'started',
      piece: { characterId: 'fee', piecesPlaced: 1, completed: false },
    });
  });

  it('la 9e pièce termine le puzzle et libère le choix suivant', () => {
    const reward = { ...emptyRewards('p1'), activeCharacterId: 'fee', stars: 14 };
    const r = applySeriesRewards({
      reward,
      activePuzzle: { ...startPuzzle('p1', 'fee', 0), piecesPlaced: 8 },
      series: { stars: 2 },
      today: '2026-11-19',
      now: NOW,
    });
    expect(r.outcome.piece?.completed).toBe(true);
    expect(r.reward.activeCharacterId).toBeNull();
    expect(r.puzzle?.completedAt).toBe(NOW);
    expect(r.outcome.newThemes).toEqual(['mint']);
  });

  it('sans puzzle actif : étoiles et flamme, pas de pièce', () => {
    const r = applySeriesRewards({
      reward: emptyRewards('p1'),
      activePuzzle: null,
      series: { stars: 1 },
      today: '2026-11-19',
      now: NOW,
    });
    expect(r.outcome.piece).toBeNull();
    expect(r.puzzle).toBeNull();
    expect(r.reward.stars).toBe(1);
  });

  it('reprend un puzzle déjà commencé', () => {
    const existing = { ...startPuzzle('p1', 'fee', 0), piecesPlaced: 4 };
    expect(chooseCharacter(emptyRewards('p1'), existing, 'fee', NOW).puzzle).toBe(existing);
  });
});
