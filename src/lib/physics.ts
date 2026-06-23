// Canopy-flight maths, ported faithfully from the reference prototype's
// `Component` class. All functions are pure: they take the relevant state and
// return numbers / vectors. Internals use a local ENU frame in metres where
// `e` = east, `n` = north. Wind direction is the meteorological "from" bearing
// in degrees; speed is m/s. Altitudes/distances are metres.

export interface Wind {
  alt: number;
  dir: number;
  spd: number;
}

export interface Vec {
  e: number;
  n: number;
}

/** A geographic coordinate pair, [latitude, longitude]. */
export type LatLng = [number, number];

export type Handed = 'left' | 'right';
export type LandingMode = 'wind' | 'manual';

export interface PhysState {
  winds: Wind[];
  weight: number; // kg, equipped
  canopy: number; // ft²
  fwdOv: number | null; // forward-speed override (m/s)
  descOv: number | null; // descent-rate override (m/s)
  handed: Handed;
  landingMode: LandingMode;
  landingDir: number; // ° (manual mode)
  dwAlt: number; // downwind turn altitude (m)
  baseAlt: number; // base turn altitude (m)
  finalAlt: number; // final turn altitude (m)
  openAlt: number; // opening altitude for drift (m)
  zoneAlt: number; // canopy altitude H for the open zone (m)
}

export const rad = (d: number): number => (d * Math.PI) / 180;

/** Unit vector pointing TOWARDS bearing `dir`. */
export const unit = (dir: number): Vec => {
  const r = rad(dir);
  return { e: Math.sin(r), n: Math.cos(r) };
};

/** Wind as a "blowing-towards" vector? No — kept as the prototype: from-bearing components. */
export const windFrom = (dir: number, spd: number): Vec => {
  const r = rad(dir);
  return { e: spd * Math.sin(r), n: spd * Math.cos(r) };
};

/** Smallest signed angular difference a − b, in (−180, 180]. */
export const angDiff = (a: number, b: number): number => ((a - b + 540) % 360) - 180;

/** Wing loading in lb/ft². */
export const wl = (s: PhysState): number => (s.weight * 2.20462) / Math.max(1, s.canopy);

/** Forward speed (m/s): override, else 9·√wl. */
export const getFwd = (s: PhysState): number =>
  s.fwdOv != null ? s.fwdOv : 9.0 * Math.sqrt(wl(s));

/** Descent rate (m/s): override, else 3·√wl. */
export const getDesc = (s: PhysState): number =>
  s.descOv != null ? s.descOv : 3.0 * Math.sqrt(wl(s));

export type WlCategory = 'student' | 'intermediate' | 'sport' | 'performance' | 'elite';

/** Wing-loading category as a stable key (translated in the UI layer). */
export function wlCategory(s: PhysState): WlCategory {
  const w = wl(s);
  if (w < 1.0) return 'student';
  if (w < 1.3) return 'intermediate';
  if (w < 1.7) return 'sport';
  if (w < 2.2) return 'performance';
  return 'elite';
}

/** Interpolate the wind (dir/spd) at altitude `alt` from the layered profile. */
export function windAt(winds: Wind[], alt: number): { dir: number; spd: number } {
  const w = winds.slice().sort((a, b) => a.alt - b.alt);
  if (!w.length) return { dir: 0, spd: 0 };
  if (alt <= w[0].alt) return { dir: w[0].dir, spd: w[0].spd };
  const last = w[w.length - 1];
  if (alt >= last.alt) return { dir: last.dir, spd: last.spd };
  for (let i = 0; i < w.length - 1; i++) {
    if (alt >= w[i].alt && alt <= w[i + 1].alt) {
      const t = (alt - w[i].alt) / ((w[i + 1].alt - w[i].alt) || 1);
      const a = windFrom(w[i].dir, w[i].spd);
      const b = windFrom(w[i + 1].dir, w[i + 1].spd);
      const e = a.e + (b.e - a.e) * t;
      const n = a.n + (b.n - a.n) * t;
      const spd = Math.hypot(e, n);
      let dir = (Math.atan2(e, n) * 180) / Math.PI;
      if (dir < 0) dir += 360;
      return { dir, spd };
    }
  }
  return { dir: w[0].dir, spd: w[0].spd };
}

/** Heading the canopy lands on: surface wind, or the manual axis. */
export function landingHeading(s: PhysState): number {
  return s.landingMode === 'manual'
    ? (((s.landingDir % 360) + 360) % 360)
    : windAt(s.winds, 0).dir;
}

/**
 * Ground displacement of a leg flown at a fixed HEADING through the wind
 * (airspeed vector + wind), integrated over an altitude band — the real,
 * wind-drifted ground track.
 */
export function glegVec(s: PhysState, aTop: number, aBot: number, heading: Vec): Vec {
  const fwd = getFwd(s);
  const desc = Math.max(0.5, getDesc(s));
  let e = 0;
  let n = 0;
  const step = 5;
  for (let a = aBot; a < aTop; a += step) {
    const w = windAt(s.winds, a + step / 2);
    const r = rad(w.dir);
    const dt = step / desc;
    e += (fwd * heading.e + -w.spd * Math.sin(r)) * dt;
    n += (fwd * heading.n + -w.spd * Math.cos(r)) * dt;
  }
  return { e, n };
}

export interface Geom {
  F: Vec;
  B: Vec;
  D: Vec;
  Fi: Vec;
  Bi: Vec;
  Di: Vec;
  O: Vec;
  // Canopy headings (unit vectors) flown on each leg — the direction the pilot
  // faces, before wind drift. hD on the downwind leg (from D), hB base, hF final.
  hD: Vec;
  hB: Vec;
  hF: Vec;
  finalDist: number;
  baseDist: number;
  dwDist: number;
  driftMag: number;
}

