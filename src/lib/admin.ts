// Admin DZ editor: draft model, geo helpers and the JSON-proposal builder
// (ported from the prototype). Proposals are emitted for a human to merge into
// the DZ list + landing-zones.json — there is no backend.

import { rad, type LatLng } from './physics';

export const ADMIN_EMAIL = 'jerome.musialak@gmail.com';
export const ADMIN_SWATCHES = ['#3fd07a', '#36c2d6', '#f2a40c', '#ff6b5e', '#2a6fdb', '#a06bd6'];

export interface AdminZone {
  name: string;
  color: string;
  polygon: LatLng[];
}

export interface AdminRunway {
  name: string;
  a: LatLng | null;
  b: LatLng | null;
}

export interface AdminJrRef {
  name: string;
  ll: LatLng;
}

export interface AdminDraft {
  name: string;
  country: string;
  lat: number;
  lng: number;
  landingDir: number | null;
  zones: AdminZone[];
  runways: AdminRunway[];
  // Jump-run reference points. Drawing a runway appends its mid + thresholds
  // here; the list stays freely editable (rename, move, remove, add custom).
  jrRefs: AdminJrRef[];
}

export type AdminMode = 'add' | 'edit';
export type AdminTool = 'target' | 'runway' | 'jrref' | 'zone' | 'none';

export function emptyDraft(partial: Partial<AdminDraft> = {}): AdminDraft {
  return {
    name: '',
    country: 'France',
    lat: 46.6,
    lng: 2.5,
    landingDir: null,
    zones: [],
    runways: [],
    jrRefs: [],
    ...partial,
  };
}

/** Initial-course bearing p → q in degrees [0,360). */
export function bearingDeg(p: LatLng, q: LatLng): number {
  const y = Math.sin(rad(q[1] - p[1])) * Math.cos(rad(q[0]));
  const x =
    Math.cos(rad(p[0])) * Math.sin(rad(q[0])) -
    Math.sin(rad(p[0])) * Math.cos(rad(q[0])) * Math.cos(rad(q[1] - p[1]));
  const b = (Math.atan2(y, x) * 180) / Math.PI;
  return (b + 360) % 360;
}

/** Two-digit runway "seuil" number from a bearing, e.g. 040° → "04". */
export function seuilNum(b: number): string {
  let n = Math.round(b / 10);
  if (n === 0) n = 36;
  return ('0' + n).slice(-2);
}

/**
 * Auto jump-run refs for a runway a→b: mid + the two thresholds. A threshold's
 * number is the runway heading flown when departing from it (bearing from that
 * threshold TOWARD the opposite end). An optional prefix labels the runway.
 */
export function runwayRefs(a: LatLng, b: LatLng, prefix = ''): AdminJrRef[] {
  const mid: LatLng = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  const p = prefix ? prefix + ' · ' : '';
  return [
    { name: p + (prefix ? 'mid' : 'mid runway'), ll: mid },
    { name: p + 'seuil ' + seuilNum(bearingDeg(a, b)), ll: [a[0], a[1]] },
    { name: p + 'seuil ' + seuilNum(bearingDeg(b, a)), ll: [b[0], b[1]] },
  ];
}

/** Display label for a runway's references: its name, else "Piste N" when many. */
export function runwayLabel(rw: AdminRunway, i: number, total: number): string {
  const n = rw.name?.trim();
  if (n) return n;
  return total > 1 ? `Piste ${i + 1}` : '';
}

/** All jump-run references derived from the (completed) runways of a draft. */
export function draftJrRefs(runways: AdminRunway[]): AdminJrRef[] {
  const refs: AdminJrRef[] = [];
  runways.forEach((rw, i) => {
    if (!rw.a || !rw.b) return;
    refs.push(...runwayRefs(rw.a, rw.b, runwayLabel(rw, i, runways.length)));
  });
  return refs;
}

const r6 = (v: number): number => +v.toFixed(6);

/** Build the JSON proposal object for a draft. `today` is YYYY-MM-DD. */
export function buildProposal(d: AdminDraft, mode: AdminMode, today: string) {
  const name = d.name || 'Sans nom';
  const zonesObj = {
    landingDir: d.landingDir == null ? null : Math.round(+d.landingDir),
    zones: d.zones
      .filter((z) => z.polygon.length >= 3)
      .map((z) => ({
        name: z.name || 'Zone',
        color: z.color || '#36c2d6',
        polygon: z.polygon.map((p) => [r6(p[0]), r6(p[1])]),
      })),
    runways: d.runways
      .filter((rw) => rw.a && rw.b)
      .map((rw) => ({
        ...(rw.name?.trim() ? { name: rw.name.trim() } : {}),
        a: [r6(rw.a![0]), r6(rw.a![1])],
        b: [r6(rw.b![0]), r6(rw.b![1])],
      })),
    jrRefs: d.jrRefs
      .filter((r) => r && r.ll)
      .map((r) => ({ name: r.name || 'repère', ll: [r6(r.ll[0]), r6(r.ll[1])] })),
  };
  return {
    _proposition: { type: mode === 'edit' ? 'modification' : 'ajout', date: today },
    dz: { name, country: d.country || '', lat: r6(d.lat), lng: r6(d.lng) },
    landingZones: { [name]: zonesObj },
  };
}
