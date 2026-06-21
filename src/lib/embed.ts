// Encode / decode the full map configuration into URL params, used by the
// "Intégrer la carte" dialog and the standalone /embed view.

import type { Wind } from './physics';
import type { Target } from './dropzones';
import type { AltUnit, WindUnit } from './units';
import type { Basemap } from './state.svelte';

export interface EmbedConfig {
  embed: boolean;
  target?: Target;
  zoom?: number;
  bearing?: number;
  basemap?: Basemap;
  windUnit?: WindUnit;
  altUnit?: AltUnit;
  canopy?: number;
  weight?: number;
  landingMode?: 'wind' | 'manual';
  landingDir?: number;
  handed?: 'left' | 'right';
  dwAlt?: number;
  baseAlt?: number;
  finalAlt?: number;
  zoneAlt?: number;
  windAlt?: number;
  jumpRunDir?: number;
  jumpRunOffset?: number;
  jumpRefIdx?: number;
  jumpRun?: boolean;
  /** Locked "circuit of the day": the circuit/jump-run controls are read-only. */
  lock?: boolean;
  showOpenZone?: boolean;
  showLegs?: boolean;
  showCompass?: boolean;
  showLabels?: boolean;
  showIdeal?: boolean;
  showCircuit?: boolean;
  showWind?: boolean;
  showWindLayer?: boolean;
  winds?: Wind[];
}

