import { useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useReports } from '../context/ReportContext';
import ChartCard, { summarise } from '../components/charts/ChartCard';
import DonutChart from '../components/charts/DonutChart';
import BarsChart from '../components/charts/BarsChart';
import StackedBars from '../components/charts/StackedBars';
import { CLASS_COLORS, COLORS, FUEL_COLOR, STATUS_COLORS, TYPE_COLORS } from '../components/charts/palette';
import KpiCard from '../components/dashboard/KpiCard';
import AttentionList from '../components/dashboard/AttentionList';
import Icon from '../components/dashboard/Icon';
import {
  DOCUMENT_SHORT, DOCUMENT_TYPES, FUEL_TYPES, MANAGER_ROLES, ROLES, ROLE_LABELS, VEHICLE_STATUSES, VEHICLE_TYPES, labelOf,
} from '../utils/constants';

const DOC_SERIES = [
  { key: 'expired', label: 'Expired', color: COLORS.red },
  { key: 'due30', label: 'Due within 30 days', color: COLORS.amber },
  { key: 'due90', label: 'Due in 31 to 90 days', color: COLORS.paleAmber },
  { key: 'valid', label: 'Valid beyond 90 days', color: COLORS.green },
];

const grid = 'grid gap-4 @2xl:grid-cols-2 @5xl:grid-cols-3';

function Section({ title, description, children }) {
  return (
    <section className="mt-9" aria-label={title}>
      <div className="mb-3">
        <h2 className="font-display text-xl font-bold">{title}</h2>
        {description && <p className="text-sm text-slate-600">{description}</p>}
      </div>
      {children}
    </section>
  );
}

function Skeleton() {
  return (
    <div className="mt-6 animate-pulse" role="status" aria-label="Loading dashboard">
      <div className="grid grid-cols-2 gap-3 @2xl:grid-cols-3 @6xl:grid-cols-6">
        {Array.from({ length: 6 }, (_, i) => <div key={i} className="h-24 rounded-xl bg-white" />)}
      </div>
      <div className={`${grid} mt-8`}>
        {Array.from({ length: 6 }, (_, i) => <div key={i} className="h-72 rounded-xl bg-white" />)}
      </div>
    </div>
  );
}

