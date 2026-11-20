import { createRng } from '../rng';
import { makeChoices, swapDigits } from './choices';

describe('makeChoices', () => {
  it('complète avec des voisins quand les erreurs typiques sont inutilisables', () => {
    const choices = makeChoices(0, [-1, 0, null], createRng(1), { max: 10 });
    expect(choices).toContain(0);
    expect(new Set(choices).size).toBe(3);
    for (const c of choices) expect(c).toBeGreaterThan(0 - 1);
  });

  it('la bonne réponse n’est pas plus souvent au milieu, et jamais 3 nombres qui se suivent', () => {
    const rng = createRng(11);
    const DRAWS = 3000;
    const ranks = [0, 0, 0];
    let runs = 0;
    for (let i = 0; i < DRAWS; i++) {
      const answer = 2 + (i % 7);
      const [a = 0, b = 0, c = 0] = [
        ...makeChoices(answer, [answer + 1, answer - 1, 10 - answer], rng, { max: 10 }),
      ].sort((x, y) => x - y);
      const rank = [a, b, c].indexOf(answer);
      ranks[rank] = (ranks[rank] ?? 0) + 1;
      if (b === a + 1 && c === b + 1) runs++;
    }
    for (const n of ranks) expect(n / DRAWS).toBeGreaterThan(0.25);
    expect((ranks[1] ?? 0) / DRAWS).toBeLessThan(0.42);
    expect(runs).toBe(0);
  });

  it('garde les erreurs typiques en priorité', () => {
    const rng = createRng(2);
    for (let i = 0; i < 200; i++) {
      const choices = makeChoices(42, [32, 52], rng);
      expect(choices.some((c) => c === 32 || c === 52)).toBe(true);
    }
  });

  it('suite de 3 tolérée si les bornes ne laissent pas le choix', () => {
    const choices = makeChoices(1, [], createRng(1), { min: 0, max: 2 });
    expect([...choices].sort((a, b) => a - b)).toEqual([0, 1, 2]);
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
