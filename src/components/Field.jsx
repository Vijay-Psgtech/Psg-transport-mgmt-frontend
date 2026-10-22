export const inputCls = (error) =>
  `w-full rounded-md border bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-signal ${
    error ? 'border-red-500' : 'border-line'
  }`;

export default function Field({ label, error, hint, required, className = '', children }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1 block text-sm font-medium">
        {label}
        {required && <span className="text-red-600"> *</span>}
      </span>
      {children}
      {error ? (
        <span className="mt-1 block text-xs text-red-600">{error}</span>
      ) : (
        hint && <span className="mt-1 block text-xs text-slate-500">{hint}</span>
      )}
    </label>
  );
}
