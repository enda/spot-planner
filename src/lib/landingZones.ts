// Loader + normaliser for static/landing-zones.json (hand-traced posing zones,
// runways and jump-run reference points, keyed by exact DZ name).

import { base } from '$app/paths';

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
  a: LatLng;
  b: LatLng;
}

/** Raw shape as found in the JSON (jrRefs may be missing / take legacy forms). */
interface RawEntry {
  landingDir?: number | null;
  zones?: PosingZone[];
  runway?: { a?: LatLng; b?: LatLng; jrRef?: LatLng };
  jrRefs?: Array<{ name?: string; ll?: LatLng } | LatLng>;
  jrRef?: LatLng;
  jrName?: string;
}

export interface DzEntry {
  landingDir: number | null;
  zones: PosingZone[];
  runway: Runway | null;
  jrRefs: JrRef[];
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

/** Derive the jump-run reference points, falling back to mid-runway. */
export function normalizeJrRefs(entry: RawEntry | undefined): JrRef[] {
  if (!entry) return [];
  if (Array.isArray(entry.jrRefs) && entry.jrRefs.length) {
    return entry.jrRefs.map((r, i) => {
      if (Array.isArray(r)) return { name: `repère ${i + 1}`, ll: r };
      return { name: r.name ?? `repère ${i + 1}`, ll: (r.ll ?? [0, 0]) as LatLng };
    });
  }
  const refs: JrRef[] = [];
  const rw = entry.runway;
  const first =
    entry.jrRef ??
    rw?.jrRef ??
    (rw?.a && rw?.b ? ([(rw.a[0] + rw.b[0]) / 2, (rw.a[1] + rw.b[1]) / 2] as LatLng) : null);
  if (first) refs.push({ name: entry.jrName ?? 'mid runway', ll: first });
  return refs;
}

/** Normalise a single DZ entry into a stable shape, or null when unknown. */
export function getDzEntry(db: Record<string, RawEntry> | null, name: string): DzEntry | null {
  if (!db) return null;
  const raw = db[name];
  if (!raw) return null;
  const rw =
    raw.runway && raw.runway.a && raw.runway.b
      ? ({ a: raw.runway.a, b: raw.runway.b } as Runway)
      : null;
  return {
    landingDir: typeof raw.landingDir === 'number' ? raw.landingDir : null,
    zones: raw.zones ?? [],
    runway: rw,
    jrRefs: normalizeJrRefs(raw),
  };
}
