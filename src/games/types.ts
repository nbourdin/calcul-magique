import type { ComponentType } from 'react';
import type { GameId, Question, SkillId } from '@/domain/types';

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
  onAnswer: (correct: boolean, responseMs: number) => void;
}

export interface GameDefinition {
  id: GameId;
  skills: readonly SkillId[];
  Component: ComponentType<GameProps>;
}
