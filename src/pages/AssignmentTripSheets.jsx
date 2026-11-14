import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../api/axios';
import Badge from '../components/Badge';
import Icon from '../components/dashboard/Icon';
import { useAuth } from '../context/AuthContext';
import { formatDateTime, getErrorMessage } from '../utils/helpers';
import { ROLES } from '../utils/constants';

const numberFormat = new Intl.NumberFormat('en-IN');
const PAGE_SIZE = 20;

function SummaryItem({ label, value, detail }) {
  return (
    <div className="min-w-0 rounded-xl bg-canvas/70 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 break-words font-semibold text-asphalt">{value || 'Not available'}</p>
      {detail && <p className="mt-1 break-words text-sm text-slate-600">{detail}</p>}
    </div>
  );
}

export default function AssignmentTripSheets() {
  const { id } = useParams();
  const { user } = useAuth();
  const [assignment, setAssignment] = useState(null);
  const [entries, setEntries] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  const backTo = user.role === ROLES.DRIVER ? '/trip-sheets' : '/vehicle-assignments';

  const load = useCallback(async (signal) => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get(`/vehicle-assignments/${id}/trip-sheets`, {
        params: { page, limit: PAGE_SIZE },
        signal,
      });
      setAssignment(data.assignment);
      setEntries(data.data);
      setPagination(data.pagination);
    } catch (loadError) {
      if (loadError.name !== 'CanceledError') setError(getErrorMessage(loadError));
    } finally {
      if (!signal.aborted) setLoading(false);
    }
  }, [id, page]);

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort();
  }, [load, retry]);

  const firstResult = pagination.total ? (page - 1) * PAGE_SIZE + 1 : 0;
  const lastResult = Math.min(page * PAGE_SIZE, pagination.total);
  const statusTone = assignment?.status === 'assigned' ? 'green' : 'slate';

  return (
    <main className="mx-auto w-full max-w-7xl">
      <Link
        to={backTo}
        className="inline-flex min-h-10 items-center gap-2 rounded-sm px-2 text-sm font-semibold text-slate-600 hover:bg-white hover:text-asphalt focus:outline-none focus-visible:ring-2 focus-visible:ring-signal"
      >
        <span aria-hidden="true">←</span>
        Back to {user.role === ROLES.DRIVER ? 'my trips' : 'assignments'}
      </Link>

      <header className="mt-4 flex flex-col gap-4 rounded-sm border border-line bg-white p-5 shadow-sm sm:flex-row sm:items-start sm:justify-between sm:p-7">
        <div className="flex min-w-0 items-start gap-3">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-sm bg-asphalt text-signal">
            <Icon name="route" className="h-6 w-6" />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Assignment history</p>
            <h1 className="mt-1 font-display text-2xl font-bold tracking-tight text-asphalt sm:text-3xl">Trip sheets</h1>
            <p className="mt-1 text-sm text-slate-600">Daily odometer and fuel records for this vehicle and driver.</p>
          </div>
        </div>
        <div className="flex items-center gap-2 self-start">
          <span className="rounded-sm bg-canvas px-3 py-2 text-sm font-semibold text-asphalt">
            {loading && !assignment ? 'Loading...' : `${pagination.total} ${pagination.total === 1 ? 'record' : 'records'}`}
          </span>
          {assignment && <Badge tone={statusTone}>{assignment.status}</Badge>}
        </div>
      </header>

      {assignment && (
        <section aria-label="Assignment details" className="mt-4 grid gap-3 grid-cols-2 sm:grid-cols-4">
          <SummaryItem
            label="Vehicle"
            value={assignment.vehicle?.regNo}
            detail={[assignment.vehicle?.make, assignment.vehicle?.model].filter(Boolean).join(' ')}
          />
          <SummaryItem
            label="Driver"
            value={assignment.driver?.name}
            detail={assignment.driver?.phone}
          />
          <SummaryItem
            label="Route"
            value={assignment.pickupLocation && assignment.destination
              ? `${assignment.pickupLocation} → ${assignment.destination}`
              : assignment.purpose || 'Availability assignment'}
            detail={assignment.pickupLocation && assignment.destination ? assignment.purpose : ''}
          />
          <SummaryItem
            label="Assignment period"
            value={assignment.startAt ? formatDateTime(assignment.startAt) : 'Open assignment'}
            detail={assignment.endAt ? `Until ${formatDateTime(assignment.endAt)}` : ''}
          />
        </section>
      )}

      {error ? (
        <div role="alert" className="mt-4 rounded-sm border border-red-200 bg-red-50 p-5 text-sm text-red-800">
          {error}
          <button type="button" onClick={() => setRetry((value) => value + 1)} className="ml-2 font-semibold underline">Try again</button>
        </div>
      ) : loading && entries.length === 0 ? (
        <p role="status" className="mt-4 rounded-sm border border-line bg-white p-6 text-sm text-slate-600">Loading trip sheets...</p>
      ) : entries.length === 0 ? (
        <div className="mt-4 rounded-sm border border-dashed border-slate-300 bg-white px-5 py-12 text-center">
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-sm bg-canvas text-slate-500">
            <Icon name="doc" className="h-6 w-6" />
          </span>
          <h2 className="mt-4 font-display text-lg font-bold text-asphalt">No trip sheets submitted</h2>
          <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">Trip entries for this vehicle and driver will appear here once submitted.</p>
        </div>
      ) : (
        <section className={`mt-4 overflow-hidden rounded-sm border border-line bg-white shadow-sm ${loading ? 'opacity-60' : ''}`} aria-busy={loading}>
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-4 sm:px-5">
            <div>
              <h2 className="font-display text-lg font-bold text-asphalt">Daily trip entries</h2>
              <p className="mt-0.5 text-sm text-slate-500">Newest submissions appear first.</p>
            </div>
            {loading && <span role="status" className="text-sm text-slate-500">Updating...</span>}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-left text-sm">
              <thead className="bg-canvas text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th scope="col" className="px-4 py-3 font-semibold">Submitted</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Driver</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Vehicle</th>
                  <th scope="col" className="px-4 py-3 text-right font-semibold">Start (km)</th>
                  <th scope="col" className="px-4 py-3 text-right font-semibold">End (km)</th>
                  <th scope="col" className="px-4 py-3 text-right font-semibold">Distance</th>
                  <th scope="col" className="px-4 py-3 text-right font-semibold">Fuel (L)</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {entries.map((sheet) => (
                  <tr key={sheet._id} className="align-top hover:bg-canvas/40">
                    <td className="whitespace-nowrap px-4 py-4 font-medium text-asphalt">{formatDateTime(sheet.submittedAt)}</td>
                    <td className="px-4 py-4">
                      <p className="font-medium text-asphalt">{sheet.driver?.name || 'Driver unavailable'}</p>
                      {sheet.driver?.phone && <p className="mt-1 text-xs text-slate-500">{sheet.driver.phone}</p>}
                    </td>
                    <td className="px-4 py-4">
                      <p className="font-semibold text-asphalt">{sheet.vehicle?.regNo || 'Vehicle unavailable'}</p>
                      {(sheet.vehicle?.make || sheet.vehicle?.model) && (
                        <p className="mt-1 text-xs text-slate-500">{[sheet.vehicle.make, sheet.vehicle.model].filter(Boolean).join(' ')}</p>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-right tabular-nums">{numberFormat.format(sheet.startOdometer)}</td>
                    <td className="whitespace-nowrap px-4 py-4 text-right tabular-nums">{numberFormat.format(sheet.endOdometer)}</td>
                    <td className="whitespace-nowrap px-4 py-4 text-right font-semibold tabular-nums">
                      {numberFormat.format(sheet.endOdometer - sheet.startOdometer)} km
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-right tabular-nums">
                      {sheet.fuelConsumed == null ? '—' : numberFormat.format(sheet.fuelConsumed)}
                    </td>
                    <td className="max-w-xs whitespace-normal px-4 py-4 text-slate-600">{sheet.notes || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="border-t border-line px-4 py-2 text-xs text-slate-500 sm:hidden">Swipe horizontally to see all trip details.</p>
        </section>
      )}

      {pagination.pages > 1 && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-sm border border-line bg-white px-4 py-3 text-sm">
          <p className="text-slate-600">Showing {firstResult}–{lastResult} of {pagination.total}</p>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setPage((value) => Math.max(1, value - 1))}
              disabled={page <= 1 || loading}
              className="min-h-10 rounded-sm border border-line px-3 font-medium disabled:opacity-50"
            >
              Previous
            </button>
            <span className="px-1 text-slate-600">Page {pagination.page} of {pagination.pages}</span>
            <button
              type="button"
              onClick={() => setPage((value) => Math.min(pagination.pages, value + 1))}
              disabled={page >= pagination.pages || loading}
              className="min-h-10 rounded-sm border border-line px-3 font-medium disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
