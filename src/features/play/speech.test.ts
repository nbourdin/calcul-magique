import { createRng } from '@/domain/rng';
import { questionForFact } from '@/domain/skills';
import type { Level, SkillId } from '@/domain/types';
import { spokenQuestion } from './speech';

const say = (skillId: SkillId, fact: string, level: Level = 1) =>
  spokenQuestion(questionForFact(skillId, fact, level, createRng(1)));

describe('question lue à voix haute', () => {
  it.each([
    ['C10', 'c10:7', 1, '7 plus combien, ça fait 10 ?'],
    ['C10', 'c10:7', 3, 'Combien plus 7, ça fait 10 ?'],
    ['P9', 'p9:6', 1, '6 plus 9, ça fait combien ?'],
    ['M9', 'm9:23', 1, '23 moins 9, ça fait combien ?'],
    ['T3', 'x:3x4', 1, '3 fois 4, ça fait combien ?'],
    ['DBL', 'dbl:8', 1, 'Quel est le double de 8 ?'],
    ['DBL', 'dbl:h16', 3, 'Quelle est la moitié de 16 ?'],
  ] as const)('%s %s niveau %i', (skillId, fact, level, text) => {
    expect(say(skillId, fact, level)).toBe(text);
  });
});