/** Parse `#…`/`?…` config params into a partial config (mirrors the prototype). */
export function parseEmbed(raw: string): EmbedConfig {
  const cfg: EmbedConfig = { embed: false };
  try {
    const s = raw.replace(/^[#?]/, '');
    if (!s) return cfg;
    const p = new URLSearchParams(s);
    const num = (k: string): number | null => {
      const v = p.get(k);
      return v == null || v === '' ? null : parseFloat(v);
    };
    const bool = (k: string): boolean | null => {
      const v = p.get(k);
      return v == null ? null : v === '1' || v === 'true';
    };

    if (p.get('embed')) cfg.embed = true;
    if (p.get('lat') && p.get('lng')) {
      cfg.target = {
        lat: +p.get('lat')!,
        lng: +p.get('lng')!,
        name: p.get('dz') || 'Cible',
        country: p.get('cy') || '',
      };
    }
    if (num('z') != null) cfg.zoom = num('z')!;
    if (num('b') != null) cfg.bearing = num('b')!;
    const bm = p.get('bm');
    if (bm === 'sat' || bm === 'plan') cfg.basemap = bm;
    const wu = p.get('wu');
    if (wu === 'kt' || wu === 'ms') cfg.windUnit = wu;
    const au = p.get('au');
    if (au === 'm' || au === 'ft') cfg.altUnit = au;
    if (num('cn') != null) cfg.canopy = num('cn')!;
    if (num('wt') != null) cfg.weight = num('wt')!;
    const lm = p.get('lm');
    if (lm === 'wind' || lm === 'manual') cfg.landingMode = lm;
    if (num('ld') != null) cfg.landingDir = num('ld')!;
    const ha = p.get('ha');
    if (ha === 'left' || ha === 'right') cfg.handed = ha;
    if (num('dw') != null) cfg.dwAlt = num('dw')!;
    if (num('ba') != null) cfg.baseAlt = num('ba')!;
    if (num('fi') != null) cfg.finalAlt = num('fi')!;
    if (num('za') != null) cfg.zoneAlt = num('za')!;
    if (num('wa') != null) cfg.windAlt = num('wa')!;
    if (num('jd') != null) cfg.jumpRunDir = num('jd')!;
    if (num('jo') != null) cfg.jumpRunOffset = num('jo')!;
    if (num('ji') != null) cfg.jumpRefIdx = num('ji')!;
    if (bool('jr') != null) cfg.jumpRun = bool('jr')!;
    if (bool('lock') != null) cfg.lock = bool('lock')!;
    if (bool('oz') != null) cfg.showOpenZone = bool('oz')!;
    if (bool('lg') != null) cfg.showLegs = bool('lg')!;
    if (bool('cp') != null) cfg.showCompass = bool('cp')!;
    if (bool('lb') != null) cfg.showLabels = bool('lb')!;
    if (bool('id') != null) cfg.showIdeal = bool('id')!;
    if (bool('cr') != null) cfg.showCircuit = bool('cr')!;
    if (bool('wv') != null) cfg.showWindLayer = bool('wv')!;
    const w = p.get('w');
    if (w) {
      const winds = w
        .split(';')
        .map((seg) => {
          const a = seg.split(',');
          return { alt: +a[0], dir: +a[1], spd: +a[2] };
        })
        .filter((x) => isFinite(x.alt) && isFinite(x.dir) && isFinite(x.spd));
      if (winds.length) cfg.winds = winds;
    }
  } catch {
    /* malformed — ignore */
  }
  return cfg;
}

export interface EmbedSource {
  target: Target;
  zoom: number;
  bearing: number;
  basemap: Basemap;
  theme?: string;
  windUnit: WindUnit;
  altUnit: AltUnit;
  canopy: number;
  weight: number;
  landingMode: 'wind' | 'manual';
  landingDir: number;
  handed: 'left' | 'right';
  dwAlt: number;
  baseAlt: number;
  finalAlt: number;
  zoneAlt: number;
  windAlt: number;
  jumpRunDir: number;
  jumpRunOffset: number;
  jumpRefIdx: number;
  jumpRun: boolean;
  showOpenZone: boolean;
  showLegs: boolean;
  showCompass: boolean;
  showLabels: boolean;
  showIdeal: boolean;
  showCircuit: boolean;
  showWindLayer: boolean;
  winds: Wind[];
}

/** Build the `embed=1&…` query string capturing the current view. */
export function buildEmbedParams(s: EmbedSource): string {
  const p = new URLSearchParams();
  p.set('embed', '1');
  p.set('lat', s.target.lat.toFixed(6));
  p.set('lng', s.target.lng.toFixed(6));
  if (s.target.name) p.set('dz', s.target.name);
  if (s.target.country) p.set('cy', s.target.country);
  p.set('z', String(Math.round(s.zoom)));
  p.set('b', String(Math.round(s.bearing)));
  p.set('bm', s.basemap);
  p.set('wu', s.windUnit);
  p.set('au', s.altUnit);
  p.set('cn', String(s.canopy));
  p.set('wt', String(s.weight));
  p.set('lm', s.landingMode);
  p.set('ld', String(Math.round(s.landingDir)));
  p.set('ha', s.handed);
  p.set('dw', String(Math.round(s.dwAlt)));
  p.set('ba', String(Math.round(s.baseAlt)));
  p.set('fi', String(Math.round(s.finalAlt)));
  p.set('za', String(Math.round(s.zoneAlt)));
  p.set('wa', String(Math.round(s.windAlt)));
  p.set('jd', String(Math.round(s.jumpRunDir)));
  p.set('jo', String(Math.round(s.jumpRunOffset)));
  p.set('ji', String(s.jumpRefIdx));
  p.set('jr', s.jumpRun ? '1' : '0');
  p.set('oz', s.showOpenZone ? '1' : '0');
  p.set('lg', s.showLegs ? '1' : '0');
  p.set('cp', s.showCompass ? '1' : '0');
  p.set('lb', s.showLabels ? '1' : '0');
  p.set('id', s.showIdeal ? '1' : '0');
  p.set('cr', s.showCircuit ? '1' : '0');
  p.set('wv', s.showWindLayer ? '1' : '0');
  p.set(
    'w',
    s.winds.map((x) => `${x.alt},${Math.round(x.dir)},${Math.round(x.spd * 1000) / 1000}`).join(';'),
  );
  return p.toString();
}

export interface CircuitShare {
  target: Target;
  landingDir: number; // resolved heading, frozen as manual
  handed: 'left' | 'right';
  dwAlt: number;
  baseAlt: number;
  finalAlt: number;
  jumpRun: boolean;
  jumpRunDir: number;
  jumpRunOffset: number;
  jumpRefIdx: number;
}

/**
 * Compact "circuit of the day" share string (no winds/zoom — keeps the QR small).
 * The circuit is frozen: landing direction is captured as a manual heading, and
 * `lock=1` marks the circuit/jump-run controls read-only until the DZ changes.
 */
export function buildCircuitShareParams(s: CircuitShare): string {
  const p = new URLSearchParams();
  p.set('lock', '1');
  p.set('lat', s.target.lat.toFixed(6));
  p.set('lng', s.target.lng.toFixed(6));
  if (s.target.name) p.set('dz', s.target.name);
  if (s.target.country) p.set('cy', s.target.country);
  p.set('lm', 'manual');
  p.set('ld', String(Math.round(s.landingDir)));
  p.set('ha', s.handed);
  p.set('dw', String(Math.round(s.dwAlt)));
  p.set('ba', String(Math.round(s.baseAlt)));
  p.set('fi', String(Math.round(s.finalAlt)));
  p.set('jr', s.jumpRun ? '1' : '0');
  p.set('jd', String(Math.round(s.jumpRunDir)));
  p.set('jo', String(Math.round(s.jumpRunOffset)));
  p.set('ji', String(s.jumpRefIdx));
  return p.toString();
}
