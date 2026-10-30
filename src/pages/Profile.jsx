import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import ChangePasswordForm from '../components/ChangePasswordForm';
import Field, { inputCls } from '../components/Field';
import { ROLE_LABELS, PHONE_REGEX } from '../utils/constants';
import { formatDateTime, getErrorMessage } from '../utils/helpers';

export default function Profile() {
  const { user, updateProfile } = useAuth();
  const [form, setForm] = useState({ name: user.name, phone: user.phone || '' });
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState({ type: '', text: '' });
  const [saving, setSaving] = useState(false);

  const save = async (e) => {
    e.preventDefault();
    const found = {};
    if (!form.name.trim()) found.name = 'Enter your name.';
    if (!form.phone.trim()) found.phone = 'Enter your phone number.';
    else if (!PHONE_REGEX.test(form.phone.trim())) found.phone = 'Enter a valid phone number.';
    setErrors(found);
    if (Object.keys(found).length) return;

    setSaving(true);
    setMessage({ type: '', text: '' });
    try {
      await updateProfile({ name: form.name.trim(), phone: form.phone.trim() });
      setMessage({ type: 'ok', text: 'Your details were saved.' });
    } catch (err) {
      setMessage({ type: 'error', text: getErrorMessage(err) });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-3xl font-bold">My account</h1>
      <p className="text-sm text-slate-600">{ROLE_LABELS[user.role]} · Last sign in {formatDateTime(user.lastLoginAt)}</p>

      <section className="mt-6 rounded-lg border border-line bg-white p-5">
        <h2 className="font-display text-xl font-bold">Your details</h2>
        <form onSubmit={save} noValidate className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="Name" required error={errors.name}>
            <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className={inputCls(errors.name)} />
          </Field>
          <Field label="Phone" required error={errors.phone}>
            <input type="tel" required value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} className={inputCls(errors.phone)} />
          </Field>
          <Field label="Email" hint="Optional. Ask an administrator to change your email.">
            <input value={user.email || ''} disabled className={`${inputCls(false)} bg-canvas text-slate-500`} />
          </Field>
          <div className="flex items-end gap-3 sm:col-span-2">
            <button type="submit" disabled={saving} className="rounded-md bg-signal px-4 py-2 text-sm font-semibold text-asphalt hover:bg-signal-dark disabled:opacity-60">
              {saving ? 'Saving...' : 'Save details'}
            </button>
            {message.text && (
              <p role="status" className={`text-sm ${message.type === 'ok' ? 'text-emerald-800' : 'text-red-700'}`}>{message.text}</p>
            )}
          </div>
        </form>
      </section>

      <section className="mt-6 rounded-lg border border-line bg-white p-5">
        <h2 className="font-display text-xl font-bold">Change password</h2>
        <div className="mt-4 max-w-sm"><ChangePasswordForm /></div>
      </section>
    </div>
  );
}
