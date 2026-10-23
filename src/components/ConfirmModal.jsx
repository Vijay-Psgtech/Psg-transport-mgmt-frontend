import { useState } from 'react';
import Modal from './Modal';
import { getErrorMessage } from '../utils/helpers';

// Generic confirm dialog. onConfirm may be async; failures are shown inside the dialog.
export default function ConfirmModal({ open, title, children, confirmLabel = 'Confirm', danger = false, onConfirm, onClose }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const close = () => { setError(''); onClose(); };

  const confirm = async () => {
    setBusy(true);
    setError('');
    try {
      await onConfirm();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={open} title={title} size="max-w-md" onClose={close}>
      <div className="space-y-3 px-5 py-5 text-sm">
        {children}
        {error && <p role="alert" className="text-red-700">{error}</p>}
      </div>
      <div className="flex justify-end gap-3 border-t border-line px-5 py-4">
        <button onClick={close} className="rounded-md border border-line px-4 py-2 text-sm font-medium hover:bg-canvas">Cancel</button>
        <button
          onClick={confirm}
          disabled={busy}
          className={`rounded-md px-4 py-2 text-sm font-semibold disabled:opacity-60 ${
            danger ? 'bg-red-700 text-white hover:bg-red-800' : 'bg-signal text-asphalt hover:bg-signal-dark'
          }`}
        >
          {busy ? 'Please wait...' : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
