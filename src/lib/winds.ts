// Real winds-aloft from open-meteo (free, no key, CORS-friendly).
// Pressure levels 1000→500 hPa + geopotential height → AGL altitude.
//
// Near-surface winds are tricky: in the lowest ~200 m a near-calm sample (the
// 10 m diagnostic OR the 1000 hPa level, depending on the spot) has an essentially
// random direction and pollutes the surface reading. We drop low samples below
// CALM_MS so the surface settles on the first usable wind (matching windaloft,
// which anchors on the lowest pressure level rather than the 10 m wind).

import type { Wind } from './physics';

/** Surface/atmosphere snapshot at the current hour — not winds-aloft. */
export interface Conditions {
  weatherCode: number | null;
  cloudTotal: number | null;
  cloudLow: number | null;
  cloudMid: number | null;
  cloudHigh: number | null;
  gust: number | null; // m/s
  wind: number | null; // m/s (10 m)
  visibility: number | null; // m
  cape: number | null; // J/kg
  qnh: number | null; // hPa surface pressure
  pmsl: number | null; // hPa sea-level pressure
  freezing: number | null; // m
  temp: number | null; // °C
  humidity: number | null; // %
  dewpoint: number | null; // °C
  precip: number | null; // mm
  rain: number | null; // mm
  showers: number | null; // mm
}

export interface WindsResult {
  winds: Wind[];
  source: string;
  conditions: Conditions;
}

/** One hourly forecast step (winds-aloft + ground conditions) at a given time. */
export interface ForecastStep {
  time: string; // local time of the DZ, "YYYY-MM-DDTHH:MM"
  winds: Wind[];
  conditions: Conditions;
}

export interface ForecastResult {
  steps: ForecastStep[];
  baseIdx: number; // index of the current hour within steps
  source: string; // 'open-meteo'
}

/** How many days of hourly forecast to fetch (today + the next 3). */
const FORECAST_DAYS = 4;

const COND_VARS = [
  'weather_code',
  'cloud_cover',
  'cloud_cover_low',
  'cloud_cover_mid',
  'cloud_cover_high',
  'wind_gusts_10m',
  'visibility',
  'cape',
  'surface_pressure',
  'pressure_msl',
  'freezing_level_height',
  'relative_humidity_2m',
  'dew_point_2m',
  'precipitation',
  'rain',
  'showers',
];

const LEVELS = [1000, 975, 950, 925, 900, 850, 800, 700, 600, 500];

// Below this altitude (m AGL), drop samples slower than this (m/s) — their
// direction is unreliable (light/variable wind or model near-surface artifact).
const LOW_ALT = 200;
const CALM_MS = 1.5;

/** Fallback profile used before the network responds (Gap-Tallard-ish SW wind). */
export const DEFAULT_WINDS: Wind[] = [
  { alt: 0, dir: 225, spd: 6.173 },
  { alt: 100, dir: 228, spd: 8.231 },
  { alt: 200, dir: 230, spd: 9.775 },
  { alt: 300, dir: 232, spd: 11.318 },
  { alt: 600, dir: 235, spd: 12.861 },
  { alt: 900, dir: 238, spd: 14.404 },
  { alt: 1200, dir: 240, spd: 15.946 },
  { alt: 1500, dir: 242, spd: 17.489 },
  { alt: 2000, dir: 245, spd: 19.032 },
  { alt: 3000, dir: 248, spd: 21.604 },
  { alt: 4000, dir: 250, spd: 24.176 },
  { alt: 5000, dir: 252, spd: 26.749 },
  { alt: 6000, dir: 255, spd: 29.321 },
];

interface Hourly {
  time: string[];
  [key: string]: (number | null)[] | string[];
}

