import { createRng } from '@/domain/rng';
import { questionForFact } from '@/domain/skills';
import type { Level, SkillId } from '@/domain/types';
import { frogJumps, jumpLabel, lineBounds } from './jumps';

const q = (skillId: SkillId, fact: string, level: Level = 1) =>
  questionForFact(skillId, fact, level, createRng(1));
const labels = (skillId: SkillId, fact: string, level: Level = 1) =>
  frogJumps(q(skillId, fact, level)).jumps.map(jumpLabel);

describe('sauts de la grenouille', () => {
  it('suivent la stratégie quand elle forme une chaîne', () => {
    expect(labels('P9', 'p9:6')).toEqual(['+10', '−1']);
    expect(labels('M9', 'm9:23')).toEqual(['−10', '+1']);
    expect(labels('TAD', 'tad:8+5', 2)).toEqual(['+2', '+3']);
    expect(labels('PDB', 'pdb:6+7')).toEqual(['+6', '+1']);
    expect(labels('T3', 'x:3x4')).toEqual(['+3', '+3', '+3', '+3']);
    expect(frogJumps(q('T3', 'x:3x4')).start).toBe(0);
  });

  it('découpent en dizaines et unités sinon', () => {
    expect(labels('DBL', 'dbl:13', 2)).toEqual(['+10', '+3']);
    expect(labels('TAD', 'tad:3+4')).toEqual(['+4']);
  });

  it('moitié : deux sauts égaux depuis 0', () => {
    expect(frogJumps(q('DBL', 'dbl:h16', 3))).toEqual({
      start: 0,
      jumps: [
        { from: 0, to: 8 },
        { from: 8, to: 16 },
      ],
    });
  });

  it('bornes de la droite en dizaines entières', () => {
    expect(lineBounds([6, 16, 15])).toEqual({ lo: 0, hi: 20 });
    expect(lineBounds([30, 30])).toEqual({ lo: 30, hi: 40 });
  });
});
