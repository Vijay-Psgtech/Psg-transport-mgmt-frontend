import { useState } from 'react';
import PasswordField from './PasswordField';
import { useAuth } from '../context/AuthContext';
import { getErrorMessage, passwordIssue } from '../utils/helpers';

export default function ChangePasswordForm({ onDone }) {
  const { changePassword } = useAuth();
  const [form, setForm] = useState({ current: '', next: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [saving, setSaving] = useState(false);

  const set = (name) => (e) => {
    setForm((f) => ({ ...f, [name]: e.target.value }));
    setErrors((er) => ({ ...er, [name]: undefined }));
  };

  const submit = async (e) => {
    e.preventDefault();
    const found = {};
    if (!form.current) found.current = 'Enter your current password.';
    const issue = passwordIssue(form.next);
    if (issue) found.next = issue;
    else if (form.next === form.current) found.next = 'Choose a password different from the current one.';
    if (form.confirm !== form.next) found.confirm = 'The two passwords do not match.';
    setErrors(found);
    if (Object.keys(found).length) return;

    setSaving(true);
    setServerError('');
    try {
      await changePassword(form.current, form.next);
      setForm({ current: '', next: '', confirm: '' });
      onDone?.();
    } catch (err) {
      setServerError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      {serverError && <div role="alert" className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{serverError}</div>}
      <PasswordField label="Current password" value={form.current} onChange={set('current')} error={errors.current} autoComplete="current-password" />
      <PasswordField label="New password" value={form.next} onChange={set('next')} error={errors.next} hint="At least 8 characters, with a letter and a number." />
      <PasswordField label="Confirm new password" value={form.confirm} onChange={set('confirm')} error={errors.confirm} />
      <button type="submit" disabled={saving} className="rounded-md bg-signal px-4 py-2 text-sm font-semibold text-asphalt hover:bg-signal-dark focus:outline-none focus-visible:ring-2 focus-visible:ring-asphalt disabled:opacity-60">
        {saving ? 'Saving...' : 'Change password'}
      </button>
    </form>
  );
}
