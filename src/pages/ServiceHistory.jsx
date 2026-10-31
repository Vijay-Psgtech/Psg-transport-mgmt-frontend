import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import ConfirmModal from '../components/ConfirmModal';
import Field, { inputCls } from '../components/Field';
import Icon from '../components/dashboard/Icon';
import Modal from '../components/Modal';
import ServiceRecordForm, { SERVICE_STATUSES, SERVICE_TYPES } from '../components/ServiceRecordForm';
import { useAuth } from '../context/AuthContext';
import { formatDate, getErrorMessage } from '../utils/helpers';

const PAGE_SIZE = 10;
const SERVICE_LABELS = Object.fromEntries(SERVICE_TYPES);
const STATUS_LABELS = Object.fromEntries(SERVICE_STATUSES);
const STATUS_CLASSES = {
  completed: 'bg-emerald-50 text-emerald-800',
  scheduled: 'bg-blue-50 text-blue-800',
  in_progress: 'bg-amber-50 text-amber-800',
  cancelled: 'bg-slate-100 text-slate-700',
};
const EMPTY_STATS = { total: 0, totalSpend: 0, monthSpend: 0, dueSoon: 0, byStatus: {} };

const money = (value) => new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
}).format(value || 0);

function StatusBadge({ status }) {
  return (
    <span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_CLASSES[status] || STATUS_CLASSES.cancelled}`}>
      {STATUS_LABELS[status] || status}
    </span>
  );
}

function StatCard({ title, value, detail, icon, tone = 'slate' }) {
  const tones = {
    slate: 'bg-slate-100 text-slate-700',
    green: 'bg-emerald-50 text-emerald-700',
    amber: 'bg-amber-50 text-amber-700',
    blue: 'bg-blue-50 text-blue-700',
  };
  return (
    <article className="rounded-xl border border-line bg-white p-4 shadow-sm sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-600">{title}</p>
          <p className="mt-2 truncate font-display text-2xl font-bold text-asphalt sm:text-3xl">{value}</p>
          <p className="mt-1 text-xs text-slate-500">{detail}</p>
        </div>
        <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg ${tones[tone]}`}>
          <Icon name={icon} className="h-5 w-5" />
        </span>
      </div>
    </article>
  );
}

function VehicleLabel({ vehicle }) {
  if (!vehicle) return <span className="text-slate-400">Vehicle unavailable</span>;
  return (
    <span>
      <span className="block font-semibold text-asphalt">{vehicle.regNo}</span>
      <span className="block text-xs text-slate-500">{vehicle.make} {vehicle.model}</span>
    </span>
  );
}

function RecordActions({ record, onEdit, onDelete, canDelete }) {
  return (
    <div className="flex items-center gap-3">
      <button type="button" onClick={() => onEdit(record)} className="text-sm font-semibold text-blue-800 underline underline-offset-2 hover:text-blue-950 focus:outline-none focus-visible:ring-2 focus-visible:ring-signal">
        Edit
      </button>
      {canDelete && <button type="button" onClick={() => onDelete(record)} className="text-sm font-semibold text-red-700 underline underline-offset-2 hover:text-red-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500">
        Delete
      </button>}
    </div>
  );
}

function ServiceCard({ record, onEdit, onDelete, canDelete }) {
  return (
    <article className="rounded-xl border border-line bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-asphalt">{formatDate(record.serviceDate)}</p>
          <p className="mt-1 text-xs font-medium text-slate-500">{SERVICE_LABELS[record.serviceType] || record.serviceType}</p>
        </div>
        <StatusBadge status={record.status} />
      </div>
      <div className="mt-3 border-t border-line pt-3">
        <VehicleLabel vehicle={record.vehicle} />
        <p className="mt-3 whitespace-pre-wrap text-sm text-slate-700">{record.workDescription}</p>
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div>
          <dt className="text-xs text-slate-500">Odometer</dt>
          <dd className="mt-0.5 font-medium">{Number(record.odometer).toLocaleString('en-IN')} km</dd>
        </div>
        <div>
          <dt className="text-xs text-slate-500">Cost</dt>
          <dd className="mt-0.5 font-medium">{money(record.cost)}</dd>
        </div>
        <div>
          <dt className="text-xs text-slate-500">Provider</dt>
          <dd className="mt-0.5 truncate font-medium">{record.provider || '—'}</dd>
        </div>
        <div>
          <dt className="text-xs text-slate-500">Next service</dt>
          <dd className="mt-0.5 font-medium">{record.nextServiceDate ? formatDate(record.nextServiceDate) : record.nextServiceOdometer ? `${Number(record.nextServiceOdometer).toLocaleString('en-IN')} km` : '—'}</dd>
        </div>
      </dl>
      {record.notes && <p className="mt-3 border-t border-line pt-3 text-xs text-slate-600">{record.notes}</p>}
      <div className="mt-4 flex justify-end border-t border-line pt-3">
        <RecordActions record={record} onEdit={onEdit} onDelete={onDelete} canDelete={canDelete} />
      </div>
    </article>
  );
}

