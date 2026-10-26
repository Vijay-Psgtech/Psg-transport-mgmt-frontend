const PATHS = {
  bus: (<><rect x="4" y="3" width="16" height="14" rx="2" /><path d="M4 11h16M8 21v-4M16 21v-4" /><circle cx="8" cy="14" r=".7" /><circle cx="16" cy="14" r=".7" /></>),
  seat: (<><path d="M8 4v9a3 3 0 003 3h6" /><path d="M8 13H5.5a1.5 1.5 0 00-1.5 1.5V20M17 16v4" /></>),
  driver: (<><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" /></>),
  link: (<><path d="M10 14a4 4 0 005.7 0l3-3a4 4 0 00-5.7-5.7l-1 1" /><path d="M14 10a4 4 0 00-5.7 0l-3 3A4 4 0 0011 18.7l1-1" /></>),
  doc: (<><path d="M7 3h7l5 5v13H7z" /><path d="M14 3v5h5M10 13h6M10 17h6" /></>),
  licence: (<><rect x="3" y="5" width="18" height="14" rx="2" /><circle cx="9" cy="11" r="2" /><path d="M6 16c.6-1.6 5.4-1.6 6 0M14 10h4M14 14h4" /></>),
  refresh: (<><path d="M20 12a8 8 0 11-2.3-5.7" /><path d="M20 4v5h-5" /></>),
  check: (<><circle cx="12" cy="12" r="9" /><path d="M8 12.5l3 3 5-6" /></>),
};

export default function Icon({ name, className = 'h-5 w-5' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      {PATHS[name]}
    </svg>
  );
}