/** The full circuit geometry in metres, chained back from the target (origin). */
export function geomMeters(s: PhysState): Geom {
  const tF = unit(landingHeading(s));
  const perp = { e: -tF.n, n: tF.e };
  const h = s.handed === 'left' ? -1 : 1;
  const tB = { e: h * perp.e, n: h * perp.n };
  const tD = { e: -tF.e, n: -tF.n };
  const desc = Math.max(0.5, getDesc(s));
  const fwd = getFwd(s);

  // Real drifted ground track (perpendicular headings, wind drifts each leg).
  const gF = glegVec(s, s.finalAlt, 0, tF);
  const gB = glegVec(s, s.baseAlt, s.finalAlt, tB);
  const gD = glegVec(s, s.dwAlt, s.baseAlt, tD);
  const F = { e: -gF.e, n: -gF.n };
  const B = { e: F.e - gB.e, n: F.n - gB.n };
  const D = { e: B.e - gD.e, n: B.n - gD.n };

  // Ideal no-wind rectangle (still air): straight perpendicular legs.
  const lF = fwd * (s.finalAlt / desc);
  const lB = fwd * ((s.baseAlt - s.finalAlt) / desc);
  const lD = fwd * ((s.dwAlt - s.baseAlt) / desc);
  const Fi = { e: -lF * tF.e, n: -lF * tF.n };
  const Bi = { e: Fi.e - lB * tB.e, n: Fi.n - lB * tB.n };
  const Di = { e: Bi.e - lD * tD.e, n: Bi.n - lD * tD.n };

  const dr = drift(s);
  const O = { e: -dr.e, n: -dr.n };

  return {
    F,
    B,
    D,
    Fi,
    Bi,
    Di,
    O,
    hD: tD,
    hB: tB,
    hF: tF,
    finalDist: Math.hypot(gF.e, gF.n),
    baseDist: Math.hypot(gB.e, gB.n),
    dwDist: Math.hypot(gD.e, gD.n),
    driftMag: Math.hypot(dr.e, dr.n),
  };
}

/** Along-track ground distance of a leg flown along `track` (used for footprint). */
export function legDist(s: PhysState, aTop: number, aBot: number, track: Vec): number {
  const fwd = getFwd(s);
  const desc = Math.max(0.5, getDesc(s));
  const step = 5;
  let dist = 0;
  for (let a = aBot; a < aTop; a += step) {
    const w = windAt(s.winds, a + step / 2);
    const r = rad(w.dir);
    const along = -w.spd * Math.sin(r) * track.e + -w.spd * Math.cos(r) * track.n;
    dist += (fwd + along) * (step / desc);
  }
  return dist;
}

/** Total under-canopy drift from 0 to the opening altitude. */
export function drift(s: PhysState): Vec {
  const desc = Math.max(0.5, getDesc(s));
  const step = 10;
  let e = 0;
  let n = 0;
  for (let a = 0; a < s.openAlt; a += step) {
    const w = windAt(s.winds, a + step / 2);
    const r = rad(w.dir);
    e += -w.spd * Math.sin(r) * (step / desc);
    n += -w.spd * Math.cos(r) * (step / desc);
  }
  return { e, n };
}

export interface OpenZone {
  ring: Vec[];
  center: Vec;
  R: number;
  dwind: Vec;
  /** Reachable distance (m) from the finale point F in unit direction (bx,bn). */
  reach: (bx: number, bn: number) => number;
}

/**
 * Reachability footprint: from which positions, opening at altitude H, can you
 * still glide back to the target? A disk of radius R = 0.85·fwd·(H−final)/desc,
 * shifted upwind by the under-canopy drift and anchored on the finale point F.
 */
export function openZoneMeters(s: PhysState): OpenZone {
  const fwd = getFwd(s);
  const desc = Math.max(0.5, getDesc(s));
  const H = Math.max(50, s.zoneAlt);
  const eff = 0.85;
  // Reserve the finale: usable navigation band is H → finalAlt only.
  const fa = Math.max(0, Math.min(H - 20, s.finalAlt || 0));
  const navH = Math.max(20, H - fa);
  const R = eff * fwd * (navH / desc);
  let de = 0;
  let dn = 0;
  const step = 10;
  for (let a = fa; a < H; a += step) {
    const w = windAt(s.winds, a + step / 2);
    const r = rad(w.dir);
    de += -w.spd * Math.sin(r) * (step / desc);
    dn += -w.spd * Math.cos(r) * (step / desc);
  }
  const reach = (bx: number, bn: number): number => {
    const dot = bx * de + bn * dn;
    const disc = dot * dot - (de * de + dn * dn) + R * R;
    const d = disc > 0 ? -dot + Math.sqrt(disc) : 0;
    return d < 0 ? 0 : d;
  };
  const F = geomMeters(s).F;
  const N = 64;
  const ring: Vec[] = [];
  for (let i = 0; i < N; i++) {
    const b = (i * 2 * Math.PI) / N;
    const bx = Math.sin(b);
    const bn = Math.cos(b);
    const d = reach(bx, bn);
    ring.push({ e: F.e + d * bx, n: F.n + d * bn });
  }
  return { ring, center: { e: F.e - de, n: F.n - dn }, R, dwind: { e: de, n: dn }, reach };
}

/** Convert a local ENU offset (metres) around origin `o` into a [lat,lng]. */
export function metersLatLng(
  o: { lat: number; lng: number },
  e: number,
  n: number,
): [number, number] {
  const dLat = n / 111320;
  const dLng = e / (111320 * Math.cos((o.lat * Math.PI) / 180));
  return [o.lat + dLat, o.lng + dLng];
}
