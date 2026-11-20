import type { Level, VisualAidSetting } from '@/domain/types';

/**
 * Aide visuelle d'un jeu pour une question : affichée d'office, à demander (bouton
 * « Montre-moi »), ou cachée jusqu'à la réponse.
 */
export type AidMode = 'shown' | 'onDemand' | 'hidden';

export function aidMode(setting: VisualAidSetting, level: Level): AidMode {
  if (setting === 'ask') return 'onDemand';
  if (setting === 'off') return 'hidden';
  return level === 1 ? 'shown' : 'hidden';
}
