import 'fake-indexeddb/auto';
import { createRng } from '@/domain/rng';
import { generateQuestion } from '@/domain/skills';
import type { Series } from '@/domain/types';
import {
  exportProfile,
  ImportError,
  importProfile,
  parseExport,
  resetProfileProgress,
  validateExport,
} from './backup';
import { db, SCHEMA_VERSION } from './db';
import { getProfile, saveNewProfile, updateSettings } from './profiles';
import { listFactStates, recordAnswer } from './progress';
import { chooseNextCharacter, finishSeries, getRewards } from './rewards';
import { markDiscovered } from './skills';

const NOW = new Date(2026, 10, 19, 17, 0).getTime();

async function seed(name: string) {
  const profile = await saveNewProfile({ name, avatar: 'moon' }, NOW);
  await chooseNextCharacter(profile.id, 'licorne', NOW);
  await markDiscovered(profile.id, 'C10', 1, NOW);
  const rng = createRng(name.length);
  for (let i = 0; i < 6; i++) {
    const question = { ...generateQuestion('C10', 1, rng), id: `q${i}` };
    await recordAnswer({
      profileId: profile.id,
      seriesId: 's1',
      gameId: 'house10',
      question,
      attempt: 1,
      correct: i % 3 !== 0,
      responseMs: 1500 + i,
      now: NOW + i,
    });
  }
  const series: Series = {
    id: `s-${name}`,
    profileId: profile.id,
    skillId: 'C10',
    gameId: 'house10',
    startedAt: NOW,
    endedAt: NOW + 90_000,
    stars: 2,
    mode: 'practice',
    firstTryCorrect: 7,
    questionCount: 10,
  };
  await finishSeries(series, ['fee', 'licorne'], NOW + 90_000);
  return profile;
}

const withoutDate = <T extends { exportedAt: number }>(e: T) => ({ ...e, exportedAt: 0 });

const store = new Map<string, string>();
vi.stubGlobal('localStorage', {
  getItem: (k: string) => store.get(k) ?? null,
  setItem: (k: string, v: string) => void store.set(k, v),
});

beforeEach(async () => {
  store.clear();
  await db.delete();
  await db.open();
});

describe('export / import', () => {
  it('export puis import redonne un état identique', async () => {
    const lila = await seed('Lila');
    await updateSettings(lila.id, { chronoMode: 'soft', seriesBeforeBreak: 4 });
    const before = await exportProfile(lila.id, NOW);
    expect(before.attempts).toHaveLength(6);
    expect(before.puzzles).toHaveLength(1);

    const file = JSON.stringify(before);
    await db.delete();
    await db.open();
    await importProfile(parseExport(file));
    const after = await exportProfile(lila.id, NOW + 1);
    expect(withoutDate(after)).toEqual(withoutDate(before));
  });

  it('l’import remplace les données du profil sans toucher aux autres', async () => {
    const lila = await seed('Lila');
    const tom = await seed('Tom');
    const snapshot = await exportProfile(lila.id, NOW);
    await resetProfileProgress(lila.id);
    const [first] = snapshot.series;
    if (!first) throw new Error('série attendue');
    await finishSeries({ ...first, id: 'en-trop' }, ['fee'], NOW);
    await importProfile(snapshot);
    expect(withoutDate(await exportProfile(lila.id, NOW))).toEqual(withoutDate(snapshot));
    expect((await exportProfile(tom.id, NOW)).attempts).toHaveLength(6);
  });

  it('refuse un fichier d’une version plus récente', () => {
    expect(() =>
      validateExport({ app: 'calcul-magique', schemaVersion: SCHEMA_VERSION + 1, profile: {} }),
    ).toThrow(expect.objectContaining({ code: 'version' }));
  });

  it.each([
    ['pas du JSON', '{oups', 'json'],
    ['autre application', JSON.stringify({ app: 'autre', schemaVersion: 1 }), 'format'],
    ['profil manquant', JSON.stringify({ app: 'calcul-magique', schemaVersion: 1 }), 'format'],
  ])('refuse %s', (_label, text, code) => {
    try {
      parseExport(text);
      expect.unreachable();
    } catch (error) {
      expect(error).toBeInstanceOf(ImportError);
      expect((error as ImportError).code).toBe(code);
    }
  });

  it('refuse des enregistrements d’un autre profil ou mal formés', async () => {
    const lila = await seed('Lila');
    const data = await exportProfile(lila.id, NOW);
    expect(() =>
      validateExport({ ...data, attempts: [{ ...data.attempts[0], profileId: 'autre' }] }),
    ).toThrow(ImportError);
    expect(() => validateExport({ ...data, factStates: [{ ...data.factStates[0], box: 7 }] })).toThrow(
      ImportError,
    );
    expect(() => validateExport({ ...data, series: 'non' })).toThrow(ImportError);
    expect(() => validateExport({ ...data, rewards: { profileId: lila.id } })).toThrow(ImportError);
  });

  it('accepte un export plus ancien sans les tables récentes', async () => {
    const lila = await seed('Lila');
    const data = await exportProfile(lila.id, NOW);
    const v1 = {
      app: 'calcul-magique',
      schemaVersion: 1,
      exportedAt: NOW,
      profile: data.profile,
      factStates: data.factStates,
      attempts: data.attempts,
      series: data.series,
    };
    const parsed = validateExport(v1);
    expect(parsed.puzzles).toEqual([]);
    expect(parsed.rewards).toBeNull();
    await importProfile(parsed);
    expect((await getRewards(lila.id)).stars).toBe(0);
  });
});

describe('réinitialisation', () => {
  it('efface la progression mais garde le profil et ses réglages', async () => {
    const lila = await seed('Lila');
    await updateSettings(lila.id, { startLevel: 2 });
    await resetProfileProgress(lila.id);
    expect(await listFactStates(lila.id)).toEqual([]);
    expect((await getRewards(lila.id)).stars).toBe(0);
    expect((await getProfile(lila.id))?.settings.startLevel).toBe(2);
  });
});

describe('réglages', () => {
  it('complète les réglages d’un profil ancien', async () => {
    const lila = await saveNewProfile({ name: 'Lila', avatar: 'moon' }, NOW);
    const old: Partial<typeof lila.settings> = { ...lila.settings };
    delete old.unlockAll;
    await db.profiles.put({ ...lila, settings: old as typeof lila.settings });
    expect((await getProfile(lila.id))?.settings.unlockAll).toBe(false);
    await expect(updateSettings('inconnu', {})).rejects.toThrow();
  });
});
