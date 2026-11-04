import { useCallback, useEffect, useState } from 'react';
import api from '../api/axios';
import Badge from '../components/Badge';
import Field, { inputCls } from '../components/Field';
import { formatDateTime, getErrorMessage } from '../utils/helpers';
import { VEHICLE_TYPES, labelOf } from '../utils/constants';

const STATUS = {
  pending: { tone: 'amber', label: 'Pending review' },
  assigned: { tone: 'green', label: 'Assigned' },
  rejected: { tone: 'red', label: 'Rejected' },
  cancelled: { tone: 'slate', label: 'Cancelled' },
  completed: { tone: 'slate', label: 'Completed' },
};
const toLocalInput = (value) => {
  const date = new Date(value);
  const pad = (part) => String(part).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};
const initialForm = () => {
  const start = new Date(Date.now() + 60 * 60 * 1000);
  start.setSeconds(0, 0);
  const end = new Date(start.getTime() + 60 * 60 * 1000);
  return {
    startAt: toLocalInput(start),
    endAt: toLocalInput(end),
    purpose: '',
    preferredVehicleType: '',
    pickupLocation: '',
    destination: '',
    passengerCount: '1',
    notes: '',
  };
};

export default function VehicleRequests() {
  const [form, setForm] = useState(initialForm);
  const [requests, setRequests] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [cancellingId, setCancellingId] = useState('');
  const [refresh, setRefresh] = useState(0);
  const [error, setError] = useState('');
  const [listError, setListError] = useState('');
  const [notice, setNotice] = useState('');

  const load = useCallback(async (signal) => {
    setLoading(true);
    setListError('');
    try {
      const { data } = await api.get('/vehicle-assignments', { params: { page, limit: 20 }, signal });
      setRequests(data.data);
      setPagination(data.pagination);
    } catch (loadError) {
      if (loadError.name !== 'CanceledError') setListError(getErrorMessage(loadError));
    } finally {
      if (!signal.aborted) setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort();
  }, [load, refresh]);

  const change = (name) => (event) => setForm((current) => ({ ...current, [name]: event.target.value }));

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setNotice('');
    try {
      await api.post('/vehicle-assignments', {
        ...form,
        startAt: new Date(form.startAt).toISOString(),
        endAt: new Date(form.endAt).toISOString(),
        passengerCount: Number(form.passengerCount),
      });
      setForm(initialForm());
      setPage(1);
      setNotice('Your vehicle request has been submitted to the transport officer.');
      setRefresh((value) => value + 1);
    } catch (submitError) {
      setError(getErrorMessage(submitError));
    } finally {
      setSaving(false);
    }
  };

  const cancel = async (request) => {
    setError('');
    setCancellingId(request._id);
    try {
      await api.patch(`/vehicle-assignments/${request._id}/status`, { status: 'cancelled' });
      setNotice('Your pending request was cancelled.');
      setRefresh((value) => value + 1);
    } catch (cancelError) {
      setError(getErrorMessage(cancelError));
    } finally {
      setCancellingId('');
    }
  };

  return (
    <div className="min-w-0 w-full">
      <h1 className="font-display text-3xl font-bold">Vehicle Requests</h1>
      <p className="text-sm text-slate-600">Submit a transport request; the transport officer will assign an available vehicle and driver.</p>

      {notice && <div role="status" className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{notice}</div>}
      {error && <div role="alert" className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</div>}

      <form onSubmit={submit} className="mt-5 rounded-lg border border-line bg-white p-4 sm:p-5">
        <h2 className="font-display text-lg font-bold">New request</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Purpose" required>
            <input required maxLength={160} value={form.purpose} onChange={change('purpose')} className={inputCls(false)} />
          </Field>
          <Field label="Preferred vehicle type">
            <select value={form.preferredVehicleType} onChange={change('preferredVehicleType')} className={inputCls(false)}>
              <option value="">No preference</option>
              {VEHICLE_TYPES.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}
            </select>
          </Field>
          <Field label="Passenger count" required>
            <input required type="number" min="1" max="100" value={form.passengerCount} onChange={change('passengerCount')} className={inputCls(false)} />
          </Field>
          <Field label="Pickup location" required>
            <input required maxLength={160} value={form.pickupLocation} onChange={change('pickupLocation')} className={inputCls(false)} />
          </Field>
          <Field label="Destination" required>
            <input required maxLength={160} value={form.destination} onChange={change('destination')} className={inputCls(false)} />
          </Field>
          <Field label="Start date and time" required>
            <input required type="datetime-local" min={toLocalInput(new Date())} value={form.startAt} onChange={change('startAt')} className={inputCls(false)} />
          </Field>
          <Field label="End date and time" required>
            <input required type="datetime-local" min={form.startAt} value={form.endAt} onChange={change('endAt')} className={inputCls(false)} />
          </Field>
          <Field label="Additional notes" className="sm:col-span-2 lg:col-span-3">
            <textarea rows={2} maxLength={500} value={form.notes} onChange={change('notes')} className={inputCls(false)} />
          </Field>
        </div>
        <div className="mt-4 flex justify-end">
          <button type="submit" disabled={saving} className="rounded-md bg-signal px-4 py-2 text-sm font-semibold text-asphalt hover:bg-signal-dark disabled:opacity-60">
            {saving ? 'Submitting...' : 'Submit request'}
          </button>
        </div>
      </form>

      <section className="mt-8" aria-labelledby="requests-heading">
        <div className="flex items-end justify-between">
          <div>
            <h2 id="requests-heading" className="font-display text-xl font-bold">My requests</h2>
            <p className="text-sm text-slate-600">{pagination.total} request(s)</p>
          </div>
          <button onClick={() => setRefresh((value) => value + 1)} className="rounded-md border border-line bg-white px-3 py-2 text-sm font-medium hover:bg-canvas">Refresh</button>
        </div>
        {listError ? (
          <p role="alert" className="mt-3 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800">{listError}</p>
        ) : loading && requests.length === 0 ? (
          <p role="status" className="mt-3 rounded-md border border-line bg-white p-5 text-sm text-slate-600">Loading requests...</p>
        ) : requests.length === 0 ? (
          <p className="mt-3 rounded-md border border-line bg-white p-8 text-center text-sm text-slate-600">You have not submitted any requests yet.</p>
        ) : (
          <div className={`mt-3 space-y-3 ${loading ? 'opacity-60' : ''}`}>
            {requests.map((request) => {
              const status = STATUS[request.status] || STATUS.pending;
              return (
                <article key={request._id} className="rounded-lg border border-line bg-white p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold">{request.purpose}</p>
                      <p className="mt-1 text-sm text-slate-600">{formatDateTime(request.startAt)} – {formatDateTime(request.endAt)}</p>
                    </div>
                    <Badge tone={status.tone}>{status.label}</Badge>
                  </div>
                  <div className="mt-3 grid gap-2 border-t border-line pt-3 text-sm sm:grid-cols-2">
                    <p>{request.pickupLocation} → {request.destination}</p>
                    <p>{request.passengerCount} passenger(s)</p>
                    {request.preferredVehicleType && <p>Preferred vehicle: {labelOf(VEHICLE_TYPES, request.preferredVehicleType)}</p>}
                    {request.status === 'assigned' && (
                      <>
                        <p>Vehicle: {request.vehicle?.regNo || 'Vehicle removed'}</p>
                        <p>Driver: {request.driver?.name || 'Driver removed'}</p>
                      </>
                    )}
                  </div>
                  {request.status === 'pending' && (
                    <div className="mt-3 flex justify-end border-t border-line pt-3">
                      <button onClick={() => cancel(request)} disabled={cancellingId === request._id} className="rounded-md border border-red-200 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50">
                        {cancellingId === request._id ? 'Cancelling...' : 'Cancel request'}
                      </button>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
        {pagination.pages > 1 && (
          <div className="mt-4 flex items-center justify-between text-sm">
            <p className="text-slate-600">Page {pagination.page} of {pagination.pages}</p>
            <div className="flex gap-2">
              <button disabled={page <= 1} onClick={() => setPage((value) => value - 1)} className="rounded-md border border-line bg-white px-3 py-1.5 font-medium disabled:opacity-40">Previous</button>
              <button disabled={page >= pagination.pages} onClick={() => setPage((value) => value + 1)} className="rounded-md border border-line bg-white px-3 py-1.5 font-medium disabled:opacity-40">Next</button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
