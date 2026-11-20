import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { setSoundEnabled } from '@/app/audio';
import { DEFAULT_THEME } from '@/domain/rewards/themes';
import { useProfile } from '@/features/profile/profileStore';
import { SoundToggle } from '@/features/profile/SoundToggle';
import { useArrowNavigation } from '@/ui/arrowNavigation';

export function Layout() {
  const load = useProfile((s) => s.load);
  const theme = useProfile((s) => s.rewards?.theme ?? DEFAULT_THEME);
  const sound = useProfile((s) => s.profile?.settings.sound ?? true);
  const { pathname } = useLocation();
  // Menus et réponses au clavier : les flèches passent d'un bouton à l'autre.
  useArrowNavigation();

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  useEffect(() => {
    setSoundEnabled(sound);
  }, [sound]);

  return (
    <div className="mx-auto flex min-h-full max-w-5xl flex-col px-4 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] sm:px-8">
      <Outlet />
      {/* Bouton muet toujours visible côté enfant (l'espace parent a son propre réglage). */}
      {!pathname.startsWith('/parent') && <SoundToggle className="fixed top-3 right-3 z-20" />}
    </div>
  );
}
