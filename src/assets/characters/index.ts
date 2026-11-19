import type { CharacterMeta } from '@/domain/types';

/**
 * Catalogue construit à partir des fichiers du dossier : `<id>.json` (métadonnées) + `<id>.svg`.
 * Remplacer une illustration ne demande aucun changement de code.
 */
export interface Character extends CharacterMeta {
  image: string;
}

const metas = import.meta.glob<CharacterMeta>('./*.json', { eager: true, import: 'default' });
const images = import.meta.glob<string>('./*.svg', { eager: true, query: '?url', import: 'default' });

export const CHARACTERS: readonly Character[] = Object.entries(metas)
  .map(([path, meta]) => ({ ...meta, image: images[path.replace(/\.json$/, '.svg')] ?? '' }))
  .sort((a, b) => a.order - b.order);

export const CHARACTER_IDS: readonly string[] = CHARACTERS.map((c) => c.id);

export function getCharacter(id: string): Character | undefined {
  return CHARACTERS.find((c) => c.id === id);
}
