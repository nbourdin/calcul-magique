import { factsFor } from '../skills';
import type { FactState, LeitnerBox } from '../types';
import { newFactState } from './leitner';
import {
  allFacts,
  canLevelUp,
  isNextWorldUnlocked,
  levelBoxRatio,
  skillMasteryRatio,
  suggestLevelChange,
} from './progression';

const fact = (factKey: string, box: LeitnerBox, streak = 0, skillId: FactState['skillId'] = 'C10') => ({
  ...newFactState('p1', factKey, skillId, 0),
  box,
  consecutiveCorrect: streak,
});

const c10 = factsFor('C10', 1); // 11 faits

describe('passage de niveau (80 % en boîte ≥ 3)', () => {
  it('9 faits sur 11 suffisent, 8 non', () => {
    const nine = c10.slice(0, 9).map((k) => fact(k, 3));
    expect(levelBoxRatio('C10', 1, nine)).toBeCloseTo(9 / 11);
    expect(canLevelUp('C10', 1, nine)).toBe(true);
    expect(canLevelUp('C10', 1, nine.slice(1))).toBe(false);
  });

  it('impossible au dernier niveau', () => {
    const all = factsFor('C20', 2).map((k) => fact(k, 4, 5, 'C20'));
    expect(canLevelUp('C20', 2, all)).toBe(false);
  });

  it('ignore les états des autres compétences', () => {
    expect(levelBoxRatio('C10', 1, [fact('c10:3', 4, 5, 'P9')])).toBe(0);
  });
});

describe('déblocage du monde suivant (60 % maîtrisé)', () => {
  it('7 faits maîtrisés sur 11 suffisent, 6 non', () => {
    const seven = c10.slice(0, 7).map((k) => fact(k, 3, 3));
    expect(skillMasteryRatio('C10', seven)).toBeCloseTo(7 / 11);
    expect(isNextWorldUnlocked('C10', seven)).toBe(true);
    expect(isNextWorldUnlocked('C10', seven.slice(1))).toBe(false);
  });

  it('une boîte haute sans réussites consécutives ne compte pas', () => {
    expect(
      skillMasteryRatio(
        'C10',
        c10.map((k) => fact(k, 4, 2)),
      ),
    ).toBe(0);
  });

  it('compte les faits uniques de tous les niveaux', () => {
    expect(allFacts('C20')).toHaveLength(21);
    expect(allFacts('P9')).toHaveLength(9 + 80 + 120);
  });
});

describe('suggestLevelChange', () => {
  it.each([
    [[0.9, 1, 0.9], 'up'],
    [[0.5, 0.9, 1, 0.95], 'up'],
    [[0.9, 0.8, 1], null],
    [[1, 1], null],
    [[0.4, 0.3], 'down'],
    [[1, 0.49, 0.2], 'down'],
    [[0.4, 0.5], null],
    [[], null],
  ] as const)('%j → %s', (rates, expected) => {
    expect(suggestLevelChange(rates)).toBe(expected);
  });
});
