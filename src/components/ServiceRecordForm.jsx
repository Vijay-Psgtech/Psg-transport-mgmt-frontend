import { useEffect, useState } from 'react';
import Field, { inputCls } from './Field';
import api from '../api/axios';
import { getErrorMessage, toDateInput } from '../utils/helpers';

const TYPES = [
  ['routine', 'Routine service'],
  ['oil_change', 'Oil change'],
  ['repair', 'Repair'],
  ['inspection', 'Inspection'],
  ['tyres', 'Tyres'],
  ['battery', 'Battery'],
  ['other', 'Other'],
];
const STATUSES = [
  ['completed', 'Completed'],
  ['scheduled', 'Scheduled'],
  ['in_progress', 'In progress'],
  ['cancelled', 'Cancelled'],
];

const blankForm = () => ({
  vehicle: '',
  serviceType: 'routine',
  status: 'completed',
  serviceDate: toDateInput(new Date()),
  odometer: '',
  provider: '',
  workDescription: '',
  cost: '0',
  nextServiceDate: '',
  nextServiceOdometer: '',
  notes: '',
});

function formFromRecord(record) {
  if (!record) return blankForm();
  return {
    vehicle: record.vehicle?._id || record.vehicle || '',
    serviceType: record.serviceType,
    status: record.status,
    serviceDate: toDateInput(record.serviceDate),
    odometer: String(record.odometer ?? ''),
    provider: record.provider ?? '',
    workDescription: record.workDescription ?? '',
    cost: String(record.cost ?? 0),
    nextServiceDate: toDateInput(record.nextServiceDate),
    nextServiceOdometer: record.nextServiceOdometer == null ? '' : String(record.nextServiceOdometer),
    notes: record.notes ?? '',
  };
}

function validate(form) {
  const errors = {};
  if (!form.vehicle) errors.vehicle = 'Choose a vehicle.';
  if (!form.serviceDate) errors.serviceDate = 'Choose the service date.';
  if (form.odometer === '' || !Number.isFinite(Number(form.odometer)) || Number(form.odometer) < 0) {
    errors.odometer = 'Enter a valid, non-negative odometer reading.';
  }
  if (!form.workDescription.trim()) errors.workDescription = 'Describe the work performed or planned.';
  if (form.workDescription.length > 2000) errors.workDescription = 'Use 2,000 characters or fewer.';
  if (form.provider.length > 120) errors.provider = 'Use 120 characters or fewer.';
  if (form.cost === '' || !Number.isFinite(Number(form.cost)) || Number(form.cost) < 0) {
    errors.cost = 'Enter a valid, non-negative cost.';
  }
  if (form.nextServiceOdometer !== '' && (!Number.isFinite(Number(form.nextServiceOdometer)) || Number(form.nextServiceOdometer) < 0)) {
    errors.nextServiceOdometer = 'Enter a valid, non-negative odometer reading.';
  }
  if (form.notes.length > 1000) errors.notes = 'Use 1,000 characters or fewer.';
  if (form.nextServiceDate && form.serviceDate && form.nextServiceDate < form.serviceDate) {
    errors.nextServiceDate = 'Next service date must be on or after this service date.';
  }
  return errors;
}

