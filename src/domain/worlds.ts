import { skillMasteryRatio, WORLD_UNLOCK_RATIO } from './engine/progression';
import { skillSummary } from './parent/dashboard';
import type { FactState, Level, SkillId } from './types';

/**
 * Ordre des mondes (PRD §4, adouci) ; un monde = une petite famille de compétences,
 * de la plus facile à la plus difficile. Chaque monde ne demande qu'une marche de plus :
 * calculs ≤ 10, puis doubles, puis ≤ 20, puis dizaines, calcul posé, ±9 et enfin les tables.
 */
export const WORLDS = [
  { id: 'forest', skills: ['ADS', 'C10', 'C20'] },
  { id: 'river', skills: ['DBL', 'PDB'] },
  { id: 'mountain', skills: ['TAD'] },
  { id: 'bridge', skills: ['D10', 'CDS'] },
  { id: 'station', skills: ['APO', 'SPO'] },
  { id: 'meadow', skills: ['P9', 'M9'] },
  { id: 'castle', skills: ['T2', 'T5', 'T10', 'T3', 'T4'] },
] as const satisfies readonly { id: string; skills: readonly SkillId[] }[];

export type WorldId = (typeof WORLDS)[number]['id'];

/**
 * Un monde s'ouvre quand une compétence du monde précédent est maîtrisée à 60 %
 * (ou quand le parent a tout débloqué). On peut toujours rejouer un monde ouvert.
 */
export function unlockedWorlds(states: readonly FactState[], unlockAll = false): WorldId[] {
  const open: WorldId[] = [];
  for (const [i, world] of WORLDS.entries()) {
    const previous = WORLDS[i - 1];
    const ok =
      unlockAll ||
      previous === undefined ||
      (open.includes(previous.id) &&
        previous.skills.some((s) => skillMasteryRatio(s, states) >= WORLD_UNLOCK_RATIO));
    if (!ok) break;
    open.push(world.id);
  }
  return open;
}

/**
 * Prochaine étape conseillée sur la carte : la première compétence (dans l'ordre des mondes
 * ouverts) qui n'est pas encore solide à son niveau. L'enfant reste libre de jouer ailleurs.
 */
export function suggestedSkill(
  open: readonly WorldId[],
  levelOf: (skillId: SkillId) => Level,
  states: readonly FactState[],
): SkillId | null {
  for (const world of WORLDS) {
    if (!open.includes(world.id)) continue;
    for (const skillId of world.skills as readonly SkillId[]) {
      if (skillSummary(skillId, levelOf(skillId), states).status !== 'solid') return skillId;
    }
  }
  return null;
}

export function worldOfSkill(skillId: SkillId): WorldId | undefined {
  return WORLDS.find((w) => (w.skills as readonly SkillId[]).includes(skillId))?.id;
}
