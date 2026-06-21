// Colour coding for winds and glide ratios (matches the reference palette).
import { toKt } from './units';

const GOOD = '#3fd07a';
const YELLOW = '#f2c40c';
const ACCENT = '#f2a40c';
const DANGER = '#ff6b5e';

/** Wind colour by speed band: ≤4 kt green, ≤11 yellow, ≤18 orange, else red. */
export function windCol(ms: number): string {
  const k = toKt(ms);
  if (k <= 4) return GOOD;
  if (k <= 11) return YELLOW;
  if (k <= 18) return ACCENT;
  return DANGER;
}

/** Glide-ratio colour: negative/very low is dangerous, high is good. */
export function grCol(gr: number): string {
  if (gr < 0) return '#b3402f';
  if (gr < 0.9) return DANGER;
  if (gr < 1.6) return ACCENT;
  if (gr < 2.4) return YELLOW;
  return GOOD;
}

export const WIND_BANDS = [
  { c: GOOD, t: '0–4 kt' },
  { c: YELLOW, t: '5–11 kt' },
  { c: ACCENT, t: '12–18 kt' },
  { c: DANGER, t: '>18 kt' },
];
