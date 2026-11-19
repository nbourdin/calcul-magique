import type { Settings } from './types';

/** Réglages par défaut (PRD §9). */
export const DEFAULT_SETTINGS: Settings = {
  sessionMinutes: 10,
  seriesBeforeBreak: 3,
  chronoMode: 'off',
  sound: true,
  voice: false,
  startLevel: 1,
};
