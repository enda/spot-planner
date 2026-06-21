// Unit conversions and display formatters.
// Wind speed is stored internally in m/s, altitudes/distances in metres.

export const MS_TO_KT = 1.94384;
export const M_TO_FT = 3.28084;

export type WindUnit = 'kt' | 'ms';
export type AltUnit = 'm' | 'ft';

export const toKt = (ms: number): number => ms * MS_TO_KT;
export const fromKt = (kt: number): number => kt / MS_TO_KT;
export const toFt = (m: number): number => m * M_TO_FT;
export const fromFt = (ft: number): number => ft / M_TO_FT;

/** Display a wind speed (stored m/s) in the active unit, e.g. "12 kt" / "6.2 m/s". */
export function fmtSpeed(ms: number, unit: WindUnit): string {
  return unit === 'kt' ? `${Math.round(toKt(ms))} kt` : `${Math.round(ms * 10) / 10} m/s`;
}

/** Numeric speed value (no unit suffix) in the active unit. */
export function dispSpeed(ms: number, unit: WindUnit): number {
  return unit === 'kt' ? Math.round(toKt(ms)) : Math.round(ms * 10) / 10;
}

/** Convert a user-entered speed (active unit) back to m/s. */
export function speedToMs(value: number, unit: WindUnit): number {
  return unit === 'kt' ? fromKt(value) : value;
}

/** Display an altitude/distance (stored m) in the active unit, e.g. "300 m" / "984 ft". */
export function fmtAlt(m: number, unit: AltUnit): string {
  return unit === 'ft' ? `${Math.round(toFt(m))} ft` : `${Math.round(m)} m`;
}

/** Numeric altitude value (no unit suffix) in the active unit. */
export function dispAlt(m: number, unit: AltUnit): number {
  return unit === 'ft' ? Math.round(toFt(m)) : Math.round(m);
}

/** Convert a user-entered altitude (active unit) back to metres. */
export function altToM(value: number, unit: AltUnit): number {
  return unit === 'ft' ? fromFt(value) : value;
}

export const altLabel = (unit: AltUnit): string => (unit === 'ft' ? 'ft' : 'm');
export const speedLabel = (unit: WindUnit): string => (unit === 'kt' ? 'kt' : 'm/s');
