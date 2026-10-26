import { Link } from 'react-router-dom';
import Icon from './Icon';

// Phone: icon and number share a row, the label gets the full width underneath.
// Tablet and up: icon on the left, number and label stacked on the right.
// alert: tints the card red when the number means "something needs doing" and is above zero.
export default function KpiCard({ label, value, hint, icon, to, alert = false }) {
  const hot = alert && value > 0;
  return (
    <Link
      to={to}
      className="grid grid-cols-[auto_1fr] content-start items-center gap-x-3 gap-y-2 rounded-xl border border-line bg-white p-4 shadow-sm transition-shadow hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-signal sm:items-start sm:gap-y-0"
    >
      <span className={`grid h-10 w-10 place-items-center rounded-lg sm:row-span-2 ${hot ? 'bg-red-50 text-red-700' : 'bg-signal/20 text-asphalt'}`}>
        <Icon name={icon} />
      </span>
      <span className={`font-display text-3xl font-bold leading-none ${hot ? 'text-red-700' : ''}`}>{value ?? '-'}</span>
      <span className="col-span-2 min-w-0 sm:col-span-1 sm:mt-1.5">
        <span className="block text-sm font-medium leading-snug">{label}</span>
        {hint && <span className="block text-xs text-slate-500">{hint}</span>}
      </span>
    </Link>
  );
}
