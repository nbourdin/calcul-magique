import Dexie, { type Table } from 'dexie';
import type { PuzzleProgress } from '@/domain/rewards/puzzle';
import type { RewardState } from '@/domain/rewards/seriesRewards';
import type { Attempt, FactState, Profile, Series } from '@/domain/types';

/** Version du schéma : incrémentée à chaque migration, reprise dans l'export JSON. */
export const SCHEMA_VERSION = 2;

export class AppDb extends Dexie {
  // `declare` : ne pas écraser les tables que Dexie installe sur l'instance.
  declare profiles: Table<Profile, string>;
  declare factStates: Table<FactState, [string, string]>;
  declare attempts: Table<Attempt, string>;
  declare series: Table<Series, string>;
  declare puzzles: Table<PuzzleProgress, [string, string]>;
  declare rewards: Table<RewardState, string>;

  constructor(name = 'calcul-magique') {
    super(name);
    // Chaque version ne déclare que ses changements ; Dexie applique les migrations dans l'ordre.
    this.version(1).stores({
      profiles: 'id',
      factStates: '[profileId+factKey], profileId, [profileId+skillId]',
      attempts: 'id, profileId, seriesId, [profileId+factKey], ts',
      series: 'id, profileId, [profileId+endedAt]',
    });
    this.version(2).stores({
      puzzles: '[profileId+characterId], profileId',
      rewards: 'profileId',
    });
  }
}

export const db = new AppDb();

export function newId(): string {
  return crypto.randomUUID();
}
