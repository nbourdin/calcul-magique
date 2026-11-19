import 'fake-indexeddb/auto';
import { db } from './db';
import { listSkillProgress, markDiscovered, setSkillLevel } from './skills';

beforeEach(async () => {
  await db.delete();
  await db.open();
});

describe('progression par compétence', () => {
  it('mémorise la découverte et le niveau', async () => {
    await markDiscovered('p1', 'P9', 1, 1000);
    await setSkillLevel('p1', 'P9', 2);
    await setSkillLevel('p1', 'C10', 3);
    const all = await listSkillProgress('p1');
    expect(all).toEqual(
      expect.arrayContaining([
        { profileId: 'p1', skillId: 'P9', level: 2, discoveredAt: 1000 },
        { profileId: 'p1', skillId: 'C10', level: 3 },
      ]),
    );
    expect(await listSkillProgress('p2')).toEqual([]);
  });
});
