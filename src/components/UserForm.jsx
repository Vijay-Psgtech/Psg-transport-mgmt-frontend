import { useState } from 'react';
import Field, { inputCls } from './Field';
import PasswordField from './PasswordField';
import {
  ROLE_OPTIONS, BLOOD_GROUPS, LICENSE_CLASSES, PHONE_REGEX, EMAIL_REGEX,
} from '../utils/constants';
import { generatePassword, getErrorMessage, passwordIssue, toDateInput } from '../utils/helpers';

const EMPTY = {
  name: '', email: '', phone: '', idNumber: '', role: 'student', password: '',
  licenseNumber: '', licenseClass: 'HPMV', licenseExpiry: '', badgeNumber: '', bloodGroup: '',
  dateOfBirth: '', dateOfJoining: '', experienceYears: '', address: '',
  emergencyContactName: '', emergencyContactPhone: '',
};

function toFormState(user, fixedRole) {
  if (!user) return { ...EMPTY, role: fixedRole || 'student', password: generatePassword() };
  const p = user.driverProfile || {};
  return {
    ...EMPTY,
    name: user.name, email: user.email ?? '', phone: user.phone ?? '', idNumber: user.idNumber ?? '', role: user.role,
    licenseNumber: p.licenseNumber ?? '', licenseClass: p.licenseClass ?? 'HPMV', licenseExpiry: toDateInput(p.licenseExpiry),
    badgeNumber: p.badgeNumber ?? '', bloodGroup: p.bloodGroup ?? '', dateOfBirth: toDateInput(p.dateOfBirth),
    dateOfJoining: toDateInput(p.dateOfJoining), experienceYears: p.experienceYears ?? '', address: p.address ?? '',
    emergencyContactName: p.emergencyContactName ?? '', emergencyContactPhone: p.emergencyContactPhone ?? '',
  };
}

// '' -> null so clearing a field on edit really clears it on the server
const orNull = (v) => (v === '' || v === undefined ? null : typeof v === 'string' ? v.trim() : v);

function toPayload(f, creating) {
  const payload = {
    name: f.name.trim(),
    email: orNull(f.email),
    phone: orNull(f.phone),
    idNumber: orNull(f.idNumber),
    role: f.role,
  };
  if (creating) payload.password = f.password;
  if (f.role === 'driver') {
    payload.driverProfile = {
      licenseNumber: orNull(f.licenseNumber),
      licenseClass: orNull(f.licenseClass),
      licenseExpiry: orNull(f.licenseExpiry),
      badgeNumber: orNull(f.badgeNumber),
      bloodGroup: orNull(f.bloodGroup),
      dateOfBirth: orNull(f.dateOfBirth),
      dateOfJoining: orNull(f.dateOfJoining),
      experienceYears: f.experienceYears === '' ? null : Number(f.experienceYears),
      address: orNull(f.address),
      emergencyContactName: orNull(f.emergencyContactName),
      emergencyContactPhone: orNull(f.emergencyContactPhone),
    };
  }
  return payload;
}

function validate(f, creating) {
  const e = {};
  if (!f.name.trim()) e.name = 'Enter the full name.';
  if (f.email.trim() && !EMAIL_REGEX.test(f.email.trim())) e.email = 'Enter a valid email address.';
  if (!f.phone.trim()) e.phone = 'Enter a phone number.';
  else if (!PHONE_REGEX.test(f.phone.trim())) e.phone = 'Enter a valid phone number.';
  if (creating) {
    const issue = passwordIssue(f.password);
    if (issue) e.password = issue;
  }
  if (f.role === 'driver') {
    if (!f.licenseNumber.trim()) e.licenseNumber = 'Enter the licence number.';
    if (!f.licenseClass) e.licenseClass = 'Select the licence class.';
    if (!f.licenseExpiry) e.licenseExpiry = 'Enter the licence expiry date.';
    if (f.experienceYears !== '' && (Number(f.experienceYears) < 0 || Number(f.experienceYears) > 60)) e.experienceYears = 'Enter 0 to 60 years.';
    if (f.emergencyContactPhone && !PHONE_REGEX.test(f.emergencyContactPhone)) e.emergencyContactPhone = 'Enter a valid phone number.';
  }
  return e;
}

// Server field errors use dotted paths such as "driverProfile.licenseNumber"
const fieldKey = (path) => path.replace('driverProfile.', '');

