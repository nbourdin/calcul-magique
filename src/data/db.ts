import Dexie, { type Table } from 'dexie';
import type { Attempt, FactState, Profile, Series } from '@/domain/types';

/** Version du schéma : incrémentée à chaque migration, reprise dans l'export JSON. */
export const SCHEMA_VERSION = 1;

export class AppDb extends Dexie {
  // `declare` : ne pas écraser les tables que Dexie installe sur l'instance.
  declare profiles: Table<Profile, string>;
  declare factStates: Table<FactState, [string, string]>;
  declare attempts: Table<Attempt, string>;
  declare series: Table<Series, string>;

  constructor(name = 'calcul-magique') {
    super(name);
    this.version(SCHEMA_VERSION).stores({
      profiles: 'id',
      factStates: '[profileId+factKey], profileId, [profileId+skillId]',
      attempts: 'id, profileId, seriesId, [profileId+factKey], ts',
      series: 'id, profileId, [profileId+endedAt]',
    });
  }
}

export const db = new AppDb();

export function newId(): string {
  return crypto.randomUUID();
}
