import { useCallback, useEffect, useState } from 'react';
import api from '../api/axios';
import Badge from '../components/Badge';
import Field, { inputCls } from '../components/Field';
import Icon from '../components/dashboard/Icon';
import { formatDate, getErrorMessage } from '../utils/helpers';

const money = (value) => new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 2,
}).format(value || 0);

function ReviewForm({ advance, onCancel, onSave, saving }) {
  const [status, setStatus] = useState('approved');
  const [approvedAmount, setApprovedAmount] = useState(String(advance.requestedAmount));
  const [officerRemarks, setOfficerRemarks] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [error, setError] = useState('');

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    try {
      await onSave(advance, {
        status,
        officerRemarks,
        ...(status === 'approved' && { approvedAmount: Number(approvedAmount) }),
        ...(status === 'rejected' && { rejectionReason }),
      });
    } catch (saveError) {
      setError(getErrorMessage(saveError));
    }
  };

  return (
    <form onSubmit={submit} className="mt-4 rounded-xl border border-signal/60 bg-amber-50/40 p-4">
      {error && <p role="alert" className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>}
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Requested amount">
          <input readOnly value={money(advance.requestedAmount)} className={`${inputCls(false)} min-h-11 bg-slate-100 font-semibold`} />
        </Field>
        <Field label="Approval status" required>
          <select value={status} onChange={(event) => setStatus(event.target.value)} className={`${inputCls(false)} min-h-11`}>
            <option value="approved">Approve</option>
            <option value="rejected">Reject</option>
          </select>
        </Field>
        {status === 'approved' ? (
          <Field label="Approved amount (₹)" required>
            <input type="number" required min="0.01" max={advance.requestedAmount} step="0.01" inputMode="decimal" value={approvedAmount} onChange={(event) => setApprovedAmount(event.target.value)} className={`${inputCls(false)} min-h-11`} />
          </Field>
        ) : (
          <Field label="Rejection reason" required>
            <input required maxLength={1000} value={rejectionReason} onChange={(event) => setRejectionReason(event.target.value)} placeholder="Explain why this request is rejected" className={`${inputCls(false)} min-h-11`} />
          </Field>
        )}
        <Field label="Officer remarks" hint="Optional">
          <input maxLength={1000} value={officerRemarks} onChange={(event) => setOfficerRemarks(event.target.value)} placeholder="Add a note for the driver" className={`${inputCls(false)} min-h-11`} />
        </Field>
      </div>
      <p className="mt-3 text-xs text-slate-500">The decision date is saved automatically when you submit.</p>
      <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <button type="button" onClick={onCancel} className="min-h-10 rounded-lg border border-line bg-white px-4 text-sm font-semibold hover:bg-canvas">Cancel</button>
        <button type="submit" disabled={saving} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-asphalt px-4 text-sm font-semibold text-white hover:bg-asphalt-soft disabled:opacity-60">
          <Icon name="check" className="h-4 w-4" /> {saving ? 'Saving decision...' : 'Submit decision'}
        </button>
      </div>
    </form>
  );
}

function AdvanceCard({ advance, reviewing, onReview, onCancelReview, onSave, saving }) {
  const statusTone = { pending: 'amber', approved: 'green', rejected: 'red' }[advance.status] || 'slate';
  return (
    <article className="rounded-2xl border border-line bg-white p-4 shadow-sm sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-display text-lg font-bold">{advance.destination}</h2>
            <Badge tone={statusTone}>{advance.status}</Badge>
          </div>
          <p className="mt-1 text-sm text-slate-600">{advance.purpose}</p>
        </div>
        {advance.status === 'pending' && !reviewing && (
          <button type="button" onClick={() => onReview(advance._id)} className="min-h-10 rounded-lg bg-signal px-4 py-2 text-sm font-bold text-asphalt hover:bg-signal-dark">Review request</button>
        )}
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-line pt-4 text-sm sm:grid-cols-4">
        <div><dt className="text-xs text-slate-500">Driver</dt><dd className="mt-1 font-semibold">{advance.driver?.name || 'Unavailable'}</dd></div>
        <div><dt className="text-xs text-slate-500">Vehicle</dt><dd className="mt-1 font-semibold">{advance.vehicle?.regNo || 'Unavailable'}</dd></div>
        <div><dt className="text-xs text-slate-500">Requested</dt><dd className="mt-1 font-semibold">{money(advance.requestedAmount)}</dd></div>
        <div><dt className="text-xs text-slate-500">Request date</dt><dd className="mt-1 font-medium">{formatDate(advance.createdAt)}</dd></div>
        <div><dt className="text-xs text-slate-500">Departure</dt><dd className="mt-1 font-medium">{formatDate(advance.departureDate)}</dd></div>
        <div><dt className="text-xs text-slate-500">Return</dt><dd className="mt-1 font-medium">{formatDate(advance.returnDate)}</dd></div>
      </dl>
      {advance.remarks && <p className="mt-3 rounded-lg bg-canvas px-3 py-2 text-sm text-slate-700"><span className="font-semibold">Driver remarks: </span>{advance.remarks}</p>}
      {advance.status === 'approved' && (
        <p className="mt-3 text-sm text-emerald-800">
          Approved {money(advance.approvedAmount)} on {formatDate(advance.approvedDate)} · Receipt {advance.receiptNo}
        </p>
      )}
      {advance.status === 'rejected' && (
        <p className="mt-3 text-sm text-red-800">
          Rejected on {formatDate(advance.decisionDate)} · Reason: {advance.rejectionReason}
        </p>
      )}
      {reviewing && <ReviewForm advance={advance} onCancel={onCancelReview} onSave={onSave} saving={saving} />}
    </article>
  );
}

