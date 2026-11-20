import type { Level, SkillId } from '@/domain/types';
import { fr } from '@/i18n/fr';

/** Phrase d'introduction du niveau (certaines compétences changent de stratégie d'un niveau à l'autre). */
export function discoverIntro(skillId: SkillId, level: Level): string {
  const intro: string | readonly string[] = fr.discover.intro[skillId];
  return typeof intro === 'string' ? intro : (intro[level - 1] ?? intro[intro.length - 1] ?? '');
}