function ManagerDashboard() {
  const { hasRole } = useAuth();
  const { report, loading, error } = useReports();
  const isAdmin = hasRole(ROLES.ADMIN);

  // Shape the API response into chart-ready arrays once per report
  const charts = useMemo(() => {
    if (!report) return null;
    const { vehicles: v, drivers: d, users } = report;
    const num = (obj, key) => obj?.[key] || 0;

    const docRows = DOCUMENT_TYPES.map((t) => ({ name: DOCUMENT_SHORT[t.value], ...Object.fromEntries(DOC_SERIES.map((s) => [s.key, num(v.docs[t.value], s.key)])) }))
      .filter((r) => DOC_SERIES.some((s) => r[s.key] > 0));

    return {
      type: VEHICLE_TYPES.map((t) => ({ name: t.label, value: num(v.byType, t.value), color: TYPE_COLORS[t.value] })),
      status: VEHICLE_STATUSES.map((s) => ({ name: s.label, value: num(v.byStatus, s.value), color: STATUS_COLORS[s.value] })),
      fuel: FUEL_TYPES.map((f) => ({ name: f.label, value: num(v.byFuel, f.value) })).filter((f) => f.value > 0),
      seats: VEHICLE_TYPES.map((t) => ({ name: t.label, value: num(v.seatsByType, t.value), color: TYPE_COLORS[t.value] })).filter((s) => s.value > 0),
      age: v.ageBuckets.map((b) => ({ name: b.label, value: b.count })),
      vehicleAssign: [
        { name: 'With a driver', value: v.assigned, color: COLORS.green },
        { name: 'No driver assigned', value: v.unassigned, color: COLORS.slate },
      ],
      docRows,
      licence: [
        { name: 'Expired', value: d.licence.expired, color: COLORS.red },
        { name: 'Due within 30 days', value: d.licence.due30, color: COLORS.amber },
        { name: 'Due in 31 to 90 days', value: d.licence.due90, color: COLORS.paleAmber },
        { name: 'Valid beyond 90 days', value: d.licence.valid, color: COLORS.green },
        ...(d.licence.unknown ? [{ name: 'No expiry recorded', value: d.licence.unknown, color: COLORS.slate }] : []),
      ],
      driverAssign: [
        { name: 'On a vehicle', value: d.assigned, color: COLORS.asphalt },
        { name: 'Available', value: d.available, color: COLORS.signal },
      ],
      classes: Object.entries(d.byClass).map(([k, value]) => ({
        name: k === 'unknown' ? 'Not recorded' : k, value, color: CLASS_COLORS[k] || COLORS.slate,
      })),
      experience: d.experience.map((e) => ({ name: e.label === 'unknown' ? 'Not recorded' : e.label, value: e.count })),
      roles: users ? Object.entries(users.byRole).map(([k, value]) => ({ name: ROLE_LABELS[k] || k, value })).sort((a, b) => b.value - a.value) : [],
    };
  }, [report]);

  if (error && !report) {
    return <div role="alert" className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</div>;
  }
  if (!report || !charts) return <Skeleton />;

  const { vehicles: v, drivers: d, users, attention } = report;
  const noVehicles = v.total === 0;
  const noDrivers = d.active === 0;

  return (
    <>
      <section className="mt-6 grid grid-cols-2 gap-3 @2xl:grid-cols-3 @6xl:grid-cols-6" aria-label="Key figures">
        <KpiCard label="Vehicles" value={v.total} hint={`${v.active} active`} icon="bus" to="/vehicles" />
        <KpiCard label="Seat capacity" value={v.activeSeats} hint="active vehicles" icon="seat" to="/vehicles" />
        <KpiCard label="Active drivers" value={d.active} hint={`${d.available} available`} icon="driver" to="/drivers" />
        <KpiCard label="Vehicles without a driver" value={v.unassigned} icon="link" to="/vehicles" alert={v.total > 0} />
        <KpiCard label="Vehicle documents due" value={v.docsDue} hint="in the next 30 days" icon="doc" to="/vehicles" alert />
        <KpiCard label="Licences due" value={d.licenceDue} hint="in the next 30 days" icon="licence" to="/drivers" alert />
      </section>

      <Section title="Fleet" description="What the institution runs, and how it is used.">
        <div className={grid}>
          <ChartCard title="Fleet by type" subtitle="All vehicles" empty={noVehicles} emptyText="Add vehicles to see the fleet mix." summary={summarise(charts.type)}>
            <DonutChart data={charts.type} centerLabel="vehicles" />
          </ChartCard>
          <ChartCard title="Vehicle status" subtitle="Ready, in the workshop or retired" empty={noVehicles} summary={summarise(charts.status)}>
            <DonutChart data={charts.status} centerLabel="vehicles" />
          </ChartCard>
          <ChartCard title="Driver coverage" subtitle="Vehicles with and without an assigned driver" empty={noVehicles} summary={summarise(charts.vehicleAssign)}>
            <DonutChart data={charts.vehicleAssign} centerLabel="vehicles" />
          </ChartCard>
          <ChartCard title="Seats by vehicle type" subtitle="Active vehicles only" empty={!charts.seats.length} summary={summarise(charts.seats)}>
            <BarsChart data={charts.seats} valueLabel="Seats" />
          </ChartCard>
          <ChartCard title="Fleet age" subtitle="Vehicles by years since manufacture" empty={!charts.age.some((a) => a.value)} emptyText="Add the year of manufacture to vehicles to see their age." summary={summarise(charts.age)}>
            <BarsChart data={charts.age} color={COLORS.blue} valueLabel="Vehicles" />
          </ChartCard>
          <ChartCard title="Fuel type" subtitle="Vehicles by fuel" empty={!charts.fuel.length} summary={summarise(charts.fuel)}>
            <BarsChart data={charts.fuel} horizontal color={FUEL_COLOR} valueLabel="Vehicles" />
          </ChartCard>
        </div>
      </Section>

      <Section title="Compliance" description="Documents and licences that are expired or about to expire.">
        <div className={grid}>
          <ChartCard
            title="Vehicle documents by expiry"
            subtitle="Each bar is one document type"
            className="@5xl:col-span-2"
            empty={!charts.docRows.length}
            emptyText="No vehicle documents recorded yet. Add insurance, fitness, permit and PUC dates on each vehicle."
            summary={charts.docRows.map((r) => `${r.name}: ${DOC_SERIES.map((s) => `${r[s.key]} ${s.label.toLowerCase()}`).join(', ')}`).join('. ')}
          >
            <StackedBars rows={charts.docRows} series={DOC_SERIES} />
          </ChartCard>
          <ChartCard title="Needs attention" subtitle="Expired or due within 30 days, soonest first">
            <AttentionList items={attention} />
          </ChartCard>
        </div>
      </Section>

      <Section title="Drivers" description="Licence validity, availability and experience of active drivers.">
        <div className={grid}>
          <ChartCard title="Licence status" subtitle="Active drivers" empty={noDrivers} emptyText="Add drivers to see licence status." summary={summarise(charts.licence)}>
            <DonutChart data={charts.licence} centerLabel="drivers" />
          </ChartCard>
          <ChartCard title="Driver availability" subtitle="On a vehicle or free to assign" empty={noDrivers} summary={summarise(charts.driverAssign)}>
            <DonutChart data={charts.driverAssign} centerLabel="drivers" />
          </ChartCard>
          <ChartCard title="Licence class" subtitle="Active drivers" empty={!charts.classes.length} summary={summarise(charts.classes)}>
            <DonutChart data={charts.classes} centerLabel="drivers" />
          </ChartCard>
          <ChartCard
            title="Driver experience"
            subtitle="Active drivers by years of experience"
            className={isAdmin ? '@5xl:col-span-2' : '@5xl:col-span-3'}
            empty={!charts.experience.some((e) => e.value)}
            emptyText="Add years of experience to drivers to see this chart."
            summary={summarise(charts.experience)}
          >
            <BarsChart data={charts.experience} color={COLORS.asphalt} valueLabel="Drivers" />
          </ChartCard>
          {isAdmin && users && (
            <ChartCard title="User accounts by role" subtitle={`${users.active} active of ${users.total} accounts`} className="@2xl:col-span-2 @5xl:col-span-1" summary={summarise(charts.roles)}>
              <BarsChart data={charts.roles} horizontal color={COLORS.sage} valueLabel="Accounts" />
            </ChartCard>
          )}
        </div>
      </Section>
    </>
  );
}

