import { useState } from 'react';
import { setSoundEnabled } from '@/app/audio';
import { updateSettings } from '@/data/profiles';
import { fr } from '@/i18n/fr';
import { Icon } from '@/ui/Icon';
import { useProfile } from './profileStore';

/** Bouton muet global, visible en permanence côté enfant (PRD §10). Il suit le réglage « Sons » du profil. */
export function SoundToggle({ className = '' }: { className?: string }) {
  const profile = useProfile((s) => s.profile);
  const load = useProfile((s) => s.load);
  const [localOn, setLocalOn] = useState(true);
  const on = profile ? profile.settings.sound : localOn;

  const toggle = async () => {
    setSoundEnabled(!on);
    if (profile) {
      await updateSettings(profile.id, { sound: !on });
      await load();
    } else {
      setLocalOn(!on);
    }
  };

  return (
    <button
      type="button"
      onClick={() => void toggle()}
      aria-pressed={!on}
      aria-label={on ? fr.sound.mute : fr.sound.unmute}
      title={on ? fr.sound.mute : fr.sound.unmute}
      className={`flex size-tap items-center justify-center rounded-full bg-surface text-ink shadow-sm transition hover:bg-primary-soft focus-visible:outline-4 focus-visible:outline-primary ${className}`}
    >
      <Icon name={on ? 'speaker' : 'speakerOff'} className="size-6" />
    </button>
  );
}
