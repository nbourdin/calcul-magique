import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useProfile } from './profileStore';

/** Écrans enfant : sans profil nommé, on passe par l'onboarding. */
export function RequireProfile({ children }: { children: ReactNode }) {
  const { status, profile } = useProfile();
  if (status === 'loading') return null;
  if (status === 'none' || !profile || profile.name === '') return <Navigate to="/bienvenue" replace />;
  return children;
}
