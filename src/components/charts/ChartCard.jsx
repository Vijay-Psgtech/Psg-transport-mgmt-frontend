// Card shell used by every chart. "@container" lets charts adapt to the card width, not the screen width.
export default function ChartCard({ title, subtitle, empty, emptyText = 'No data yet.', summary, className = '', children }) {
  return (
    <section className={`@container flex flex-col rounded-xl border border-line bg-white p-5 shadow-sm ${className}`} aria-label={title}>
      <header className="mb-4">
        <h3 className="font-display text-lg font-bold leading-tight">{title}</h3>
        {subtitle && <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>}
      </header>
      {empty ? (
        <p className="grid min-h-40 flex-1 place-items-center rounded-lg border border-dashed border-line px-4 text-center text-sm text-slate-500">
          {emptyText}
        </p>
      ) : (
        <div className="flex-1">{children}</div>
      )}
      {/* Screen readers get the numbers as text because the SVG is decorative */}
      {summary && <p className="sr-only">{summary}</p>}
    </section>
  );
}

export const summarise = (data) => data.map((d) => `${d.name}: ${d.value}`).join(', ');