/** Parse the winds-aloft profile + ground conditions at one hourly index. */
function parseStep(H: Hourly, elev: number, idx: number): ForecastStep | null {
  let winds: Wind[] = [];
  const num = (key: string): number | null => {
    const arr = H[key] as (number | null)[] | undefined;
    const v = arr?.[idx];
    return v == null ? null : v;
  };

  const s10 = num('windspeed_10m');
  const d10 = num('winddirection_10m');
  const t2 = num('temperature_2m');
  if (s10 != null && d10 != null)
    winds.push({ alt: 0, dir: Math.round(d10), spd: s10, ...(t2 != null ? { temp: t2 } : {}) });

  for (const p of LEVELS) {
    const sp = num(`windspeed_${p}hPa`);
    const dr = num(`winddirection_${p}hPa`);
    const gh = num(`geopotential_height_${p}hPa`);
    const tp = num(`temperature_${p}hPa`);
    if (sp != null && dr != null && gh != null) {
      const agl = gh - elev;
      if (agl > 20 && agl <= 6500) {
        winds.push({
          alt: Math.round(agl / 50) * 50,
          dir: Math.round(dr),
          spd: sp,
          ...(tp != null ? { temp: tp } : {}),
        });
      }
    }
  }

  winds.sort((a, b) => a.alt - b.alt);

  // Drop near-calm samples in the lowest layer (unreliable direction) — but keep
  // at least two points so the profile and surface reading stay defined.
  const usable = winds.filter((w) => !(w.alt <= LOW_ALT && w.spd < CALM_MS));
  if (usable.length >= 2) winds = usable;

  if (winds.length < 2) return null;

  const conditions: Conditions = {
    weatherCode: num('weather_code'),
    cloudTotal: num('cloud_cover'),
    cloudLow: num('cloud_cover_low'),
    cloudMid: num('cloud_cover_mid'),
    cloudHigh: num('cloud_cover_high'),
    gust: num('wind_gusts_10m'),
    wind: s10,
    visibility: num('visibility'),
    cape: num('cape'),
    qnh: num('surface_pressure'),
    pmsl: num('pressure_msl'),
    freezing: num('freezing_level_height'),
    temp: t2,
    humidity: num('relative_humidity_2m'),
    dewpoint: num('dew_point_2m'),
    precip: num('precipitation'),
    rain: num('rain'),
    showers: num('showers'),
  };

  return { time: (H.time[idx] as string) ?? '', winds, conditions };
}

/**
 * Fetch the hourly forecast (today + next 3 days) for a location and parse every
 * hour into a step. Times come back in the DZ's local timezone; `baseIdx` points
 * at the current hour so callers can default to "now" and scrub forward.
 */
export async function loadForecast(lat: number, lng: number): Promise<ForecastResult> {
  const vars: string[] = [];
  for (const p of LEVELS) {
    vars.push(`windspeed_${p}hPa`, `winddirection_${p}hPa`, `geopotential_height_${p}hPa`, `temperature_${p}hPa`);
  }
  vars.push('windspeed_10m', 'winddirection_10m', 'temperature_2m', ...COND_VARS);

  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${lat.toFixed(4)}` +
    `&longitude=${lng.toFixed(4)}&hourly=${vars.join(',')}&windspeed_unit=ms` +
    `&timezone=auto&forecast_days=${FORECAST_DAYS}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error('open-meteo HTTP ' + res.status);
  const j = (await res.json()) as { hourly: Hourly; elevation?: number; utc_offset_seconds?: number };

  const H = j.hourly;
  const elev = j.elevation ?? 0;
  const offset = (j.utc_offset_seconds ?? 0) * 1000;

  const steps: ForecastStep[] = [];
  for (let i = 0; i < H.time.length; i++) {
    const s = parseStep(H, elev, i);
    if (s) steps.push(s);
  }
  if (steps.length < 2) throw new Error('Pas de données pour ce lieu');

  // Current-hour index: the times are DZ-local, so convert each to true UTC
  // (local − utc_offset) before comparing with the real now.
  const now = Date.now();
  let baseIdx = 0;
  for (let i = 0; i < steps.length; i++) {
    if (Date.parse(steps[i].time + 'Z') - offset <= now) baseIdx = i;
  }

  return { steps, baseIdx, source: 'open-meteo' };
}
