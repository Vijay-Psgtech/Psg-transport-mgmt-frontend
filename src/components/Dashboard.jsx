import { useEffect, useMemo, useState } from 'react'
import { BusFront, CarFront, ChevronDown, CircleUserRound, LogOut, Plus, Search, SlidersHorizontal, Trash2, Truck, Wrench } from 'lucide-react'
import { api } from '../services/api.js'
import { useAuth } from '../context/AuthContext.jsx'
import VehicleModal from './VehicleModal.jsx'

const statusStyle = {
  active: 'bg-emerald-50 text-emerald-700 ring-emerald-600/15',
  maintenance: 'bg-amber-50 text-amber-700 ring-amber-600/15',
  inactive: 'bg-slate-100 text-slate-600 ring-slate-500/10',
}

function StatCard({ title, value, detail, icon: Icon, tint }) {
  return (
    <article className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm shadow-slate-200/30">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">{value}</p>
          <p className="mt-2 text-xs text-slate-400">{detail}</p>
        </div>
        <span className={`grid h-10 w-10 place-items-center rounded-xl ${tint}`}><Icon size={19} /></span>
      </div>
    </article>
  )
}

export default function Dashboard() {
  const { user, logout, canManageVehicles } = useAuth()
  const [vehicles, setVehicles] = useState([])
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [modalVehicle, setModalVehicle] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [reloadCount, setReloadCount] = useState(0)
  const [saving, setSaving] = useState(false)
  const [pageError, setPageError] = useState('')
  const [notice, setNotice] = useState('')

  useEffect(() => {
    let active = true
    async function loadVehicles() {
      try {
        const { data } = await api.get('/vehicles')
        if (active) {
          setVehicles(data.vehicles)
          setPageError('')
        }
      } catch (error) {
        if (active) setPageError(error.response?.data?.message || 'Unable to load vehicles. Please refresh to try again.')
      } finally {
        if (active) setLoading(false)
      }
    }
    loadVehicles()
    return () => {
      active = false
    }
  }, [reloadCount])

  useEffect(() => {
    if (!notice) return undefined
    const timeout = window.setTimeout(() => setNotice(''), 3500)
    return () => window.clearTimeout(timeout)
  }, [notice])

  const filteredVehicles = useMemo(() => {
    const query = search.trim().toLowerCase()
    return vehicles.filter((vehicle) => {
      const matchesStatus = filter === 'all' || vehicle.status === filter
      const matchesQuery = !query || [
        vehicle.registrationNumber, vehicle.make, vehicle.model, vehicle.type, vehicle.assignedDriver,
      ].some((value) => value?.toLowerCase().includes(query))
      return matchesStatus && matchesQuery
    })
  }, [vehicles, search, filter])

  const stats = useMemo(() => ({
    total: vehicles.length,
    active: vehicles.filter((vehicle) => vehicle.status === 'active').length,
    maintenance: vehicles.filter((vehicle) => vehicle.status === 'maintenance').length,
    buses: vehicles.filter((vehicle) => vehicle.type === 'bus').length,
  }), [vehicles])

  function openCreate() {
    setModalVehicle(null)
    setModalOpen(true)
  }

  function openEdit(vehicle) {
    setModalVehicle(vehicle)
    setModalOpen(true)
  }

  function retryLoadingVehicles() {
    setPageError('')
    setLoading(true)
    setReloadCount((count) => count + 1)
  }

  async function saveVehicle(vehicleData) {
    setSaving(true)
    try {
      if (modalVehicle) {
        const { data } = await api.patch(`/vehicles/${modalVehicle._id}`, vehicleData)
        setVehicles((current) => current.map((vehicle) => vehicle._id === data.vehicle._id ? data.vehicle : vehicle))
        setNotice('Vehicle details updated.')
      } else {
        const { data } = await api.post('/vehicles', vehicleData)
        setVehicles((current) => [data.vehicle, ...current])
        setNotice('Vehicle added to your fleet.')
      }
      setModalOpen(false)
    } finally {
      setSaving(false)
    }
  }

  async function deleteVehicle(vehicle) {
    const confirmed = window.confirm(`Remove ${vehicle.registrationNumber} from your fleet? This cannot be undone.`)
    if (!confirmed) return
    try {
      await api.delete(`/vehicles/${vehicle._id}`)
      setVehicles((current) => current.filter((item) => item._id !== vehicle._id))
      setNotice('Vehicle removed.')
    } catch (error) {
      setPageError(error.response?.data?.message || 'Could not remove this vehicle.')
    }
  }

  return (
    <div className="min-h-screen bg-[#f5f7fb]">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-[248px] flex-col border-r border-slate-200 bg-white lg:flex">
        <div className="flex h-[76px] items-center gap-3 border-b border-slate-100 px-6">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-700 text-white"><BusFront size={21} /></span>
          <span className="text-sm font-bold tracking-[0.12em] text-slate-800">PSG TRANSPORT</span>
        </div>
        <div className="px-4 pt-8">
          <p className="px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Workspace</p>
          <div className="mt-3 flex items-center gap-3 rounded-lg bg-blue-50 px-3 py-3 text-sm font-semibold text-blue-800">
            <Truck size={18} />
            Fleet overview
          </div>
        </div>
        <div className="mt-auto border-t border-slate-100 p-4">
          <div className="flex items-center gap-3 px-2 py-2">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-slate-100 text-slate-600"><CircleUserRound size={21} /></span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-slate-800">{user.name}</p>
              <p className="text-xs capitalize text-slate-500">{user.role}</p>
            </div>
          </div>
          <button onClick={() => logout().catch((error) => setPageError(error.response?.data?.message || 'Could not complete sign out. Please try again.'))} className="mt-2 flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900">
            <LogOut size={17} /> Sign out
          </button>
        </div>
      </aside>

      <div className="lg:pl-[248px]">
        <header className="sticky top-0 z-10 flex h-[68px] items-center justify-between border-b border-slate-200 bg-white/95 px-5 backdrop-blur sm:px-8">
          <div className="flex items-center gap-3 lg:hidden">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-blue-700 text-white"><BusFront size={19} /></span>
            <span className="text-xs font-bold tracking-[0.1em] text-slate-800">PSG TRANSPORT</span>
          </div>
          <div className="hidden text-sm text-slate-500 lg:block">Transport operations <span className="mx-2 text-slate-300">/</span> <span className="font-medium text-slate-800">Fleet</span></div>
          <div className="flex items-center gap-3">
            <span className="hidden text-right sm:block">
              <span className="block text-sm font-semibold text-slate-800">{user.name}</span>
              <span className="block text-xs capitalize text-slate-500">{user.role}</span>
            </span>
            <button onClick={() => logout().catch((error) => setPageError(error.response?.data?.message || 'Could not complete sign out. Please try again.'))} aria-label="Sign out" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden"><LogOut size={18} /></button>
          </div>
        </header>

        <main className="mx-auto max-w-[1440px] px-5 py-8 sm:px-8 lg:px-10">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="text-sm font-medium text-blue-700">Fleet management</p>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900 sm:text-[28px]">Vehicle overview</h1>
              <p className="mt-2 text-sm text-slate-500">Manage your vehicles and keep your fleet information up to date.</p>
            </div>
            {canManageVehicles && (
              <button onClick={openCreate} className="inline-flex h-10 items-center justify-center gap-2 self-start rounded-lg bg-blue-700 px-4 text-sm font-semibold text-white shadow-sm hover:bg-blue-800 sm:self-auto">
                <Plus size={17} /> Add vehicle
              </button>
            )}
          </div>

          {pageError && <div role="alert" className="mt-6 flex items-center justify-between rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{pageError}<button onClick={retryLoadingVehicles} className="ml-4 font-semibold underline">Retry</button></div>}
          {notice && <div role="status" className="fixed right-5 top-20 z-40 rounded-lg border border-emerald-200 bg-white px-4 py-3 text-sm font-medium text-emerald-800 shadow-lg">{notice}</div>}

          <section aria-label="Fleet statistics" className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard title="Total vehicles" value={stats.total} detail="Registered in your fleet" icon={Truck} tint="bg-blue-50 text-blue-700" />
            <StatCard title="Active vehicles" value={stats.active} detail="Ready for operation" icon={BusFront} tint="bg-emerald-50 text-emerald-700" />
            <StatCard title="In maintenance" value={stats.maintenance} detail="Currently unavailable" icon={Wrench} tint="bg-amber-50 text-amber-700" />
            <StatCard title="Buses" value={stats.buses} detail={`${stats.total - stats.buses} cars and other vehicles`} icon={CarFront} tint="bg-violet-50 text-violet-700" />
          </section>

          <section className="mt-7 overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm shadow-slate-200/30">
            <div className="flex flex-col gap-4 border-b border-slate-100 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <div>
                <h2 className="text-base font-semibold text-slate-900">All vehicles</h2>
                <p className="mt-1 text-xs text-slate-500">{filteredVehicles.length} {filteredVehicles.length === 1 ? 'vehicle' : 'vehicles'} shown</p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <label className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input aria-label="Search vehicles" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search vehicles…" className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm outline-none focus:border-blue-500 sm:w-56" />
                </label>
                <label className="relative">
                  <SlidersHorizontal size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <select aria-label="Filter by status" value={filter} onChange={(event) => setFilter(event.target.value)} className="h-10 w-full appearance-none rounded-lg border border-slate-200 bg-white pl-9 pr-9 text-sm capitalize outline-none focus:border-blue-500 sm:w-40">
                    <option value="all">All statuses</option>
                    <option value="active">Active</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="inactive">Inactive</option>
                  </select>
                  <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                </label>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[780px] text-left">
                <thead className="bg-slate-50/80">
                  <tr className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    <th className="px-6 py-3.5">Vehicle</th>
                    <th className="px-4 py-3.5">Type</th>
                    <th className="px-4 py-3.5">Capacity</th>
                    <th className="px-4 py-3.5">Driver</th>
                    <th className="px-4 py-3.5">Status</th>
                    {canManageVehicles && <th className="px-5 py-3.5"><span className="sr-only">Actions</span></th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr><td colSpan={canManageVehicles ? 6 : 5} className="px-6 py-16 text-center text-sm text-slate-500">Loading vehicles…</td></tr>
                  ) : filteredVehicles.length === 0 ? (
                    <tr><td colSpan={canManageVehicles ? 6 : 5} className="px-6 py-16 text-center">
                      <span className="mx-auto grid h-11 w-11 place-items-center rounded-full bg-slate-100 text-slate-500"><Truck size={20} /></span>
                      <p className="mt-3 text-sm font-semibold text-slate-800">{vehicles.length ? 'No matching vehicles' : 'Your fleet is ready to get started'}</p>
                      <p className="mt-1 text-sm text-slate-500">{vehicles.length ? 'Try adjusting your search or status filter.' : canManageVehicles ? 'Add your first bus or car to start managing your fleet.' : 'No vehicles have been added yet.'}</p>
                      {!vehicles.length && canManageVehicles && <button onClick={openCreate} className="mt-4 text-sm font-semibold text-blue-700 hover:text-blue-800">Add your first vehicle</button>}
                    </td></tr>
                  ) : filteredVehicles.map((vehicle) => (
                    <tr key={vehicle._id} className="transition hover:bg-slate-50/70">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-600">{vehicle.type === 'bus' ? <BusFront size={18} /> : <CarFront size={18} />}</span>
                          <span>
                            <span className="block text-sm font-semibold text-slate-800">{vehicle.registrationNumber}</span>
                            <span className="mt-0.5 block text-xs text-slate-500">{vehicle.make} {vehicle.model} · {vehicle.year}</span>
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm capitalize text-slate-600">{vehicle.type}</td>
                      <td className="px-4 py-4 text-sm text-slate-600">{vehicle.capacity} seats</td>
                      <td className="px-4 py-4 text-sm text-slate-600">{vehicle.assignedDriver || <span className="text-slate-400">Unassigned</span>}</td>
                      <td className="px-4 py-4"><span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium capitalize ring-1 ring-inset ${statusStyle[vehicle.status] || statusStyle.inactive}`}>{vehicle.status}</span></td>
                      {canManageVehicles && <td className="px-5 py-4 text-right">
                        <div className="inline-flex items-center gap-1">
                          <button onClick={() => openEdit(vehicle)} className="rounded-md px-2 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-50">Edit</button>
                          <button onClick={() => deleteVehicle(vehicle)} aria-label={`Delete ${vehicle.registrationNumber}`} className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"><Trash2 size={16} /></button>
                        </div>
                      </td>}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3.5 text-xs text-slate-500 sm:px-6">
              <span>Showing {filteredVehicles.length} of {vehicles.length}</span>
              <span className="capitalize">Signed in as {user.role}</span>
            </div>
          </section>
        </main>
      </div>

      {modalOpen && <VehicleModal vehicle={modalVehicle} onClose={() => setModalOpen(false)} onSave={saveVehicle} saving={saving} />}
    </div>
  )
}
