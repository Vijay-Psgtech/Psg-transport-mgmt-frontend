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

// ---- Phase 2 ----
export const formatDateTime = (value) =>
  value
    ? new Date(value).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : 'Never';

// Mirrors the backend rule: 8+ characters with at least one letter and one number
export function passwordIssue(pw) {
  if (!pw || pw.length < 8) return 'Use at least 8 characters.';
  if (!/[A-Za-z]/.test(pw) || !/\d/.test(pw)) return 'Include at least one letter and one number.';
  return '';
}

// Random 12 character password using the browser's crypto source (no look-alike characters)
export function generatePassword(length = 12) {
  const sets = ['ABCDEFGHJKLMNPQRSTUVWXYZ', 'abcdefghijkmnopqrstuvwxyz', '23456789', '@#$%&*'];
  const all = sets.join('');
  const rand = (n) => crypto.getRandomValues(new Uint32Array(1))[0] % n;
  const chars = sets.map((s) => s[rand(s.length)]); // at least one of each kind
  while (chars.length < length) chars.push(all[rand(all.length)]);
  for (let i = chars.length - 1; i > 0; i--) {
    const j = rand(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join('');
}
