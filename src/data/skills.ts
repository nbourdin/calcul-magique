import type { Level, SkillId } from '@/domain/types';
import { db, type SkillProgress } from './db';

export type { SkillProgress } from './db';

export function getSkillProgress(profileId: string, skillId: SkillId): Promise<SkillProgress | undefined> {
  return db.skillProgress.get([profileId, skillId]);
}

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

/**
 * L'étape « Je découvre » a été vue pour ce niveau : elle ne s'affiche plus d'elle-même
 * (bouton « revoir »), jusqu'au passage à un niveau supérieur.
 */
export function markDiscovered(
  profileId: string,
  skillId: SkillId,
  defaultLevel: Level,
  now: number,
  level: Level = defaultLevel,
) {
  return update(profileId, skillId, defaultLevel, { discoveredAt: now, discoveredLevel: level });
}

export function setSkillLevel(profileId: string, skillId: SkillId, level: Level, now?: number) {
  return update(profileId, skillId, level, now === undefined ? { level } : { level, levelSince: now });
}

/** L'enfant préfère rester à ce niveau : on attend de nouvelles séries avant de reproposer. */
export function postponeLevelUp(profileId: string, skillId: SkillId, level: Level, now: number) {
  return update(profileId, skillId, level, { levelSince: now });
}
