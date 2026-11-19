import { isThemeUnlocked, newlyUnlockedThemes, nextTheme, THEMES } from './themes';

describe('fonds d’écran', () => {
  it('se débloquent par paliers d’étoiles', () => {
    expect(THEMES.length).toBeGreaterThanOrEqual(3);
    expect(isThemeUnlocked('cream', 0)).toBe(true);
    expect(isThemeUnlocked('mint', 14)).toBe(false);
    expect(isThemeUnlocked('mint', 15)).toBe(true);
  });

  it('annoncent le prochain palier', () => {
    expect(nextTheme(0)?.id).toBe('mint');
    expect(nextTheme(15)?.id).toBe('sky');
    expect(nextTheme(1000)).toBeNull();
  });

  it('détectent les paliers franchis', () => {
    expect(newlyUnlockedThemes(13, 16)).toEqual(['mint']);
    expect(newlyUnlockedThemes(16, 18)).toEqual([]);
    expect(newlyUnlockedThemes(0, 100)).toEqual(['mint', 'sky', 'lavender']);
  });
});
