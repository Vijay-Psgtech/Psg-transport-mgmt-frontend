import { useCallback, useEffect, useState } from 'react';
import api from '../api/axios';
import Badge from '../components/Badge';
import Modal from '../components/Modal';
import VehicleAssignmentForm from '../components/VehicleAssignmentForm';
import TripSheetHistory from '../components/TripSheetHistory';
import { inputCls } from '../components/Field';
import Icon from '../components/dashboard/Icon';
import { formatDateTime, getErrorMessage } from '../utils/helpers';

const STATUS = {
  pending: { tone: 'amber', label: 'Pending request' },
  assigned: { tone: 'green', label: 'Assigned' },
  rejected: { tone: 'red', label: 'Rejected' },
  cancelled: { tone: 'slate', label: 'Cancelled' },
  completed: { tone: 'slate', label: 'Completed' },
};

function AssignmentActions({ item, workingId, onUpdate, onAssign }) {
  const request = item.type === 'request';
  return (
    <div className="flex flex-wrap gap-2">
      {request && item.status === 'pending' && (
        <>
          <button
            type="button"
            onClick={() => onUpdate(item, 'rejected')}
            disabled={workingId === item._id}
            className="min-h-9 rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
          >
            Reject
          </button>
          <button
            type="button"
            onClick={() => onAssign(item)}
            className="min-h-9 rounded-lg bg-signal px-3 py-1.5 text-sm font-semibold text-asphalt hover:bg-signal-dark"
          >
            Assign vehicle
          </button>
        </>
      )}
      {item.status === 'assigned' && (
        <>
          <button
            type="button"
            onClick={() => onUpdate(item, 'completed')}
            disabled={workingId === item._id}
            className="min-h-9 rounded-lg border border-line px-3 py-1.5 text-sm font-medium hover:bg-canvas disabled:opacity-50"
          >
            Close assignment
          </button>
          <button
            type="button"
            onClick={() => onUpdate(item, 'cancelled')}
            disabled={workingId === item._id}
            className="min-h-9 rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
          >
            Cancel
          </button>
        </>
      )}
      {!request && item.status !== 'assigned' && item.status !== 'completed' && (
        <span className="text-sm text-slate-400">No actions</span>
      )}
    </div>
  );
}

function RouteSummary({ item }) {
  return (
    <div className="min-w-0">
      <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
        {item.type === 'request' ? 'Transport request' : 'Availability assignment'}
      </p>
      <p className="font-semibold text-asphalt">{item.purpose || (item.type === 'request' ? 'Transport request' : 'Availability assignment')}</p>
      {(item.pickupLocation || item.destination) && (
        <p className="mt-1 break-words text-xs text-slate-500">
          {item.pickupLocation || 'Pickup not set'} <span aria-hidden="true">→</span> {item.destination || 'Destination not set'}
        </p>
      )}
      {item.requestedBy?.name && <p className="mt-1 text-xs text-slate-500">Requested by {item.requestedBy.name}</p>}
      {item.passengerCount && <p className="mt-1 text-xs text-slate-500">{item.passengerCount} passengers</p>}
      {item.feedback && (
        <div className="mt-3 rounded-lg border border-line bg-slate-50 p-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-slate-700">Trip feedback</span>
            <Badge tone={item.feedback.experience === 'good' ? 'green' : 'red'}>
              {item.feedback.experience === 'good' ? 'Good' : 'Bad'}
            </Badge>
          </div>
          {item.feedback.remarks && <p className="mt-2 whitespace-normal text-sm text-slate-700">{item.feedback.remarks}</p>}
          <p className="mt-2 text-xs text-slate-500">Submitted {formatDateTime(item.feedback.submittedAt)}</p>
        </div>
      )}
    </div>
  );
}

