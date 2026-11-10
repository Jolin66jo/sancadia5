import { Home, Store, User, Users } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

interface NavItem {
  to: string;
  label: string;
  icon: typeof Home;
  match: (pathname: string) => boolean;
}

const items: NavItem[] = [
  { to: '/games', label: 'Games', icon: Home, match: (p) => p.startsWith('/games') },
  { to: '/social', label: 'Social', icon: Users, match: (p) => p.startsWith('/social') },
  { to: '/shop', label: 'Shop', icon: Store, match: (p) => p.startsWith('/shop') },
  { to: '/profile', label: 'Profile', icon: User, match: (p) => p.startsWith('/profile') },
];

export default function BottomNav() {
  const { pathname } = useLocation();
  const hideOn = ['/login', '/signup'];
  if (hideOn.some((p) => pathname === p)) return null;

  return (
    <nav
      aria-label="Primary"
      className="sticky bottom-0 z-20 mt-6 border-t border-border bg-background/90 backdrop-blur-lg"
    >
      <ul className="mx-auto flex max-w-md items-stretch justify-around px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2">
        {items.map(({ to, label, icon: Icon, match }) => {
          const active = match(pathname);
          return (
            <li key={to} className="flex-1">
              <Link
                to={to}
                className="flex flex-col items-center gap-1 rounded-xl py-1.5 transition active:scale-95 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/40"
              >
                <Icon
                  className={`h-6 w-6 ${active ? 'text-primary' : 'text-subtle'}`}
                  strokeWidth={active ? 2.25 : 1.75}
                  aria-hidden="true"
                />
                <span
                  className={`text-[0.7rem] font-medium ${active ? 'text-primary' : 'text-subtle'}`}
                >
                  {label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
