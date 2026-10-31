import { useEffect, useState } from 'react';

export const COLORS = {
  asphalt: '#1b2430',
  signal: '#f2b705',
  blue: '#2f6f9f',
  sage: '#5f9c86',
  rust: '#c2622d',
  lilac: '#8b7ab8',
  slate: '#94a3b8',
  green: '#1f8a5b',
  red: '#c0392b',
  amber: '#f2b705',
  paleAmber: '#f7dc8a',
};

export const TYPE_COLORS = { bus: COLORS.signal, minibus: COLORS.asphalt, van: COLORS.blue, car_hatchback: COLORS.sage, car_suv: COLORS.rust, car_sedan: COLORS.lilac };
export const FUEL_COLOR = COLORS.blue;
export const STATUS_COLORS = { active: COLORS.green, maintenance: COLORS.amber, inactive: COLORS.slate };
export const CLASS_COLORS = { LMV: COLORS.sage, HMV: COLORS.blue, HPMV: COLORS.asphalt, unknown: COLORS.slate };

// Chart axis styling shared by every chart
export const AXIS_TICK = { fontSize: 12, fill: '#475569' };
export const GRID_STROKE = '#e5e8ed';

// Recharts animates with JS, so honour the reduced-motion setting here
export function useReducedMotion() {
  const [reduced, setReduced] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const on = () => setReduced(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  return reduced;
}
