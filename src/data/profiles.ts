import { DEFAULT_SETTINGS, withDefaultSettings } from '@/domain/settings';
import type { Profile, Settings } from '@/domain/types';
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

/** Réglages complétés par les valeurs par défaut (profils créés par une version plus ancienne). */
function normalize(profile: Profile): Profile {
  return { ...profile, settings: withDefaultSettings(profile.settings) };
}

export async function getProfile(id: string): Promise<Profile | undefined> {
  const profile = await db.profiles.get(id);
  return profile && normalize(profile);
}

export async function updateSettings(profileId: string, patch: Partial<Settings>): Promise<Profile> {
  return db.transaction('rw', db.profiles, async () => {
    const profile = await db.profiles.get(profileId);
    if (!profile) throw new Error(`Profil inconnu : ${profileId}`);
    const updated = { ...profile, settings: { ...withDefaultSettings(profile.settings), ...patch } };
    await db.profiles.put(updated);
    return updated;
  });
}

export async function listProfiles(): Promise<Profile[]> {
  return (await db.profiles.orderBy('id').toArray()).map(normalize);
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
  return profile && normalize(profile);
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
