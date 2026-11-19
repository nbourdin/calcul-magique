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

/** 2 à 4 profils sur le même appareil (PRD §2). */
export const MAX_PROFILES = 4;

/**
 * Profil actif, ou à défaut le premier profil existant. `undefined` au premier lancement :
 * l'app envoie alors vers l'onboarding.
 */
export async function getActiveProfile(): Promise<Profile | undefined> {
  const activeId = getActiveProfileId();
  const profile =
    (activeId ? await db.profiles.get(activeId) : undefined) ?? (await db.profiles.toCollection().first());
  if (profile && profile.id !== activeId) setActiveProfileId(profile.id);
  return profile;
}

/**
 * Crée un profil depuis l'onboarding. Un profil sans prénom (créé automatiquement avant
 * l'onboarding) est complété plutôt que doublé. La transaction sérialise deux envois rapides.
 */
export async function saveNewProfile(input: { name: string; avatar: string }, now: number): Promise<Profile> {
  const profile = await db.transaction('rw', db.profiles, async () => {
    const unnamed = await db.profiles.filter((p) => p.name === '').first();
    if (unnamed) {
      const updated = { ...unnamed, ...input };
      await db.profiles.put(updated);
      return updated;
    }
    if ((await db.profiles.count()) >= MAX_PROFILES) throw new Error('Nombre maximal de profils atteint');
    return createProfile(input, now);
  });
  setActiveProfileId(profile.id);
  return profile;
}
