import { canSpeak, speak } from '@/app/voice';
import { fr } from '@/i18n/fr';
import { Icon } from '@/ui/Icon';
import { useProfile } from './profileStore';

/** « Écouter » : lit le texte à voix haute si le parent a activé la voix et si l'appareil sait le faire. */
export function ListenButton({ text }: { text: string }) {
  const voice = useProfile((s) => s.profile?.settings.voice ?? false);
  if (!voice || !canSpeak()) return null;
  return (
    <button
      type="button"
      onClick={() => speak(text)}
      className="flex min-h-tap shrink-0 items-center gap-2 rounded-full bg-sky px-4 text-lg font-extrabold text-ink transition hover:bg-primary-soft focus-visible:outline-4 focus-visible:outline-primary"
    >
      <Icon name="speaker" className="size-6" />
      {fr.speech.listen}
    </button>
  );
}
