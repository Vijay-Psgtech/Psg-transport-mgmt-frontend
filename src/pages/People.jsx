import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useUsers } from '../context/UserContext';
import Modal from '../components/Modal';
import UserForm from '../components/UserForm';
import UserTable from '../components/UserTable';
import ConfirmModal from '../components/ConfirmModal';
import CredentialsModal from '../components/CredentialsModal';
import ResetPasswordModal from '../components/ResetPasswordModal';
import { inputCls } from '../components/Field';
import { ROLES, ROLE_OPTIONS } from '../utils/constants';

// One screen, two modes: <People driversOnly /> for drivers, <People /> for every role (admin only)
export default function People({ driversOnly = false }) {
  const { user: me, hasRole } = useAuth();
  const {
    users, pagination, loading, error,
    clearUsers, fetchUsers, createUser, updateUser, setUserStatus, resetPassword, deleteUser,
  } = useUsers();
  const isAdmin = hasRole(ROLES.ADMIN);
  const noun = driversOnly ? 'driver' : 'user';

  const [filters, setFilters] = useState({ search: '', role: '', status: '', page: 1 });
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [form, setForm] = useState(null); // null | { user? }
  const [resetFor, setResetFor] = useState(null);
  const [toggleFor, setToggleFor] = useState(null);
  const [deleteFor, setDeleteFor] = useState(null);
  const [credentials, setCredentials] = useState(null);
  const [notice, setNotice] = useState('');

  // Start clean when switching between the drivers and users screens
  useEffect(() => { clearUsers(); }, [driversOnly, clearUsers]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(filters.search.trim()), 350);
    return () => clearTimeout(t);
  }, [filters.search]);

  const params = {
    search: debouncedSearch,
    role: driversOnly ? 'driver' : filters.role,
    status: filters.status,
    page: filters.page,
  };
  useEffect(() => {
    fetchUsers(params);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, driversOnly, filters.role, filters.status, filters.page, fetchUsers]);

  useEffect(() => {
    if (!loading && users.length === 0 && filters.page > 1) setFilters((f) => ({ ...f, page: f.page - 1 }));
  }, [loading, users.length, filters.page]);

  useEffect(() => {
    if (!notice) return undefined;
    const t = setTimeout(() => setNotice(''), 5000);
    return () => clearTimeout(t);
  }, [notice]);

  const change = (name) => (e) => setFilters((f) => ({ ...f, [name]: e.target.value, page: 1 }));

  const handleSave = async (payload, formState) => {
    if (form.user) {
      const res = await updateUser(form.user._id, payload);
      setNotice(`${res.data.name}: ${res.message.toLowerCase()}.`);
    } else {
      const res = await createUser(payload);
      setCredentials({ name: res.data.name, email: res.data.email, password: formState.password });
    }
    setForm(null);
  };

  const handleReset = async (password) => {
    await resetPassword(resetFor._id, password);
    setCredentials({ name: resetFor.name, email: resetFor.email, password, reset: true });
    setResetFor(null);
  };

  const handleToggle = async () => {
    const res = await setUserStatus(toggleFor._id, !toggleFor.isActive);
    setNotice(`${toggleFor.name}: ${res.message.toLowerCase()}.`);
    setToggleFor(null);
  };

  const handleDelete = async () => {
    await deleteUser(deleteFor._id);
    setNotice(`${deleteFor.name} was deleted.`);
    setDeleteFor(null);
  };

  const filtered = filters.search || filters.role || filters.status;
  const title = driversOnly ? 'Drivers' : 'Users';

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold">{title}</h1>
          <p className="text-sm text-slate-600">
            {pagination.total} {pagination.total === 1 ? noun : `${noun}s`}{filtered ? ' match your filters' : ''}
          </p>
        </div>
        <button
          onClick={() => setForm({})}
          className="rounded-md bg-signal px-4 py-2 text-sm font-semibold text-asphalt hover:bg-signal-dark focus:outline-none focus-visible:ring-2 focus-visible:ring-asphalt"
        >
          Add {noun}
        </button>
      </div>

      {notice && <div role="status" className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{notice}</div>}

      <div className={`mt-5 grid gap-3 ${driversOnly ? 'sm:grid-cols-[1fr_200px]' : 'sm:grid-cols-[1fr_200px_160px]'}`}>
        <input
          type="search"
          value={filters.search}
          onChange={change('search')}
          placeholder={driversOnly ? 'Search by name, phone, email or licence number' : 'Search by name, email, phone or ID'}
          aria-label={`Search ${noun}s`}
          className={inputCls(false)}
        />
        {!driversOnly && (
          <select value={filters.role} onChange={change('role')} aria-label="Filter by role" className={inputCls(false)}>
            <option value="">All roles</option>
            {ROLE_OPTIONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
        )}
        <select value={filters.status} onChange={change('status')} aria-label="Filter by status" className={inputCls(false)}>
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      <div className="mt-4 overflow-hidden rounded-lg border border-line bg-white">
        {error ? (
          <div role="alert" className="p-6 text-sm text-red-800">
            {error} <button className="underline" onClick={() => fetchUsers(params)}>Try again</button>
          </div>
        ) : loading && users.length === 0 ? (
          <p className="p-6 text-sm text-slate-600" role="status">Loading {noun}s...</p>
        ) : users.length === 0 ? (
          <div className="p-10 text-center">
            <p className="font-medium">{filtered ? `No ${noun}s match these filters.` : `No ${noun}s yet.`}</p>
            {!filtered && <p className="mt-1 text-sm text-slate-600">Add the first {noun} to get started.</p>}
          </div>
        ) : (
          <div className={loading ? 'opacity-60 transition-opacity' : ''}>
            <UserTable
              users={users}
              variant={driversOnly ? 'drivers' : 'users'}
              currentUserId={me._id}
              isAdmin={isAdmin}
              onEdit={(u) => setForm({ user: u })}
              onReset={setResetFor}
              onToggle={setToggleFor}
              onDelete={setDeleteFor}
            />
          </div>
        )}
      </div>

      {pagination.pages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm">
          <p className="text-slate-600">Page {pagination.page} of {pagination.pages}</p>
          <div className="flex gap-2">
            <button disabled={pagination.page <= 1} onClick={() => setFilters((f) => ({ ...f, page: f.page - 1 }))} className="rounded-md border border-line bg-white px-3 py-1.5 font-medium disabled:opacity-40">Previous</button>
            <button disabled={pagination.page >= pagination.pages} onClick={() => setFilters((f) => ({ ...f, page: f.page + 1 }))} className="rounded-md border border-line bg-white px-3 py-1.5 font-medium disabled:opacity-40">Next</button>
          </div>
        </div>
      )}

      {/* Add / edit */}
      <Modal open={Boolean(form)} title={form?.user ? `Edit ${form.user.name}` : `Add ${noun}`} onClose={() => setForm(null)}>
        {form && (
          <UserForm
            key={form.user?._id || 'new'}
            user={form.user}
            fixedRole={driversOnly || !isAdmin ? 'driver' : undefined}
            roleLocked={driversOnly || !isAdmin || form.user?._id === me._id}
            onSubmit={handleSave}
            onCancel={() => setForm(null)}
          />
        )}
      </Modal>

      <ResetPasswordModal key={resetFor?._id} user={resetFor} onSubmit={handleReset} onClose={() => setResetFor(null)} />

      <ConfirmModal
        open={Boolean(toggleFor)}
        title={toggleFor?.isActive ? `Deactivate ${toggleFor?.name}` : `Activate ${toggleFor?.name}`}
        confirmLabel={toggleFor?.isActive ? 'Deactivate' : 'Activate'}
        danger={toggleFor?.isActive}
        onConfirm={handleToggle}
        onClose={() => setToggleFor(null)}
      >
        {toggleFor?.isActive ? (
          <>
            <p>They will be signed out and will not be able to sign in until you activate the account again.</p>
            {toggleFor.assignedVehicle && <p className="font-medium">They will also be removed from vehicle {toggleFor.assignedVehicle.regNo}.</p>}
          </>
        ) : (
          <p>They will be able to sign in again with their current password.</p>
        )}
      </ConfirmModal>

      <ConfirmModal
        open={Boolean(deleteFor)}
        title={`Delete ${deleteFor?.name}`}
        confirmLabel="Delete permanently"
        danger
        onConfirm={handleDelete}
        onClose={() => setDeleteFor(null)}
      >
        <p>This permanently removes the account and cannot be undone. To keep their history, deactivate the account instead.</p>
        {deleteFor?.assignedVehicle && <p className="font-medium">They will also be removed from vehicle {deleteFor.assignedVehicle.regNo}.</p>}
      </ConfirmModal>

      <CredentialsModal credentials={credentials} onClose={() => setCredentials(null)} />
    </div>
  );
}
