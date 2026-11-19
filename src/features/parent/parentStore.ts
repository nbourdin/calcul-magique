import { create } from 'zustand';

/** Accès à l'espace parent : ouvert jusqu'au retour au jeu (jamais mémorisé sur l'appareil). */
interface ParentAccess {
  unlocked: boolean;
  unlock: () => void;
  lock: () => void;
}

export const useParentAccess = create<ParentAccess>()((set) => ({
  unlocked: false,
  unlock: () => set({ unlocked: true }),
  lock: () => set({ unlocked: false }),
}));
