import { useState } from 'react';
import type { Level } from '@/domain/types';
import type { AidMode } from './aid';

/**
 * Aide visuelle d'une question : visible d'office, ou après un appui sur « Montre-moi ».
 * Sans réglage, l'aide n'apparaît qu'au niveau 1 (comportement d'origine des jeux).
 */
export function useAid(aid: AidMode | undefined, level: Level) {
  const mode = aid ?? (level === 1 ? 'shown' : 'hidden');
  const [asked, setAsked] = useState(false);
  return {
    visible: mode === 'shown' || (mode === 'onDemand' && asked),
    canAsk: mode === 'onDemand' && !asked,
    ask: () => setAsked(true),
  };
}
