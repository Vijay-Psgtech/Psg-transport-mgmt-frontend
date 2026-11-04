import { useEffect, useRef, useState } from 'react';
import api from '../api/axios';
import Field, { inputCls } from './Field';
import { getErrorMessage } from '../utils/helpers';
import { VEHICLE_TYPES, labelOf } from '../utils/constants';

const pad = (value) => String(value).padStart(2, '0');
const toLocalInput = (value) => {
  const date = new Date(value);
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};
const defaultWindow = () => {
  const start = new Date(Date.now() + 60 * 60 * 1000);
  start.setSeconds(0, 0);
  const end = new Date(start.getTime() + 60 * 60 * 1000);
  return { startAt: toLocalInput(start), endAt: toLocalInput(end) };
};

export default function VehicleAssignmentForm({ assignment, onSubmit, onCancel }) {
  const isRequest = Boolean(assignment);
  const initialWindow = isRequest
    ? { startAt: toLocalInput(assignment.startAt), endAt: toLocalInput(assignment.endAt) }
    : defaultWindow();
  const [window, setWindow] = useState(initialWindow);
  const [vehicle, setVehicle] = useState('');
  const [driver, setDriver] = useState('');
  const [purpose, setPurpose] = useState(assignment?.purpose || '');
  const [notes, setNotes] = useState(assignment?.notes || '');
  const [options, setOptions] = useState({ vehicles: [], drivers: [] });
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [optionsError, setOptionsError] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const requestId = useRef(0);

  useEffect(() => {
    const start = new Date(window.startAt);
    const end = new Date(window.endAt);
    if (!window.startAt || !window.endAt || Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
      setOptions({ vehicles: [], drivers: [] });
      setOptionsError('Choose an end time after the start time to check availability.');
      setLoadingOptions(false);
      return undefined;
    }

    const id = ++requestId.current;
    setLoadingOptions(true);
    setOptionsError('');
    const params = {
      startAt: start.toISOString(),
      endAt: end.toISOString(),
      ...(assignment?.passengerCount && { passengerCount: assignment.passengerCount }),
      ...(assignment?.preferredVehicleType && { vehicleType: assignment.preferredVehicleType }),
    };
    api.get('/vehicle-assignments/availability', { params })
      .then(({ data }) => {
        if (requestId.current === id) setOptions(data.data);
      })
      .catch((availabilityError) => {
        if (requestId.current === id) setOptionsError(getErrorMessage(availabilityError));
      })
      .finally(() => {
        if (requestId.current === id) setLoadingOptions(false);
      });
    return () => { requestId.current += 1; };
  }, [window.startAt, window.endAt, assignment?.passengerCount]);

  const setTime = (name) => (event) => {
    setWindow((current) => ({ ...current, [name]: event.target.value }));
    setVehicle('');
    setDriver('');
  };

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setSaving(true);
    try {
      const payload = {
        vehicle,
        driver,
        ...(isRequest ? {} : {
          startAt: new Date(window.startAt).toISOString(),
          endAt: new Date(window.endAt).toISOString(),
          purpose: purpose.trim(),
          notes: notes.trim(),
        }),
      };
      await onSubmit(payload);
    } catch (submitError) {
      setError(getErrorMessage(submitError));
    } finally {
      setSaving(false);
    }
  };

  const enoughOptions = options.vehicles.length > 0 && options.drivers.length > 0;
  return (
    <form onSubmit={submit} className="min-h-0 flex-1 overflow-y-auto">
      <div className="space-y-5 px-4 py-5 sm:px-5">
        {isRequest && (
          <div className="rounded-md border border-line bg-canvas px-3 py-3 text-sm">
            <p className="font-semibold">{assignment.requestedBy?.name || 'Transport user'} requested a vehicle</p>
            <p className="mt-1 text-slate-600">{assignment.passengerCount} passenger(s) · {assignment.purpose}</p>
            {assignment.preferredVehicleType && <p className="mt-1 text-slate-600">Preferred vehicle: {labelOf(VEHICLE_TYPES, assignment.preferredVehicleType)}</p>}
            <p className="mt-1 text-slate-600">{assignment.pickupLocation} → {assignment.destination}</p>
            <p className="mt-1 text-slate-600">{new Date(assignment.startAt).toLocaleString()} – {new Date(assignment.endAt).toLocaleString()}</p>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Start time" required>
            <input type="datetime-local" value={window.startAt} onChange={setTime('startAt')} readOnly={isRequest} required className={inputCls(false)} />
          </Field>
          <Field label="End time" required>
            <input type="datetime-local" value={window.endAt} onChange={setTime('endAt')} readOnly={isRequest} required className={inputCls(false)} />
          </Field>
        </div>

        {!isRequest && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Purpose">
              <input value={purpose} onChange={(event) => setPurpose(event.target.value)} maxLength={160} className={inputCls(false)} />
            </Field>
            <Field label="Notes">
              <input value={notes} onChange={(event) => setNotes(event.target.value)} maxLength={500} className={inputCls(false)} />
            </Field>
          </div>
        )}

        {loadingOptions && <p role="status" className="text-sm text-slate-600">Checking vehicle and driver availability...</p>}
        {optionsError && <p role="alert" className="text-sm text-red-700">{optionsError}</p>}
        {!loadingOptions && !optionsError && !enoughOptions && (
          <p role="status" className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            No vehicle or licensed driver is available for this time window.
          </p>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Vehicle" required>
            <select value={vehicle} onChange={(event) => setVehicle(event.target.value)} required disabled={!enoughOptions || loadingOptions} className={inputCls(false)}>
              <option value="">Select an available vehicle</option>
              {options.vehicles.map((item) => (
                <option key={item._id} value={item._id}>
                  {item.regNo} · {item.make} {item.model} · {item.seatingCapacity} seats
                </option>
              ))}
            </select>
          </Field>
          <Field label="Driver" required>
            <select value={driver} onChange={(event) => setDriver(event.target.value)} required disabled={!enoughOptions || loadingOptions} className={inputCls(false)}>
              <option value="">Select an available driver</option>
              {options.drivers.map((item) => (
                <option key={item._id} value={item._id}>{item.name}{item.phone ? ` · ${item.phone}` : ''}</option>
              ))}
            </select>
          </Field>
        </div>

        {error && <p role="alert" className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>}
      </div>

      <footer className="flex justify-end gap-3 border-t border-line px-4 py-3 sm:px-5">
        <button type="button" onClick={onCancel} disabled={saving} className="rounded-md border border-line px-4 py-2 text-sm font-medium hover:bg-canvas disabled:opacity-60">Cancel</button>
        <button type="submit" disabled={saving || loadingOptions || !enoughOptions || !vehicle || !driver} className="rounded-md bg-signal px-4 py-2 text-sm font-semibold text-asphalt hover:bg-signal-dark disabled:opacity-60">
          {saving ? 'Saving...' : isRequest ? 'Assign vehicle and driver' : 'Create assignment'}
        </button>
      </footer>
    </form>
  );
}
