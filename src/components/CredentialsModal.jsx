import { useState } from 'react';
import Modal from './Modal';

// Shown once after creating a user or resetting a password, so the admin can hand over the temporary password
export default function CredentialsModal({ credentials, onClose }) {
  const [copied, setCopied] = useState(false);
  if (!credentials) return null;

  const text = `Phone: ${credentials.phone}\n${credentials.email ? `Email: ${credentials.email}\n` : ''}Temporary password: ${credentials.password}`;
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked: the values are visible to copy by hand */
    }
  };

  return (
    <Modal open title={credentials.reset ? 'Password reset' : 'Account created'} size="max-w-md" onClose={onClose}>
      <div className="space-y-4 px-5 py-5 text-sm">
        <p>
          Share these sign-in details with <strong>{credentials.name}</strong>. They can sign in with their phone number or email. This is the only time the password is shown.
          They will be asked to choose their own at first sign in.
        </p>
        <dl className="space-y-2 rounded-md border border-line bg-canvas p-3">
          <div><dt className="text-xs text-slate-500">Phone number</dt><dd className="font-medium">{credentials.phone || '-'}</dd></div>
          {credentials.email && <div><dt className="text-xs text-slate-500">Email</dt><dd className="font-medium break-all">{credentials.email}</dd></div>}
          <div><dt className="text-xs text-slate-500">Temporary password</dt><dd className="font-mono text-base font-semibold">{credentials.password}</dd></div>
        </dl>
      </div>
      <div className="flex justify-end gap-3 border-t border-line px-5 py-4">
        <button onClick={copy} className="rounded-md border border-line px-4 py-2 text-sm font-medium hover:bg-canvas">
          {copied ? 'Copied' : 'Copy details'}
        </button>
        <button onClick={onClose} className="rounded-md bg-signal px-4 py-2 text-sm font-semibold text-asphalt hover:bg-signal-dark">Done</button>
      </div>
    </Modal>
  );
}
