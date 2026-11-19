import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { now } from '@/app/clock';
import { saveNewProfile } from '@/data/profiles';
import { useProfile } from '@/features/profile/profileStore';
import { ChooseCharacter } from '@/features/rewards/ChooseCharacter';
import { fr } from '@/i18n/fr';
import { Avatar } from '@/ui/Avatar';
import { AVATARS, type AvatarId } from '@/ui/avatars';
import { Button } from '@/ui/Button';

type Step = 'name' | 'avatar' | 'character';

const NAME_MAX = 20;

/** Premier lancement (ou nouveau joueur) : prénom, image, premier personnage à gagner. */
export function OnboardingScreen() {
  const navigate = useNavigate();
  const load = useProfile((s) => s.load);
  const [step, setStep] = useState<Step>('name');
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState<AvatarId>('star');
  const [saving, setSaving] = useState(false);
  const trimmed = name.trim();

  const createProfile = async () => {
    setSaving(true);
    try {
      await saveNewProfile({ name: trimmed, avatar }, now());
      await load();
      setStep('character');
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8 py-10 text-center">
      <h1 className="text-4xl font-extrabold text-primary">{fr.app.name}</h1>

      {step === 'name' && (
        <form
          className="flex w-full max-w-md flex-col items-center gap-6"
          onSubmit={(e) => {
            e.preventDefault();
            if (trimmed) setStep('avatar');
          }}
        >
          <p className="text-instruction">{fr.onboarding.hello}</p>
          <label className="flex w-full flex-col gap-3 text-2xl font-extrabold">
            {fr.onboarding.nameQuestion}
            <input
              autoFocus
              value={name}
              maxLength={NAME_MAX}
              onChange={(e) => setName(e.target.value)}
              placeholder={fr.onboarding.namePlaceholder}
              autoComplete="off"
              className="min-h-touch rounded-2xl border-4 border-primary-soft bg-surface px-5 text-center text-3xl font-extrabold focus:border-primary focus:outline-none"
            />
          </label>
          <Button type="submit" disabled={!trimmed} className="disabled:opacity-40">
            {fr.onboarding.next}
          </Button>
        </form>
      )}

      {step === 'avatar' && (
        <section className="flex w-full max-w-md flex-col items-center gap-6">
          <h2 className="text-2xl font-extrabold">{fr.onboarding.avatarQuestion}</h2>
          <div role="radiogroup" aria-label={fr.onboarding.avatarQuestion} className="grid grid-cols-3 gap-4">
            {AVATARS.map((id) => (
              <button
                key={id}
                type="button"
                role="radio"
                aria-checked={avatar === id}
                aria-label={fr.avatars[id]}
                onClick={() => setAvatar(id)}
                className={`rounded-full p-1 transition focus-visible:outline-4 focus-visible:outline-primary ${
                  avatar === id ? 'scale-110 ring-4 ring-primary' : 'opacity-80 hover:opacity-100'
                }`}
              >
                <Avatar id={id} className="size-20" />
              </button>
            ))}
          </div>
          <div className="flex gap-4">
            <Button variant="soft" onClick={() => setStep('name')}>
              {fr.onboarding.back}
            </Button>
            <Button onClick={() => void createProfile()} disabled={saving}>
              {fr.onboarding.next}
            </Button>
          </div>
        </section>
      )}

      {step === 'character' && (
        <section className="flex w-full flex-col items-center gap-6">
          <h2 className="text-2xl font-extrabold">{fr.onboarding.characterQuestion}</h2>
          <ChooseCharacter onChosen={() => navigate('/', { replace: true })} />
        </section>
      )}
    </main>
  );
}
