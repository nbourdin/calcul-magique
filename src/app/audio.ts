import type { Howl } from 'howler';

/** Sons courts embarqués (PRD §10) : jamais de son négatif, volume modéré, bouton muet global. */
export type SoundId = 'click' | 'correct' | 'piece' | 'complete' | 'star' | 'bubble' | 'jump' | 'train';

const urls = import.meta.glob<string>('../assets/sounds/*.{ogg,mp3}', {
  eager: true,
  query: '?url',
  import: 'default',
});

const VOLUME = 0.55;
const cache = new Map<SoundId, Howl>();
let enabled = true;
// Howler n'est chargé qu'au premier son (allège le démarrage de l'app).
let howler: Promise<typeof import('howler')> | null = null;

function sourcesFor(id: SoundId): string[] {
  // .ogg d'abord, .mp3 en repli (Safari).
  return ['ogg', 'mp3'].map((ext) => urls[`../assets/sounds/${id}.${ext}`]).filter((u): u is string => !!u);
}

export function setSoundEnabled(on: boolean): void {
  enabled = on;
  if (!on) for (const howl of cache.values()) howl.stop();
}

export function isSoundEnabled(): boolean {
  return enabled;
}

export function playSound(id: SoundId): void {
  if (!enabled) return;
  howler ??= import('howler');
  howler
    .then(({ Howl }) => {
      if (!enabled) return;
      let howl = cache.get(id);
      if (!howl) {
        howl = new Howl({ src: sourcesFor(id), volume: VOLUME, preload: true });
        cache.set(id, howl);
      }
      howl.play();
    })
    .catch(() => {
      // Audio indisponible : le jeu continue en silence.
    });
}
