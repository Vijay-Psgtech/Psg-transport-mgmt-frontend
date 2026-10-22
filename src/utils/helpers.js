export function getErrorMessage(err) {
  if (err?.response?.data?.message) return err.response.data.message;
  if (err?.request) return 'Cannot reach the server. Check your connection and try again.';
  return err?.message || 'Something went wrong. Try again.';
}

export const formatDate = (value) =>
  value ? new Date(value).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';

// ISO string -> yyyy-mm-dd for <input type="date">
export const toDateInput = (value) => (value ? new Date(value).toISOString().slice(0, 10) : '');

export function docStatus(expiry) {
  if (!expiry) return 'unknown';
  const days = Math.ceil((new Date(expiry) - Date.now()) / 86400000);
  if (days < 0) return 'expired';
  if (days <= 30) return 'expiring';
  return 'valid';
}

// Worst status across all documents of a vehicle
export function worstDocStatus(docs = []) {
  if (!docs.length) return 'none';
  for (const s of ['expired', 'expiring', 'valid']) {
    if (docs.some((d) => docStatus(d.expiryDate) === s)) return s;
  }
  return 'valid';
}
