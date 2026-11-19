import { DEFAULT_SETTINGS } from '@/domain/settings';
import type { Profile } from '@/domain/types';
import { db, newId } from './db';

/** Seul usage de localStorage : l'identifiant du profil actif (PRD §3). */
const ACTIVE_PROFILE_KEY = 'calcul-magique.activeProfile';

export async function createProfile(input: { name: string; avatar: string }, now: number): Promise<Profile> {
  const profile: Profile = {
    id: newId(),
    name: input.name,
    avatar: input.avatar,
    createdAt: now,
    settings: { ...DEFAULT_SETTINGS },
  };
  await db.profiles.add(profile);
  return profile;
}

export function getProfile(id: string): Promise<Profile | undefined> {
  return db.profiles.get(id);
}

export function listProfiles(): Promise<Profile[]> {
  return db.profiles.orderBy('id').toArray();
}

export function getActiveProfileId(): string | null {
  try {
    return localStorage.getItem(ACTIVE_PROFILE_KEY);
  } catch {
    return null;
  }
}

export function setActiveProfileId(id: string): void {
  try {
    localStorage.setItem(ACTIVE_PROFILE_KEY, id);
  } catch {
    // Stockage indisponible (navigation privée) : le profil sera redemandé.
  }
}

/**
 * Profil actif, ou à défaut le premier profil existant, ou un profil créé.
 * En attendant l'onboarding, le profil créé n'a pas de prénom.
 */
export async function ensureActiveProfile(now: number): Promise<Profile> {
  const activeId = getActiveProfileId();
  // Transaction en écriture : deux appels simultanés (premier lancement, StrictMode)
  // sont sérialisés par IndexedDB et ne créent qu'un seul profil.
  const profile = await db.transaction(
    'rw',
    db.profiles,
    async () =>
      (activeId ? await db.profiles.get(activeId) : undefined) ??
      (await db.profiles.toCollection().first()) ??
      (await createProfile({ name: '', avatar: 'star' }, now)),
  );
  setActiveProfileId(profile.id);
  return profile;
}
