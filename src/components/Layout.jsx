import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Icon from './dashboard/Icon';
import { MANAGER_ROLES, ROLES, ROLE_LABELS } from '../utils/constants';

// Navigation is data: add a page by adding a row. Groups and items are hidden when the role is not allowed.
const NAV = [
  { label: 'Overview', items: [{ to: '/', label: 'Dashboard', icon: 'grid', end: true }] },
  { label: 'Fleet', 
    roles: MANAGER_ROLES, 
    items: [
      { to: '/vehicles', label: 'Vehicles', icon: 'bus' },
      { to: '/service-history', label: 'Service History', icon: 'wrench' }
    ] 
    },
  {
    label: 'People',
    roles: MANAGER_ROLES,
    items: [
      { to: '/drivers', label: 'Drivers', icon: 'driver' },
      { to: '/users', label: 'Users', icon: 'users', roles: [ROLES.ADMIN] },
    ],
  },
];

const STORAGE_KEY = 'tms.sidebar.collapsed';
const readCollapsed = () => {
  try { return localStorage.getItem(STORAGE_KEY) === '1'; } catch { return false; }
};

const initialsOf = (name = '') =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('') || '?';

function BrandMark({ className = 'h-9 w-9' }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <rect width="32" height="32" rx="8" fill="#f2b705" />
      <path d="M16 6v4M16 14v4M16 22v4" stroke="#1b2430" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export default function Layout() {
  const { user, logout, hasRole } = useAuth();
  const location = useLocation();
  const institution = import.meta.env.VITE_INSTITUTION_NAME || 'Your Institution';

  const [open, setOpen] = useState(false); // mobile drawer
  const [collapsed, setCollapsed] = useState(readCollapsed); // desktop icon-only rail
  const menuBtn = useRef(null);
  const closeBtn = useRef(null);
  const drawer = useRef(null);

  const groups = useMemo(
    () =>
      NAV.filter((g) => !g.roles || hasRole(g.roles))
        .map((g) => ({ ...g, items: g.items.filter((i) => !i.roles || hasRole(i.roles)) }))
        .filter((g) => g.items.length),
    [hasRole]
  );

  const toggleCollapsed = () =>
    setCollapsed((c) => {
      try { localStorage.setItem(STORAGE_KEY, c ? '0' : '1'); } catch { /* storage unavailable: keep it for this session only */ }
      return !c;
    });

  // Navigating closes the drawer
  useEffect(() => { setOpen(false); }, [location.pathname]);

  // Leaving the mobile layout (rotating or resizing) closes the drawer
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    const onChange = () => mq.matches && setOpen(false);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const closeDrawer = useCallback(() => {
    setOpen(false);
    menuBtn.current?.focus();
  }, []);

  // Drawer behaviour: lock page scroll, move focus in, close on Escape, keep Tab inside
  useEffect(() => {
    if (!open) return undefined;
    document.body.style.overflow = 'hidden';
    closeBtn.current?.focus();

    const onKey = (e) => {
      if (e.key === 'Escape') { closeDrawer(); return; }
      if (e.key !== 'Tab' || !drawer.current) return;
      const focusable = [...drawer.current.querySelectorAll('a[href], button:not([disabled])')].filter((el) => el.offsetParent !== null);
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', onKey);
    };
  }, [open, closeDrawer]);

  // "lg:" classes only apply on desktop, so the mobile drawer is always shown expanded
  const hideWhenCollapsed = collapsed ? 'lg:sr-only' : '';

  const itemCls = ({ isActive }) =>
    `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-signal ${
      collapsed ? 'lg:justify-center lg:px-0' : ''
    } ${isActive ? 'bg-signal text-asphalt' : 'text-slate-200 hover:bg-asphalt-soft'}`;

  return (
    <div className={`min-h-screen transition-[padding] duration-200 ${collapsed ? 'lg:pl-[72px]' : 'lg:pl-64'}`}>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[60] focus:rounded-md focus:bg-signal focus:px-3 focus:py-2 focus:text-sm focus:font-semibold focus:text-asphalt"
      >
        Skip to content
      </a>

      {/* Top bar: phones and tablets only */}
      <header className="sticky top-0 z-30 flex items-center gap-3 bg-asphalt px-4 py-2.5 text-white lg:hidden">
        <button
          ref={menuBtn}
          onClick={() => setOpen(true)}
          aria-label="Open menu"
          aria-expanded={open}
          aria-controls="sidebar"
          className="rounded-md p-2 hover:bg-asphalt-soft focus:outline-none focus-visible:ring-2 focus-visible:ring-signal"
        >
          <Icon name="menu" className="h-6 w-6" />
        </button>
        <BrandMark className="h-8 w-8" />
        <p className="font-display text-lg font-bold leading-none">Transport Portal</p>
        <NavLink
          to="/profile"
          aria-label="My account"
          className="ml-auto grid h-9 w-9 place-items-center rounded-full bg-signal text-sm font-bold text-asphalt focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
        >
          {initialsOf(user.name)}
        </NavLink>
      </header>

      {/* Backdrop behind the drawer */}
      <div
        onClick={closeDrawer}
        aria-hidden="true"
        className={`fixed inset-0 z-40 bg-asphalt/60 transition-opacity duration-200 lg:hidden ${open ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
      />

      <aside
        id="sidebar"
        ref={drawer}
        aria-label="Sidebar"
        className={`fixed inset-y-0 left-0 z-50 flex w-80 max-w-[88vw] flex-col bg-asphalt text-white lg:visible lg:z-30 lg:translate-x-0 ${
          collapsed ? 'lg:w-[72px]' : 'lg:w-64'
        } ${
          // Opening: visible at once so focus can move in. Closing: stay visible until the slide-out ends, then hide from keyboard and screen readers.
          open
            ? 'translate-x-0 [transition:transform_200ms,width_200ms,visibility_0s]'
            : 'invisible -translate-x-full [transition:transform_200ms,width_200ms,visibility_0s_linear_200ms]'
        }`}
      >
        {/* Painted road line down the inner edge */}
        <div className="road-line pointer-events-none absolute inset-y-0 right-0 w-0.5 opacity-30" aria-hidden="true" />

        {/* Brand */}
        <div className={`flex items-center gap-3 px-4 py-4 ${collapsed ? 'lg:justify-center lg:px-0' : ''}`}>
          <BrandMark className="h-9 w-9 shrink-0" />
          <div className={`min-w-0 flex-1 ${hideWhenCollapsed}`}>
            <p className="font-display text-lg font-bold leading-tight">Transport Portal</p>
            <p className="truncate text-xs text-slate-400">{institution}</p>
          </div>
          <button
            ref={closeBtn}
            onClick={closeDrawer}
            aria-label="Close menu"
            className="rounded-md p-2 hover:bg-asphalt-soft focus:outline-none focus-visible:ring-2 focus-visible:ring-signal lg:hidden"
          >
            <Icon name="close" className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav aria-label="Main" className="flex-1 overflow-y-auto px-3 pb-4">
          {groups.map((g, i) => (
            <div key={g.label} className={i ? 'mt-4' : 'mt-1'}>
              <p className={`px-3 pb-1.5 text-xs font-medium text-slate-400 ${collapsed ? 'lg:hidden' : ''}`}>{g.label}</p>
              {collapsed && i > 0 && <div className="mx-2 mb-2 hidden border-t border-asphalt-soft lg:block" aria-hidden="true" />}
              <ul className="space-y-1">
                {g.items.map((item) => (
                  <li key={item.to}>
                    <NavLink to={item.to} end={item.end} className={itemCls} title={collapsed ? item.label : undefined}>
                      <Icon name={item.icon} className="h-5 w-5 shrink-0" />
                      <span className={hideWhenCollapsed}>{item.label}</span>
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        {/* Collapse control: desktop only */}
        <button
          onClick={toggleCollapsed}
          aria-pressed={collapsed}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className={`mx-3 mb-2 hidden items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-300 hover:bg-asphalt-soft focus:outline-none focus-visible:ring-2 focus-visible:ring-signal lg:flex ${
            collapsed ? 'lg:justify-center lg:px-0' : ''
          }`}
        >
          <Icon name="collapse" className={`h-5 w-5 shrink-0 transition-transform ${collapsed ? 'rotate-180' : ''}`} />
          <span className={hideWhenCollapsed}>Collapse</span>
        </button>

        {/* Account */}
        <div className="border-t border-asphalt-soft p-3">
          <NavLink
            to="/profile"
            title={collapsed ? 'My account' : undefined}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg p-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-signal ${
                collapsed ? 'lg:justify-center' : ''
              } ${isActive ? 'bg-asphalt-soft' : 'hover:bg-asphalt-soft'}`
            }
          >
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-signal text-sm font-bold text-asphalt" aria-hidden="true">
              {initialsOf(user.name)}
            </span>
            <span className={`min-w-0 leading-tight ${hideWhenCollapsed}`}>
              <span className="block truncate text-sm font-medium">{user.name}</span>
              <span className="block truncate text-xs text-slate-400">{ROLE_LABELS[user.role]}</span>
            </span>
          </NavLink>
          <button
            onClick={logout}
            title={collapsed ? 'Sign out' : undefined}
            className={`mt-2 flex w-full items-center gap-3 rounded-lg border border-slate-600 px-3 py-2 text-sm hover:bg-asphalt-soft focus:outline-none focus-visible:ring-2 focus-visible:ring-signal ${
              collapsed ? 'lg:justify-center lg:px-0' : ''
            }`}
          >
            <Icon name="logout" className="h-5 w-5 shrink-0" />
            <span className={hideWhenCollapsed}>Sign out</span>
          </button>
        </div>
      </aside>

      <main id="main" tabIndex={-1} className="px-4 py-5 focus:outline-none sm:px-6 lg:px-8 lg:py-8">
        <div className="mx-auto max-w-7xl">
          <Outlet />
        </div>
      </main>
    </div>
  );
}