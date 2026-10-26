import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import ChartTooltip from './ChartTooltip';
import { useReducedMotion } from './palette';

// data: [{ name, value, color }]. The legend lists every entry (including zeros) with count and share.
export default function DonutChart({ data, centerLabel = 'Total', total }) {
  const reduced = useReducedMotion();
  const sum = total ?? data.reduce((a, d) => a + d.value, 0);
  const visible = data.filter((d) => d.value > 0);

  return (
    <div className="flex flex-col items-center gap-5 @md:flex-row @md:items-center @md:gap-8">
      <div className="relative h-44 w-44 shrink-0" aria-hidden="true">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={visible}
              dataKey="value"
              nameKey="name"
              innerRadius="64%"
              outerRadius="100%"
              paddingAngle={visible.length > 1 ? 2 : 0}
              stroke="none"
              isAnimationActive={!reduced}
            >
              {visible.map((d) => <Cell key={d.name} fill={d.color} />)}
            </Pie>
            <Tooltip content={<ChartTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display text-3xl font-bold leading-none">{sum}</span>
          <span className="mt-1 text-xs text-slate-500">{centerLabel}</span>
        </div>
      </div>

      <ul className="w-full min-w-0 flex-1 space-y-2 text-sm">
        {data.map((d) => (
          <li key={d.name} className="flex items-center gap-2">
            <span className="h-3 w-3 shrink-0 rounded-sm" style={{ background: d.color }} aria-hidden="true" />
            <span className="min-w-0 flex-1 truncate" title={d.name}>{d.name}</span>
            <strong>{d.value}</strong>
            <span className="w-10 text-right text-xs text-slate-500">{sum ? Math.round((d.value / sum) * 100) : 0}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
