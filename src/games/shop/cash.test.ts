import { cashDrawer, seedOf } from './cash';

describe('caisse de la boutique', () => {
  it('niveau 1 : toute la monnaie', () => {
    for (let seed = 0; seed < 20; seed++) {
      expect(cashDrawer(10, 7, 1, seed)).toEqual({ available: [1, 2, 5], missing: null });
    }
  });

  it('ensuite, une question sur deux, une pièce utile manque (jamais 1 €)', () => {
    let missing = 0;
    for (let seed = 0; seed < 200; seed++) {
      const drawer = cashDrawer(20, 13, 2, seed);
      expect(drawer.available).toContain(1);
      if (drawer.missing !== null) {
        missing++;
        expect([2, 5, 10]).toContain(drawer.missing);
        expect(drawer.available).not.toContain(drawer.missing);
      }
    }
    expect(missing).toBe(100);
  });

  it('rien ne manque quand aucune pièce ne servirait (rendre 1 €)', () => {
    expect(cashDrawer(10, 1, 2, 0).missing).toBeNull();
  });

  it('même question, même caisse', () => {
    expect(seedOf('3-c10:3')).toBe(seedOf('3-c10:3'));
    expect(seedOf('3-c10:3')).not.toBe(seedOf('4-c10:3'));
  });
});
