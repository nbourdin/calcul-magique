import { lazy } from 'react';

/** Écrans secondaires chargés à la demande (le service worker les précharge quand même pour le hors ligne). */
export const AlbumScreen = lazy(() =>
  import('@/features/album/AlbumScreen').then((m) => ({ default: m.AlbumScreen })),
);
export const CharacterScreen = lazy(() =>
  import('@/features/album/CharacterScreen').then((m) => ({ default: m.CharacterScreen })),
);
export const ParentScreen = lazy(() =>
  import('@/features/parent/ParentScreen').then((m) => ({ default: m.ParentScreen })),
);
export const ProfilesScreen = lazy(() =>
  import('@/features/profile/ProfilesScreen').then((m) => ({ default: m.ProfilesScreen })),
);
