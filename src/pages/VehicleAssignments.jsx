import { useCallback, useEffect, useState } from 'react';
import api from '../api/axios';
import Badge from '../components/Badge';
import Modal from '../components/Modal';
import VehicleAssignmentForm from '../components/VehicleAssignmentForm';
import { inputCls } from '../components/Field';
import { formatDateTime, getErrorMessage } from '../utils/helpers';
import { VEHICLE_TYPES, labelOf } from '../utils/constants';

const STATUS = {
  pending: { tone: 'amber', label: 'Pending request' },
  assigned: { tone: 'green', label: 'Assigned' },
  rejected: { tone: 'red', label: 'Rejected' },
  cancelled: { tone: 'slate', label: 'Cancelled' },
  completed: { tone: 'slate', label: 'Completed' },
};

export default function VehicleAssignments() {
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [refresh, setRefresh] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [notice, setNotice] = useState('');
  const [form, setForm] = useState(null);
  const [workingId, setWorkingId] = useState('');

  const load = useCallback(async (signal) => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/vehicle-assignments', {
        params: { page, limit: 20, status: statusFilter },
        signal,
      });
      setItems(data.data);
      setPagination(data.pagination);
    } catch (loadError) {
      if (loadError.name !== 'CanceledError') setError(getErrorMessage(loadError));
    } finally {
      if (!signal.aborted) setLoading(false);
    }
  }, [page, statusFilter]);

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

  const changeStatus = (event) => {
    setStatusFilter(event.target.value);
    setPage(1);
  };

  return (
    <div className="min-w-0 w-full">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold">Vehicle Assign</h1>
          <p className="text-sm text-slate-600">Schedule vehicles and drivers by availability, or fulfil user requests.</p>
        </div>
        <button onClick={() => setForm({})} className="rounded-md bg-signal px-4 py-2 text-sm font-semibold text-asphalt hover:bg-signal-dark focus:outline-none focus-visible:ring-2 focus-visible:ring-asphalt">
          Add availability assignment
        </button>
      </div>

      {notice && <div role="status" className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{notice}</div>}
      {actionError && <div role="alert" className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{actionError}</div>}

      <div className="mt-5 grid gap-3 sm:grid-cols-[minmax(0,1fr)_200px]">
        <div className="rounded-md border border-line bg-white px-4 py-3 text-sm text-slate-600">
          {pagination.total} {pagination.total === 1 ? 'assignment or request' : 'assignments and requests'}
        </div>
        <select value={statusFilter} onChange={changeStatus} aria-label="Filter by assignment status" className={inputCls(false)}>
          <option value="">All statuses</option>
          {Object.entries(STATUS).map(([value, item]) => <option key={value} value={value}>{item.label}</option>)}
        </select>
      </div>

      {error ? (
        <div role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 p-5 text-sm text-red-800">
          {error} <button className="font-semibold underline" onClick={() => setRefresh((value) => value + 1)}>Try again</button>
        </div>
      ) : loading && items.length === 0 ? (
        <p role="status" className="mt-4 rounded-lg border border-line bg-white p-6 text-sm text-slate-600">Loading assignments...</p>
      ) : items.length === 0 ? (
        <div className="mt-4 rounded-lg border border-line bg-white p-10 text-center">
          <p className="font-semibold">No assignments or requests found.</p>
          <p className="mt-1 text-sm text-slate-600">Create an availability assignment or wait for a transport user request.</p>
        </div>
      ) : (
        <div className={`mt-4 space-y-3 ${loading ? 'opacity-60' : ''}`}>
          {items.map((item) => {
            const status = STATUS[item.status] || STATUS.pending;
            const request = item.type === 'request';
            return (
              <article key={item._id} className="rounded-lg border border-line bg-white p-4 sm:p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-display text-lg font-bold">{request ? 'User request' : 'Availability assignment'}</h2>
                      <Badge tone={status.tone}>{status.label}</Badge>
                    </div>
                    <p className="mt-1 text-sm text-slate-600">{formatDateTime(item.startAt)} – {formatDateTime(item.endAt)}</p>
                  </div>
                  {request && item.requestedBy && <p className="text-sm text-slate-600">Requested by <strong>{item.requestedBy.name}</strong></p>}
                </div>

                {request && (
                  <div className="mt-3 grid gap-2 border-t border-line pt-3 text-sm sm:grid-cols-2">
                    <p><span className="text-slate-500">Purpose:</span> {item.purpose}</p>
                    <p><span className="text-slate-500">Passengers:</span> {item.passengerCount}</p>
                    {item.preferredVehicleType && <p><span className="text-slate-500">Preferred vehicle:</span> {labelOf(VEHICLE_TYPES, item.preferredVehicleType)}</p>}
                    <p className="sm:col-span-2"><span className="text-slate-500">Route:</span> {item.pickupLocation} → {item.destination}</p>
                    {item.notes && <p className="sm:col-span-2"><span className="text-slate-500">Notes:</span> {item.notes}</p>}
                  </div>
                )}

                {item.status === 'assigned' && (
                  <div className="mt-3 grid gap-2 border-t border-line pt-3 text-sm sm:grid-cols-3">
                    <p><span className="text-slate-500">Vehicle:</span> {item.vehicle ? `${item.vehicle.regNo} · ${item.vehicle.make} ${item.vehicle.model}` : 'Vehicle removed'}</p>
                    <p><span className="text-slate-500">Driver:</span> {item.driver?.name || 'Driver removed'}</p>
                    <p><span className="text-slate-500">Assigned by:</span> {item.assignedBy?.name || '—'}</p>
                  </div>
                )}

                <div className="mt-3 flex flex-wrap justify-end gap-2 border-t border-line pt-3">
                  {request && item.status === 'pending' && (
                    <>
                      <button onClick={() => updateStatus(item, 'rejected')} disabled={workingId === item._id} className="rounded-md border border-red-200 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50">Reject</button>
                      <button onClick={() => setForm({ assignment: item })} className="rounded-md bg-signal px-3 py-1.5 text-sm font-semibold text-asphalt hover:bg-signal-dark">Assign vehicle + driver</button>
                    </>
                  )}
                  {item.status === 'assigned' && (
                    <>
                      {new Date(item.endAt) <= new Date() && (
                        <button onClick={() => updateStatus(item, 'completed')} disabled={workingId === item._id} className="rounded-md border border-line px-3 py-1.5 text-sm font-medium hover:bg-canvas disabled:opacity-50">Mark completed</button>
                      )}
                      <button onClick={() => updateStatus(item, 'cancelled')} disabled={workingId === item._id} className="rounded-md border border-red-200 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50">Cancel assignment</button>
                    </>
                  )}
                </div>
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

      <Modal open={Boolean(form)} title={form?.assignment ? 'Assign a request' : 'Create availability assignment'} size="max-w-3xl" onClose={() => setForm(null)}>
        {form && <VehicleAssignmentForm key={form.assignment?._id || 'availability'} assignment={form.assignment} onSubmit={saveForm} onCancel={() => setForm(null)} />}
      </Modal>
    </div>
  );
}
