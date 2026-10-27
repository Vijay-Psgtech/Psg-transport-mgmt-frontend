const PATHS = {
  bus: (<><rect x="4" y="3" width="16" height="14" rx="2" /><path d="M4 11h16M8 21v-4M16 21v-4" /><circle cx="8" cy="14" r=".7" /><circle cx="16" cy="14" r=".7" /></>),
  seat: (<><path d="M8 4v9a3 3 0 003 3h6" /><path d="M8 13H5.5a1.5 1.5 0 00-1.5 1.5V20M17 16v4" /></>),
  driver: (<><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" /></>),
  link: (<><path d="M10 14a4 4 0 005.7 0l3-3a4 4 0 00-5.7-5.7l-1 1" /><path d="M14 10a4 4 0 00-5.7 0l-3 3A4 4 0 0011 18.7l1-1" /></>),
  doc: (<><path d="M7 3h7l5 5v13H7z" /><path d="M14 3v5h5M10 13h6M10 17h6" /></>),
  licence: (<><rect x="3" y="5" width="18" height="14" rx="2" /><circle cx="9" cy="11" r="2" /><path d="M6 16c.6-1.6 5.4-1.6 6 0M14 10h4M14 14h4" /></>),
  refresh: (<><path d="M20 12a8 8 0 11-2.3-5.7" /><path d="M20 4v5h-5" /></>),
  grid: (<><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></>),
  users: (<><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6" /><path d="M16 4.6a3.5 3.5 0 010 6.8M18 14.4c2 .7 3.5 2.6 3.5 5.6" /></>),
  logout: (<><path d="M9 4H5a1 1 0 00-1 1v14a1 1 0 001 1h4" /><path d="M16 8l4 4-4 4M20 12H9" /></>),
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  close: <path d="M6 6l12 12M18 6L6 18" />,
  collapse: <path d="M11 17l-5-5 5-5M18 17l-5-5 5-5" />,
  wrench: (<><path d="M14.7 2.3a1 1 0 011.4 0l2.6 2.6a1 1 0 010 1.4l-1.8 1.8a5.5 5.5 0 11-7.8 7.8L6.3 15a1 1 0 01-1.4-1.4l2.6-2.6a1 1 0 010-1.4l-2-2a1 1 0 010-1.4l2.6-2.6z" /></>),
  check: (<><circle cx="12" cy="12" r="9" /><path d="M8 12.5l3 3 5-6" /></>),
};

export default function Icon({ name, className = 'h-5 w-5' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      {PATHS[name]}
    </svg>
  );
}
