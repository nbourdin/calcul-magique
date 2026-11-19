import type { Level, SkillId } from '@/domain/types';
import { db, type SkillProgress } from './db';

export type { SkillProgress } from './db';

export function listSkillProgress(profileId: string): Promise<SkillProgress[]> {
  return db.skillProgress.where('profileId').equals(profileId).toArray();
}

async function update(
  profileId: string,
  skillId: SkillId,
  defaultLevel: Level,
  patch: Partial<SkillProgress>,
) {
  await db.transaction('rw', db.skillProgress, async () => {
    const current = (await db.skillProgress.get([profileId, skillId])) ?? {
      profileId,
      skillId,
      level: defaultLevel,
    };
    await db.skillProgress.put({ ...current, ...patch });
  });
}

/** L'étape « Je découvre » a été vue : elle ne s'affiche plus d'elle-même (bouton « revoir »). */
export function markDiscovered(profileId: string, skillId: SkillId, defaultLevel: Level, now: number) {
  return update(profileId, skillId, defaultLevel, { discoveredAt: now });
}

export function setSkillLevel(profileId: string, skillId: SkillId, level: Level) {
  return update(profileId, skillId, level, { level });
}
