/** Fonds d'écran débloqués par les étoiles (qui ne se dépensent ni ne se perdent). */
export const THEMES = [
  { id: 'cream', minStars: 0 },
  { id: 'mint', minStars: 15 },
  { id: 'sky', minStars: 40 },
  { id: 'lavender', minStars: 80 },
  { id: 'rose', minStars: 150 },
] as const;

export type ThemeId = (typeof THEMES)[number]['id'];

export const DEFAULT_THEME: ThemeId = 'cream';

export function isThemeUnlocked(theme: ThemeId, stars: number): boolean {
  return stars >= (THEMES.find((t) => t.id === theme)?.minStars ?? Infinity);
}

export function nextTheme(stars: number): (typeof THEMES)[number] | null {
  return THEMES.find((t) => t.minStars > stars) ?? null;
}

export function newlyUnlockedThemes(before: number, after: number): ThemeId[] {
  return THEMES.filter((t) => t.minStars > before && t.minStars <= after).map((t) => t.id);
}
