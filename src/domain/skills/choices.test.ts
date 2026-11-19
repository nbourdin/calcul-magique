import { createRng } from '../rng';
import { makeChoices, swapDigits } from './choices';

describe('makeChoices', () => {
  it('complète avec des voisins quand les erreurs typiques sont inutilisables', () => {
    const choices = makeChoices(0, [-1, 0, null], createRng(1), { max: 10 });
    expect([...choices].sort((a, b) => a - b)).toEqual([0, 2, 3]);
  });

  it('respecte les bornes', () => {
    for (let seed = 0; seed < 200; seed++) {
      const choices = makeChoices(9, [10, 19, 8], createRng(seed), { min: 1, max: 9 });
      expect(choices).toContain(9);
      for (const c of choices) {
        expect(c).toBeGreaterThanOrEqual(1);
        expect(c).toBeLessThanOrEqual(9);
      }
    }
  });

  it('échoue si l’intervalle ne permet pas 3 propositions', () => {
    expect(() => makeChoices(1, [], createRng(1), { min: 0, max: 1 })).toThrow();
  });
});

describe('swapDigits', () => {
  it('inverse les nombres à deux chiffres distincts', () => {
    expect(swapDigits(15)).toBe(51);
    expect(swapDigits(40)).toBe(4);
    expect(swapDigits(33)).toBeNull();
    expect(swapDigits(7)).toBeNull();
    expect(swapDigits(105)).toBeNull();
  });
});
