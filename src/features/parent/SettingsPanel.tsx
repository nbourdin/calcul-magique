import { useState, type ReactNode } from 'react';
import { getSkill } from '@/domain/skills';
import type { Level, Profile, Settings, SkillId } from '@/domain/types';
import { WORLDS } from '@/domain/worlds';
import { updateSettings } from '@/data/profiles';
import { setSkillLevel, type SkillProgress } from '@/data/skills';
import { fr } from '@/i18n/fr';

const t = fr.parent.settings;

function Segmented<T extends string | number>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: readonly { value: T; label: string }[];
  onChange: (value: T) => void;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button
          key={String(o.value)}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={`min-h-tap rounded-xl px-4 font-bold transition focus-visible:outline-4 focus-visible:outline-primary ${
            value === o.value ? 'bg-primary text-white' : 'bg-primary-soft text-ink hover:bg-primary/20'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function Field({ title, help, children }: { title: string; help?: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2 rounded-2xl bg-surface p-4">
      <h3 className="text-lg font-extrabold">{title}</h3>
      {help && <p className="text-sm text-ink-soft">{help}</p>}
      {children}
    </div>
  );
}

const onOff = [
  { value: 'on', label: t.on },
  { value: 'off', label: t.off },
] as const;

/** Réglages du profil, enregistrés immédiatement (PRD §9). */
export function SettingsPanel({
  profile,
  skills,
  onChanged,
}: {
  profile: Profile;
  skills: readonly SkillProgress[];
  onChanged: () => Promise<void>;
}) {
  const [saved, setSaved] = useState(false);
  const s = profile.settings;

  const save = async (patch: Partial<Settings>) => {
    await updateSettings(profile.id, patch);
    await onChanged();
    setSaved(true);
  };
  const saveLevel = async (skillId: SkillId, level: Level) => {
    await setSkillLevel(profile.id, skillId, level);
    await onChanged();
    setSaved(true);
  };

  return (
    <div className="flex flex-col gap-4">
      <p role="status" className="min-h-6 text-sm font-bold text-success">
        {saved ? t.saved : ''}
      </p>
      <Field title={t.sessionMinutes} help={t.sessionMinutesHelp}>
        <Segmented
          label={t.sessionMinutes}
          value={s.sessionMinutes}
          options={([5, 10, 15, 20] as const).map((n) => ({ value: n, label: t.minutes(n) }))}
          onChange={(sessionMinutes) => void save({ sessionMinutes })}
        />
      </Field>
      <Field title={t.seriesBeforeBreak}>
        <Segmented
          label={t.seriesBeforeBreak}
          value={s.seriesBeforeBreak}
          options={[2, 3, 4, 5].map((n) => ({ value: n, label: String(n) }))}
          onChange={(seriesBeforeBreak) => void save({ seriesBeforeBreak })}
        />
      </Field>
      <Field title={t.chrono} help={t.chronoHelp}>
        <Segmented
          label={t.chrono}
          value={s.chronoMode}
          options={(['off', 'soft', 'on'] as const).map((m) => ({ value: m, label: t.chronoModes[m] }))}
          onChange={(chronoMode) => void save({ chronoMode })}
        />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field title={t.sound} help={t.soon}>
          <Segmented
            label={t.sound}
            value={s.sound ? 'on' : 'off'}
            options={onOff}
            onChange={(v) => void save({ sound: v === 'on' })}
          />
        </Field>
        <Field title={t.voice} help={t.soon}>
          <Segmented
            label={t.voice}
            value={s.voice ? 'on' : 'off'}
            options={onOff}
            onChange={(v) => void save({ voice: v === 'on' })}
          />
        </Field>
      </div>
      <Field title={t.startLevel}>
        <Segmented
          label={t.startLevel}
          value={s.startLevel}
          options={([1, 2, 3] as const).map((l) => ({ value: l, label: String(l) }))}
          onChange={(startLevel) => void save({ startLevel })}
        />
      </Field>
      <Field title={t.levels}>
        <ul className="flex flex-col gap-3">
          {WORLDS.flatMap((w) => w.skills).map((skillId) => {
            const levels = getSkill(skillId).levels;
            const current = skills.find((p) => p.skillId === skillId)?.level ?? s.startLevel;
            const name = fr.parent.skillNames[skillId];
            return (
              <li key={skillId} className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-bold">{name}</span>
                {levels.length > 1 ? (
                  <Segmented
                    label={t.levelLabel(name, current)}
                    value={Math.min(current, levels.length) as Level}
                    options={levels.map((l) => ({ value: l, label: String(l) }))}
                    onChange={(level) => void saveLevel(skillId, level)}
                  />
                ) : (
                  <span className="text-sm text-ink-soft">{fr.parent.skillLevel(1)}</span>
                )}
              </li>
            );
          })}
        </ul>
      </Field>
      <Field title={t.unlockAll} help={t.unlockAllHelp}>
        {s.unlockAll ? (
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-bold text-success">{t.unlocked}</span>
            <button
              type="button"
              onClick={() => void save({ unlockAll: false })}
              className="font-bold text-primary underline"
            >
              {t.relock}
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => void save({ unlockAll: true })}
            className="min-h-tap w-fit rounded-xl bg-primary px-5 font-bold text-white focus-visible:outline-4 focus-visible:outline-primary"
          >
            {t.unlockAll}
          </button>
        )}
      </Field>
    </div>
  );
}
