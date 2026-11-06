import { useEffect, useRef, useState } from 'react';
import api from '../api/axios';
import Field, { inputCls } from './Field';
import { getErrorMessage } from '../utils/helpers';
import { VEHICLE_TYPES, labelOf } from '../utils/constants';

export default function VehicleAssignmentForm({ assignment, onSubmit, onCancel }) {
  const isRequest = Boolean(assignment);
  const [vehicle, setVehicle] = useState('');
  const [driver, setDriver] = useState('');
  const [purpose, setPurpose] = useState(assignment?.purpose || '');
  const [notes, setNotes] = useState(assignment?.notes || '');
  const [options, setOptions] = useState({ vehicles: [], drivers: [] });
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [optionsError, setOptionsError] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const requestId = useRef(0);

  useEffect(() => {
    const id = ++requestId.current;
    setLoadingOptions(true);
    setOptionsError('');
    const params = {
      ...(isRequest && { startAt: assignment.startAt, endAt: assignment.endAt }),
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
  }, [assignment, isRequest]);

  const enoughOptions = options.vehicles.length > 0 && options.drivers.length > 0;

  const chooseVehicle = (event) => {
    const value = event.target.value;
    setVehicle(value);
    setDriver('');
  };

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setSaving(true);
    try {
      const payload = { vehicle, driver };
      if (!isRequest) {
        payload.purpose = purpose.trim();
        payload.notes = notes.trim();
      }
      await onSubmit(payload);
    } catch (submitError) {
      setError(getErrorMessage(submitError));
    } finally {
      setSaving(false);
    }
  };

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

        <p className="text-xs text-slate-500">
          Select the driver for this assignment. Active assignments reserve the vehicle and driver until the assignment is closed.
        </p>

        {loadingOptions && <p role="status" className="text-sm text-slate-600">Checking available vehicles and drivers...</p>}
        {optionsError && <p role="alert" className="text-sm text-red-700">{optionsError}</p>}
        {!loadingOptions && !optionsError && !enoughOptions && (
          <p role="status" className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            No available vehicle and licensed driver were found.
          </p>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Vehicle" required>
            <select value={vehicle} onChange={chooseVehicle} required disabled={!options.vehicles.length || loadingOptions} className={inputCls(false)}>
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
              <option value="">Select a licensed driver</option>
              {options.drivers.map((item) => (
                <option key={item._id} value={item._id}>
                  {item.name}{item.phone ? ` · ${item.phone}` : ''}
                </option>
              ))}
            </select>
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

        {error && <p role="alert" className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>}
      </div>

      <footer className="flex justify-end gap-3 border-t border-line px-4 py-3 sm:px-5">
        <button type="button" onClick={onCancel} disabled={saving} className="rounded-md border border-line px-4 py-2 text-sm font-medium hover:bg-canvas disabled:opacity-60">Cancel</button>
        <button type="submit" disabled={saving || loadingOptions || !enoughOptions || !vehicle || !driver} className="rounded-md bg-signal px-4 py-2 text-sm font-semibold text-asphalt hover:bg-signal-dark disabled:opacity-60">
          {saving ? 'Saving...' : isRequest ? 'Approve and assign' : 'Create assignment'}
        </button>
      </footer>
    </form>
  );
}
