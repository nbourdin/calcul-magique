import type { GameId, SkillId } from '@/domain/types';
import { House10Game } from './house10/House10Game';
import type { GameDefinition } from './types';

export type { GameDefinition, GameProps } from './types';

export const GAMES: Partial<Record<GameId, GameDefinition>> = {
  house10: { id: 'house10', skills: ['C10', 'C20', 'CDS'], Component: House10Game },
};

/** Jeux compatibles avec une compétence (le premier est proposé par défaut). */
export function gamesForSkill(skillId: SkillId): GameDefinition[] {
  return Object.values(GAMES).filter((g) => g.skills.includes(skillId));
}
