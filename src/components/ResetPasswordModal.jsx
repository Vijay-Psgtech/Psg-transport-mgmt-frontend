import { useState } from 'react';
import Modal from './Modal';
import PasswordField from './PasswordField';
import { generatePassword, getErrorMessage, passwordIssue } from '../utils/helpers';

export default function ResetPasswordModal({ user, onSubmit, onClose }) {
  const [password, setPassword] = useState(() => generatePassword());
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  if (!user) return null;

  const submit = async (e) => {
    e.preventDefault();
    const issue = passwordIssue(password);
    if (issue) { setError(issue); return; }
    setSaving(true);
    setError('');
    try {
      await onSubmit(password);
    } catch (err) {
      setError(getErrorMessage(err));
      setSaving(false);
    }
  };

  return (
    <Modal open title={`Reset password for ${user.name}`} size="max-w-md" onClose={onClose}>
      <form onSubmit={submit} noValidate>
        <div className="space-y-3 px-5 py-5 text-sm">
          <p>Set a temporary password. They will be signed out everywhere and must choose a new password at next sign in.</p>
          <PasswordField
            label="Temporary password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError(''); }}
            onGenerate={() => setPassword(generatePassword())}
            error={error}
            required
          />
        </div>
        <div className="flex justify-end gap-3 border-t border-line px-5 py-4">
          <button type="button" onClick={onClose} className="rounded-md border border-line px-4 py-2 text-sm font-medium hover:bg-canvas">Cancel</button>
          <button type="submit" disabled={saving} className="rounded-md bg-signal px-4 py-2 text-sm font-semibold text-asphalt hover:bg-signal-dark disabled:opacity-60">
            {saving ? 'Resetting...' : 'Reset password'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
