import type { ComponentType } from 'react';
import type { GameId, Question } from '@/domain/types';

/**
 * Contrat commun des mini-jeux : un jeu ne connaît que la question courante
 * et signale la réponse ; il ne touche jamais à la base (PRD §3 et §6).
 * Le lecteur de série remonte le composant à chaque question (prop `key`).
 */
export interface GameProps {
  question: Question;
  /** 2 = seconde chance, en fin de série. */
  attempt: 1 | 2;
  /** Faux pendant le retour (bravo / aide) : le jeu fige sa saisie. */
  active: boolean;
  /** Avancement de la série, de 0 à 1 (ex. position du poney). */
  progress?: number;
  onAnswer: (correct: boolean, responseMs: number) => void;
}

/** Les compétences compatibles sont déclarées dans `SKILL_GAMES` (src/games/index.ts). */
export interface GameDefinition {
  id: GameId;
  Component: ComponentType<GameProps>;
}
