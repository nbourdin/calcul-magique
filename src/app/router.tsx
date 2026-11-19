import type { ReactNode } from 'react';
import { createHashRouter } from 'react-router-dom';
import { ErrorScreen } from '@/app/ErrorScreen';
import { Layout } from '@/app/Layout';
import { AlbumScreen } from '@/features/album/AlbumScreen';
import { CharacterScreen } from '@/features/album/CharacterScreen';
import { HomeScreen } from '@/features/home/HomeScreen';
import { OnboardingScreen } from '@/features/onboarding/OnboardingScreen';
import { ParentScreen } from '@/features/parent/ParentScreen';
import { SeriesScreen } from '@/features/play/SeriesScreen';
import { ProfilesScreen } from '@/features/profile/ProfilesScreen';
import { RequireProfile } from '@/features/profile/RequireProfile';
import { ChooseScreen } from '@/features/rewards/ChooseScreen';
import { SkillScreen } from '@/features/skill/SkillScreen';

const child = (element: ReactNode) => <RequireProfile>{element}</RequireProfile>;

/**
 * Routage par hash : fonctionne sur n'importe quel hébergement statique
 * (et en local) sans configuration de fallback SPA côté serveur.
 */
export const routes = [
  {
    path: '/',
    element: <Layout />,
    errorElement: <ErrorScreen />,
    children: [
      { index: true, element: child(<HomeScreen />) },
      { path: 'bienvenue', element: <OnboardingScreen /> },
      { path: 'profils', element: <ProfilesScreen /> },
      { path: 'competence/:skillId', element: child(<SkillScreen />) },
      { path: 'jouer/:skillId', element: child(<SeriesScreen />) },
      { path: 'choisir', element: child(<ChooseScreen />) },
      { path: 'album', element: child(<AlbumScreen />) },
      { path: 'album/:characterId', element: child(<CharacterScreen />) },
      { path: 'parent', element: child(<ParentScreen />) },
    ],
  },
];

export const router = createHashRouter(routes);
