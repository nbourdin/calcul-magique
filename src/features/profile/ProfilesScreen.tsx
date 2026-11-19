import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { Profile } from '@/domain/types';
import { listProfiles, MAX_PROFILES } from '@/data/profiles';
import { fr } from '@/i18n/fr';
import { Avatar } from '@/ui/Avatar';
import { buttonClass } from '@/ui/buttonClass';
import { useProfile } from './profileStore';

export function ProfilesScreen() {
  const navigate = useNavigate();
  const select = useProfile((s) => s.select);
  const [profiles, setProfiles] = useState<Profile[]>([]);

  useEffect(() => {
    void listProfiles().then((all) => setProfiles(all.filter((p) => p.name !== '')));
  }, []);

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8 py-10">
      <h1 className="text-4xl font-extrabold text-primary">{fr.profiles.title}</h1>
      <ul className="flex flex-wrap justify-center gap-6">
        {profiles.map((p) => (
          <li key={p.id}>
            <button
              type="button"
              aria-label={fr.profiles.play(p.name)}
              onClick={() => void select(p.id).then(() => navigate('/'))}
              className="flex w-40 flex-col items-center gap-3 rounded-3xl bg-surface p-5 shadow-md transition hover:-translate-y-1 focus-visible:outline-4 focus-visible:outline-primary"
            >
              <Avatar id={p.avatar} className="size-24" />
              <span className="text-2xl font-extrabold">{p.name}</span>
            </button>
          </li>
        ))}
      </ul>
      {profiles.length < MAX_PROFILES && (
        <Link to="/bienvenue" className={buttonClass('soft')}>
          {fr.profiles.add}
        </Link>
      )}
    </main>
  );
}
