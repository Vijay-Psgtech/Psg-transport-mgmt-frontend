import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import ChartTooltip from './ChartTooltip';
import { AXIS_TICK, COLORS, GRID_STROKE, useReducedMotion } from './palette';

// data: [{ name, value, color? }]. horizontal = bars run left to right (best for long labels).
export default function BarsChart({ data, horizontal = false, color = COLORS.asphalt, valueLabel = 'Count', height = 240 }) {
  const reduced = useReducedMotion();
  const labelWidth = Math.min(120, Math.max(...data.map((d) => d.name.length)) * 6.5 + 10);
  const h = horizontal ? Math.max(180, data.length * 40 + 30) : height;

  return (
    <div aria-hidden="true" style={{ height: h }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout={horizontal ? 'vertical' : 'horizontal'}
          margin={{ top: 8, right: 16, left: 0, bottom: 0 }}
          barCategoryGap="22%"
        >
          <CartesianGrid stroke={GRID_STROKE} strokeDasharray="3 3" vertical={horizontal} horizontal={!horizontal} />
          {horizontal ? (
            <>
              <XAxis type="number" allowDecimals={false} tick={AXIS_TICK} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" width={labelWidth} tick={AXIS_TICK} axisLine={false} tickLine={false} />
            </>
          ) : (
            <>
              <XAxis dataKey="name" tick={{ ...AXIS_TICK, fontSize: 11 }} axisLine={false} tickLine={false} interval={0} />
              <YAxis allowDecimals={false} width={32} tick={AXIS_TICK} axisLine={false} tickLine={false} />
            </>
          )}
          <Tooltip content={<ChartTooltip />} cursor={{ fill: '#f2f4f7' }} />
          <Bar dataKey="value" name={valueLabel} radius={horizontal ? [0, 4, 4, 0] : [4, 4, 0, 0]} maxBarSize={36} isAnimationActive={!reduced}>
            {data.map((d) => <Cell key={d.name} fill={d.color || color} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
