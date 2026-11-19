import { createRng, pick, randInt, range, shuffle } from './rng';

describe('rng', () => {
  it('est reproductible à graine égale', () => {
    const a = createRng(42);
    const b = createRng(42);
    expect(Array.from({ length: 20 }, a)).toEqual(Array.from({ length: 20 }, b));
    expect(createRng(1)()).not.toBe(createRng(2)());
  });

  it('reste dans [0, 1)', () => {
    const rng = createRng(7);
    for (let i = 0; i < 10_000; i++) {
      const x = rng();
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThan(1);
    }
  });

  it('randInt couvre les bornes incluses', () => {
    const rng = createRng(3);
    const seen = new Set(Array.from({ length: 2000 }, () => randInt(rng, 2, 5)));
    expect([...seen].sort()).toEqual([2, 3, 4, 5]);
  });

  it('shuffle renvoie une permutation sans toucher à l’original', () => {
    const items = range(1, 20);
    const out = shuffle(createRng(9), items);
    expect(out).not.toEqual(items);
    expect([...out].sort((x, y) => x - y)).toEqual(items);
    expect(items).toEqual(range(1, 20));
  });

  it('pick refuse une liste vide', () => {
    expect(() => pick(createRng(1), [])).toThrow();
    expect(pick(createRng(1), ['seul'])).toBe('seul');
  });

  it('range gère un intervalle vide', () => {
    expect(range(3, 2)).toEqual([]);
  });
});
