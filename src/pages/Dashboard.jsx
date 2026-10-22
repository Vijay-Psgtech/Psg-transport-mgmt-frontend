import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useVehicles } from '../context/VehicleContext';
import { MANAGER_ROLES, ROLE_LABELS, VEHICLE_TYPES, labelOf } from '../utils/constants';

function Figure({ value, label, tone = '' }) {
  return (
    <div className="border-l-4 border-signal bg-white px-4 py-3">
      <p className={`font-display text-4xl font-bold ${tone}`}>{value ?? '-'}</p>
      <p className="text-sm text-slate-600">{label}</p>
    </div>
  );
}

export default function Dashboard() {
  const { user, hasRole } = useAuth();
  const { stats, fetchStats } = useVehicles();
  const isManager = hasRole(MANAGER_ROLES);

  useEffect(() => {
    if (isManager) fetchStats();
  }, [isManager, fetchStats]);

  return (
    <div>
      <h1 className="font-display text-3xl font-bold">Welcome, {user.name.split(' ')[0]}</h1>
      <p className="mt-1 text-slate-600">Signed in as {ROLE_LABELS[user.role].toLowerCase()}.</p>

      {isManager ? (
        <>
          <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-label="Fleet summary">
            <Figure value={stats?.total} label="Vehicles in the fleet" />
            <Figure value={stats?.byStatus?.active ?? 0} label="Active" />
            <Figure value={stats?.byStatus?.maintenance ?? 0} label="In maintenance" />
            <Figure
              value={stats?.docsDue ?? 0}
              label="With documents expired or due within 30 days"
              tone={stats?.docsDue ? 'text-red-700' : ''}
            />
          </section>

          <section className="mt-8 rounded-lg border border-line bg-white p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl font-bold">Fleet by type</h2>
              <Link to="/vehicles" className="text-sm font-medium underline underline-offset-4 hover:text-signal-dark">
                Manage vehicles
              </Link>
            </div>
            {stats && Object.keys(stats.byType).length ? (
              <ul className="mt-3 divide-y divide-line">
                {VEHICLE_TYPES.filter((t) => stats.byType[t.value]).map((t) => (
                  <li key={t.value} className="flex justify-between py-2 text-sm">
                    <span>{labelOf(VEHICLE_TYPES, t.value)}</span>
                    <span className="font-medium">{stats.byType[t.value]}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-slate-600">
                No vehicles yet. <Link to="/vehicles" className="underline">Add the first vehicle</Link> to get started.
              </p>
            )}
          </section>
        </>
      ) : (
        <p className="mt-8 max-w-xl rounded-lg border border-line bg-white p-5 text-slate-700">
          Transport registration, bus tracking and fee payment will appear here as they are released.
        </p>
      )}
    </div>
  );
}
