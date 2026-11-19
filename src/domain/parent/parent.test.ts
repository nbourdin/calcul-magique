import { newFactState } from '../engine/leitner';
import { createRng } from '../rng';
import { chronoBonus } from '../rewards/chrono';
import type { FactState, Series } from '../types';
import { activityByDay, factsToWork, minutesOnDay, shiftDay, skillSummary } from './dashboard';
import { parentChallenge } from './gate';

const fact = (factKey: string, patch: Partial<FactState>): FactState => ({
  ...newFactState('p1', factKey, 'C10', 0),
  seenCount: 3,
  correctFirstTry: 3,
  ...patch,
});

const series = (endedAt: number, minutes: number): Series => ({
  id: String(endedAt),
  profileId: 'p1',
  skillId: 'C10',
  gameId: 'house10',
  startedAt: endedAt - minutes * 60_000,
  endedAt,
  stars: 2,
  mode: 'practice',
  firstTryCorrect: 7,
  questionCount: 10,
});

describe('accès parent', () => {
  it('pose une multiplication des tables de 6 à 9', () => {
    const rng = createRng(3);
    for (let i = 0; i < 200; i++) {
      const { a, b, answer } = parentChallenge(rng);
      expect(a).toBeGreaterThanOrEqual(6);
      expect(b).toBeLessThanOrEqual(9);
      expect(answer).toBe(a * b);
    }
  });
});

describe('tableau de bord', () => {
  it('statut des compétences', () => {
    expect(skillSummary('C10', 1, [])).toMatchObject({ status: 'new', mastered: 0, total: 11 });
    const some = [fact('c10:1', { box: 3, consecutiveCorrect: 3 }), fact('c10:2', { box: 1 })];
    expect(skillSummary('C10', 1, some)).toMatchObject({ status: 'learning', mastered: 1 });
    const solid = Array.from({ length: 9 }, (_, i) => fact(`c10:${i}`, { box: 4, consecutiveCorrect: 4 }));
    expect(skillSummary('C10', 1, solid)).toMatchObject({ status: 'solid', mastered: 9 });
  });

  it('faits à travailler : les plus ratés puis les plus lents', () => {
    const list = factsToWork([
      fact('c10:1', { correctFirstTry: 3 }),
      fact('c10:2', { correctFirstTry: 1 }),
      fact('c10:3', { correctFirstTry: 3, avgMs: 7000 }),
      fact('c10:4', { correctFirstTry: 2, avgMs: 2000 }),
      fact('c10:5', { seenCount: 0, correctFirstTry: 0 }),
    ]);
    expect(list.map((s) => s.factKey)).toEqual(['c10:2', 'c10:4', 'c10:3']);
    expect(
      factsToWork(Array.from({ length: 20 }, (_, i) => fact(`c10:${i}`, { correctFirstTry: 0 }))),
    ).toHaveLength(10);
  });

  it('activité sur 14 jours', () => {
    const today = new Date(2026, 10, 19, 18).getTime();
    const days = activityByDay(
      [
        series(today, 4),
        series(today - 3600_000, 3),
        series(today - 2 * 86_400_000, 5),
        series(today - 30 * 86_400_000, 9),
      ],
      '2026-11-19',
    );
    expect(days).toHaveLength(14);
    expect(days[0]?.day).toBe('2026-11-06');
    expect(days[13]).toEqual({ day: '2026-11-19', minutes: 7, series: 2 });
    expect(days[11]).toEqual({ day: '2026-11-17', minutes: 5, series: 1 });
    expect(days.reduce((s, d) => s + d.series, 0)).toBe(3);
    expect(minutesOnDay([series(today, 4), series(today - 2 * 86_400_000, 5)], '2026-11-19')).toBe(4);
  });

  it('décale les jours en traversant les mois', () => {
    expect(shiftDay('2026-03-01', -1)).toBe('2026-02-28');
    expect(shiftDay('2026-12-31', 1)).toBe('2027-01-01');
  });
});

describe('mode chrono', () => {
  it('donne une étoile bonus seulement si rapide et juste, jamais en mode désactivé', () => {
    const fast = Array(8).fill(2500);
    expect(chronoBonus('off', fast)).toBe(0);
    expect(chronoBonus('soft', fast)).toBe(1);
    expect(chronoBonus('on', [...fast, 9000, 9000])).toBe(1);
    expect(chronoBonus('on', Array(8).fill(6000))).toBe(0);
    expect(chronoBonus('on', Array(6).fill(1000))).toBe(0);
  });
});
