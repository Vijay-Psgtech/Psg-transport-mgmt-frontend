import { useEffect, useState } from 'react';
import api from '../api/axios';
import Icon from './dashboard/Icon';
import { formatDateTime, getErrorMessage } from '../utils/helpers';

const numberFormat = new Intl.NumberFormat('en-IN');

export default function TripSheetHistory({ assignmentId, refreshKey = 0 }) {
  const [open, setOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [entries, setEntries] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    if (!open) return undefined;
    const controller = new AbortController();
    setLoading(true);
    setError('');

    api.get(`/vehicle-assignments/${assignmentId}/trip-sheets`, {
      params: { page, limit: 20 },
      signal: controller.signal,
    })
      .then(({ data }) => {
        setEntries(data.data);
        setPagination(data.pagination);
      })
      .catch((loadError) => {
        if (loadError.name !== 'CanceledError') setError(getErrorMessage(loadError));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [assignmentId, open, page, refreshKey, retry]);

  return (
    <section className="mt-3 border-t border-line pt-3">
      <button
        type="button"
        onClick={() => {
          setOpen((value) => !value);
          setPage(1);
        }}
        aria-expanded={open}
        className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-line bg-white px-3 py-2 text-sm font-semibold text-asphalt hover:bg-canvas focus:outline-none focus-visible:ring-2 focus-visible:ring-signal"
      >
        <Icon name="route" className="h-4 w-4" />
        {open ? 'Hide trip sheets' : 'View trip sheets'}
        <span className="text-slate-500">{pagination.total}</span>
      </button>

      {open && (
        <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50/50 p-4" aria-busy={loading}>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="font-semibold text-emerald-950">Daily trip entries</h3>
              <p className="text-xs text-emerald-800">{pagination.total} submitted</p>
            </div>
            {loading && <span role="status" className="text-xs text-slate-500">Loading...</span>}
          </div>

          {error ? (
            <div role="alert" className="rounded-lg border border-red-200 bg-white p-3 text-sm text-red-800">
              {error}
              <button type="button" onClick={() => setRetry((value) => value + 1)} className="ml-2 font-semibold underline">Retry</button>
            </div>
          ) : !loading && entries.length === 0 ? (
            <p className="rounded-lg border border-dashed border-emerald-200 bg-white p-4 text-sm text-slate-600">No trip sheets submitted yet.</p>
          ) : (
            <div className="space-y-3">
              {entries.map((sheet) => (
                <article key={sheet._id} className="rounded-lg border border-emerald-200/70 bg-white p-3">
                  <div className="flex flex-wrap justify-between gap-2 text-sm">
                    <p className="font-semibold">Daily trip entry</p>
                    <p className="text-xs text-slate-500">Logged {formatDateTime(sheet.submittedAt)}</p>
                  </div>
                  <div className="mt-3 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
                    <p><span className="text-slate-600">Start odometer:</span><br /><strong>{numberFormat.format(sheet.startOdometer)} km</strong></p>
                    <p><span className="text-slate-600">End odometer:</span><br /><strong>{numberFormat.format(sheet.endOdometer)} km</strong></p>
                    <p><span className="text-slate-600">Distance:</span><br /><strong>{numberFormat.format(sheet.endOdometer - sheet.startOdometer)} km</strong></p>
                    {sheet.fuelConsumed !== undefined && (
                      <p><span className="text-slate-600">Fuel used:</span><br /><strong>{sheet.fuelConsumed} L</strong></p>
                    )}
                    {sheet.notes && (
                      <p className="sm:col-span-2 lg:col-span-4"><span className="text-slate-600">Driver notes:</span><br />{sheet.notes}</p>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}

          {pagination.pages > 1 && (
            <div className="mt-3 flex items-center justify-between text-sm">
              <p className="text-slate-600">Page {pagination.page} of {pagination.pages}</p>
              <div className="flex gap-2">
                <button type="button" onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={page <= 1 || loading} className="min-h-9 rounded-lg border border-line bg-white px-3 disabled:opacity-50">Previous</button>
                <button type="button" onClick={() => setPage((value) => Math.min(pagination.pages, value + 1))} disabled={page >= pagination.pages || loading} className="min-h-9 rounded-lg border border-line bg-white px-3 disabled:opacity-50">Next</button>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
