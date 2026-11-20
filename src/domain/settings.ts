import type { Settings } from './types';

/** Réglages par défaut (PRD §9). */
export const DEFAULT_SETTINGS: Settings = {
  sessionMinutes: 10,
  seriesBeforeBreak: 3,
  chronoMode: 'off',
  sound: true,
  voice: false,
  startLevel: 1,
  unlockAll: false,
  visualAid: 'level',
};

/** Complète des réglages enregistrés par une version plus ancienne de l'app. */
export function withDefaultSettings(settings: Partial<Settings> | undefined): Settings {
  return { ...DEFAULT_SETTINGS, ...settings };
}
