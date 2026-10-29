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
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto overflow-x-hidden bg-asphalt/60 p-0 sm:items-center sm:p-4 lg:p-8"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className={`flex h-[100dvh] min-h-0 w-5xl max-w-full flex-col overflow-hidden bg-white shadow-xl sm:h-auto sm:max-h-[calc(100dvh-2rem)] sm:rounded-xl lg:max-h-[calc(100dvh-4rem)] ${size}`}>
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-line px-4 py-3 sm:px-5 sm:py-4">
          <h2 className="min-w-0 break-words font-display text-lg font-bold sm:text-xl">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-md text-slate-500 hover:bg-canvas focus:outline-none focus-visible:ring-2 focus-visible:ring-signal"
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
