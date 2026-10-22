const TONES = {
  green: 'bg-emerald-50 text-emerald-800 ring-emerald-600/25',
  amber: 'bg-amber-50 text-amber-800 ring-amber-600/30',
  red: 'bg-red-50 text-red-800 ring-red-600/25',
  slate: 'bg-slate-100 text-slate-700 ring-slate-500/20',
};

export default function Badge({ tone = 'slate', children }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${TONES[tone]}`}>
      {children}
    </span>
  );
}
