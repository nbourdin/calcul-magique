import { Outlet } from 'react-router-dom';

export function Layout() {
  return (
    <div className="mx-auto flex min-h-full max-w-screen-md flex-col px-4 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
      <Outlet />
    </div>
  );
}
