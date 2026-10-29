import { useEffect, useState } from 'react';
import Field, { inputCls } from './Field';
import api from '../api/axios';
import {
  VEHICLE_TYPES, FUEL_TYPES, VEHICLE_STATUSES, DOCUMENT_TYPES, REG_NO_REGEX,
} from '../utils/constants';
import { getErrorMessage, toDateInput } from '../utils/helpers';

const EMPTY = {
  vehicleType: 'bus', regNo: '', make: '', model: '', manufactureYear: '', color: '',
  fuelType: 'diesel', seatingCapacity: '', chassisNo: '', engineNo: '', odometer: '',
  status: 'active', assignedDriver: '', gpsDeviceId: '', notes: '', documents: [],
};

function toFormState(v) {
  if (!v) return EMPTY;
  return {
    ...EMPTY,
    vehicleType: v.vehicleType, regNo: v.regNo, make: v.make, model: v.model,
    manufactureYear: v.manufactureYear ?? '', color: v.color ?? '', fuelType: v.fuelType,
    seatingCapacity: v.seatingCapacity ?? '', chassisNo: v.chassisNo ?? '', engineNo: v.engineNo ?? '',
    odometer: v.odometer ?? '', status: v.status,
    assignedDriver: v.assignedDriver?._id || v.assignedDriver || '',
    gpsDeviceId: v.gpsDeviceId ?? '', notes: v.notes ?? '',
    documents: (v.documents || []).map((d) => ({
      _id: d._id,
      type: d.type, number: d.number ?? '', issueDate: toDateInput(d.issueDate), expiryDate: toDateInput(d.expiryDate),
      proofImage: d.proofImage ?? null, proofFile: null,
    })),
  };
}

// '' -> null so that clearing a field on edit really clears it on the server
const orNull = (v) => (v === '' || v === undefined ? null : v);
const numOrNull = (v) => (v === '' ? null : Number(v));

function toPayload(f) {
  return {
    vehicleType: f.vehicleType,
    regNo: f.regNo.trim(),
    make: f.make.trim(),
    model: f.model.trim(),
    manufactureYear: numOrNull(f.manufactureYear),
    color: orNull(f.color.trim()),
    fuelType: f.fuelType,
    seatingCapacity: numOrNull(f.seatingCapacity),
    chassisNo: orNull(f.chassisNo.trim()),
    engineNo: orNull(f.engineNo.trim()),
    odometer: numOrNull(f.odometer),
    status: f.status,
    assignedDriver: orNull(f.assignedDriver),
    gpsDeviceId: orNull(f.gpsDeviceId.trim()),
    notes: orNull(f.notes.trim()),
    documents: f.documents.map((d) => ({
      _id: d._id,
      removeProof: !d.proofImage && !d.proofFile,
      type: d.type, number: orNull(d.number.trim()), issueDate: orNull(d.issueDate), expiryDate: d.expiryDate,
    })),
  };
}

function validate(f) {
  const e = {};
  const reg = f.regNo.replace(/[\s-]/g, '').toUpperCase();
  if (!reg) e.regNo = 'Enter the registration number.';
  else if (!REG_NO_REGEX.test(reg)) e.regNo = 'Use a format like TN 38 AB 1234.';
  if (!f.make.trim()) e.make = 'Enter the make, for example Ashok Leyland.';
  if (!f.model.trim()) e.model = 'Enter the model, for example Viking.';
  const year = Number(f.manufactureYear);
  if (f.manufactureYear !== '' && (year < 1990 || year > new Date().getFullYear() + 1)) {
    e.manufactureYear = `Enter a year between 1990 and ${new Date().getFullYear() + 1}.`;
  }
  const seats = Number(f.seatingCapacity);
  if (f.seatingCapacity === '' || seats < 1 || seats > 100) e.seatingCapacity = 'Enter seats between 1 and 100.';
  if (f.odometer !== '' && Number(f.odometer) < 0) e.odometer = 'Odometer cannot be negative.';
  const documentErrors = [];
  if (f.documents.some((d) => !d.expiryDate)) documentErrors.push('Every document needs an expiry date.');
  if (f.documents.some((d) => d.proofFile?.size > 5 * 1024 * 1024)) {
    documentErrors.push('Each proof image must be 5 MB or smaller.');
  }
  if (documentErrors.length) e.documents = documentErrors.join(' ');
  return e;
}

function DocumentProofPreview({ proof, file, vehicleId }) {
  const [src, setSrc] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    let objectUrl;
    setSrc(null);
    setError('');

    async function loadProof() {
      if (file) {
        objectUrl = URL.createObjectURL(file);
        if (active) setSrc(objectUrl);
        return;
      }
      if (!proof?.filename || !vehicleId) return;

      try {
        const { data } = await api.get(
          `/vehicles/${vehicleId}/documents/${encodeURIComponent(proof.filename)}`,
          { responseType: 'blob' }
        );
        objectUrl = URL.createObjectURL(data);
        if (active) setSrc(objectUrl);
      } catch (loadError) {
        if (active) setError(getErrorMessage(loadError));
      }
    }

    loadProof();
    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [file, proof?.filename, vehicleId]);

  if (error) return <p role="alert" className="text-xs text-red-700">{error}</p>;
  if (!src) return null;
  return <img src={src} alt="Document proof preview" className="max-h-40 max-w-full rounded border border-line object-contain" />;
}

