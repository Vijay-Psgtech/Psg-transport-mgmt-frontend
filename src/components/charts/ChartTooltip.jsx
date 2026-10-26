export default function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  // Hide zero-value series (stacked bars) unless everything is zero
  const rows = payload.some((p) => p.value > 0) ? payload.filter((p) => p.value > 0) : payload;

  return (
    <div className="rounded-md border border-line bg-white px-3 py-2 text-xs shadow-md">
      {label !== undefined && label !== '' && <p className="mb-1 font-semibold">{label}</p>}
      {rows.map((p) => (
        <p key={p.dataKey || p.name} className="flex items-center gap-2 py-0.5">
          <span className="h-2.5 w-2.5 rounded-sm" style={{ background: p.payload?.color || p.color || p.fill }} />
          <span className="text-slate-600">{p.name}</span>
          <strong className="ml-auto pl-3">{p.value}</strong>
        </p>
      ))}
    </div>
  );
}
