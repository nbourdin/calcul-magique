import { useState } from 'react';
import { now } from '@/app/clock';
import { dayKey } from '@/domain/time';
import type { Profile } from '@/domain/types';
import {
  exportProfile,
  ImportError,
  importProfile,
  parseExport,
  resetProfileProgress,
  type ProfileExport,
} from '@/data/backup';
import { listProfiles, MAX_PROFILES } from '@/data/profiles';
import { fr } from '@/i18n/fr';

const t = fr.parent.data;
const dateText = (ts: number) =>
  new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long', timeStyle: 'short' }).format(ts);
const card = 'flex flex-col gap-3 rounded-2xl bg-surface p-4';
const action =
  'min-h-tap w-fit rounded-xl px-5 font-bold focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-primary';

/** Export, import et réinitialisation d'un profil (PRD §9) : tout reste sur l'appareil. */
export function DataPanel({ profile, onChanged }: { profile: Profile; onChanged: () => Promise<void> }) {
  const [pending, setPending] = useState<{ data: ProfileExport; exists: boolean } | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  const download = async () => {
    const data = await exportProfile(profile.id, now());
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = t.fileName(profile.name.toLowerCase().replace(/[^a-z0-9]+/gi, '-'), dayKey(now()));
    a.click();
    URL.revokeObjectURL(url);
  };

  const pickFile = async (file: File | undefined) => {
    setError(null);
    setMessage(null);
    if (!file) return;
    try {
      const data = parseExport(await file.text());
      const profiles = await listProfiles();
      const exists = profiles.some((p) => p.id === data.profile.id);
      if (!exists && profiles.length >= MAX_PROFILES) throw new ImportError('format', t.importTooMany);
      setPending({ data, exists });
    } catch (e) {
      setError(e instanceof ImportError ? e.message : String(e));
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm font-bold text-ink-soft">{t.privacy}</p>
      {message && (
        <p role="status" className="font-bold text-success">
          {message}
        </p>
      )}

      <section className={card}>
        <h3 className="text-lg font-extrabold">{t.exportTitle}</h3>
        <p className="text-sm text-ink-soft">{t.exportHelp}</p>
        <button type="button" onClick={() => void download()} className={`${action} bg-primary text-white`}>
          {t.exportButton}
        </button>
      </section>

      <section className={card}>
        <h3 className="text-lg font-extrabold">{t.importTitle}</h3>
        <p className="text-sm text-ink-soft">{t.importHelp}</p>
        <label className={`${action} flex cursor-pointer items-center bg-primary-soft text-ink`}>
          {t.importButton}
          <input
            type="file"
            accept="application/json,.json"
            className="sr-only"
            onChange={(e) => {
              void pickFile(e.target.files?.[0]);
              e.target.value = '';
            }}
          />
        </label>
        {error && (
          <p role="alert" className="font-bold text-help">
            {error}
          </p>
        )}
        {pending && (
          <div className="flex flex-col gap-2 rounded-xl border-2 border-primary-soft p-3">
            <p>
              {t.importPreview(
                pending.data.profile.name,
                pending.data.attempts.length,
                dateText(pending.data.exportedAt),
              )}
            </p>
            {pending.exists && <p className="font-bold text-help">{t.importReplace}</p>}
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                className={`${action} bg-primary text-white`}
                onClick={async () => {
                  await importProfile(pending.data);
                  setPending(null);
                  setMessage(t.importDone);
                  await onChanged();
                }}
              >
                {t.importConfirm}
              </button>
              <button
                type="button"
                className={`${action} bg-primary-soft text-ink`}
                onClick={() => setPending(null)}
              >
                {t.cancel}
              </button>
            </div>
          </div>
        )}
      </section>

      <section className={card}>
        <h3 className="text-lg font-extrabold">{t.resetTitle}</h3>
        <p className="text-sm text-ink-soft">{t.resetHelp}</p>
        {!confirmReset ? (
          <button
            type="button"
            onClick={() => setConfirmReset(true)}
            className={`${action} bg-help-soft text-ink`}
          >
            {t.resetButton}
          </button>
        ) : (
          <div
            role="alertdialog"
            aria-label={t.resetTitle}
            className="flex flex-col gap-3 rounded-xl border-2 border-help p-3"
          >
            <p className="font-bold">{t.resetConfirm(profile.name)}</p>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                className={`${action} bg-help text-white`}
                onClick={async () => {
                  await resetProfileProgress(profile.id);
                  setConfirmReset(false);
                  setMessage(t.resetDone);
                  await onChanged();
                }}
              >
                {t.resetYes}
              </button>
              <button
                type="button"
                autoFocus
                className={`${action} bg-primary-soft text-ink`}
                onClick={() => setConfirmReset(false)}
              >
                {t.cancel}
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
