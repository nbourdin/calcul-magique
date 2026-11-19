import { newFactState } from './engine/leitner';
import { factsFor } from './skills';
import type { FactState, SkillId } from './types';
import { suggestedSkill, unlockedWorlds, worldOfSkill, WORLDS } from './worlds';

const mastered = (skillId: SkillId, count: number): FactState[] =>
  factsFor(skillId, 1)
    .slice(0, count)
    .map((k) => ({ ...newFactState('p1', k, skillId, 0), box: 3, consecutiveCorrect: 3 }));

describe('mondes', () => {
  it('couvrent chaque compétence une seule fois', () => {
    const skills = WORLDS.flatMap((w) => w.skills);
    expect(new Set(skills).size).toBe(skills.length);
    expect(skills).toHaveLength(17);
  });

  it('seule la forêt est ouverte au départ', () => {
    expect(unlockedWorlds([])).toEqual(['forest']);
  });

  it('une compétence de la forêt maîtrisée à 60 % ouvre la rivière', () => {
    expect(unlockedWorlds(mastered('C10', 6))).toEqual(['forest']); // 6/11
    expect(unlockedWorlds(mastered('C10', 7))).toEqual(['forest', 'river']); // 7/11
  });

  it('commencent par les calculs les plus simples', () => {
    expect(WORLDS[0].skills[0]).toBe('ADS');
    expect(worldOfSkill('APO')).toBe('station');
    // Le calcul posé vient après les dizaines, les tables en dernier.
    const order = WORLDS.map((w) => w.id);
    expect(order.indexOf('bridge')).toBeLessThan(order.indexOf('station'));
    expect(order.at(-1)).toBe('castle');
  });

  it('les mondes s’ouvrent dans l’ordre', () => {
    // Doubles maîtrisés mais forêt pas encore : la rivière reste fermée.
    expect(unlockedWorlds(mastered('PDB', 9))).toEqual(['forest']);
  });

  it('le parent peut tout débloquer', () => {
    expect(unlockedWorlds([], true)).toHaveLength(WORLDS.length);
  });

  it('conseille la première compétence pas encore solide', () => {
    const one = () => 1 as const;
    expect(suggestedSkill(['forest'], one, [])).toBe('ADS');
    const adsSolid = factsFor('ADS', 1).map((k) => ({
      ...newFactState('p1', k, 'ADS', 0),
      box: 3 as const,
      consecutiveCorrect: 3,
      seenCount: 3,
    }));
    expect(suggestedSkill(['forest'], one, adsSolid)).toBe('C10');
    // Au niveau 2, « Plus et moins » redevient l'étape conseillée.
    expect(suggestedSkill(['forest'], (s) => (s === 'ADS' ? 2 : 1), adsSolid)).toBe('ADS');
    expect(suggestedSkill([], one, [])).toBeNull();
  });

  it('retrouve le monde d’une compétence', () => {
    expect(worldOfSkill('P9')).toBe('meadow');
  });
});
