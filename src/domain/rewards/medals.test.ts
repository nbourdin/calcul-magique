import { newFactState } from '../engine/leitner';
import type { LeitnerBox } from '../types';
import { isMedalId, MEDALS, newMedals, type MedalContext } from './medals';
import { EMPTY_STREAK } from './streak';

const base: MedalContext = {
  series: { gameId: 'house10', firstTryCorrect: 6, questionCount: 10 },
  seriesCount: 2,
  streak: { ...EMPTY_STREAK, count: 1 },
  streakChange: 'same',
  facts: [],
  frogAnswers: 0,
  completedPuzzles: 0,
  dailyQuestions: 0,
};

const c10 = (box: LeitnerBox) =>
  Array.from({ length: 11 }, (_, n) => ({ ...newFactState('p1', `c10:${n}`, 'C10', 0), box }));

describe('médailles', () => {
  it('8 médailles au catalogue', () => {
    expect(MEDALS).toHaveLength(8);
    expect(isMedalId('comeback')).toBe(true);
    expect(isMedalId('autre')).toBe(false);
  });

  it('première série', () => {
    expect(newMedals([], { ...base, seriesCount: 1 })).toEqual(['firstSeries']);
    expect(newMedals(['firstSeries'], { ...base, seriesCount: 1 })).toEqual([]);
  });

  it('3 jours de suite, retour après une pause', () => {
    expect(newMedals(['firstSeries'], { ...base, streak: { ...EMPTY_STREAK, count: 3 } })).toEqual([
      'streak3',
    ]);
    expect(newMedals(['firstSeries'], { ...base, streakChange: 'woke' })).toEqual(['comeback']);
  });

  it('maître du 10 : tous les compléments en boîte 4', () => {
    expect(newMedals(['firstSeries'], { ...base, facts: c10(4) })).toEqual(['master10']);
    const almost = c10(4).map((s, i) => (i === 0 ? { ...s, box: 3 as const } : s));
    expect(newMedals(['firstSeries'], { ...base, facts: almost })).toEqual([]);
  });

  it('grenouille, course parfaite, album, défis du jour', () => {
    const owned = ['firstSeries'];
    expect(newMedals(owned, { ...base, frogAnswers: 50 })).toEqual(['frogJumper']);
    expect(newMedals(owned, { ...base, frogAnswers: 49 })).toEqual([]);
    expect(
      newMedals(owned, { ...base, series: { gameId: 'race', firstTryCorrect: 10, questionCount: 10 } }),
    ).toEqual(['perfectRace']);
    expect(
      newMedals(owned, { ...base, series: { gameId: 'frog', firstTryCorrect: 10, questionCount: 10 } }),
    ).toEqual([]);
    expect(newMedals(owned, { ...base, completedPuzzles: 3 })).toEqual(['album3']);
    expect(newMedals(owned, { ...base, dailyQuestions: 100 })).toEqual(['daily100']);
  });
});
