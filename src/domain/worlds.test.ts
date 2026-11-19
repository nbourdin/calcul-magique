import { newFactState } from './engine/leitner';
import { factsFor } from './skills';
import type { FactState, SkillId } from './types';
import { unlockedWorlds, worldOfSkill, WORLDS } from './worlds';

const mastered = (skillId: SkillId, count: number): FactState[] =>
  factsFor(skillId, 1)
    .slice(0, count)
    .map((k) => ({ ...newFactState('p1', k, skillId, 0), box: 3, consecutiveCorrect: 3 }));

describe('mondes', () => {
  it('couvrent chaque compétence une seule fois', () => {
    const skills = WORLDS.flatMap((w) => w.skills);
    expect(new Set(skills).size).toBe(skills.length);
    expect(skills).toHaveLength(14);
  });

  it('seule la forêt est ouverte au départ', () => {
    expect(unlockedWorlds([])).toEqual(['forest']);
  });

  it('une compétence de la forêt maîtrisée à 60 % ouvre la rivière', () => {
    expect(unlockedWorlds(mastered('CDS', 5))).toEqual(['forest']); // 5/9
    expect(unlockedWorlds(mastered('CDS', 6))).toEqual(['forest', 'river']); // 6/9
  });

  it('les mondes s’ouvrent dans l’ordre', () => {
    // Doubles maîtrisés mais forêt pas encore : la rivière reste fermée.
    expect(unlockedWorlds(mastered('PDB', 9))).toEqual(['forest']);
  });

  it('le parent peut tout débloquer', () => {
    expect(unlockedWorlds([], true)).toHaveLength(5);
  });

  it('retrouve le monde d’une compétence', () => {
    expect(worldOfSkill('P9')).toBe('meadow');
  });
});
