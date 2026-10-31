import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useVehicles } from '../context/VehicleContext';
import Modal from '../components/Modal';
import VehicleForm from '../components/VehicleForm';
import VehicleTable from '../components/VehicleTable';
import { inputCls } from '../components/Field';
import { ROLES, VEHICLE_TYPES, VEHICLE_STATUSES } from '../utils/constants';
import { getErrorMessage } from '../utils/helpers';

export default function Vehicles() {
  const { hasRole } = useAuth();
  const {
    vehicles, pagination, loading, error, drivers,
    fetchVehicles, fetchDrivers, createVehicle, updateVehicle, deleteVehicle,
  } = useVehicles();
  const canDelete = hasRole(ROLES.ADMIN);

  const [filters, setFilters] = useState({ search: '', vehicleType: '', status: '', page: 1 });
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [modal, setModal] = useState(null); // null | { vehicle?: Vehicle }
  const [toDelete, setToDelete] = useState(null);
  const [deleteError, setDeleteError] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(filters.search.trim()), 350);
    return () => clearTimeout(t);
  }, [filters.search]);

  useEffect(() => {
    fetchVehicles({ search: debouncedSearch, vehicleType: filters.vehicleType, status: filters.status, page: filters.page });
  }, [debouncedSearch, filters.vehicleType, filters.status, filters.page, fetchVehicles]);

  useEffect(() => { fetchDrivers(); }, [fetchDrivers]);

  // If the last row of a page was deleted, step back one page
  useEffect(() => {
    if (!loading && vehicles.length === 0 && filters.page > 1) setFilters((f) => ({ ...f, page: f.page - 1 }));
  }, [loading, vehicles.length, filters.page]);

  useEffect(() => {
    if (!notice) return undefined;
    const t = setTimeout(() => setNotice(''), 4000);
    return () => clearTimeout(t);
  }, [notice]);

  const change = (name) => (e) => setFilters((f) => ({ ...f, [name]: e.target.value, page: 1 }));

  const handleSave = async (payload) => {
    if (modal.vehicle) {
      await updateVehicle(modal.vehicle._id, payload);
      setNotice(`${modal.vehicle.regNo} was updated.`);
    } else {
      const created = await createVehicle(payload);
      setNotice(`${created.regNo} was added.`);
    }
    setModal(null);
  };

  const confirmDelete = async () => {
    setDeleting(true);
    setDeleteError('');
    try {
      await deleteVehicle(toDelete._id);
      setNotice(`${toDelete.regNo} was deleted.`);
      setToDelete(null);
    } catch (err) {
      setDeleteError(getErrorMessage(err));
    } finally {
      setDeleting(false);
    }
  };

  const filtered = filters.search || filters.vehicleType || filters.status;

  return (
    <div className="min-w-0 w-full">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold">Vehicles</h1>
          <p className="text-sm text-slate-600">{pagination.total} {pagination.total === 1 ? 'vehicle' : 'vehicles'}{filtered ? ' match your filters' : ' in the fleet'}</p>
        </div>
        <button
          onClick={() => setModal({})}
          className="rounded-md bg-signal px-4 py-2 text-sm font-semibold text-asphalt hover:bg-signal-dark focus:outline-none focus-visible:ring-2 focus-visible:ring-asphalt"
        >
          Add vehicle
        </button>
      </div>

      {notice && <div role="status" className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{notice}</div>}

      <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_180px_180px]">
        <input
          type="search"
          value={filters.search}
          onChange={change('search')}
          placeholder="Search by registration, make or model"
          aria-label="Search vehicles"
          className={inputCls(false)}
        />
        <select value={filters.vehicleType} onChange={change('vehicleType')} aria-label="Filter by type" className={inputCls(false)}>
          <option value="">All types</option>
          {VEHICLE_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
        <select value={filters.status} onChange={change('status')} aria-label="Filter by status" className={inputCls(false)}>
          <option value="">All statuses</option>
          {VEHICLE_STATUSES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
      </div>

      <div className="mt-4 overflow-hidden rounded-lg border border-line bg-white">
        {error ? (
          <div role="alert" className="p-6 text-sm text-red-800">
            {error}{' '}
            <button className="underline" onClick={() => fetchVehicles({ search: debouncedSearch, vehicleType: filters.vehicleType, status: filters.status, page: filters.page })}>Try again</button>
          </div>
        ) : loading && vehicles.length === 0 ? (
          <p className="p-6 text-sm text-slate-600" role="status">Loading vehicles...</p>
        ) : vehicles.length === 0 ? (
          <div className="p-10 text-center">
            <p className="font-medium">{filtered ? 'No vehicles match these filters.' : 'No vehicles yet.'}</p>
            {!filtered && <p className="mt-1 text-sm text-slate-600">Add your first bus or car to start building the fleet.</p>}
          </div>
        ) : (
          <div className={loading ? 'opacity-60 transition-opacity' : ''}>
            <VehicleTable
              vehicles={vehicles}
              canDelete={canDelete}
              onEdit={(v) => setModal({ vehicle: v })}
              onDelete={(v) => { setDeleteError(''); setToDelete(v); }}
            />
          </div>
        )}
      </div>

      {pagination.pages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm">
          <p className="text-slate-600">Page {pagination.page} of {pagination.pages}</p>
          <div className="flex gap-2">
            <button
              disabled={pagination.page <= 1}
              onClick={() => setFilters((f) => ({ ...f, page: f.page - 1 }))}
              className="rounded-md border border-line bg-white px-3 py-1.5 font-medium disabled:opacity-40"
            >
              Previous
            </button>
            <button
              disabled={pagination.page >= pagination.pages}
              onClick={() => setFilters((f) => ({ ...f, page: f.page + 1 }))}
              className="rounded-md border border-line bg-white px-3 py-1.5 font-medium disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Add / edit vehicle */}
      <Modal open={Boolean(modal)} title={modal?.vehicle ? `Edit ${modal.vehicle.regNo}` : 'Add vehicle'} onClose={() => setModal(null)}>
        {modal && (
          <VehicleForm
            key={modal.vehicle?._id || 'new'}
            vehicle={modal.vehicle}
            drivers={drivers}
            onSubmit={handleSave}
            onCancel={() => setModal(null)}
          />
        )}
      </Modal>

      {/* Delete confirmation */}
      <Modal open={Boolean(toDelete)} title="Delete vehicle" size="max-w-md" onClose={() => setToDelete(null)}>
        <div className="space-y-3 px-5 py-5 text-sm">
          <p>
            Delete <strong>{toDelete?.regNo}</strong> ({toDelete?.make} {toDelete?.model})? This removes the vehicle and its
            documents and cannot be undone.
          </p>
          {deleteError && <p role="alert" className="text-red-700">{deleteError}</p>}
        </div>
        <div className="flex justify-end gap-3 border-t border-line px-5 py-4">
          <button onClick={() => setToDelete(null)} className="rounded-md border border-line px-4 py-2 text-sm font-medium hover:bg-canvas">Cancel</button>
          <button onClick={confirmDelete} disabled={deleting} className="rounded-md bg-red-700 px-4 py-2 text-sm font-semibold text-white hover:bg-red-800 disabled:opacity-60">
            {deleting ? 'Deleting...' : 'Delete vehicle'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
