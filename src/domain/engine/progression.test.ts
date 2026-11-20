import { factsFor } from '../skills';
import type { FactState, LeitnerBox } from '../types';
import { newFactState } from './leitner';
import {
  allFacts,
  canLevelUp,
  isNextWorldUnlocked,
  levelAdvice,
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

describe('conseil de fin de série (levelAdvice)', () => {
  const solid = c10.map((k) => fact(k, 3));

  it('propose de monter après 3 séries très réussies', () => {
    expect(levelAdvice({ skillId: 'C10', level: 1, states: [], rates: [0.9, 1, 0.9] })).toBe('up');
    expect(levelAdvice({ skillId: 'C10', level: 1, states: [], rates: [0.9, 1] })).toBeNull();
  });

  it('propose de monter quand les faits du niveau sont solides et la série réussie', () => {
    expect(levelAdvice({ skillId: 'C10', level: 1, states: solid, rates: [0.6, 0.8] })).toBe('up');
    // Une seule série depuis le dernier « pas encore » : on attend.
    expect(levelAdvice({ skillId: 'C10', level: 1, states: solid, rates: [0.8] })).toBeNull();
    // Dernière série difficile : on attend aussi.
    expect(levelAdvice({ skillId: 'C10', level: 1, states: solid, rates: [0.9, 0.5] })).toBeNull();
  });

  it('jamais au-dessus du dernier niveau', () => {
    expect(levelAdvice({ skillId: 'C20', level: 2, states: [], rates: [1, 1, 1] })).toBeNull();
  });

  it('redescend après 2 séries difficiles, jamais sous le niveau 1', () => {
    expect(levelAdvice({ skillId: 'C10', level: 2, states: [], rates: [0.4, 0.3] })).toBe('down');
    expect(levelAdvice({ skillId: 'C10', level: 1, states: [], rates: [0.4, 0.3] })).toBeNull();
  });
});
