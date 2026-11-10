import { useCallback, useEffect, useState } from 'react';
import api from '../api/axios';
import Badge from '../components/Badge';
import Field, { inputCls } from '../components/Field';
import Icon from '../components/dashboard/Icon';
import TripSheetHistory from '../components/TripSheetHistory';
import { formatDateTime, getErrorMessage } from '../utils/helpers';

const EMPTY_FORM = { startOdometer: '', endOdometer: '', fuelConsumed: '', notes: '' };

function TripCard({ trip, onSubmit, saving, formOpen, onToggle }) {
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [showOptional, setShowOptional] = useState(false);
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
      setShowOptional(false);
    } catch (submitError) {
      setError(getErrorMessage(submitError));
    }
  };

  return (
    <article className="overflow-hidden rounded-2xl border border-line bg-white shadow-sm">
      <div className="p-4 sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-asphalt text-signal">
              <Icon name="bus" className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-display text-lg font-bold">
                  {vehicle?.regNo || 'Assigned vehicle'}
                </h2>
                <Badge tone={completed ? 'slate' : 'green'}>{completed ? 'Assignment closed' : 'Active'}</Badge>
              </div>
              <p className="mt-0.5 text-sm text-slate-600">
                {vehicle ? `${vehicle.make} ${vehicle.model}` : 'Vehicle details unavailable'}
              </p>
            </div>
          </div>
          {!completed && (
            <button
              type="button"
              onClick={onToggle}
              aria-expanded={formOpen}
              className="inline-flex min-h-11 w-full shrink-0 items-center justify-center gap-2 rounded-lg bg-signal px-4 py-2 text-sm font-bold text-asphalt hover:bg-signal-dark focus:outline-none focus-visible:ring-2 focus-visible:ring-asphalt focus-visible:ring-offset-2 sm:w-auto"
            >
              <Icon name={formOpen ? 'close' : 'plus'} className="h-4 w-4" />
              {formOpen ? 'Close form' : 'Update trip sheet'}
            </button>
          )}
        </div>

        <div className="mt-4 grid gap-3 rounded-xl bg-canvas/70 p-3 text-sm sm:grid-cols-3">
          <div>
            <p className="text-xs font-medium text-slate-500">Route</p>
            <p className="mt-0.5 font-medium text-asphalt">
              {trip.pickupLocation || 'Pickup'} <span className="text-slate-400">→</span> {trip.destination || 'Destination'}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Assignment period</p>
            <p className="mt-0.5 font-medium text-asphalt">{formatDateTime(trip.startAt)}</p>
            <p className="text-xs text-slate-500">Until {formatDateTime(trip.endAt)}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Trip purpose</p>
            <p className="mt-0.5 font-medium text-asphalt">{trip.purpose || 'Scheduled trip'}</p>
            {trip.passengerCount != null && <p className="text-xs text-slate-500">{trip.passengerCount} passengers</p>}
          </div>
        </div>

        {formOpen && (
          <form onSubmit={submit} className="mt-4 rounded-xl border border-signal/50 bg-amber-50/40 p-4">
            <div className="mb-3">
              <h3 className="font-display font-bold">Quick trip update</h3>
              <p className="mt-0.5 text-xs text-slate-600">Enter the vehicle readings. Submission date and time are saved automatically.</p>
            </div>

            {error && <p role="alert" className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>}

            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Starting km" required>
                <input
                  type="number"
                  required
                  min="0"
                  max="99999999"
                  step="1"
                  inputMode="numeric"
                  placeholder="e.g. 15010"
                  value={form.startOdometer}
                  onChange={change('startOdometer')}
                  className={`${inputCls(false)} min-h-12 text-base`}
                />
              </Field>
              <Field label="Ending km" required>
                <input
                  type="number"
                  required
                  min={form.startOdometer || 0}
                  max="99999999"
                  step="1"
                  inputMode="numeric"
                  placeholder="e.g. 15060"
                  value={form.endOdometer}
                  onChange={change('endOdometer')}
                  className={`${inputCls(false)} min-h-12 text-base`}
                />
              </Field>
            </div>

            <button
              type="button"
              aria-expanded={showOptional}
              onClick={() => setShowOptional((value) => !value)}
              className="mt-3 min-h-10 rounded-md text-sm font-medium text-slate-600 underline decoration-slate-300 underline-offset-4 hover:text-asphalt"
            >
              {showOptional ? 'Hide optional details' : '+ Add fuel or a note (optional)'}
            </button>

            {showOptional && (
              <div className="mt-2 grid gap-3 border-t border-line pt-3 sm:grid-cols-2">
                <Field label="Fuel used (litres)" hint="Optional">
                  <input
                    type="number"
                    min="0"
                    max="100000"
                    step="0.1"
                    inputMode="decimal"
                    placeholder="0"
                    value={form.fuelConsumed}
                    onChange={change('fuelConsumed')}
                    className={inputCls(false)}
                  />
                </Field>
                <Field label="Note" hint="Optional">
                  <input
                    type="text"
                    maxLength={1000}
                    placeholder="Anything the officer should know?"
                    value={form.notes}
                    onChange={change('notes')}
                    className={inputCls(false)}
                  />
                </Field>
              </div>
            )}

            <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={onToggle}
                className="min-h-11 rounded-lg border border-line bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-canvas focus:outline-none focus-visible:ring-2 focus-visible:ring-signal"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-asphalt px-5 py-2 text-sm font-bold text-white hover:bg-asphalt-soft disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-signal"
              >
                <Icon name="check" className="h-4 w-4" />
                {saving ? 'Saving...' : 'Save trip sheet'}
              </button>
            </div>
          </form>
        )}
      </div>

      <div className="border-t border-line px-4 sm:px-5">
        <TripSheetHistory assignmentId={trip._id} />
      </div>
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
      setNotice('Trip sheet saved. You can add another update whenever needed.');
      setRefresh((value) => value + 1);
    } finally {
      setSavingId('');
    }
  };

  const assignedCount = trips.filter((trip) => trip.status === 'assigned').length;
  const firstResult = pagination.total ? (page - 1) * 10 + 1 : 0;
  const lastResult = Math.min(page * 10, pagination.total);

  return (
    <div className="mx-auto w-full max-w-5xl">
      <header className="flex flex-col gap-3 border-b border-line pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Driver portal</p>
          <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">My trips</h1>
          <p className="mt-1 text-sm text-slate-600">Choose a trip and enter your vehicle readings.</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="rounded-lg bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800">
            {assignedCount} active on this page
          </span>
          <button
            type="button"
            onClick={() => setRefresh((value) => value + 1)}
            disabled={loading}
            className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-line bg-white px-3 py-2 text-sm font-semibold hover:bg-canvas disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-signal"
          >
            <Icon name="refresh" className="h-4 w-4" />
            Refresh
          </button>
        </div>
      </header>

      {notice && <p role="status" className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{notice}</p>}

      {error ? (
        <div role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-800">
          {error}
          <button type="button" onClick={() => setRefresh((value) => value + 1)} className="ml-2 font-semibold underline">Try again</button>
        </div>
      ) : loading && trips.length === 0 ? (
        <p role="status" className="mt-4 rounded-xl border border-line bg-white p-6 text-sm text-slate-600">Loading your trips...</p>
      ) : trips.length === 0 ? (
        <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-10 text-center">
          <span className="mx-auto grid h-11 w-11 place-items-center rounded-xl bg-canvas text-slate-500"><Icon name="bus" className="h-5 w-5" /></span>
          <h2 className="mt-3 font-display text-lg font-bold">No trips assigned</h2>
          <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">Your transport officer's assignments will appear here.</p>
        </div>
      ) : (
        <div className={`mt-4 space-y-3 ${loading ? 'opacity-60' : ''}`} aria-busy={loading}>
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
            />
          ))}
        </div>
      )}

      {pagination.pages > 1 && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-white px-4 py-3 text-sm">
          <p className="text-slate-600">Showing {firstResult}–{lastResult} of {pagination.total}</p>
          <div className="flex gap-2">
            <button type="button" onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={page <= 1 || loading} className="min-h-10 rounded-lg border border-line px-3 font-medium disabled:opacity-50">Previous</button>
            <span className="flex items-center px-2 text-slate-600">Page {pagination.page} of {pagination.pages}</span>
            <button type="button" onClick={() => setPage((value) => Math.min(pagination.pages, value + 1))} disabled={page >= pagination.pages || loading} className="min-h-10 rounded-lg border border-line px-3 font-medium disabled:opacity-50">Next</button>
          </div>
        </div>
      )}
    </div>
  );
}