export default function ServiceRecordForm({ record, onSubmit, onCancel }) {
  const [form, setForm] = useState(() => formFromRecord(record));
  const [vehicleQuery, setVehicleQuery] = useState(() => {
    const vehicle = record?.vehicle;
    return vehicle && typeof vehicle === 'object'
      ? `${vehicle.regNo} · ${vehicle.make} ${vehicle.model}`.trim()
      : '';
  });
  const [vehicleResults, setVehicleResults] = useState([]);
  const [vehicleSearchError, setVehicleSearchError] = useState('');
  const [searchingVehicles, setSearchingVehicles] = useState(false);
  const [vehicleListOpen, setVehicleListOpen] = useState(false);
  const [activeVehicleIndex, setActiveVehicleIndex] = useState(-1);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const search = vehicleQuery.trim();
    if (search.length < 2 || form.vehicle) {
      setVehicleResults([]);
      setVehicleSearchError('');
      setSearchingVehicles(false);
      return undefined;
    }

    let active = true;
    setVehicleResults([]);
    setSearchingVehicles(true);
    setVehicleSearchError('');
    const timer = setTimeout(async () => {
      try {
        const { data } = await api.get('/vehicles', {
          params: { search, limit: 10, sortBy: 'regNo', order: 'asc' },
        });
        if (active) setVehicleResults(data.data);
      } catch (error) {
        if (active) setVehicleSearchError(getErrorMessage(error));
      } finally {
        if (active) setSearchingVehicles(false);
      }
    }, 250);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [vehicleQuery, form.vehicle]);

  const update = (name) => (event) => {
    const { value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: undefined }));
  };

  const selectVehicle = (vehicle) => {
    setForm((current) => ({ ...current, vehicle: vehicle._id }));
    setVehicleQuery(`${vehicle.regNo} · ${vehicle.make} ${vehicle.model}`.trim());
    setVehicleResults([]);
    setVehicleListOpen(false);
    setActiveVehicleIndex(-1);
    setErrors((current) => ({ ...current, vehicle: undefined }));
  };

  const handleVehicleKeyDown = (event) => {
    if (event.key === 'ArrowDown' && vehicleResults.length) {
      event.preventDefault();
      setActiveVehicleIndex((current) => (current + 1) % vehicleResults.length);
    } else if (event.key === 'ArrowUp' && vehicleResults.length) {
      event.preventDefault();
      setActiveVehicleIndex((current) => (current <= 0 ? vehicleResults.length - 1 : current - 1));
    } else if (event.key === 'Enter' && vehicleListOpen && activeVehicleIndex >= 0) {
      event.preventDefault();
      selectVehicle(vehicleResults[activeVehicleIndex]);
    } else if (event.key === 'Escape') {
      setVehicleListOpen(false);
    }
  };

  const submit = async (event) => {
    event.preventDefault();
    const validationErrors = validate(form);
    setErrors(validationErrors);
    setServerError('');
    if (Object.keys(validationErrors).length) return;

    setSaving(true);
    try {
      await onSubmit({
        ...form,
        odometer: Number(form.odometer),
        cost: Number(form.cost),
        nextServiceOdometer: form.nextServiceOdometer === '' ? null : Number(form.nextServiceOdometer),
        nextServiceDate: form.nextServiceDate || null,
        provider: form.provider.trim(),
        workDescription: form.workDescription.trim(),
        notes: form.notes.trim(),
      });
    } catch (error) {
      setServerError(getErrorMessage(error));
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} noValidate className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
      <div className="grid gap-4 px-5 py-5 sm:grid-cols-2 overflow-y-auto overflow-x-hidden overscroll-contain">
        {serverError && <p role="alert" className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 sm:col-span-2">{serverError}</p>}

        <Field label="Vehicle" required error={errors.vehicle} hint="Search by registration number, vehicle type, make, or model.">
          <div className="relative">
            <input
              type="search"
              role="combobox"
              aria-autocomplete="list"
              aria-expanded={vehicleListOpen && !form.vehicle}
              aria-controls={vehicleResults.length ? 'service-vehicle-options' : undefined}
              aria-activedescendant={activeVehicleIndex >= 0 ? `service-vehicle-option-${activeVehicleIndex}` : undefined}
              value={vehicleQuery}
              onChange={(event) => {
                setVehicleQuery(event.target.value);
                setForm((current) => ({ ...current, vehicle: '' }));
                setVehicleListOpen(true);
                setActiveVehicleIndex(-1);
                setErrors((current) => ({ ...current, vehicle: undefined }));
              }}
              onFocus={() => setVehicleListOpen(true)}
              onBlur={() => setVehicleListOpen(false)}
              onKeyDown={handleVehicleKeyDown}
              placeholder="Search vehicles..."
              className={inputCls(errors.vehicle)}
            />
            {vehicleListOpen && !form.vehicle && vehicleQuery.trim().length >= 2 && (
              <div className="absolute z-20 mt-1 max-h-60 w-full overflow-y-auto rounded-md border border-line bg-white py-1 shadow-lg">
                {searchingVehicles && <p role="status" className="px-3 py-2 text-sm text-slate-500">Searching vehicles...</p>}
                {vehicleSearchError && <p role="alert" className="px-3 py-2 text-sm text-red-700">{vehicleSearchError}</p>}
                {!searchingVehicles && !vehicleSearchError && vehicleResults.length === 0 && (
                  <p className="px-3 py-2 text-sm text-slate-500">No matching vehicles found.</p>
                )}
                {!vehicleSearchError && vehicleResults.length > 0 && (
                  <ul id="service-vehicle-options" role="listbox" aria-label="Matching vehicles">
                    {vehicleResults.map((vehicle, index) => (
                      <li
                        id={`service-vehicle-option-${index}`}
                        key={vehicle._id}
                        role="option"
                        aria-selected={activeVehicleIndex === index}
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => selectVehicle(vehicle)}
                        className={`cursor-pointer px-3 py-2 text-sm hover:bg-canvas ${activeVehicleIndex === index ? 'bg-canvas' : ''}`}
                      >
                        <span className="block font-medium text-asphalt">{vehicle.regNo}</span>
                        <span className="block text-xs text-slate-500">
                          {[vehicle.make, vehicle.model, vehicle.vehicleType].filter(Boolean).join(' · ')}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        </Field>
        <Field label="Service type" required>
          <select value={form.serviceType} onChange={update('serviceType')} className={inputCls(false)}>
            {TYPES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </Field>
        <Field label="Status">
          <select value={form.status} onChange={update('status')} className={inputCls(false)}>
            {STATUSES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </Field>
        <Field label="Service date" required error={errors.serviceDate}>
          <input type="date" value={form.serviceDate} onChange={update('serviceDate')} className={inputCls(errors.serviceDate)} />
        </Field>
        <Field label="Odometer (km)" required error={errors.odometer}>
          <input type="number" min="0" step="1" value={form.odometer} onChange={update('odometer')} className={inputCls(errors.odometer)} />
        </Field>
        <Field label="Service provider" error={errors.provider}>
          <input maxLength={120} value={form.provider} onChange={update('provider')} placeholder="Garage or technician" className={inputCls(errors.provider)} />
        </Field>
        <Field label="Cost (INR)" required error={errors.cost}>
          <input type="number" min="0" step="0.01" value={form.cost} onChange={update('cost')} className={inputCls(errors.cost)} />
        </Field>
        <Field label="Next service date" error={errors.nextServiceDate}>
          <input type="date" min={form.serviceDate} value={form.nextServiceDate} onChange={update('nextServiceDate')} className={inputCls(errors.nextServiceDate)} />
        </Field>
        <Field label="Next service at (km)" error={errors.nextServiceOdometer}>
          <input type="number" min="0" step="1" value={form.nextServiceOdometer} onChange={update('nextServiceOdometer')} className={inputCls(errors.nextServiceOdometer)} />
        </Field>
        <Field label="Work description" required error={errors.workDescription} className="sm:col-span-2">
          <textarea rows={3} maxLength={2000} value={form.workDescription} onChange={update('workDescription')} placeholder="Describe the service, repairs, or inspection..." className={inputCls(errors.workDescription)} />
        </Field>
        <Field label="Notes" error={errors.notes} className="sm:col-span-2">
          <textarea rows={2} maxLength={1000} value={form.notes} onChange={update('notes')} placeholder="Optional notes, parts used, or invoice reference" className={inputCls(errors.notes)} />
        </Field>
      </div>
      <div className="flex flex-col-reverse gap-2 border-t border-line px-5 py-4 sm:flex-row sm:justify-end">
        <button type="button" disabled={saving} onClick={onCancel} className="rounded-md border border-line px-4 py-2 text-sm font-medium hover:bg-canvas disabled:opacity-50">Cancel</button>
        <button type="submit" disabled={saving} className="rounded-md bg-signal px-5 py-2 text-sm font-semibold text-asphalt hover:bg-signal-dark disabled:opacity-60">
          {saving ? 'Saving...' : record ? 'Save changes' : 'Add service record'}
        </button>
      </div>
    </form>
  );
}

export { TYPES as SERVICE_TYPES, STATUSES as SERVICE_STATUSES };