export default function Dashboard() {
  const { user, hasRole } = useAuth();
  const { report, loading, fetchReport } = useReports();
  const isManager = hasRole(MANAGER_ROLES);

  useEffect(() => {
    if (isManager) fetchReport();
  }, [isManager, fetchReport]);

  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });
  const alerts = report ? report.vehicles.docsDue + report.drivers.licenceDue : 0;

  return (
    <div className="@container">
      {/* Banner: asphalt with the painted centre line along the bottom edge */}
      <header className="relative overflow-hidden rounded-xl bg-asphalt px-5 pb-7 pt-5 text-white sm:px-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm text-slate-300">{today}</p>
            <h1 className="mt-1 font-display text-3xl font-bold leading-tight sm:text-4xl">Welcome, {user.name.split(' ')[0]}</h1>
            <p className="mt-1 text-sm text-slate-300">
              {isManager
                ? report
                  ? alerts > 0
                    ? `${alerts} ${alerts === 1 ? 'item needs' : 'items need'} attention in the next 30 days.`
                    : 'Everything is in order for the next 30 days.'
                  : 'Loading the latest figures...'
                : `Signed in as ${ROLE_LABELS[user.role].toLowerCase()}.`}
            </p>
          </div>
          {isManager && (
            <div className="flex items-center gap-3 text-xs text-slate-300">
              {report && <span>Updated {new Date(report.generatedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>}
              <button
                onClick={fetchReport}
                disabled={loading}
                className="flex items-center gap-2 rounded-md border border-slate-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-asphalt-soft focus:outline-none focus-visible:ring-2 focus-visible:ring-signal disabled:opacity-60"
              >
                <Icon name="refresh" className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                {loading ? 'Refreshing' : 'Refresh'}
              </button>
            </div>
          )}
        </div>
        <div className="road-line-h absolute inset-x-0 bottom-2.5 h-1 opacity-90" aria-hidden="true" />
      </header>

      {isManager ? (
        <ManagerDashboard />
      ) : (
        <p className="mt-8 max-w-xl rounded-lg border border-line bg-white p-5 text-slate-700">
          Transport registration, bus tracking and fee payment will appear here as they are released.
        </p>
      )}
    </div>
  );
}