export default function VehicleForm({ vehicle, drivers, onSubmit, onCancel }) {
  const editing = Boolean(vehicle);
  const [form, setForm] = useState(() => toFormState(vehicle));
  const [errors, setErrors] = useState({});
  const [serverErrors, setServerErrors] = useState([]);
  const [saving, setSaving] = useState(false);

  const set = (name) => (e) => {
    setForm((f) => ({ ...f, [name]: e.target.value }));
    if (errors[name]) setErrors((er) => ({ ...er, [name]: undefined }));
  };

  const setDoc = (i, name, value) =>
    setForm((f) => ({ ...f, documents: f.documents.map((d, idx) => (idx === i ? { ...d, [name]: value } : d)) }));

  const addDoc = () =>
    setForm((f) => {
      const used = f.documents.map((d) => d.type);
      const next = DOCUMENT_TYPES.find((t) => !used.includes(t.value))?.value || 'insurance';
      return { ...f, documents: [...f.documents, { type: next, number: '', issueDate: '', expiryDate: '' }] };
    });

  const removeDoc = (i) => setForm((f) => ({ ...f, documents: f.documents.filter((_, idx) => idx !== i) }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const found = validate(form);
    setErrors(found);
    if (Object.keys(found).length) return;

    setSaving(true);
    setServerErrors([]);
    try {
      const payload = toPayload(form);
      const proofFiles = [];
      payload.documents = payload.documents.map((document, index) => {
        const file = form.documents[index].proofFile;
        if (!file) return document;
        proofFiles.push(file);
        return { ...document, proofUploadIndex: proofFiles.length - 1 };
      });
      const multipart = new FormData();
      multipart.append('payload', JSON.stringify(payload));
      proofFiles.forEach((file) => multipart.append('proofs', file));
      await onSubmit(multipart);
    } catch (err) {
      const fieldErrors = err.response?.data?.errors;
      setServerErrors(fieldErrors ? Object.values(fieldErrors) : [getErrorMessage(err)]);
      if (fieldErrors) setErrors((prev) => ({ ...prev, ...fieldErrors }));
      setSaving(false);
    }
  };

  const section = 'grid gap-4 sm:grid-cols-2 lg:grid-cols-3';
  const heading = 'mb-3 font-display text-base font-bold';

  return (
    <form onSubmit={handleSubmit} noValidate className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
      <div className="space-y-6 px-5 py-5 overflow-y-auto overflow-x-hidden overscroll-contain">
        {serverErrors.length > 0 && (
          <div role="alert" className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
            <p className="font-medium">The vehicle was not saved.</p>
            <ul className="mt-1 list-disc pl-5">{serverErrors.map((m) => <li key={m}>{m}</li>)}</ul>
          </div>
        )}

        <fieldset>
          <legend className={heading}>Identification</legend>
          <div className={section}>
            <Field label="Vehicle type" required>
              <select value={form.vehicleType} onChange={set('vehicleType')} className={inputCls(false)}>
                {VEHICLE_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </Field>
            <Field label="Registration number" required error={errors.regNo}>
              <input value={form.regNo} onChange={set('regNo')} placeholder="TN 38 AB 1234" className={inputCls(errors.regNo)} />
            </Field>
            <Field label="Colour">
              <input value={form.color} onChange={set('color')} placeholder="Yellow" className={inputCls(false)} />
            </Field>
            <Field label="Make" required error={errors.make}>
              <input value={form.make} onChange={set('make')} placeholder="Ashok Leyland" className={inputCls(errors.make)} />
            </Field>
            <Field label="Model" required error={errors.model}>
              <input value={form.model} onChange={set('model')} placeholder="Viking" className={inputCls(errors.model)} />
            </Field>
            <Field label="Year of manufacture" error={errors.manufactureYear}>
              <input type="number" value={form.manufactureYear} onChange={set('manufactureYear')} placeholder="2021" className={inputCls(errors.manufactureYear)} />
            </Field>
          </div>
        </fieldset>

        <fieldset>
          <legend className={heading}>Specifications</legend>
          <div className={section}>
            <Field label="Seating capacity" required error={errors.seatingCapacity}>
              <input type="number" min="1" value={form.seatingCapacity} onChange={set('seatingCapacity')} className={inputCls(errors.seatingCapacity)} />
            </Field>
            <Field label="Fuel type">
              <select value={form.fuelType} onChange={set('fuelType')} className={inputCls(false)}>
                {FUEL_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </Field>
            <Field label="Odometer (km)" error={errors.odometer}>
              <input type="number" min="0" value={form.odometer} onChange={set('odometer')} className={inputCls(errors.odometer)} />
            </Field>
            <Field label="Chassis number" error={errors.chassisNo}>
              <input value={form.chassisNo} onChange={set('chassisNo')} className={inputCls(errors.chassisNo)} />
            </Field>
            <Field label="Engine number">
              <input value={form.engineNo} onChange={set('engineNo')} className={inputCls(false)} />
            </Field>
            <Field label="GPS device ID" hint="Used later for live tracking.">
              <input value={form.gpsDeviceId} onChange={set('gpsDeviceId')} className={inputCls(false)} />
            </Field>
          </div>
        </fieldset>

        <fieldset>
          <legend className={heading}>Operations</legend>
          <div className={section}>
            <Field label="Status">
              <select value={form.status} onChange={set('status')} className={inputCls(false)}>
                {VEHICLE_STATUSES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </Field>
            <Field label="Assigned driver" error={errors.assignedDriver}>
              <select value={form.assignedDriver} onChange={set('assignedDriver')} className={inputCls(errors.assignedDriver)}>
                <option value="">Unassigned</option>
                {drivers.map((d) => <option key={d._id} value={d._id}>{d.name}{d.phone ? ` (${d.phone})` : ''}</option>)}
              </select>
            </Field>
            <Field label="Notes" className="sm:col-span-2 lg:col-span-3">
              <textarea rows={2} maxLength={500} value={form.notes} onChange={set('notes')} className={inputCls(false)} />
            </Field>
          </div>
        </fieldset>

        <fieldset>
          <div className="mb-3 flex items-center justify-between">
            <legend className="font-display text-base font-bold">Documents and expiry dates</legend>
            <button type="button" onClick={addDoc} className="rounded-md border border-line px-3 py-1.5 text-sm font-medium hover:bg-canvas focus:outline-none focus-visible:ring-2 focus-visible:ring-signal">
              Add document
            </button>
          </div>
          {errors.documents && <p className="mb-2 text-xs text-red-600">{errors.documents}</p>}
          {form.documents.length === 0 ? (
            <p className="rounded-md border border-dashed border-line px-3 py-4 text-sm text-slate-600">
              No documents added. Add insurance, fitness, permit and PUC so the portal can warn you before they expire.
            </p>
          ) : (
            <div className="space-y-3">
              {form.documents.map((d, i) => (
                <div key={d._id || i} className="grid items-end gap-3 rounded-md border border-line p-3 sm:grid-cols-[1.3fr_1fr_1fr_1fr_auto]">
                  <Field label="Document">
                    <select value={d.type} onChange={(e) => setDoc(i, 'type', e.target.value)} className={inputCls(false)}>
                      {DOCUMENT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                  </Field>
                  <Field label="Number">
                    <input value={d.number} onChange={(e) => setDoc(i, 'number', e.target.value)} className={inputCls(false)} />
                  </Field>
                  <Field label="Issued on">
                    <input type="date" value={d.issueDate} onChange={(e) => setDoc(i, 'issueDate', e.target.value)} className={inputCls(false)} />
                  </Field>
                  <Field label="Expires on" required>
                    <input type="date" value={d.expiryDate} onChange={(e) => setDoc(i, 'expiryDate', e.target.value)} className={inputCls(errors.documents && !d.expiryDate)} />
                  </Field>
                  <button type="button" onClick={() => removeDoc(i)} aria-label={`Remove document ${i + 1}`} className="rounded-md px-2 py-2 text-sm font-medium text-red-700 hover:bg-red-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500">
                    Remove
                  </button>
                  <div className="sm:col-span-4">
                    <Field label="Proof image" hint="JPG, PNG, or WebP; up to 5 MB.">
                      <input
                        key={`${d._id || i}-${d.proofFile?.name || 'empty'}`}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={(e) => {
                          const file = e.target.files?.[0] || null;
                          setDoc(i, 'proofFile', file);
                          if (file) setDoc(i, 'proofImage', null);
                        }}
                        className="block w-full text-sm text-slate-700 file:mr-3 file:rounded-md file:border-0 file:bg-canvas file:px-3 file:py-2 file:text-sm file:font-medium"
                      />
                    </Field>
                    {(d.proofFile || d.proofImage) && (
                      <div className="mt-2 flex flex-wrap items-start gap-3">
                        <DocumentProofPreview proof={d.proofImage} file={d.proofFile} vehicleId={vehicle?._id} />
                        <button
                          type="button"
                          onClick={() => {
                            setDoc(i, 'proofFile', null);
                            setDoc(i, 'proofImage', null);
                          }}
                          className="text-xs font-medium text-red-700 underline underline-offset-2"
                        >
                          Remove proof image
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </fieldset>
      </div>

      <div className="flex justify-end gap-3 border-t border-line px-5 py-4">
        <button type="button" onClick={onCancel} className="rounded-md border border-line px-4 py-2 text-sm font-medium hover:bg-canvas focus:outline-none focus-visible:ring-2 focus-visible:ring-signal">
          Cancel
        </button>
        <button type="submit" disabled={saving} className="rounded-md bg-signal px-5 py-2 text-sm font-semibold text-asphalt hover:bg-signal-dark focus:outline-none focus-visible:ring-2 focus-visible:ring-asphalt disabled:opacity-60">
          {saving ? 'Saving...' : editing ? 'Save changes' : 'Add vehicle'}
        </button>
      </div>
    </form>
  );
}
