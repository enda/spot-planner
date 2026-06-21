// Loader + normaliser for static/landing-zones.json (hand-traced posing zones,
// runways and jump-run reference points, keyed by exact DZ name).

import { base } from '$app/paths';
import { draftJrRefs } from './admin';

export type LatLng = [number, number];

export interface PosingZone {
  name: string;
  color: string;
  polygon: LatLng[];
}

export interface JrRef {
  name: string;
  ll: LatLng;
}

export interface Runway {
  name?: string;
  a: LatLng;
  b: LatLng;
}

/** Raw shape as found in the JSON (jrRefs may be missing / take legacy forms). */
interface RawEntry {
  landingDir?: number | null;
  zones?: PosingZone[];
  runways?: Array<{ name?: string; a?: LatLng; b?: LatLng }>;
  runway?: { a?: LatLng; b?: LatLng; jrRef?: LatLng };
  jrRefs?: Array<{ name?: string; ll?: LatLng } | LatLng>;
  jrRef?: LatLng;
  jrName?: string;
}

export interface DzEntry {
  landingDir: number | null;
  zones: PosingZone[];
  runways: Runway[];
  jrRefs: JrRef[];
}

/** Collect runways from the new `runways` array or the legacy single `runway`. */
function entryRunways(raw: RawEntry): Runway[] {
  if (Array.isArray(raw.runways)) {
    return raw.runways
      .filter((r) => r.a && r.b)
      .map((r) => ({ name: r.name, a: r.a as LatLng, b: r.b as LatLng }));
  }
  if (raw.runway && raw.runway.a && raw.runway.b) {
    return [{ a: raw.runway.a, b: raw.runway.b }];
  }
  return [];
}

let cache: Record<string, RawEntry> | null = null;

/** Fetch and memoise the landing-zones database. */
export async function loadLandingZones(): Promise<Record<string, RawEntry>> {
  if (cache) return cache;
  const res = await fetch(`${base}/landing-zones.json`);
  if (!res.ok) throw new Error('landing-zones.json unavailable');
  const json = (await res.json()) as Record<string, RawEntry>;
  delete (json as Record<string, unknown>)['_schema'];
  cache = json;
  return json;
}

/**
 * Jump-run reference points: explicit `jrRefs` when present (preserving custom
 * names), else derived from the runways (mid + two thresholds each), else the
 * legacy single jrRef.
 */
export function normalizeJrRefs(entry: RawEntry | undefined, runways: Runway[]): JrRef[] {
  if (!entry) return [];
  if (Array.isArray(entry.jrRefs) && entry.jrRefs.length) {
    return entry.jrRefs.map((r, i) => {
      if (Array.isArray(r)) return { name: `repère ${i + 1}`, ll: r };
      return { name: r.name ?? `repère ${i + 1}`, ll: (r.ll ?? [0, 0]) as LatLng };
    });
  }
  if (runways.length) {
    return draftJrRefs(runways.map((rw) => ({ name: rw.name ?? '', a: rw.a, b: rw.b })));
  }
  const first = entry.jrRef ?? entry.runway?.jrRef ?? null;
  return first ? [{ name: entry.jrName ?? 'mid runway', ll: first }] : [];
}

/** Normalise a single DZ entry into a stable shape, or null when unknown. */
export function getDzEntry(db: Record<string, RawEntry> | null, name: string): DzEntry | null {
  if (!db) return null;
  const raw = db[name];
  if (!raw) return null;
  const runways = entryRunways(raw);
  return {
    landingDir: typeof raw.landingDir === 'number' ? raw.landingDir : null,
    zones: raw.zones ?? [],
    runways,
    jrRefs: normalizeJrRefs(raw, runways),
  };
}
