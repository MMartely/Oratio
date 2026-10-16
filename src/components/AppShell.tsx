import { NavLink, Outlet } from 'react-router-dom';
import { BarChart3, Home, Map, Mic, User } from 'lucide-react';
import { useI18n } from '../i18n';

export function AppShell() {
  const { d } = useI18n();
  const items = [
    { to: '/', icon: Home, label: d.nav.home, end: true },
    { to: '/path', icon: Map, label: d.nav.path },
    { to: '/practice', icon: Mic, label: d.nav.practice },
    { to: '/progress', icon: BarChart3, label: d.nav.progress },
    { to: '/profile', icon: User, label: d.nav.profile },
  ];
  return (
    <div className="mx-auto min-h-dvh w-full max-w-md">
      <main className="px-4 pb-28 pt-[max(1.25rem,env(safe-area-inset-top))]">
        <Outlet />
      </main>
      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-surface/90 pb-[env(safe-area-inset-bottom)] backdrop-blur">
        <ul className="mx-auto grid max-w-md grid-cols-5">
          {items.map(({ to, icon: Icon, label, end }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={end}
                className={({ isActive }) =>
                  `flex flex-col items-center gap-1 py-2.5 text-[11px] font-bold transition ${isActive ? 'text-primary' : 'text-muted'}`
                }
              >
                {({ isActive }) => (
                  <>
                    <span className={`grid h-8 w-12 place-items-center rounded-full transition ${isActive ? 'bg-primary/15' : ''}`}>
                      <Icon size={21} strokeWidth={isActive ? 2.4 : 2} />
                    </span>
                    {label}
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
