import { CHARACTERS, getCharacter } from './index';

describe('catalogue des personnages', () => {
  it('contient les 9 personnages du MVP, chacun avec image et phrase courte', () => {
    expect(CHARACTERS).toHaveLength(9);
    expect(CHARACTERS.map((c) => c.order)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    for (const c of CHARACTERS) {
      expect(c.image).not.toBe('');
      expect(c.greeting.split(/\s+/).filter((w) => /\p{L}/u.test(w)).length).toBeLessThanOrEqual(8);
      expect(c.color).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });

  it('chaque SVG est carré (découpe 3×3)', () => {
    const sources = import.meta.glob<string>('./*.svg', { eager: true, query: '?raw', import: 'default' });
    expect(Object.keys(sources)).toHaveLength(9);
    for (const svg of Object.values(sources)) expect(svg).toContain('viewBox="0 0 300 300"');
  });

  it('retrouve un personnage par son identifiant', () => {
    expect(getCharacter('fee')?.name).toBe('Lila');
    expect(getCharacter('inconnu')).toBeUndefined();
  });
});
