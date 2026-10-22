import { useEffect } from 'react';

export default function Modal({ open, title, onClose, children, size = 'max-w-3xl' }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-asphalt/60 p-4 sm:p-8"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className={`w-full ${size} rounded-lg bg-white shadow-xl`}>
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 className="font-display text-xl font-bold">{title}</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-md p-1 text-slate-500 hover:bg-canvas focus:outline-none focus-visible:ring-2 focus-visible:ring-signal"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M5 5l10 10M15 5L5 15" />
            </svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
