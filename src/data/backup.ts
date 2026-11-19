import type { PuzzleProgress } from '@/domain/rewards/puzzle';
import type { RewardState } from '@/domain/rewards/seriesRewards';
import type { Attempt, FactState, Profile, Series } from '@/domain/types';
import { db, SCHEMA_VERSION, type SkillProgress } from './db';

export const EXPORT_APP = 'calcul-magique';

/** Fichier d'export d'un profil (PRD §9 et §11) : tout ce qui le concerne, rien d'autre. */
export interface ProfileExport {
  app: typeof EXPORT_APP;
  schemaVersion: number;
  exportedAt: number;
  profile: Profile;
  factStates: FactState[];
  attempts: Attempt[];
  series: Series[];
  puzzles: PuzzleProgress[];
  rewards: RewardState | null;
  skillProgress: SkillProgress[];
}

export type ImportErrorCode = 'json' | 'format' | 'version';

export class ImportError extends Error {
  constructor(
    readonly code: ImportErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'ImportError';
  }
}

const PROFILE_TABLES = ['factStates', 'attempts', 'series', 'puzzles', 'skillProgress'] as const;

export async function exportProfile(profileId: string, now: number): Promise<ProfileExport> {
  return db.transaction(
    'r',
    [db.profiles, db.factStates, db.attempts, db.series, db.puzzles, db.rewards, db.skillProgress],
    async () => {
      const profile = await db.profiles.get(profileId);
      if (!profile) throw new Error(`Profil inconnu : ${profileId}`);
      const byProfile = <T>(table: {
        where(i: string): { equals(v: string): { toArray(): Promise<T[]> } };
      }) => table.where('profileId').equals(profileId).toArray();
      return {
        app: EXPORT_APP,
        schemaVersion: SCHEMA_VERSION,
        exportedAt: now,
        profile,
        factStates: await byProfile(db.factStates),
        attempts: await byProfile(db.attempts),
        series: await byProfile(db.series),
        puzzles: await byProfile(db.puzzles),
        rewards: (await db.rewards.get(profileId)) ?? null,
        skillProgress: await byProfile(db.skillProgress),
      };
    },
  );
}

type Check = (v: Record<string, unknown>) => boolean;
const isObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);
const str = (v: unknown) => typeof v === 'string' && v.length > 0;
const num = (v: unknown) => typeof v === 'number' && Number.isFinite(v);
const intIn = (v: unknown, min: number, max: number) =>
  Number.isInteger(v) && (v as number) >= min && (v as number) <= max;

const RECORD_CHECKS: Record<(typeof PROFILE_TABLES)[number], Check> = {
  factStates: (r) =>
    str(r.factKey) && str(r.skillId) && intIn(r.box, 0, 4) && num(r.dueAt) && num(r.seenCount),
  attempts: (r) => str(r.id) && str(r.factKey) && typeof r.correctFirstTry === 'boolean' && num(r.ts),
  series: (r) => str(r.id) && str(r.skillId) && intIn(r.stars, 1, 3) && num(r.startedAt) && num(r.endedAt),
  puzzles: (r) => str(r.characterId) && intIn(r.piecesPlaced, 0, 9),
  skillProgress: (r) => str(r.skillId) && intIn(r.level, 1, 3),
};

/**
 * Valide un fichier d'import : refuse un autre format, une version plus récente que l'app
 * (PRD §11) ou des enregistrements d'un autre profil. Les tables absentes d'un export plus
 * ancien sont considérées vides.
 */
export function validateExport(data: unknown): ProfileExport {
  if (!isObject(data) || data.app !== EXPORT_APP)
    throw new ImportError('format', 'Ce fichier ne vient pas de Calcul Magique.');
  if (!Number.isInteger(data.schemaVersion) || (data.schemaVersion as number) < 1) {
    throw new ImportError('format', 'Version de fichier illisible.');
  }
  if ((data.schemaVersion as number) > SCHEMA_VERSION) {
    throw new ImportError('version', 'Ce fichier vient d’une version plus récente de l’app.');
  }
  const profile = data.profile;
  if (
    !isObject(profile) ||
    !str(profile.id) ||
    typeof profile.name !== 'string' ||
    !isObject(profile.settings)
  ) {
    throw new ImportError('format', 'Profil manquant ou invalide.');
  }
  const out: Record<string, unknown> = { ...data };
  for (const table of PROFILE_TABLES) {
    const rows = data[table] ?? [];
    if (!Array.isArray(rows)) throw new ImportError('format', `Données invalides : ${table}.`);
    for (const row of rows) {
      if (!isObject(row) || row.profileId !== profile.id || !RECORD_CHECKS[table](row)) {
        throw new ImportError('format', `Données invalides : ${table}.`);
      }
    }
    out[table] = rows;
  }
  const rewards = data.rewards ?? null;
  if (rewards !== null && (!isObject(rewards) || rewards.profileId !== profile.id || !num(rewards.stars))) {
    throw new ImportError('format', 'Données invalides : récompenses.');
  }
  out.rewards = rewards;
  return out as unknown as ProfileExport;
}

export function parseExport(text: string): ProfileExport {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new ImportError('json', 'Le fichier n’est pas un JSON valide.');
  }
  return validateExport(data);
}

const progressTables = () => [
  db.factStates,
  db.attempts,
  db.series,
  db.puzzles,
  db.rewards,
  db.skillProgress,
];

async function clearProgress(profileId: string) {
  await Promise.all([
    db.factStates.where('profileId').equals(profileId).delete(),
    db.attempts.where('profileId').equals(profileId).delete(),
    db.series.where('profileId').equals(profileId).delete(),
    db.puzzles.where('profileId').equals(profileId).delete(),
    db.skillProgress.where('profileId').equals(profileId).delete(),
    db.rewards.delete(profileId),
  ]);
}

/** Importe un profil : remplace entièrement ses données (même identifiant) ou le crée. */
export async function importProfile(data: ProfileExport): Promise<Profile> {
  await db.transaction('rw', [db.profiles, ...progressTables()], async () => {
    await clearProgress(data.profile.id);
    await db.profiles.put(data.profile);
    await db.factStates.bulkPut(data.factStates);
    await db.attempts.bulkPut(data.attempts);
    await db.series.bulkPut(data.series);
    await db.puzzles.bulkPut(data.puzzles);
    await db.skillProgress.bulkPut(data.skillProgress);
    if (data.rewards) await db.rewards.put(data.rewards);
  });
  return data.profile;
}

/** Réinitialise la progression d'un profil (prénom, image et réglages sont conservés). */
export async function resetProfileProgress(profileId: string): Promise<void> {
  await db.transaction('rw', progressTables(), () => clearProgress(profileId));
}
