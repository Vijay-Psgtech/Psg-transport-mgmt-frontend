import { Link } from 'react-router-dom';
import Badge from '../Badge';
import Icon from './Icon';
import { DOCUMENT_SHORT } from '../../utils/constants';
import { docStatus, dueText, formatDate } from '../../utils/helpers';

export default function AttentionList({ items }) {
  if (!items.length) {
    return (
      <div className="flex min-h-40 flex-col items-center justify-center gap-2 text-center">
        <span className="grid h-10 w-10 place-items-center rounded-full bg-emerald-50 text-emerald-700"><Icon name="check" /></span>
        <p className="text-sm font-medium">All clear</p>
        <p className="max-w-xs text-sm text-slate-500">Every document and licence is valid for at least the next 30 days.</p>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-line">
      {items.map((it) => {
        const expired = docStatus(it.expiry) === 'expired';
        return (
          <li key={`${it.kind}-${it.title}-${it.docType}`}>
            <Link
              to={it.kind === 'vehicle' ? '/vehicles' : '/drivers'}
              className="flex items-center gap-3 rounded-md px-1 py-2.5 hover:bg-canvas focus:outline-none focus-visible:ring-2 focus-visible:ring-signal"
            >
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-canvas text-asphalt">
                <Icon name={it.kind === 'vehicle' ? 'bus' : 'driver'} className="h-4.5 w-4.5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold">{it.title}</span>
                <span className="block truncate text-xs text-slate-500">
                  {it.docType === 'licence' ? 'Driving licence' : DOCUMENT_SHORT[it.docType] || it.docType} · {formatDate(it.expiry)}
                </span>
              </span>
              <Badge tone={expired ? 'red' : 'amber'}>{dueText(it.expiry)}</Badge>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
