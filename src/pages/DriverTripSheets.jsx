import { useCallback, useEffect, useState } from 'react';
import api from '../api/axios';
import Badge from '../components/Badge';
import Field, { inputCls } from '../components/Field';
import Icon from '../components/dashboard/Icon';
import TripSheetHistory from '../components/TripSheetHistory';
import { formatDateTime, getErrorMessage } from '../utils/helpers';

const EMPTY_FORM = { startOdometer: '', endOdometer: '', fuelConsumed: '', notes: '' };

function TripCard({ trip, onSubmit, saving, formOpen, onToggle, refreshKey }) {
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [error, setError] = useState('');
  const completed = trip.status === 'completed';
  const vehicle = trip.vehicle;
  const change = (name) => (event) => {
    setForm((current) => ({ ...current, [name]: event.target.value }));
  };

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    try {
      await onSubmit(trip._id, {
        startOdometer: Number(form.startOdometer),
        endOdometer: Number(form.endOdometer),
        ...(form.fuelConsumed !== '' && { fuelConsumed: Number(form.fuelConsumed) }),
        notes: form.notes.trim(),
      });
      setForm({ ...EMPTY_FORM });
    } catch (submitError) {
      setError(getErrorMessage(submitError));
    }
  };

  return (
    <article className="overflow-hidden rounded-2xl border border-line bg-white shadow-sm">
      <div className="flex flex-col gap-4 border-b border-line px-4 py-4 sm:flex-row sm:items-start sm:justify-between sm:px-6">
        <div className="flex min-w-0 items-start gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-asphalt text-signal">
            <Icon name="route" className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-display text-lg font-bold leading-tight">
                {trip.pickupLocation || 'Trip'} <span className="text-slate-400">to</span> {trip.destination || 'Destination'}
              </h2>
              <Badge tone={completed ? 'slate' : 'green'}>{completed ? 'Completed' : 'Assigned'}</Badge>
            </div>
            <p className="mt-1 text-sm text-slate-500">{formatDateTime(trip.startAt)} – {formatDateTime(trip.endAt)}</p>
          </div>
        </div>
        {!completed && (
          <button
            type="button"
            onClick={onToggle}
            aria-expanded={formOpen}
            className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-lg bg-signal px-4 py-2 text-sm font-semibold text-asphalt transition hover:bg-signal-dark focus:outline-none focus-visible:ring-2 focus-visible:ring-asphalt focus-visible:ring-offset-2"
          >
            {formOpen ? 'Close trip sheet' : 'Add daily trip'}
          </button>
        )}
      </div>

      <div className="grid gap-4 px-4 py-4 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Vehicle</p>
          <p className="mt-1 font-semibold">{vehicle?.regNo || 'Vehicle unavailable'}</p>
          {vehicle && <p className="text-sm text-slate-500">{vehicle.make} {vehicle.model}</p>}
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Purpose</p>
          <p className="mt-1 font-semibold">{trip.purpose || 'Scheduled trip'}</p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Passengers</p>
          <p className="mt-1 font-semibold">{trip.passengerCount ?? '—'}</p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Assignment</p>
          <p className="mt-1 font-semibold">{trip.type === 'request' ? 'Transport request' : 'Fleet assignment'}</p>
        </div>
      </div>

      <TripSheetHistory assignmentId={trip._id} refreshKey={refreshKey} />

      {formOpen && (
        <form onSubmit={submit} className="border-t border-line bg-slate-50/70 px-4 py-5 sm:px-6">
          <div className="mb-4">
            <h3 className="font-display text-lg font-bold">Add a daily trip entry</h3>
            <p className="mt-1 text-sm text-slate-600">Enter your odometer readings. The date and time are recorded automatically when you submit.</p>
          </div>
          {error && <p role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Field label="Start odometer (km)" required>
              <input
                type="number"
                required
                min="0"
                max="99999999"
                step="1"
                inputMode="numeric"
                value={form.startOdometer}
                onChange={change('startOdometer')}
                className={inputCls(false)}
              />
            </Field>
            <Field label="End odometer (km)" required>
              <input
                type="number"
                required
                min={form.startOdometer || 0}
                max="99999999"
                step="1"
                inputMode="numeric"
                value={form.endOdometer}
                onChange={change('endOdometer')}
                className={inputCls(false)}
              />
            </Field>
            <Field label="Fuel used (litres)" hint="Optional">
              <input
                type="number"
                min="0"
                max="100000"
                step="0.1"
                inputMode="decimal"
                value={form.fuelConsumed}
                onChange={change('fuelConsumed')}
                className={inputCls(false)}
              />
            </Field>
            <Field label="Trip notes" hint="Optional" className="sm:col-span-2 lg:col-span-1">
              <textarea
                rows={2}
                maxLength={1000}
                value={form.notes}
                onChange={change('notes')}
                placeholder="Delays, incidents, or other details"
                className={inputCls(false)}
              />
            </Field>
          </div>
          <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button type="button" onClick={onToggle} className="min-h-11 rounded-lg border border-line bg-white px-4 py-2 text-sm font-semibold text-asphalt hover:bg-canvas focus:outline-none focus-visible:ring-2 focus-visible:ring-signal">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-asphalt px-5 py-2 text-sm font-semibold text-white hover:bg-asphalt-soft disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-signal">
              {saving ? 'Submitting...' : <><Icon name="check" className="h-4 w-4" /> Submit daily entry</>}
            </button>
          </div>
        </form>
      )}
    </article>
  );
}