function VehicleDriverSummary({ item }) {
  return (
    <div className="min-w-0 space-y-2">
      <div>
        <p className="text-xs uppercase tracking-wide text-slate-400">Vehicle</p>
        {item.vehicle ? (
          <>
            <p className="font-semibold">{item.vehicle.regNo}</p>
            <p className="text-xs text-slate-500">{item.vehicle.make} {item.vehicle.model}</p>
          </>
        ) : <p className="text-sm text-slate-400">{item.status === 'pending' ? 'Not assigned' : 'Vehicle unavailable'}</p>}
      </div>
      <div>
        <p className="text-xs uppercase tracking-wide text-slate-400">Driver</p>
        <p className="text-sm font-medium">{item.driver?.name || (item.status === 'pending' ? 'Not assigned' : 'Driver unavailable')}</p>
      </div>
    </div>
  );
}

export default function VehicleAssignments() {
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [refresh, setRefresh] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [notice, setNotice] = useState('');
  const [form, setForm] = useState(null);
  const [workingId, setWorkingId] = useState('');

  useEffect(() => {
    const timer = window.setTimeout(() => setSearchQuery(search.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  const load = useCallback(async (signal) => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/vehicle-assignments', {
        params: {
          page,
          limit: 20,
          ...(searchQuery && { search: searchQuery }),
          ...(statusFilter && { status: statusFilter }),
          ...(typeFilter && { type: typeFilter }),
          ...(fromDate && { from: fromDate }),
          ...(toDate && { to: toDate }),
        },
        signal,
      });
      setItems(data.data);
      setPagination(data.pagination);
    } catch (loadError) {
      if (loadError.name !== 'CanceledError') setError(getErrorMessage(loadError));
    } finally {
      if (!signal.aborted) setLoading(false);
    }
  }, [page, searchQuery, statusFilter, typeFilter, fromDate, toDate]);

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort();
  }, [load, refresh]);

  const saveForm = async (payload) => {
    if (form.assignment) {
      await api.patch(`/vehicle-assignments/${form.assignment._id}/assign`, payload);
      setNotice('Vehicle and driver assigned to the request.');
    } else {
      await api.post('/vehicle-assignments', payload);
      setNotice('Availability assignment created.');
    }
    setForm(null);
    setRefresh((value) => value + 1);
  };

  const updateStatus = async (item, status) => {
    setWorkingId(item._id);
    setActionError('');
    try {
      await api.patch(`/vehicle-assignments/${item._id}/status`, { status });
      setNotice(`Assignment marked ${status}.`);
      setRefresh((value) => value + 1);
    } catch (actionFailure) {
      setActionError(getErrorMessage(actionFailure));
    } finally {
      setWorkingId('');
    }
  };

  const resetFilters = () => {
    setSearch('');
    setSearchQuery('');
    setStatusFilter('');
    setTypeFilter('');
    setFromDate('');
    setToDate('');
    setPage(1);
  };

  const updateFilter = (setter) => (event) => {
    setter(event.target.value);
    setPage(1);
  };
  const updateFromDate = (event) => {
    const value = event.target.value;
    setFromDate(value);
    if (toDate && value && value > toDate) setToDate('');
    setPage(1);
  };
  const firstResult = pagination.total ? (page - 1) * 20 + 1 : 0;
  const lastResult = Math.min(page * 20, pagination.total);

  return (
    <div className="min-w-0 w-full">
      <header className="flex flex-col gap-4 rounded-2xl  px-5 py-5 text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-7">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-asphalt">Fleet operations</p>
          <h1 className="mt-1 font-display text-2xl font-bold sm:text-3xl text-asphalt">Vehicle Assignments</h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-500">Assign available vehicles, approve requests, and follow driver trip sheets.</p>
        </div>
        <button
          type="button"
          onClick={() => setForm({})}
          className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-lg bg-signal px-4 py-2 text-sm font-semibold text-asphalt hover:bg-signal-dark focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
        >
          <Icon name="plus" className="h-4 w-4" />
          New assignment
        </button>
      </header>

      {notice && <div role="status" className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{notice}</div>}
      {actionError && <div role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{actionError}</div>}

      <section className="mt-5 rounded-2xl border border-line bg-white p-4 shadow-sm sm:p-5" aria-label="Assignment filters">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
          <label className="block sm:col-span-2 lg:col-span-2">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Search assignments</span>
            <span className="relative block">
              <Icon name="filter" className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={search}
                onChange={(event) => { setSearch(event.target.value); setPage(1); }}
                placeholder="Vehicle no., driver, route, purpose..."
                aria-label="Search by vehicle registration, driver, route, or purpose"
                className={`${inputCls(false)} pl-9`}
              />
            </span>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Status</span>
            <select value={statusFilter} onChange={updateFilter(setStatusFilter)} className={inputCls(false)}>
              <option value="">All statuses</option>
              {Object.entries(STATUS).map(([value, item]) => <option key={value} value={value}>{item.label}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Record type</span>
            <select value={typeFilter} onChange={updateFilter(setTypeFilter)} className={inputCls(false)}>
              <option value="">All types</option>
              <option value="availability">Assignments</option>
              <option value="request">Requests</option>
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">From date</span>
            <input type="date" value={fromDate} onChange={updateFromDate} className={inputCls(false)} />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">To date</span>
            <input type="date" value={toDate} onChange={updateFilter(setToDate)} min={fromDate || undefined} className={inputCls(false)} />
          </label>
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-3">
          <p className="text-sm text-slate-600">
            {loading ? 'Updating results...' : <><strong className="text-asphalt">{pagination.total}</strong> matching records</>}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-400">Filters request date or assignment creation date</span>
            <button type="button" onClick={resetFilters} className="min-h-9 rounded-lg px-3 text-sm font-semibold text-slate-600 hover:bg-canvas hover:text-asphalt">
              Clear filters
            </button>
          </div>
        </div>
      </section>

      {error ? (
        <div role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-800">
          {error}
          <button type="button" onClick={() => setRefresh((value) => value + 1)} className="ml-2 font-semibold underline">Try again</button>
        </div>
      ) : items.length === 0 && !loading ? (
        <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-12 text-center">
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-canvas text-slate-500"><Icon name="bus" className="h-6 w-6" /></span>
          <h2 className="mt-4 font-display text-lg font-bold">{pagination.total ? 'No matching assignments' : 'No assignments yet'}</h2>
          <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">{pagination.total ? 'Try adjusting your search or filters.' : 'Create an availability assignment or wait for a transport request.'}</p>
          {pagination.total > 0 && <button type="button" onClick={resetFilters} className="mt-3 text-sm font-semibold text-asphalt underline">Clear filters</button>}
        </div>
      ) : (
        <>
          {loading && items.length === 0 ? (
            <p role="status" className="mt-4 rounded-xl border border-line bg-white p-6 text-sm text-slate-600">Loading assignments...</p>
          ) : (
            <>
              <div className={`mt-4 space-y-3 lg:hidden ${loading ? 'opacity-60' : ''}`} aria-busy={loading}>
                {items.map((item) => {
                  const status = STATUS[item.status] || STATUS.pending;
                  return (
                    <article key={item._id} className="rounded-xl border border-line bg-white p-4 shadow-sm">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <RouteSummary item={item} />
                        </div>
                        <Badge tone={status.tone}>{status.label}</Badge>
                      </div>
                      <div className="mt-4 grid grid-cols-2 gap-3 border-t border-line pt-3">
                        <VehicleDriverSummary item={item} />
                        <div className="text-sm">
                          <p className="text-xs uppercase tracking-wide text-slate-400">Schedule</p>
                          {item.startAt ? (
                            <>
                              <p className="mt-1 font-medium">{formatDateTime(item.startAt)}</p>
                              <p className="mt-1 text-xs text-slate-500">Until {formatDateTime(item.endAt)}</p>
                            </>
                          ) : <p className="mt-1 font-medium">Reserved until closed</p>}
                        </div>
                      </div>
                      {item.driver && ['assigned', 'completed', 'cancelled'].includes(item.status) && (
                        <TripSheetHistory assignmentId={item._id} />
                      )}
                      <div className="mt-3 border-t border-line pt-3">
                        <AssignmentActions item={item} workingId={workingId} onUpdate={updateStatus} onAssign={(assignment) => setForm({ assignment })} />
                      </div>
                    </article>
                  );
                })}
              </div>

              <div className={`mt-4 hidden overflow-hidden rounded-2xl border border-line bg-white shadow-sm lg:block ${loading ? 'opacity-60' : ''}`} aria-busy={loading}>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[1050px] text-left text-sm">
                    <thead className="bg-canvas text-xs uppercase tracking-wide text-slate-500">
                      <tr>
                        <th scope="col" className="px-4 py-3 font-semibold">Request / route</th>
                        <th scope="col" className="px-4 py-3 font-semibold">Vehicle / driver</th>
                        <th scope="col" className="px-4 py-3 font-semibold">Schedule</th>
                        <th scope="col" className="px-4 py-3 font-semibold">Status</th>
                        <th scope="col" className="px-4 py-3 font-semibold">Trip sheets</th>
                        <th scope="col" className="px-4 py-3 text-right font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                      {items.map((item) => {
                        const status = STATUS[item.status] || STATUS.pending;
                        return (
                          <tr key={item._id} className="align-top hover:bg-canvas/40">
                            <td className="max-w-[280px] px-4 py-4"><RouteSummary item={item} /></td>
                            <td className="px-4 py-4"><VehicleDriverSummary item={item} /></td>
                            <td className="whitespace-nowrap px-4 py-4">
                              {item.startAt ? (
                                <>
                                  <p className="font-medium">{formatDateTime(item.startAt)}</p>
                                  <p className="mt-1 text-xs text-slate-500">Until {formatDateTime(item.endAt)}</p>
                                </>
                              ) : <p className="font-medium">Reserved until closed</p>}
                            </td>
                            <td className="px-4 py-4"><Badge tone={status.tone}>{status.label}</Badge></td>
                            <td className="min-w-[155px] px-4 py-4">
                              {item.driver && ['assigned', 'completed', 'cancelled'].includes(item.status)
                                ? <TripSheetHistory assignmentId={item._id} />
                                : <span className="text-slate-400">—</span>}
                            </td>
                            <td className="px-4 py-4 text-right">
                              <div className="inline-flex justify-end">
                                <AssignmentActions item={item} workingId={workingId} onUpdate={updateStatus} onAssign={(assignment) => setForm({ assignment })} />
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </>
      )}

      {pagination.pages > 1 && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-white px-4 py-3 text-sm">
          <p className="text-slate-600">Showing {firstResult}–{lastResult} of {pagination.total}</p>
          <div className="flex gap-2">
            <button type="button" disabled={page <= 1 || loading} onClick={() => setPage((value) => value - 1)} className="min-h-10 rounded-lg border border-line px-3 font-medium disabled:opacity-40">Previous</button>
            <span className="flex items-center px-2 text-slate-600">Page {pagination.page} of {pagination.pages}</span>
            <button type="button" disabled={page >= pagination.pages || loading} onClick={() => setPage((value) => value + 1)} className="min-h-10 rounded-lg border border-line px-3 font-medium disabled:opacity-40">Next</button>
          </div>
        </div>
      )}

      <Modal open={Boolean(form)} title={form?.assignment ? 'Assign a request' : 'Create availability assignment'} size="max-w-3xl" onClose={() => setForm(null)}>
        {form && <VehicleAssignmentForm key={form.assignment?._id || 'availability'} assignment={form.assignment} onSubmit={saveForm} onCancel={() => setForm(null)} />}
      </Modal>
    </div>
  );
}
