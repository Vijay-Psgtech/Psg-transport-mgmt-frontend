import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { MANAGER_ROLES, ROLES, ROLE_LABELS } from '../utils/constants';

const NAV = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/vehicles', label: 'Vehicles', roles: MANAGER_ROLES },
  { to: '/drivers', label: 'Drivers', roles: MANAGER_ROLES },
  { to: '/users', label: 'Users', roles: [ROLES.ADMIN] },
];

export default function Layout() {
  const { user, logout, hasRole } = useAuth();
  const institution = import.meta.env.VITE_INSTITUTION_NAME || 'Your Institution';

  const linkCls = ({ isActive }) =>
    `rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
      isActive ? 'bg-signal text-asphalt' : 'text-slate-200 hover:bg-asphalt-soft'
    }`;

  return (
    <div className="min-h-screen">
      <header className="bg-asphalt text-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3 sm:px-6">
          <div className="mr-2">
            <p className="font-display text-lg font-bold leading-tight">Transport Portal</p>
            <p className="text-xs text-slate-400">{institution}</p>
          </div>

          <nav className="flex gap-1" aria-label="Main">
            {NAV.filter((n) => !n.roles || hasRole(n.roles)).map((n) => (
              <NavLink key={n.to} to={n.to} end={n.end} className={linkCls}>{n.label}</NavLink>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-3">
            <NavLink to="/profile" className="rounded-md px-2 py-1 text-right leading-tight hover:bg-asphalt-soft focus:outline-none focus-visible:ring-2 focus-visible:ring-signal" aria-label="My account">
              <span className="block text-sm font-medium">{user.name}</span>
              <span className="block text-xs text-slate-400">{ROLE_LABELS[user.role]}</span>
            </NavLink>
            <button
              onClick={logout}
              className="rounded-md border border-slate-600 px-3 py-1.5 text-sm hover:bg-asphalt-soft focus:outline-none focus-visible:ring-2 focus-visible:ring-signal"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <Outlet />
      </main>
    </div>
  );
}
