import { useCallback, useEffect, useState } from 'react';
import api from '../api/axios';
import Badge from '../components/Badge';
import Field, { inputCls } from '../components/Field';
import Icon from '../components/dashboard/Icon';
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

function TripFeedbackForm({ request, onCancel, onSubmit, saving }) {
  const [experience, setExperience] = useState('');
  const [remarks, setRemarks] = useState('');

  const submit = (event) => {
    event.preventDefault();
    onSubmit(request, { experience, remarks });
  };

  return (
    <form onSubmit={submit} className="mt-2 min-w-[220px] rounded-lg border border-line bg-slate-50 p-3">
      <label className="block text-xs font-semibold text-slate-700" htmlFor={`feedback-experience-${request._id}`}>
        Trip experience
      </label>
      <select
        id={`feedback-experience-${request._id}`}
        required
        value={experience}
        onChange={(event) => setExperience(event.target.value)}
        className={`${inputCls(false)} mt-1 min-h-10 bg-white`}
      >
        <option value="" disabled>Select experience</option>
        <option value="good">Good</option>
        <option value="bad">Bad</option>
      </select>
      <label className="mt-3 block text-xs font-semibold text-slate-700" htmlFor={`feedback-remarks-${request._id}`}>
        Remarks <span className="font-normal text-slate-500">(optional)</span>
      </label>
      <textarea
        id={`feedback-remarks-${request._id}`}
        rows={2}
        maxLength={1000}
        value={remarks}
        onChange={(event) => setRemarks(event.target.value)}
        className={`${inputCls(false)} mt-1 bg-white`}
      />
      <div className="mt-3 flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="min-h-9 rounded-lg border border-line bg-white px-3 text-xs font-semibold hover:bg-canvas">
          Cancel
        </button>
        <button type="submit" disabled={saving} className="min-h-9 rounded-lg bg-asphalt px-3 text-xs font-semibold text-white hover:bg-asphalt-soft disabled:opacity-60">
          {saving ? 'Submitting...' : 'Submit feedback'}
        </button>
      </div>
    </form>
  );
}

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
  const [formOpen, setFormOpen] = useState(false);
  const [feedbackOpenId, setFeedbackOpenId] = useState('');
  const [feedbackSavingId, setFeedbackSavingId] = useState('');

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
      setFormOpen(false);
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

  const submitFeedback = async (request, feedback) => {
    setError('');
    setNotice('');
    setFeedbackSavingId(request._id);
    try {
      await api.post(`/vehicle-assignments/${request._id}/feedback`, feedback);
      setFeedbackOpenId('');
      setNotice('Your trip feedback has been submitted.');
      setRefresh((value) => value + 1);
    } catch (feedbackError) {
      setError(getErrorMessage(feedbackError));
    } finally {
      setFeedbackSavingId('');
    }
  };

  return (
    <div className="min-w-0 w-full">
      <header className="rounded bg-asphalt px-5 py-6 text-white sm:px-7">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-signal">Transport portal</p>
        <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold sm:text-3xl">Vehicle requests</h1>
            <p className="mt-1 max-w-xl text-sm text-slate-300">Request transport and follow your assignment status. The transport officer will assign an available vehicle and driver.</p>
          </div>
          <span className="inline-flex w-fit items-center rounded-full bg-white/10 px-3 py-1.5 text-sm text-slate-100">
            {pagination.total} {pagination.total === 1 ? 'request' : 'requests'}
          </span>
        </div>
      </header>

      {notice && <div role="status" className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{notice}</div>}
      {error && <div role="alert" className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</div>}

      <section className="mt-5 overflow-hidden rounded-sm border border-line bg-white shadow-sm">
        <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Plan your journey</p>
            <h2 className="mt-1 font-display text-lg font-bold">New vehicle request</h2>
            <p className="mt-1 text-sm text-slate-500">Provide the trip details so the transport officer can arrange your vehicle.</p>
          </div>
          <button
            type="button"
            aria-expanded={formOpen}
            aria-controls="vehicle-request-form"
            onClick={() => setFormOpen((open) => !open)}
            className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-lg bg-asphalt px-4 py-2 text-sm font-semibold text-white hover:bg-asphalt-soft focus:outline-none focus-visible:ring-2 focus-visible:ring-signal focus-visible:ring-offset-2"
          >
            <Icon name={formOpen ? 'close' : 'plus'} className="h-4 w-4" />
            {formOpen ? 'Close form' : 'Add request'}
          </button>
        </div>
        <div id="vehicle-request-form" hidden={!formOpen} className="border-t border-line bg-slate-50/70 p-4 sm:p-6">
          <form onSubmit={submit}>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Field label="Purpose" required>
                <input required maxLength={160} value={form.purpose} onChange={change('purpose')} className={`${inputCls(false)} min-h-11`} />
              </Field>
              <Field label="Preferred vehicle type">
                <select value={form.preferredVehicleType} onChange={change('preferredVehicleType')} className={`${inputCls(false)} min-h-11`}>
                  <option value="">No preference</option>
                  {VEHICLE_TYPES.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}
                </select>
              </Field>
              <Field label="Passenger count" required>
                <input required type="number" min="1" max="100" value={form.passengerCount} onChange={change('passengerCount')} className={`${inputCls(false)} min-h-11`} />
              </Field>
              <Field label="Pickup location" required>
                <input required maxLength={160} value={form.pickupLocation} onChange={change('pickupLocation')} className={`${inputCls(false)} min-h-11`} />
              </Field>
              <Field label="Destination" required>
                <input required maxLength={160} value={form.destination} onChange={change('destination')} className={`${inputCls(false)} min-h-11`} />
              </Field>
              <Field label="Start date and time" required>
                <input required type="datetime-local" min={toLocalInput(new Date())} value={form.startAt} onChange={change('startAt')} className={`${inputCls(false)} min-h-11`} />
              </Field>
              <Field label="End date and time" required>
                <input required type="datetime-local" min={form.startAt} value={form.endAt} onChange={change('endAt')} className={`${inputCls(false)} min-h-11`} />
              </Field>
              <Field label="Additional notes" className="sm:col-span-2 lg:col-span-3">
                <textarea rows={2} maxLength={500} value={form.notes} onChange={change('notes')} className={inputCls(false)} />
              </Field>
            </div>
            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button type="button" onClick={() => setFormOpen(false)} className="min-h-11 rounded-lg border border-line bg-white px-4 py-2 text-sm font-semibold hover:bg-canvas">Cancel</button>
              <button type="submit" disabled={saving} className="inline-flex min-h-11 items-center justify-center rounded-lg bg-signal px-5 py-2 text-sm font-bold text-asphalt hover:bg-signal-dark disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-asphalt focus-visible:ring-offset-2">
                {saving ? 'Submitting...' : 'Submit request'}
              </button>
            </div>
          </form>
        </div>
      </section>

      <section className="mt-8" aria-labelledby="requests-heading">
        <div className="mb-3 flex items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Request status</p>
            <h2 id="requests-heading" className="font-display text-xl font-bold">My requests</h2>
          </div>
          <button type="button" onClick={() => setRefresh((value) => value + 1)} className="min-h-10 rounded-lg border border-line bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-canvas focus:outline-none focus-visible:ring-2 focus-visible:ring-signal focus-visible:ring-offset-2">Refresh</button>
        </div>
        {listError ? (
          <p role="alert" className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800">{listError}</p>
        ) : loading && requests.length === 0 ? (
          <p role="status" className="rounded-md border border-line bg-white p-5 text-sm text-slate-600">Loading requests...</p>
        ) : requests.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-10 text-center">
            <p className="font-semibold text-asphalt">No vehicle requests yet</p>
            <p className="mt-1 text-sm text-slate-500">Your submitted requests and assignments will appear here.</p>
          </div>
        ) : (
          <div className={`overflow-hidden rounded-sm border border-line bg-white shadow-sm ${loading ? 'opacity-60' : ''}`}>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px] text-left text-sm">
                <thead className="border-b border-line bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th scope="col" className="px-4 py-3 font-semibold">Request</th>
                    <th scope="col" className="px-4 py-3 font-semibold">Journey</th>
                    <th scope="col" className="px-4 py-3 font-semibold">Schedule</th>
                    <th scope="col" className="px-4 py-3 font-semibold">Passengers / vehicle</th>
                    <th scope="col" className="px-4 py-3 font-semibold">Assignment</th>
                    <th scope="col" className="px-4 py-3 font-semibold">Status</th>
                    <th scope="col" className="px-4 py-3 font-semibold">Trip feedback</th>
                    <th scope="col" className="px-4 py-3 font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {requests.map((request) => {
                    const status = STATUS[request.status] || STATUS.pending;
                    return (
                      <tr key={request._id} className="align-top even:bg-slate-50/60">
                        <td className="px-4 py-4">
                          <p className="font-semibold text-asphalt">{request.purpose}</p>
                          {request.notes && <p className="mt-1 max-w-xs text-sm text-slate-600">{request.notes}</p>}
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 text-sm text-slate-700">
                          <p>{request.pickupLocation}</p>
                          <p className="mt-1 text-xs text-slate-500">to {request.destination}</p>
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 text-sm text-slate-700">
                          <p>{formatDateTime(request.startAt)}</p>
                          <p className="mt-1 text-xs text-slate-500">to {formatDateTime(request.endAt)}</p>
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 text-sm text-slate-700">
                          <p>{request.passengerCount} passenger(s)</p>
                          <p className="mt-1 text-xs text-slate-500">{request.preferredVehicleType ? labelOf(VEHICLE_TYPES, request.preferredVehicleType) : 'No preference'}</p>
                        </td>
                        <td className="px-4 py-4 text-sm text-slate-700">
                          {request.status === 'assigned' ? (
                            <>
                              <p className="font-medium">{request.vehicle?.regNo || 'Vehicle removed'}</p>
                              <p className="mt-1 text-xs text-slate-500">{request.driver?.name || 'Driver removed'}</p>
                            </>
                          ) : '—'}
                        </td>
                        <td className="whitespace-nowrap px-4 py-4"><Badge tone={status.tone}>{status.label}</Badge></td>
                        <td className="px-4 py-4">
                          {request.status !== 'completed' ? '—' : request.feedback ? (
                            <div className="min-w-[150px]">
                              <Badge tone={request.feedback.experience === 'good' ? 'green' : 'red'}>
                                {request.feedback.experience === 'good' ? 'Good' : 'Bad'}
                              </Badge>
                              {request.feedback.remarks && <p className="mt-2 max-w-xs whitespace-normal text-xs text-slate-600">{request.feedback.remarks}</p>}
                              <p className="mt-1 whitespace-nowrap text-xs text-slate-400">Submitted {formatDateTime(request.feedback.submittedAt)}</p>
                            </div>
                          ) : (
                            <>
                              <button
                                type="button"
                                aria-expanded={feedbackOpenId === request._id}
                                onClick={() => setFeedbackOpenId((current) => current === request._id ? '' : request._id)}
                                className="min-h-9 whitespace-nowrap rounded-lg border border-asphalt px-3 py-1.5 text-xs font-semibold text-asphalt hover:bg-canvas focus:outline-none focus-visible:ring-2 focus-visible:ring-signal focus-visible:ring-offset-2"
                              >
                                {feedbackOpenId === request._id ? 'Close form' : 'Leave feedback'}
                              </button>
                              {feedbackOpenId === request._id && (
                                <TripFeedbackForm
                                  request={request}
                                  onCancel={() => setFeedbackOpenId('')}
                                  onSubmit={submitFeedback}
                                  saving={feedbackSavingId === request._id}
                                />
                              )}
                            </>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-4 py-4">
                          {request.status === 'pending' ? (
                            <button
                              type="button"
                              onClick={() => cancel(request)}
                              disabled={cancellingId === request._id}
                              className="min-h-9 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-600 focus-visible:ring-offset-2"
                            >
                              {cancellingId === request._id ? 'Cancelling...' : 'Cancel request'}
                            </button>
                          ) : '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
        {pagination.pages > 1 && (
          <div className="mt-4 flex items-center justify-between gap-3 text-sm">
            <p className="text-slate-600">Page {pagination.page} of {pagination.pages}</p>
            <div className="flex gap-2">
              <button type="button" disabled={page <= 1} onClick={() => setPage((value) => value - 1)} className="min-h-10 rounded-lg border border-line bg-white px-3 py-1.5 font-medium hover:bg-canvas disabled:cursor-not-allowed disabled:opacity-40">Previous</button>
              <button type="button" disabled={page >= pagination.pages} onClick={() => setPage((value) => value + 1)} className="min-h-10 rounded-lg border border-line bg-white px-3 py-1.5 font-medium hover:bg-canvas disabled:cursor-not-allowed disabled:opacity-40">Next</button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