export default function UserForm({ user, fixedRole, roleLocked, onSubmit, onCancel }) {
  const creating = !user;
  const [form, setForm] = useState(() => toFormState(user, fixedRole));
  const [errors, setErrors] = useState({});
  const [serverErrors, setServerErrors] = useState([]);
  const [saving, setSaving] = useState(false);

  const set = (name) => (e) => {
    setForm((f) => ({ ...f, [name]: e.target.value }));
    if (errors[name]) setErrors((er) => ({ ...er, [name]: undefined }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const found = validate(form, creating);
    setErrors(found);
    if (Object.keys(found).length) return;

    setSaving(true);
    setServerErrors([]);
    try {
      await onSubmit(toPayload(form, creating), form);
    } catch (err) {
      const fieldErrors = err.response?.data?.errors;
      setServerErrors(fieldErrors ? Object.values(fieldErrors) : [getErrorMessage(err)]);
      if (fieldErrors) {
        setErrors((prev) => ({ ...prev, ...Object.fromEntries(Object.entries(fieldErrors).map(([k, v]) => [fieldKey(k), v])) }));
      }
      setSaving(false);
    }
  };

  const grid = 'grid gap-4 sm:grid-cols-2 lg:grid-cols-3';
  const heading = 'mb-3 font-display text-base font-bold';
  const isDriver = form.role === 'driver';

  return (
    <form onSubmit={handleSubmit} noValidate className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
      <div className="space-y-6 px-5 py-5 overflow-y-auto overflow-x-hidden overscroll-contain">
        {serverErrors.length > 0 && (
          <div role="alert" className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
            <p className="font-medium">The account was not saved.</p>
            <ul className="mt-1 list-disc pl-5">{serverErrors.map((m) => <li key={m}>{m}</li>)}</ul>
          </div>
        )}

        <fieldset>
          <legend className={heading}>Account</legend>
          <div className={grid}>
            <Field label="Full name" required error={errors.name}>
              <input value={form.name} onChange={set('name')} className={inputCls(errors.name)} autoFocus />
            </Field>
            <Field label="Email" error={errors.email} hint="Optional.">
              <input type="email" value={form.email} onChange={set('email')} className={inputCls(errors.email)} />
            </Field>
            <Field label="Phone" required error={errors.phone} hint="Used to sign in.">
              <input type="tel" required value={form.phone} onChange={set('phone')} placeholder="9876543210" className={inputCls(errors.phone)} />
            </Field>
            <Field label="Role" required hint={roleLocked ? 'Fixed for this screen.' : undefined}>
              <select value={form.role} onChange={set('role')} disabled={roleLocked} className={`${inputCls(false)} disabled:bg-canvas`}>
                {ROLE_OPTIONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </Field>
            <Field label="Staff, student or employee ID" error={errors.idNumber}>
              <input value={form.idNumber} onChange={set('idNumber')} className={inputCls(errors.idNumber)} />
            </Field>
            {creating && (
              <PasswordField
                label="Temporary password"
                required
                value={form.password}
                onChange={set('password')}
                onGenerate={() => setForm((f) => ({ ...f, password: generatePassword() }))}
                error={errors.password}
                hint="They must change it at first sign in."
              />
            )}
          </div>
        </fieldset>

        {isDriver && (
          <>
            <fieldset>
              <legend className={heading}>Driving licence</legend>
              <div className={grid}>
                <Field label="Licence number" required error={errors.licenseNumber}>
                  <input value={form.licenseNumber} onChange={set('licenseNumber')} placeholder="TN38 20150012345" className={inputCls(errors.licenseNumber)} />
                </Field>
                <Field label="Licence class" required error={errors.licenseClass}>
                  <select value={form.licenseClass} onChange={set('licenseClass')} className={inputCls(errors.licenseClass)}>
                    {LICENSE_CLASSES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </Field>
                <Field label="Licence expires on" required error={errors.licenseExpiry}>
                  <input type="date" value={form.licenseExpiry} onChange={set('licenseExpiry')} className={inputCls(errors.licenseExpiry)} />
                </Field>
                <Field label="Badge number (PSV)">
                  <input value={form.badgeNumber} onChange={set('badgeNumber')} className={inputCls(false)} />
                </Field>
                <Field label="Years of experience" error={errors.experienceYears}>
                  <input type="number" min="0" max="60" value={form.experienceYears} onChange={set('experienceYears')} className={inputCls(errors.experienceYears)} />
                </Field>
                <Field label="Date of joining">
                  <input type="date" value={form.dateOfJoining} onChange={set('dateOfJoining')} className={inputCls(false)} />
                </Field>
              </div>
            </fieldset>

            <fieldset>
              <legend className={heading}>Personal and emergency details</legend>
              <div className={grid}>
                <Field label="Date of birth">
                  <input type="date" value={form.dateOfBirth} onChange={set('dateOfBirth')} className={inputCls(false)} />
                </Field>
                <Field label="Blood group">
                  <select value={form.bloodGroup} onChange={set('bloodGroup')} className={inputCls(false)}>
                    <option value="">Not recorded</option>
                    {BLOOD_GROUPS.map((b) => <option key={b} value={b}>{b}</option>)}
                  </select>
                </Field>
                <span className="hidden lg:block" />
                <Field label="Emergency contact name">
                  <input value={form.emergencyContactName} onChange={set('emergencyContactName')} className={inputCls(false)} />
                </Field>
                <Field label="Emergency contact phone" error={errors.emergencyContactPhone}>
                  <input value={form.emergencyContactPhone} onChange={set('emergencyContactPhone')} className={inputCls(errors.emergencyContactPhone)} />
                </Field>
                <span className="hidden lg:block" />
                <Field label="Address" className="sm:col-span-2 lg:col-span-3">
                  <textarea rows={2} maxLength={300} value={form.address} onChange={set('address')} className={inputCls(false)} />
                </Field>
              </div>
            </fieldset>
          </>
        )}
      </div>

      <div className="flex justify-end gap-3 border-t border-line px-5 py-4">
        <button type="button" onClick={onCancel} className="rounded-md border border-line px-4 py-2 text-sm font-medium hover:bg-canvas focus:outline-none focus-visible:ring-2 focus-visible:ring-signal">
          Cancel
        </button>
        <button type="submit" disabled={saving} className="rounded-md bg-signal px-5 py-2 text-sm font-semibold text-asphalt hover:bg-signal-dark focus:outline-none focus-visible:ring-2 focus-visible:ring-asphalt disabled:opacity-60">
          {saving ? 'Saving...' : creating ? 'Create account' : 'Save changes'}
        </button>
      </div>
    </form>
  );
}
