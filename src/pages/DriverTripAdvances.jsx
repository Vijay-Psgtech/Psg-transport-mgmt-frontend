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

function AdvanceCard({ advance, onDownload }) {
  const status = STATUS[advance.status] || STATUS.pending;
  return (
    <article className="rounded-2xl border border-line bg-white p-4 shadow-sm sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            {advance.vehicle?.regNo || 'Assigned vehicle'} · Requested {formatDate(advance.createdAt)}
          </p>
          <h3 className="mt-1 font-display text-lg font-bold">{advance.destination}</h3>
          <p className="mt-1 text-sm text-slate-600">{advance.purpose}</p>
        </div>
        <Badge tone={status.tone}>{status.label}</Badge>
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-line pt-4 text-sm sm:grid-cols-4">
        <div><dt className="text-xs text-slate-500">Requested</dt><dd className="mt-1 font-semibold">{money(advance.requestedAmount)}</dd></div>
        <div><dt className="text-xs text-slate-500">Approved</dt><dd className="mt-1 font-semibold">{advance.approvedAmount ? money(advance.approvedAmount) : '—'}</dd></div>
        <div><dt className="text-xs text-slate-500">Departure</dt><dd className="mt-1 font-medium">{formatDate(advance.departureDate)}</dd></div>
        <div><dt className="text-xs text-slate-500">Return</dt><dd className="mt-1 font-medium">{formatDate(advance.returnDate)}</dd></div>
      </dl>
      {advance.status === 'rejected' && advance.rejectionReason && (
        <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">
          <span className="font-semibold">Reason: </span>{advance.rejectionReason}
        </p>
      )}
      {advance.officerRemarks && (
        <p className="mt-3 rounded-lg bg-canvas px-3 py-2 text-sm text-slate-700">
          <span className="font-semibold">Officer note: </span>{advance.officerRemarks}
        </p>
      )}
      {advance.status === 'approved' && (
        <div className="mt-4 flex flex-col gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3 sm:flex-row sm:items-center sm:justify-between">
          <p role="status" className="text-sm font-medium text-emerald-900">
            Your advance is approved. Receipt {advance.receiptNo} is ready to download.
          </p>
          <button
            type="button"
            onClick={() => onDownload(advance)}
            className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-lg bg-emerald-800 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-2"
          >
            <Icon name="doc" className="h-4 w-4" /> Download receipt
          </button>
        </div>
      )}
    </article>
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
      <header className="rounded-2xl bg-asphalt px-5 py-6 text-white sm:px-7">
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

      <section className="mt-5 rounded-2xl border border-line bg-white p-4 shadow-sm sm:p-6">
        <div className="mb-5">
          <h2 className="font-display text-lg font-bold">New advance request</h2>
          <p className="mt-1 text-sm text-slate-500">Your account and assigned vehicle details are filled in automatically.</p>
        </div>
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
              <button type="button" onClick={() => setForm({ ...EMPTY_FORM })} className="min-h-11 rounded-lg border border-line px-4 py-2 text-sm font-semibold hover:bg-canvas">Clear form</button>
              <button type="submit" disabled={saving || loading} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-signal px-5 py-2 text-sm font-bold text-asphalt hover:bg-signal-dark disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-asphalt focus-visible:ring-offset-2">
                <Icon name="check" className="h-4 w-4" /> {saving ? 'Submitting...' : 'Submit request'}
              </button>
            </div>
          </form>
        )}
      </section>

      <section className="mt-8">
        <div className="mb-3 flex items-end justify-between gap-3">
          <div><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Your requests</p><h2 className="font-display text-xl font-bold">Advance history</h2></div>
          <span className="text-sm text-slate-500">{items.length} shown</span>
        </div>
        {loading && items.length === 0 ? (
          <p role="status" className="rounded-xl border border-line bg-white p-5 text-sm text-slate-600">Loading your requests...</p>
        ) : items.length ? (
          <div className="space-y-3">
            {items.map((advance) => <AdvanceCard key={advance._id} advance={advance} onDownload={downloadReceipt} />)}
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