export default function TripAdvanceApprovals() {
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState('pending');
  const [reviewId, setReviewId] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [refresh, setRefresh] = useState(0);

  const load = useCallback(async (signal) => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/trip-advances', {
        params: { limit: 100, ...(filter && { status: filter }) },
        signal,
      });
      setItems(data.data);
    } catch (loadError) {
      if (loadError.name !== 'CanceledError') setError(getErrorMessage(loadError));
    } finally {
      if (!signal.aborted) setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort();
  }, [load, refresh]);

  const saveDecision = async (advance, payload) => {
    setSaving(true);
    setNotice('');
    try {
      await api.patch(`/trip-advances/${advance._id}/decision`, payload);
      setReviewId('');
      setNotice(payload.status === 'approved'
        ? `Approved ${advance.driver?.name}'s request. Receipt generated and available in the driver's portal.`
        : `Rejected ${advance.driver?.name}'s request.`);
      setRefresh((value) => value + 1);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-5xl">
      <header className="rounded-2xl bg-asphalt px-5 py-6 text-white sm:px-7">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-signal">Transport Officer</p>
        <h1 className="mt-2 font-display text-2xl font-bold sm:text-3xl">Trip advance approvals</h1>
        <p className="mt-1 max-w-xl text-sm text-slate-300">Review driver requests, record the decision, and issue a numbered PDF receipt on approval.</p>
      </header>

      {notice && <p role="status" className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">{notice}</p>}
      {error && <p role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>}

      <section className="mt-5">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Requests</p>
            <p className="mt-1 text-sm text-slate-600">{items.length} {filter || 'total'} requests shown</p>
          </div>
          <div className="flex flex-wrap gap-2" aria-label="Filter requests">
            {[['pending', 'Pending'], ['', 'All requests']].map(([value, label]) => (
              <button key={label} type="button" onClick={() => { setFilter(value); setReviewId(''); }} aria-pressed={filter === value} className={`min-h-10 rounded-lg border px-4 text-sm font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-signal ${filter === value ? 'border-asphalt bg-asphalt text-white' : 'border-line bg-white text-slate-700 hover:bg-canvas'}`}>
                {label}
              </button>
            ))}
          </div>
        </div>

        {loading && items.length === 0 ? (
          <p role="status" className="rounded-xl border border-line bg-white p-5 text-sm text-slate-600">Loading advance requests...</p>
        ) : items.length ? (
          <div className="space-y-3">
            {items.map((advance) => (
              <AdvanceCard
                key={advance._id}
                advance={advance}
                reviewing={reviewId === advance._id}
                onReview={setReviewId}
                onCancelReview={() => setReviewId('')}
                onSave={saveDecision}
                saving={saving}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-12 text-center">
            <Icon name="check" className="mx-auto h-9 w-9 text-slate-400" />
            <h2 className="mt-3 font-display text-lg font-bold">{filter ? 'All caught up' : 'No advance requests yet'}</h2>
            <p className="mt-1 text-sm text-slate-500">{filter ? 'There are no pending requests to review.' : 'Driver requests will appear here when submitted.'}</p>
          </div>
        )}
      </section>
    </div>
  );
}
