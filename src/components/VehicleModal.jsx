import { useEffect, useState } from 'react'
import { X } from 'lucide-react'

const EMPTY_VEHICLE = {
  type: 'bus',
  registrationNumber: '',
  make: '',
  model: '',
  year: new Date().getFullYear(),
  capacity: '',
  fuelType: 'diesel',
  status: 'active',
  assignedDriver: '',
  notes: '',
}

const inputClass = 'mt-1.5 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10'

export default function VehicleModal({ vehicle, onClose, onSave, saving }) {
  const [form, setForm] = useState({ ...EMPTY_VEHICLE, ...(vehicle || {}) })
  const [error, setError] = useState('')

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === 'Escape' && !saving) onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose, saving])

  function updateField(event) {
    const { name, value } = event.target
    setForm((current) => ({
      ...current,
      [name]: value,
    }))
  }

  async function submit(event) {
    event.preventDefault()
    setError('')
    try {
      await onSave({
        ...form,
        year: Number(form.year),
        capacity: Number(form.capacity),
      })
    } catch (saveError) {
      setError(saveError.response?.data?.message || 'Could not save this vehicle.')
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/50 p-0 sm:items-center sm:p-5"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !saving) onClose()
      }}
    >
      <section role="dialog" aria-modal="true" aria-labelledby="vehicle-modal-title" className="max-h-[95vh] w-full max-w-2xl overflow-y-auto rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl">
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white px-6 py-5">
          <div>
            <h2 id="vehicle-modal-title" className="text-lg font-semibold text-slate-900">{vehicle ? 'Edit vehicle' : 'Add a vehicle'}</h2>
            <p className="mt-1 text-sm text-slate-500">Enter the vehicle details below.</p>
          </div>
          <button type="button" onClick={onClose} disabled={saving} aria-label="Close dialog" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-50">
            <X size={19} />
          </button>
        </header>

        <form onSubmit={submit} className="space-y-5 px-6 py-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-medium text-slate-700">
              Vehicle type
              <select className={inputClass} name="type" value={form.type} onChange={updateField}>
                <option value="bus">Bus</option>
                <option value="car">Car</option>
              </select>
            </label>
            <label className="text-sm font-medium text-slate-700">
              Registration number
              <input className={inputClass} name="registrationNumber" value={form.registrationNumber} onChange={updateField} placeholder="e.g. TN 01 AB 1234" required maxLength={20} />
            </label>
            <label className="text-sm font-medium text-slate-700">
              Make
              <input className={inputClass} name="make" value={form.make} onChange={updateField} placeholder="e.g. Tata" required maxLength={50} />
            </label>
            <label className="text-sm font-medium text-slate-700">
              Model
              <input className={inputClass} name="model" value={form.model} onChange={updateField} placeholder="e.g. Starbus" required maxLength={50} />
            </label>
            <label className="text-sm font-medium text-slate-700">
              Model year
              <input className={inputClass} name="year" type="number" min="1950" max={new Date().getFullYear() + 1} value={form.year} onChange={updateField} required />
            </label>
            <label className="text-sm font-medium text-slate-700">
              Seating capacity
              <input className={inputClass} name="capacity" type="number" min="1" max="1000" value={form.capacity} onChange={updateField} required />
            </label>
            <label className="text-sm font-medium text-slate-700">
              Fuel type
              <select className={inputClass} name="fuelType" value={form.fuelType} onChange={updateField}>
                {['diesel', 'petrol', 'electric', 'hybrid', 'cng', 'other'].map((fuel) => <option key={fuel} value={fuel}>{fuel.toUpperCase() === 'CNG' ? 'CNG' : fuel[0].toUpperCase() + fuel.slice(1)}</option>)}
              </select>
            </label>
            <label className="text-sm font-medium text-slate-700">
              Status
              <select className={inputClass} name="status" value={form.status} onChange={updateField}>
                <option value="active">Active</option>
                <option value="maintenance">Maintenance</option>
                <option value="inactive">Inactive</option>
              </select>
            </label>
            <label className="text-sm font-medium text-slate-700 sm:col-span-2">
              Assigned driver <span className="font-normal text-slate-400">(optional)</span>
              <input className={inputClass} name="assignedDriver" value={form.assignedDriver} onChange={updateField} placeholder="Driver name" maxLength={100} />
            </label>
            <label className="text-sm font-medium text-slate-700 sm:col-span-2">
              Notes <span className="font-normal text-slate-400">(optional)</span>
              <textarea className="mt-1.5 min-h-20 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10" name="notes" value={form.notes} onChange={updateField} placeholder="Additional vehicle information" maxLength={500} />
            </label>
          </div>
          {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
          <footer className="flex justify-end gap-3 border-t border-slate-100 pt-4">
            <button type="button" disabled={saving} onClick={onClose} className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50">Cancel</button>
            <button type="submit" disabled={saving} className="rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-60">{saving ? 'Saving…' : vehicle ? 'Save changes' : 'Add vehicle'}</button>
          </footer>
        </form>
      </section>
    </div>
  )
}
