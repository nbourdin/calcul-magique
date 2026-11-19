import { createHashRouter } from 'react-router-dom';
import { ErrorScreen } from '@/app/ErrorScreen';
import { Layout } from '@/app/Layout';
import { HomeScreen } from '@/features/home/HomeScreen';
import { SeriesScreen } from '@/features/play/SeriesScreen';

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
      { index: true, element: <HomeScreen /> },
      { path: 'jouer/:skillId', element: <SeriesScreen /> },
    ],
  },
];

export const router = createHashRouter(routes);
