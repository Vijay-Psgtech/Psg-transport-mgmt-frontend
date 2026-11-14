import { useCallback, useEffect, useState } from 'react';
import api from '../api/axios';
import Badge from '../components/Badge';
import Field, { inputCls } from '../components/Field';
import Icon from '../components/dashboard/Icon';
import { useAuth } from '../context/AuthContext';
import { formatDate, getErrorMessage } from '../utils/helpers';

const EMPTY_FORM = {
  destination: '',
  purpose: '',
  departureDate: '',
  returnDate: '',
  requestedAmount: '',
  remarks: '',
};

const STATUS = {
  pending: { label: 'Awaiting review', tone: 'amber' },
  approved: { label: 'Approved', tone: 'green' },
  rejected: { label: 'Not approved', tone: 'red' },
};

const money = (value) => new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 2,
}).format(value || 0);

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

function AdvanceRow({ advance, onDownload, downloading }) {
  const status = STATUS[advance.status] || STATUS.pending;
  return (
    <tr className="align-top even:bg-slate-50/60">
      <td className="px-4 py-4">
        <p className="font-semibold text-asphalt">{advance.destination}</p>
        <p className="mt-1 max-w-xs text-sm text-slate-600">{advance.purpose}</p>
        <p className="mt-2 text-xs text-slate-500">Requested {formatDate(advance.createdAt)}</p>
        {(advance.rejectionReason || advance.officerRemarks) && (
          <details className="mt-2 max-w-xs text-xs text-slate-600">
            <summary className="w-fit cursor-pointer font-semibold text-slate-700">Review notes</summary>
            <div className="mt-2 space-y-1">
              {advance.rejectionReason && <p><span className="font-semibold">Reason: </span>{advance.rejectionReason}</p>}
              {advance.officerRemarks && <p><span className="font-semibold">Officer note: </span>{advance.officerRemarks}</p>}
            </div>
          </details>
        )}
      </td>
      <td className="whitespace-nowrap px-4 py-4 text-sm font-medium text-slate-700">
        {advance.vehicle?.regNo || 'Assigned vehicle'}
      </td>
      <td className="whitespace-nowrap px-4 py-4 text-sm text-slate-600">
        <p>{formatDate(advance.departureDate)}</p>
        <p className="mt-1 text-xs text-slate-500">to {formatDate(advance.returnDate)}</p>
      </td>
      <td className="whitespace-nowrap px-4 py-4 text-sm font-semibold text-asphalt">{money(advance.requestedAmount)}</td>
      <td className="whitespace-nowrap px-4 py-4 text-sm font-semibold text-asphalt">
        {advance.approvedAmount ? money(advance.approvedAmount) : '—'}
      </td>
      <td className="whitespace-nowrap px-4 py-4"><Badge tone={status.tone}>{status.label}</Badge></td>
      <td className="whitespace-nowrap px-4 py-4">
        {advance.status === 'approved' ? (
          <div>
            <p className="mb-2 text-xs text-emerald-800">Receipt {advance.receiptNo}</p>
            <button
              type="button"
              onClick={() => onDownload(advance)}
              disabled={downloading}
              className="inline-flex min-h-9 items-center justify-center gap-2 rounded-lg border border-emerald-700 px-3 py-1.5 text-xs font-semibold text-emerald-800 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-2"
            >
              <Icon name="doc" className="h-4 w-4" /> {downloading ? 'Downloading...' : 'Download'}
            </button>
          </div>
        ) : '—'}
      </td>
    </tr>
  );
}