export default function ServiceHistory() {
  const { hasRole } = useAuth();
  const canDelete = hasRole('admin');
  const [vehicles, setVehicles] = useState([]);
  const [vehiclesError, setVehiclesError] = useState('');
  const [records, setRecords] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, total: 0, pages: 1 });
  const [stats, setStats] = useState(EMPTY_STATS);
  const [statsError, setStatsError] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({ search: '', vehicle: '', serviceType: '', status: '', from: '', to: '', page: 1 });
  const [search, setSearch] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [modal, setModal] = useState(null);
  const [toDelete, setToDelete] = useState(null);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setFilters((current) => ({ ...current, search, page: 1 })), 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    let active = true;
    api.get('/vehicles', { params: { limit: 100, sortBy: 'regNo', order: 'asc' } })
      .then(({ data }) => { if (active) setVehicles(data.data); })
      .catch((err) => { if (active) setVehiclesError(getErrorMessage(err)); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    api.get('/service-history/stats')
      .then(({ data }) => {
        if (active) {
          setStats({ ...EMPTY_STATS, ...data.data });
          setStatsError('');
        }
      })
      .catch((err) => { if (active) setStatsError(getErrorMessage(err)); });
    return () => { active = false; };
  }, [refreshKey]);

  const query = useMemo(() => Object.fromEntries(
    Object.entries({
      page: filters.page,
      limit: PAGE_SIZE,
      search: filters.search.trim(),
      vehicle: filters.vehicle,
      serviceType: filters.serviceType,
      status: filters.status,
      from: filters.from,
      to: filters.to,
    }).filter(([, value]) => value !== '')
  ), [filters]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    api.get('/service-history', { params: query })
      .then(({ data }) => {
        if (!active) return;
        if (data.data.length === 0 && filters.page > data.pagination.pages) {
          setFilters((current) => ({ ...current, page: data.pagination.pages }));
          return;
        }
        setRecords(data.data);
        setPagination(data.pagination);
      })
      .catch((err) => { if (active) setError(getErrorMessage(err)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [filters.page, query, refreshKey]);

  useEffect(() => {
    if (!notice) return undefined;
    const timer = setTimeout(() => setNotice(''), 4000);
    return () => clearTimeout(timer);
  }, [notice]);

  const setFilter = (name) => (event) => {
    setFilters((current) => ({ ...current, [name]: event.target.value, page: 1 }));
  };

  const saveRecord = useCallback(async (payload) => {
    if (modal?.record) {
      await api.put(`/service-history/${modal.record._id}`, payload);
      setNotice('Service record updated.');
    } else {
      await api.post('/service-history', payload);
      setNotice('Service record added.');
    }
    setModal(null);
    setRefreshKey((key) => key + 1);
  }, [modal]);

  const deleteRecord = useCallback(async () => {
    await api.delete(`/service-history/${toDelete._id}`);
    setNotice('Service record deleted.');
    setToDelete(null);
    setRefreshKey((key) => key + 1);
  }, [toDelete]);

  const hasFilters = Boolean(search || filters.vehicle || filters.serviceType || filters.status || filters.from || filters.to);

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-500">
            <Link to="/vehicles" className="hover:text-asphalt">Fleet</Link>
            <span aria-hidden="true">/</span>
            <span className="text-asphalt">Service history</span>
          </div>
          <h1 className="font-display text-3xl font-bold text-asphalt sm:text-4xl">Service history</h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-600">Track maintenance, repairs, costs, and the next service due for every vehicle.</p>
        </div>
        <button
          type="button"
          onClick={() => setModal({})}
          disabled={Boolean(vehiclesError)}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-signal px-4 py-2 text-sm font-semibold text-asphalt hover:bg-signal-dark focus:outline-none focus-visible:ring-2 focus-visible:ring-asphalt disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Icon name="wrench" className="h-4 w-4" />
          Add service record
        </button>
      </header>

      {notice && <div role="status" className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{notice}</div>}
      {vehiclesError && (
        <div role="alert" className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          Could not load vehicles for the service form: {vehiclesError}
        </div>
      )}
      {statsError && <p role="status" className="text-sm text-amber-800">Summary metrics are unavailable: {statsError}</p>}

      <section aria-label="Service history summary" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Service records" value={stats.total.toLocaleString('en-IN')} detail={`${stats.byStatus.completed || 0} completed`} icon="doc" />
        <StatCard title="Completed service spend" value={money(stats.totalSpend)} detail="Across all completed records" icon="check" tone="green" />
        <StatCard title="Spend this month" value={money(stats.monthSpend)} detail="Completed services this month" icon="grid" tone="blue" />
        <StatCard title="Coming up" value={stats.dueSoon.toLocaleString('en-IN')} detail="Due in the next 30 days" icon="refresh" tone="amber" />
      </section>

      <section aria-label="Filter service history" className="rounded-xl border border-line bg-white p-4 shadow-sm sm:p-5">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <Field label="Search" className="sm:col-span-2 xl:col-span-2">
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Registration, provider, or work"
              aria-label="Search service history"
              className={inputCls(false)}
            />
          </Field>
          <Field label="Vehicle">
            <select value={filters.vehicle} onChange={setFilter('vehicle')} className={inputCls(false)}>
              <option value="">All vehicles</option>
              {vehicles.map((vehicle) => <option key={vehicle._id} value={vehicle._id}>{vehicle.regNo}</option>)}
            </select>
          </Field>
          <Field label="Service type">
            <select value={filters.serviceType} onChange={setFilter('serviceType')} className={inputCls(false)}>
              <option value="">All types</option>
              {SERVICE_TYPES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </Field>
          <Field label="Status">
            <select value={filters.status} onChange={setFilter('status')} className={inputCls(false)}>
              <option value="">All statuses</option>
              {SERVICE_STATUSES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-3 sm:col-span-2 lg:col-span-3 xl:col-span-2">
            <Field label="From">
              <input type="date" value={filters.from} max={filters.to || undefined} onChange={setFilter('from')} className={inputCls(false)} />
            </Field>
            <Field label="To">
              <input type="date" value={filters.to} min={filters.from || undefined} onChange={setFilter('to')} className={inputCls(false)} />
            </Field>
          </div>
        </div>
        {hasFilters && (
          <button
            type="button"
            onClick={() => {
              setSearch('');
              setFilters({ search: '', vehicle: '', serviceType: '', status: '', from: '', to: '', page: 1 });
            }}
            className="mt-3 text-sm font-semibold text-blue-800 underline underline-offset-2"
          >
            Clear filters
          </button>
        )}
      </section>

      <section aria-label="Service records" className="overflow-hidden rounded-xl border border-line bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-3 sm:px-5">
          <h2 className="font-display text-lg font-bold text-asphalt">Maintenance records</h2>
          <p className="text-sm text-slate-500">{pagination.total.toLocaleString('en-IN')} {pagination.total === 1 ? 'record' : 'records'}</p>
        </div>

        {error ? (
          <div role="alert" className="p-6 text-sm text-red-800">
            <p>{error}</p>
            <button type="button" onClick={() => setRefreshKey((key) => key + 1)} className="mt-2 font-semibold underline underline-offset-2">Try again</button>
          </div>
        ) : loading && records.length === 0 ? (
          <p role="status" className="p-8 text-center text-sm text-slate-600">Loading service history...</p>
        ) : records.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-slate-100 text-slate-600">
              <Icon name="wrench" className="h-6 w-6" />
            </span>
            <h3 className="mt-4 font-display text-lg font-bold text-asphalt">{hasFilters ? 'No matching service records' : 'No service records yet'}</h3>
            <p className="mx-auto mt-1 max-w-md text-sm text-slate-600">
              {hasFilters ? 'Try adjusting your filters or clear them to see the full service history.' : 'Record routine servicing, repairs, and inspections to build a maintenance history for your fleet.'}
            </p>
            {!hasFilters && vehicles.length > 0 && (
              <button type="button" onClick={() => setModal({})} className="mt-4 rounded-md bg-signal px-4 py-2 text-sm font-semibold text-asphalt hover:bg-signal-dark">
                Add first record
              </button>
            )}
          </div>
        ) : (
          <>
            <div className={loading ? 'opacity-60 transition-opacity' : ''}>
              <div className="space-y-3 p-3 sm:hidden">
                {records.map((record) => <ServiceCard key={record._id} record={record} onEdit={(item) => setModal({ record: item })} onDelete={setToDelete} canDelete={canDelete} />)}
              </div>
              <div className="hidden overflow-x-auto sm:block">
                <table className="min-w-[900px] w-full text-left text-sm">
                  <thead className="bg-canvas text-xs uppercase tracking-wide text-slate-600">
                    <tr>
                      <th scope="col" className="px-4 py-3 font-semibold">Date / vehicle</th>
                      <th scope="col" className="px-4 py-3 font-semibold">Service</th>
                      <th scope="col" className="px-4 py-3 font-semibold">Work / provider</th>
                      <th scope="col" className="px-4 py-3 font-semibold">Odometer</th>
                      <th scope="col" className="px-4 py-3 font-semibold">Cost</th>
                      <th scope="col" className="px-4 py-3 font-semibold">Status</th>
                      <th scope="col" className="px-4 py-3 font-semibold"><span className="sr-only">Actions</span></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {records.map((record) => (
                      <tr key={record._id} className="align-top hover:bg-canvas/60">
                        <td className="px-4 py-4">
                          <p className="mb-2 whitespace-nowrap font-semibold">{formatDate(record.serviceDate)}</p>
                          <VehicleLabel vehicle={record.vehicle} />
                        </td>
                        <td className="px-4 py-4">
                          <p className="font-medium">{SERVICE_LABELS[record.serviceType] || record.serviceType}</p>
                          {record.nextServiceDate && <p className="mt-1 text-xs text-slate-500">Next: {formatDate(record.nextServiceDate)}</p>}
                          {!record.nextServiceDate && record.nextServiceOdometer && <p className="mt-1 text-xs text-slate-500">Next: {Number(record.nextServiceOdometer).toLocaleString('en-IN')} km</p>}
                        </td>
                        <td className="max-w-sm px-4 py-4">
                          <p className="line-clamp-2 whitespace-pre-wrap">{record.workDescription}</p>
                          <p className="mt-1 text-xs text-slate-500">{record.provider || 'Provider not recorded'}</p>
                        </td>
                        <td className="whitespace-nowrap px-4 py-4">{Number(record.odometer).toLocaleString('en-IN')} km</td>
                        <td className="whitespace-nowrap px-4 py-4 font-medium">{money(record.cost)}</td>
                        <td className="px-4 py-4"><StatusBadge status={record.status} /></td>
                        <td className="px-4 py-4"><RecordActions record={record} onEdit={(item) => setModal({ record: item })} onDelete={setToDelete} canDelete={canDelete} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            {pagination.pages > 1 && (
              <div className="flex flex-col gap-3 border-t border-line px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between sm:px-5">
                <p className="text-slate-600">Page {pagination.page} of {pagination.pages} · {pagination.total} records</p>
                <div className="flex gap-2">
                  <button type="button" disabled={pagination.page <= 1} onClick={() => setFilters((current) => ({ ...current, page: current.page - 1 }))} className="min-h-10 rounded-md border border-line px-3 py-2 font-medium hover:bg-canvas disabled:opacity-40">Previous</button>
                  <button type="button" disabled={pagination.page >= pagination.pages} onClick={() => setFilters((current) => ({ ...current, page: current.page + 1 }))} className="min-h-10 rounded-md border border-line px-3 py-2 font-medium hover:bg-canvas disabled:opacity-40">Next</button>
                </div>
              </div>
            )}
          </>
        )}
      </section>

      <Modal
        open={Boolean(modal)}
        title={modal?.record ? 'Edit service record' : 'Add service record'}
        onClose={() => setModal(null)}
        size="max-w-3xl"
      >
        {modal && <ServiceRecordForm record={modal.record} onSubmit={saveRecord} onCancel={() => setModal(null)} />}
      </Modal>

      <ConfirmModal
        open={Boolean(toDelete)}
        title="Delete service record"
        confirmLabel="Delete record"
        danger
        onConfirm={deleteRecord}
        onClose={() => setToDelete(null)}
      >
        <p>
          Delete the {toDelete ? SERVICE_LABELS[toDelete.serviceType]?.toLowerCase() : ''} record for{' '}
          <strong>{toDelete?.vehicle?.regNo || 'this vehicle'}</strong>? This action cannot be undone.
        </p>
      </ConfirmModal>
    </div>
  );
}
