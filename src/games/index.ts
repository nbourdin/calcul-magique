import type { GameId, SkillId } from '@/domain/types';
import { lazy } from 'react';
import type { GameDefinition } from './types';

export type { GameDefinition, GameProps } from './types';

// Chaque jeu est un morceau chargé à la demande (préchargé par le service worker).
export const GAMES: Record<GameId, GameDefinition> = {
  house10: {
    id: 'house10',
    Component: lazy(() => import('./house10/House10Game').then((m) => ({ default: m.House10Game }))),
  },
  frog: {
    id: 'frog',
    Component: lazy(() => import('./frog/FrogGame').then((m) => ({ default: m.FrogGame }))),
  },
  bubbles: {
    id: 'bubbles',
    Component: lazy(() => import('./bubbles/BubblesGame').then((m) => ({ default: m.BubblesGame }))),
  },
  race: {
    id: 'race',
    Component: lazy(() => import('./race/RaceGame').then((m) => ({ default: m.RaceGame }))),
  },
  shop: {
    id: 'shop',
    Component: lazy(() => import('./shop/ShopGame').then((m) => ({ default: m.ShopGame }))),
  },
  train: {
    id: 'train',
    Component: lazy(() => import('./train/TrainGame').then((m) => ({ default: m.TrainGame }))),
  },
};

/**
 * Jeux proposés par compétence (au moins 2, PRD §6) ; le premier est choisi par défaut.
 * La grenouille rend toute stratégie « en sauts » et la course toute question à 3 propositions ;
 * le petit train pose les additions et soustractions en colonnes.
 */
export const SKILL_GAMES: Record<SkillId, readonly GameId[]> = {
  ADS: ['frog', 'race'],
  C10: ['house10', 'bubbles', 'shop'],
  C20: ['house10', 'bubbles', 'shop'],
  CDS: ['house10', 'bubbles'],
  DBL: ['race', 'frog'],
  PDB: ['race', 'frog'],
  TAD: ['frog', 'race'],
  P9: ['frog', 'race'],
  M9: ['frog', 'race'],
  D10: ['frog', 'race'],
  APO: ['train', 'race'],
  SPO: ['train', 'race'],
  T2: ['race', 'frog'],
  T5: ['race', 'frog'],
  T10: ['race', 'frog'],
  T3: ['race', 'frog'],
  T4: ['race', 'frog'],
};

export function gamesForSkill(skillId: SkillId): GameDefinition[] {
  return (SKILL_GAMES[skillId] ?? []).map((id) => GAMES[id]);
}

export function isGameId(id: string): id is GameId {
  return id in GAMES;
}