export default function DriverTripSheets() {
  const [trips, setTrips] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [page, setPage] = useState(1);
  const [refresh, setRefresh] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [openId, setOpenId] = useState('');
  const [savingId, setSavingId] = useState('');

  const load = useCallback(async (signal) => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/vehicle-assignments/my-trips', {
        params: { page, limit: 10 },
        signal,
      });
      setTrips(data.data);
      setPagination(data.pagination);
    } catch (loadError) {
      if (loadError.name !== 'CanceledError') setError(getErrorMessage(loadError));
    } finally {
      if (!signal.aborted) setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort();
  }, [load, refresh]);

  const submit = async (id, payload) => {
    setSavingId(id);
    setNotice('');
    try {
      await api.post(`/vehicle-assignments/${id}/trip-sheets`, payload);
      setNotice('Daily trip entry submitted. You can add more entries while the assignment remains open.');
      setRefresh((value) => value + 1);
    } finally {
      setSavingId('');
    }
  };

  const assignedCount = trips.filter((trip) => trip.status === 'assigned').length;

  return (
    <div className="mx-auto w-full max-w-5xl">
      <header className="relative overflow-hidden rounded-2xl bg-asphalt px-5 py-6 text-white sm:px-8 sm:py-8">
        <div className="road-line-h pointer-events-none absolute inset-x-0 bottom-0 h-1 opacity-70" aria-hidden="true" />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-signal">
              <Icon name="route" className="h-4 w-4" /> DRIVER PORTAL
            </div>
            <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">My trip sheets</h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-300 sm:text-base">
              Add a time-stamped log for each trip you make during an assignment. The assignment remains open until the transport officer closes it.
            </p>
          </div>
          <div className="flex items-center gap-3 self-start rounded-xl border border-white/10 bg-white/5 px-4 py-3 sm:self-center">
            <span className="grid h-10 w-10 place-items-center rounded-lg bg-signal text-asphalt">
              <Icon name="calendar" className="h-5 w-5" />
            </span>
            <div>
              <p className="text-2xl font-bold leading-none">{pagination.total}</p>
              <p className="mt-1 text-xs text-slate-300">Assigned &amp; recent trips</p>
            </div>
          </div>
        </div>
      </header>

      <section className="mt-6" aria-labelledby="trips-heading">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 id="trips-heading" className="font-display text-xl font-bold">Your assignments</h2>
            <p className="text-sm text-slate-500">
              {assignedCount} trip{assignedCount === 1 ? '' : 's'} ready to update on this page
            </p>
          </div>
          <button
            type="button"
            onClick={() => setRefresh((value) => value + 1)}
            disabled={loading}
            className="min-h-10 rounded-lg border border-line bg-white px-3 py-2 text-sm font-medium hover:bg-canvas disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-signal"
          >
            Refresh trips
          </button>
        </div>

        {notice && <p role="status" className="mb-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{notice}</p>}
        {error ? (
          <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-800">
            <p>{error}</p>
            <button onClick={() => setRefresh((value) => value + 1)} className="mt-2 font-semibold underline">Try again</button>
          </div>
        ) : loading && trips.length === 0 ? (
          <p role="status" className="rounded-xl border border-line bg-white p-6 text-sm text-slate-600">Loading your assignments...</p>
        ) : trips.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-12 text-center">
            <span className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-canvas text-slate-500"><Icon name="route" className="h-6 w-6" /></span>
            <h3 className="mt-4 font-display text-lg font-bold">No trips assigned yet</h3>
            <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-slate-500">When a transport officer assigns you a vehicle, your trip details will appear here.</p>
          </div>
        ) : (
          <div className={`space-y-4 ${loading ? 'opacity-60' : ''}`} aria-busy={loading}>
            {trips.map((trip) => (
              <TripCard
                key={trip._id}
                trip={trip}
                formOpen={openId === trip._id}
                onToggle={() => {
                  setOpenId((current) => current === trip._id ? '' : trip._id);
                  setNotice('');
                }}
                onSubmit={submit}
                saving={savingId === trip._id}
                refreshKey={refresh}
              />
            ))}
          </div>
        )}

        {pagination.pages > 1 && (
          <div className="mt-5 flex items-center justify-between rounded-xl border border-line bg-white px-4 py-3">
            <p className="text-sm text-slate-600">Page {pagination.page} of {pagination.pages}</p>
            <div className="flex gap-2">
              <button type="button" onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={page <= 1 || loading} className="min-h-10 rounded-lg border border-line px-3 text-sm font-medium disabled:opacity-50">Previous</button>
              <button type="button" onClick={() => setPage((value) => Math.min(pagination.pages, value + 1))} disabled={page >= pagination.pages || loading} className="min-h-10 rounded-lg border border-line px-3 text-sm font-medium disabled:opacity-50">Next</button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
