import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Profile } from '@/domain/types';
import { listProfiles } from '@/data/profiles';
import { listSkillProgress, type SkillProgress } from '@/data/skills';
import { useProfile } from '@/features/profile/profileStore';
import { fr } from '@/i18n/fr';
import { Icon } from '@/ui/Icon';
import { Dashboard } from './Dashboard';
import { DataPanel } from './DataPanel';
import { ParentGate } from './ParentGate';
import { useParentAccess } from './parentStore';
import { SettingsPanel } from './SettingsPanel';

type Tab = 'dashboard' | 'settings' | 'data';
const TABS: readonly Tab[] = ['dashboard', 'settings', 'data'];

/** Espace parent (PRD §9) : tableau de bord, réglages et données, par profil. */
export function ParentScreen() {
  const { unlocked, lock } = useParentAccess();
  const activeId = useProfile((s) => s.profile?.id);
  const reloadChild = useProfile((s) => s.load);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [selectedId, setSelectedId] = useState<string | undefined>(activeId);
  const [skills, setSkills] = useState<SkillProgress[]>([]);
  const [tab, setTab] = useState<Tab>('dashboard');
  const [version, setVersion] = useState(0);

  useEffect(() => {
    if (!unlocked) return;
    let alive = true;
    void (async () => {
      const all = (await listProfiles()).filter((p) => p.name !== '');
      const id = selectedId ?? all[0]?.id;
      const progress = id ? await listSkillProgress(id) : [];
      if (!alive) return;
      setProfiles(all);
      setSkills(progress);
    })();
    return () => {
      alive = false;
    };
  }, [unlocked, selectedId, version]);

  /** Après une modification : relire les données ici et côté enfant. */
  const refresh = useCallback(async () => {
    setVersion((v) => v + 1);
    await reloadChild();
  }, [reloadChild]);

  if (!unlocked) return <ParentGate />;
  const profile = profiles.find((p) => p.id === selectedId) ?? profiles[0];

  return (
    <main className="flex flex-1 flex-col gap-6 py-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <Link
          to="/"
          onClick={lock}
          className="flex min-h-tap items-center gap-2 rounded-full bg-primary-soft px-4 font-bold text-primary focus-visible:outline-4 focus-visible:outline-primary"
        >
          <Icon name="home" className="size-6" />
          {fr.parent.back}
        </Link>
        <h1 className="text-3xl font-extrabold text-primary">{fr.parent.open}</h1>
        {profiles.length > 1 && (
          <label className="flex items-center gap-2 font-bold">
            {fr.parent.profile}
            <select
              value={profile?.id}
              onChange={(e) => setSelectedId(e.target.value)}
              className="min-h-tap rounded-xl border-2 border-primary-soft bg-surface px-3"
            >
              {profiles.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
        )}
      </header>

      <div role="tablist" aria-label={fr.parent.open} className="flex flex-wrap gap-2">
        {TABS.map((id) => (
          <button
            key={id}
            role="tab"
            id={`tab-${id}`}
            aria-selected={tab === id}
            aria-controls={`panel-${id}`}
            onClick={() => setTab(id)}
            className={`min-h-tap rounded-xl px-5 font-extrabold transition focus-visible:outline-4 focus-visible:outline-primary ${
              tab === id ? 'bg-primary text-white' : 'bg-surface text-ink hover:bg-primary-soft'
            }`}
          >
            {fr.parent.tabs[id]}
          </button>
        ))}
      </div>

      {profile && (
        <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`}>
          {tab === 'dashboard' && <Dashboard key={`${profile.id}-${version}`} profile={profile} />}
          {tab === 'settings' && <SettingsPanel profile={profile} skills={skills} onChanged={refresh} />}
          {tab === 'data' && <DataPanel profile={profile} onChanged={refresh} />}
        </div>
      )}
    </main>
  );
}
