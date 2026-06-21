// Real winds-aloft from open-meteo (free, no key, CORS-friendly).
// Pressure levels 1000→500 hPa + geopotential height → AGL altitude.

import type { Wind } from './physics';

export interface WindsResult {
  winds: Wind[];
  source: string;
}

const LEVELS = [1000, 975, 950, 925, 900, 850, 800, 700, 600, 500];

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

/** Fetch and parse the winds profile for a location (winds in m/s, alt AGL m). */
export async function loadRealWinds(lat: number, lng: number): Promise<WindsResult> {
  const vars: string[] = [];
  for (const p of LEVELS) {
    vars.push(`windspeed_${p}hPa`, `winddirection_${p}hPa`, `geopotential_height_${p}hPa`);
  }
  vars.push('windspeed_10m', 'winddirection_10m');

  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${lat.toFixed(4)}` +
    `&longitude=${lng.toFixed(4)}&hourly=${vars.join(',')}&windspeed_unit=ms&forecast_days=1`;

  const res = await fetch(url);
  if (!res.ok) throw new Error('open-meteo HTTP ' + res.status);
  const j = (await res.json()) as { hourly: Hourly; elevation?: number };

  const H = j.hourly;
  const times = H.time;
  const now = Date.now();
  let idx = 0;
  for (let i = 0; i < times.length; i++) {
    if (new Date(times[i]).getTime() <= now) idx = i;
  }

  const elev = j.elevation ?? 0;
  const winds: Wind[] = [];
  const num = (key: string): number | null => {
    const arr = H[key] as (number | null)[] | undefined;
    const v = arr?.[idx];
    return v == null ? null : v;
  };

  const s10 = num('windspeed_10m');
  const d10 = num('winddirection_10m');
  if (s10 != null && d10 != null) winds.push({ alt: 0, dir: Math.round(d10), spd: s10 });

  for (const p of LEVELS) {
    const sp = num(`windspeed_${p}hPa`);
    const dr = num(`winddirection_${p}hPa`);
    const gh = num(`geopotential_height_${p}hPa`);
    if (sp != null && dr != null && gh != null) {
      const agl = gh - elev;
      if (agl > 20 && agl <= 6500) {
        winds.push({ alt: Math.round(agl / 50) * 50, dir: Math.round(dr), spd: sp });
      }
    }
  }

  winds.sort((a, b) => a.alt - b.alt);
  if (winds.length < 2) throw new Error('Pas de données pour ce lieu');

  return { winds, source: 'open-meteo · ' + times[idx].replace('T', ' ') };
}
