import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { DEFAULT_THEME } from '@/domain/rewards/themes';
import { useProfile } from '@/features/profile/profileStore';

export function Layout() {
  const load = useProfile((s) => s.load);
  const theme = useProfile((s) => s.rewards?.theme ?? DEFAULT_THEME);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  return (
    <div className="mx-auto flex min-h-full max-w-5xl flex-col px-4 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] sm:px-8">
      <Outlet />
    </div>
  );
}