export default function DriverTripAdvances() {
  const { user } = useAuth();
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [items, setItems] = useState([]);
  const [vehicle, setVehicle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [showRequest, setShowRequest] = useState(false);
  const load = useCallback(async (signal) => {
    try {
      const { data } = await api.get('/trip-advances', { params: { limit: 50 }, signal });
      setItems(data.data);
      setVehicle(data.assignedVehicle);
      setError('');
    } catch (loadError) {
      if (loadError.name !== 'CanceledError') setError(getErrorMessage(loadError));
    } finally {
      if (!signal.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    const timer = window.setInterval(() => load(controller.signal), 30000);
    return () => {
      controller.abort();
      window.clearInterval(timer);
    };
  }, [load]);

  const change = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setNotice('');
    try {
      await api.post('/trip-advances', {
        ...form,
        requestedAmount: Number(form.requestedAmount),
      });
      setForm({ ...EMPTY_FORM });
      setNotice('Your advance request has been submitted to the Transport Officer.');
      setShowRequest(false);
      const controller = new AbortController();
      await load(controller.signal);
    } catch (submitError) {
      setError(getErrorMessage(submitError));
    } finally {
      setSaving(false);
    }
  };

  const downloadReceipt = async (advance) => {
    setDownloading(advance._id);
    setError('');
    try {
      const { data } = await api.get(`/trip-advances/${advance._id}/receipt`, { responseType: 'blob' });
      downloadBlob(data, `${advance.receiptNo}.pdf`);
    } catch (downloadError) {
      setError(getErrorMessage(downloadError));
    } finally {
      setDownloading('');
    }
  };

  return (
    <div className="mx-auto w-full max-w-5xl">
      <header className="rounded bg-asphalt px-5 py-6 text-white sm:px-7">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-signal">Driver portal</p>
        <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold sm:text-3xl">Long trip advance</h1>
            <p className="mt-1 max-w-xl text-sm text-slate-300">Request travel funds, follow the decision, and download your receipt.</p>
          </div>
          <span className="inline-flex w-fit items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-sm text-slate-100">
            <Icon name="wallet" className="h-4 w-4 text-signal" /> Secure request
          </span>
        </div>
      </header>

      {notice && <p role="status" className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">{notice}</p>}
      {error && <p role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>}

      <section className="mt-5 overflow-hidden rounded-sm border border-line bg-white shadow-sm">
        <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Plan an upcoming trip</p>
            <h2 className="mt-1 font-display text-lg font-bold">New advance request</h2>
            <p className="mt-1 text-sm text-slate-500">Your account and assigned vehicle details are filled in automatically.</p>
          </div>
          <button
            type="button"
            aria-expanded={showRequest}
            aria-controls="advance-request-form"
            onClick={() => setShowRequest((open) => !open)}
            className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-lg bg-asphalt px-4 py-2 text-sm font-semibold text-white hover:bg-asphalt-soft focus:outline-none focus-visible:ring-2 focus-visible:ring-signal focus-visible:ring-offset-2"
          >
            <Icon name={showRequest ? 'close' : 'plus'} className="h-4 w-4" />
            {showRequest ? 'Close form' : 'Add request'}
          </button>
        </div>
        <div id="advance-request-form" hidden={!showRequest} className="border-t border-line bg-slate-50/70 p-4 sm:p-6">
          {!vehicle ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              An active assigned vehicle is required before you can request a trip advance.
            </div>
          ) : (
            <form onSubmit={submit}>
              <div className="mb-4 grid gap-3 rounded-xl bg-canvas p-3 sm:grid-cols-3">
                <div><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Driver</p><p className="mt-1 font-semibold">{user.name}</p></div>
                <div><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Request date</p><p className="mt-1 font-semibold">{formatDate(new Date())}</p></div>
                <div><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Assigned vehicle</p><p className="mt-1 font-semibold">{vehicle.regNo}</p></div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Trip destination" required>
                  <input name="destination" required maxLength={160} value={form.destination} onChange={change} placeholder="Where are you travelling?" className={`${inputCls(false)} min-h-11`} />
                </Field>
                <Field label="Trip purpose" required>
                  <input name="purpose" required maxLength={300} value={form.purpose} onChange={change} placeholder="Reason for the trip" className={`${inputCls(false)} min-h-11`} />
                </Field>
                <Field label="Departure date" required>
                  <input name="departureDate" type="date" required value={form.departureDate} onChange={change} className={`${inputCls(false)} min-h-11`} />
                </Field>
                <Field label="Return date" required>
                  <input name="returnDate" type="date" required min={form.departureDate || undefined} value={form.returnDate} onChange={change} className={`${inputCls(false)} min-h-11`} />
                </Field>
                <Field label="Requested advance (₹)" required hint="Enter the amount in Indian rupees.">
                  <input name="requestedAmount" type="number" required min="0.01" step="0.01" inputMode="decimal" value={form.requestedAmount} onChange={change} placeholder="e.g. 5000" className={`${inputCls(false)} min-h-11`} />
                </Field>
                <Field label="Remarks" hint="Optional">
                  <input name="remarks" maxLength={1000} value={form.remarks} onChange={change} placeholder="Any details for the officer?" className={`${inputCls(false)} min-h-11`} />
                </Field>
              </div>
              <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button type="button" onClick={() => setShowRequest(false)} className="min-h-11 rounded-lg border border-line bg-white px-4 py-2 text-sm font-semibold hover:bg-canvas">Cancel</button>
                <button type="button" onClick={() => setForm({ ...EMPTY_FORM })} className="min-h-11 rounded-lg border border-line bg-white px-4 py-2 text-sm font-semibold hover:bg-canvas">Clear form</button>
                <button type="submit" disabled={saving || loading} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-signal px-5 py-2 text-sm font-bold text-asphalt hover:bg-signal-dark disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-asphalt focus-visible:ring-offset-2">
                  <Icon name="check" className="h-4 w-4" /> {saving ? 'Submitting...' : 'Submit request'}
                </button>
              </div>
            </form>
          )}
        </div>
      </section>

      <section className="mt-8">
        <div className="mb-3 flex items-end justify-between gap-3">
          <div><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Your requests</p><h2 className="font-display text-xl font-bold">Advance history</h2></div>
          <span className="text-sm text-slate-500">{items.length} shown</span>
        </div>
        {loading && items.length === 0 ? (
          <p role="status" className="rounded-xl border border-line bg-white p-5 text-sm text-slate-600">Loading your requests...</p>
        ) : items.length ? (
          <div className="overflow-hidden rounded-sm border border-line bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px] text-left text-sm">
                <thead className="border-b border-line bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th scope="col" className="px-4 py-3 font-semibold">Trip</th>
                    <th scope="col" className="px-4 py-3 font-semibold">Vehicle</th>
                    <th scope="col" className="px-4 py-3 font-semibold">Trip dates</th>
                    <th scope="col" className="px-4 py-3 font-semibold">Requested</th>
                    <th scope="col" className="px-4 py-3 font-semibold">Approved</th>
                    <th scope="col" className="px-4 py-3 font-semibold">Status</th>
                    <th scope="col" className="px-4 py-3 font-semibold">Receipt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {items.map((advance) => (
                    <AdvanceRow
                      key={advance._id}
                      advance={advance}
                      onDownload={downloadReceipt}
                      downloading={downloading === advance._id}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-10 text-center">
            <Icon name="wallet" className="mx-auto h-8 w-8 text-slate-400" />
            <p className="mt-3 font-semibold">No advance requests yet</p>
            <p className="mt-1 text-sm text-slate-500">Your submitted requests and approvals will appear here.</p>
          </div>
        )}
        {downloading && <p role="status" className="sr-only">Downloading receipt...</p>}
      </section>
    </div>
  );
}
