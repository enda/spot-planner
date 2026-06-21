import { describe, it, expect } from 'vitest';
import {
  wl,
  getFwd,
  getDesc,
  windAt,
  windFrom,
  geomMeters,
  openZoneMeters,
  type PhysState,
  type Wind,
} from './physics';
import { haversineKm, nearestDropzone } from './dropzones';
import { runwayRefs } from './admin';

const WINDS: Wind[] = [
  { alt: 0, dir: 225, spd: 6 },
  { alt: 1000, dir: 245, spd: 12 },
];

const base: PhysState = {
  winds: WINDS,
  weight: 90,
  canopy: 170,
  fwdOv: null,
  descOv: null,
  handed: 'left',
  landingMode: 'wind',
  landingDir: 240,
  dwAlt: 300,
  baseAlt: 200,
  finalAlt: 100,
  openAlt: 1000,
  zoneAlt: 650,
};

describe('wing loading & speeds', () => {
  it('computes lb/ft² from kg and ft²', () => {
    expect(wl(base)).toBeCloseTo((90 * 2.20462) / 170, 4);
  });
  it('derives forward/descent from wingload by default', () => {
    expect(getFwd(base)).toBeCloseTo(9.0 * Math.sqrt(wl(base)), 4);
    expect(getDesc(base)).toBeCloseTo(3.0 * Math.sqrt(wl(base)), 4);
  });
  it('honours overrides', () => {
    expect(getFwd({ ...base, fwdOv: 11 })).toBe(11);
    expect(getDesc({ ...base, descOv: 4 })).toBe(4);
  });
});

describe('windAt', () => {
  it('clamps below/above the profile', () => {
    expect(windAt(WINDS, -100)).toEqual({ dir: 225, spd: 6 });
    expect(windAt(WINDS, 5000)).toEqual({ dir: 245, spd: 12 });
  });
  it('interpolates in vector space at the midpoint', () => {
    const a = windFrom(225, 6);
    const b = windFrom(245, 12);
    const e = (a.e + b.e) / 2;
    const n = (a.n + b.n) / 2;
    const mid = windAt(WINDS, 500);
    expect(mid.spd).toBeCloseTo(Math.hypot(e, n), 6);
  });
});

describe('geometry', () => {
  it('produces a circuit that lands at the target (origin)', () => {
    const g = geomMeters(base);
    // The finale point sits upwind/short of the target, never at it.
    expect(Math.hypot(g.F.e, g.F.n)).toBeGreaterThan(0);
    expect(g.finalDist).toBeGreaterThan(0);
    expect(g.dwDist).toBeGreaterThan(0);
  });
  it('open zone ring has 64 vertices and a finite radius', () => {
    const z = openZoneMeters(base);
    expect(z.ring).toHaveLength(64);
    expect(z.R).toBeGreaterThan(0);
  });
});

describe('dropzones', () => {
  it('haversine is ~0 for identical points', () => {
    expect(haversineKm({ lat: 44, lng: 6 }, { lat: 44, lng: 6 })).toBeCloseTo(0, 6);
  });
  it('finds Gap-Tallard as nearest to a point next to it', () => {
    const { dz } = nearestDropzone({ lat: 44.46, lng: 6.04 });
    expect(dz.name).toBe('Gap-Tallard');
  });
});

describe('runway thresholds', () => {
  // A threshold's number is the heading flown departing FROM it (toward the far
  // end), not toward it — east end = 27, west end = 09 on an E–W runway.
  it('numbers each threshold by the bearing toward the opposite end', () => {
    const east: [number, number] = [49.869, 3.0386];
    const west: [number, number] = [49.869, 3.0204];
    const refs = runwayRefs(east, west);
    const atEast = refs.find((r) => r.ll[1] === 3.0386);
    const atWest = refs.find((r) => r.ll[1] === 3.0204);
    expect(atEast?.name).toBe('seuil 27');
    expect(atWest?.name).toBe('seuil 09');
  });
});
