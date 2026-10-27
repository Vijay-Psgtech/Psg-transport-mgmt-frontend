import { useState } from 'react';
import Field, { inputCls } from './Field';
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

export default function ServiceRecordForm({ record, vehicles, onSubmit, onCancel }) {
  const [form, setForm] = useState(() => formFromRecord(record));
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [saving, setSaving] = useState(false);

  const update = (name) => (event) => {
    const { value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: undefined }));
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
    <form onSubmit={submit} noValidate>
      <div className="grid gap-4 px-5 py-5 sm:grid-cols-2">
        {serverError && <p role="alert" className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 sm:col-span-2">{serverError}</p>}

        <Field label="Vehicle" required error={errors.vehicle}>
          <select value={form.vehicle} onChange={update('vehicle')} className={inputCls(errors.vehicle)}>
            <option value="">Select a vehicle</option>
            {vehicles.map((vehicle) => (
              <option key={vehicle._id} value={vehicle._id}>
                {vehicle.regNo} · {vehicle.make} {vehicle.model}
              </option>
            ))}
          </select>
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
        <button type="submit" disabled={saving || vehicles.length === 0} className="rounded-md bg-signal px-5 py-2 text-sm font-semibold text-asphalt hover:bg-signal-dark disabled:opacity-60">
          {saving ? 'Saving...' : record ? 'Save changes' : 'Add service record'}
        </button>
      </div>
      {vehicles.length === 0 && <p className="px-5 pb-4 text-sm text-amber-800">Add a vehicle before recording a service.</p>}
    </form>
  );
}

export { TYPES as SERVICE_TYPES, STATUSES as SERVICE_STATUSES };
