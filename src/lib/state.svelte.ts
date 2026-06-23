// Central application state (Svelte 5 runes) + localStorage persistence.
//
// Persisted: the user's "settings" — units, canopy & pilot, circuit altitudes,
// jump-run, map basemap and legend toggles, plus the last selected DZ name.
// Ephemeral: the live target, fetched winds, map bearing, transient messages.

import { base } from '$app/paths';
import {
  DEFAULT_WINDS,
  loadRealWinds,
  type WindsResult,
} from './winds';
import type { AltUnit, WindUnit } from './units';
import type { Handed, LandingMode, PhysState, Wind } from './physics';
import { windAt, landingHeading } from './physics';
import {
  DROPZONES,
  dzToTarget,
  nearestDropzone,
  type Dropzone,
  type Target,
} from './dropzones';
import {
  getDzEntry,
  loadLandingZones,
  type DzEntry,
  type Runway,
} from './landingZones';
import {
  parseEmbed,
  buildEmbedParams,
  buildCircuitShareParams,
  type EmbedConfig,
  type EmbedSource,
} from './embed';
import * as m from './paraglide/messages';
import {
  ADMIN_SWATCHES,
  buildProposal,
  emptyDraft,
  runwayRefs,
  runwayLabel,
  seuilNum,
  bearingDeg,
  type AdminDraft,
  type AdminMode,
  type AdminTool,
} from './admin';
import type { LatLng } from './physics';

const STORAGE_KEY = 'spotplanner.settings.v1';

export type Basemap = 'sat' | 'plan';

interface PersistedSettings {
  windUnit: WindUnit;
  altUnit: AltUnit;
  canopy: number;
  weight: number;
  fwdOv: number | null;
  descOv: number | null;
  handed: Handed;
  landingMode: LandingMode;
  landingDir: number;
  dwAlt: number;
  baseAlt: number;
  finalAlt: number;
  zoneAlt: number;
  basemap: Basemap;
  jumpRun: boolean;
  jumpRunDir: number;
  jumpRefIdx: number;
  jumpDirAuto: boolean;
  showCircuit: boolean;
  showIdeal: boolean;
  showLegs: boolean;
  showCompass: boolean;
  showLabels: boolean;
  showOpenZone: boolean;
  showJrRefs: boolean;
  showZones: boolean;
  showRunways: boolean;
  showHeading: boolean;
  showTarget: boolean;
  showWind: boolean;
  showWindLayer: boolean;
  lastDz: string | null;
}

class AppState {
  // — Persisted settings —
  windUnit = $state<WindUnit>('kt');
  altUnit = $state<AltUnit>('m');
  canopy = $state(170);
  weight = $state(90);
  fwdOv = $state<number | null>(null);
  descOv = $state<number | null>(null);
  handed = $state<Handed>('left');
  landingMode = $state<LandingMode>('wind');
  landingDir = $state(240);
  dwAlt = $state(300);
  baseAlt = $state(200);
  finalAlt = $state(100);
  openAlt = $state(1000);
  zoneAlt = $state(650);
  basemap = $state<Basemap>('sat');
  jumpRun = $state(false);
  jumpRunDir = $state(0);
  jumpRunOffset = $state(0);
  jumpRefIdx = $state(0);
  // When true, the jump-run axis tracks the 4000 m wind (face au vent).
  jumpDirAuto = $state(true);
  showCircuit = $state(true);
  showIdeal = $state(true);
  showLegs = $state(false);
  showCompass = $state(false);
  showLabels = $state(true);
  showOpenZone = $state(false);
  showJrRefs = $state(false); // jump-run reference points (mid runway / seuils) on the map
  showZones = $state(true); // hand-traced posing zones (polygons)
  showRunways = $state(false); // runway lines (off by default — big white stroke)
  showHeading = $state(false); // canopy-heading arrows on each circuit node
  showTarget = $state(true); // the target / cible marker
  showWind = $state(false); // widget expanded (vs. collapsed chip); collapsed by default
  showWindLayer = $state(true); // whole wind layer visible (arrows + widget)
  lastDz = $state<string | null>(null);

  // — Ephemeral state —
  target = $state<Target | null>(null);
  winds = $state<Wind[]>(DEFAULT_WINDS);
  windAlt = $state(0);
  bearing = $state(0);
  zoom = $state(15);
  embed = $state(false);
  // "Circuit of the day": landing/pattern/jump-run are imposed (read-only) until
  // the user changes DZ. Canopy, pilot and target stay editable.
  circuitLocked = $state(false);
  query = $state('');
  geoMsg = $state('');
  windsLoading = $state(false);
  windsErr = $state('');
  windsSource = $state('');
  legendHidden = $state(true);
  fullscreen = $state(false);
  db = $state<Record<string, unknown> | null>(null);
  private dbVersion = $state(0);
  private booted = false;

  // — Admin (DZ editor) —
  adminOpen = $state(false);
  adminMode = $state<AdminMode>('add');
  adminTool = $state<AdminTool>('target');
  adminActiveZone = $state<number | null>(null);
  adminActiveRunway = $state<number | null>(null);
  adminMoveIdx = $state<number | null>(null);
  adminResult = $state<string | null>(null);
  adminDraft = $state<AdminDraft>(emptyDraft());
  private adminEnteredFs = false; // did opening admin trigger fullscreen (mobile)?

  /** Snapshot used by the pure physics module. */
  get phys(): PhysState {
    return {
      winds: this.winds,
      weight: this.weight,
      canopy: this.canopy,
      fwdOv: this.fwdOv,
      descOv: this.descOv,
      handed: this.handed,
      landingMode: this.landingMode,
      landingDir: this.landingDir,
      dwAlt: this.dwAlt,
      baseAlt: this.baseAlt,
      finalAlt: this.finalAlt,
      openAlt: this.openAlt,
      zoneAlt: this.zoneAlt,
    };
  }

  /** Hand-traced entry (zones/runway/jrRefs) for the current target, if any. */
  get entry(): DzEntry | null {
    this.dbVersion; // track
    if (!this.target) return null;
    return getDzEntry(this.db as never, this.target.name);
  }

  get runways(): Runway[] {
    return this.entry?.runways ?? [];
  }

  get jrRefs() {
    return this.entry?.jrRefs ?? [];
  }

  /**
   * The point that drives the circuit + winds. While the admin editor is open
   * and the draft target is placed, that draft point wins — so you can draw the
   * whole circuit (and get winds) for a DZ you're still creating, even with no
   * DZ selected. Otherwise it's the selected DZ.
   */
  get activeTarget(): Target | null {
    const d = this.adminDraft;
    if (this.adminOpen && isFinite(d.lat) && isFinite(d.lng)) {
      return { lat: d.lat, lng: d.lng, name: d.name || 'Cible', country: d.country || '' };
    }
    return this.target;
  }

  /**
   * Move the active target. While editing a DZ it moves the admin draft; with a
   * DZ selected it nudges that target; otherwise it creates a bare target so the
   * map marker can be dragged anywhere (winds + circuit follow it).
   */
  moveActiveTarget(lat: number, lng: number): void {
    if (this.adminOpen) this.patchDraft({ lat, lng });
    else if (this.target) this.target = { ...this.target, lat, lng };
    else this.target = { lat, lng, name: '', country: '' };
    // Circuit (landingMode 'wind') and jump run (jumpDirAuto) re-face the wind on
    // their own once winds reload — but only for whatever the user hasn't set.
  }

  /** Label of the jump-run origin: selected ref, else mid runway, else the target. */
  get jrRefName(): string {
    const refs = this.jrRefs;
    const r = refs[Math.min(this.jumpRefIdx || 0, Math.max(0, refs.length - 1))];
    if (r?.name) return r.name;
    if (this.runways.length) return 'mid runway';
    return 'cible';
  }

  private serialize(): PersistedSettings {
    return {
      windUnit: this.windUnit,
      altUnit: this.altUnit,
      canopy: this.canopy,
      weight: this.weight,
      fwdOv: this.fwdOv,
      descOv: this.descOv,
      handed: this.handed,
      landingMode: this.landingMode,
      landingDir: this.landingDir,
      dwAlt: this.dwAlt,
      baseAlt: this.baseAlt,
      finalAlt: this.finalAlt,
      zoneAlt: this.zoneAlt,
      basemap: this.basemap,
      jumpRun: this.jumpRun,
      jumpRunDir: this.jumpRunDir,
      jumpRefIdx: this.jumpRefIdx,
      jumpDirAuto: this.jumpDirAuto,
      showCircuit: this.showCircuit,
      showIdeal: this.showIdeal,
      showLegs: this.showLegs,
      showCompass: this.showCompass,
      showLabels: this.showLabels,
      showOpenZone: this.showOpenZone,
      showJrRefs: this.showJrRefs,
      showZones: this.showZones,
      showRunways: this.showRunways,
      showHeading: this.showHeading,
      showTarget: this.showTarget,
      showWind: this.showWind,
      showWindLayer: this.showWindLayer,
      lastDz: this.lastDz,
    };
  }

  private hydrate(): boolean {
    if (typeof localStorage === 'undefined') return false;
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    try {
      const s = JSON.parse(raw) as Partial<PersistedSettings>;
      const keys = Object.keys(this.serialize()) as (keyof PersistedSettings)[];
      for (const k of keys) {
        if (s[k] !== undefined && s[k] !== null) {
          (this as Record<string, unknown>)[k] = s[k];
        } else if (k in s) {
          (this as Record<string, unknown>)[k] = s[k];
        }
      }
      return true;
    } catch {
      return false;
    }
  }

  /** One-time bootstrap: hydrate settings, load DB, geolocate → nearest DZ. */
  async init(): Promise<void> {
    if (this.booted) return;
    this.booted = true;

    const hadSaved = this.hydrate();
    this.loadDb();

    // A "Préparer son circuit" config link (params in the URL) wins over geoloc.
    const cfg = this.urlConfig();
    if (cfg.target) {
      this.applyConfig(cfg);
      this.setupPersistence();
      return;
    }

    // Geolocate FIRST so nothing else can block the permission prompt.
    // No geoloc ⇒ leave the DZ unselected, as specified.
    await this.geolocateAndSelect();

    // Persistence is set up after, and never allowed to break the boot path.
    this.setupPersistence();
    void hadSaved;
  }

  /** Bootstrap for the standalone /embed view: configure from URL, no geoloc/persist. */
  initEmbed(): void {
    if (this.booted) return;
    this.booted = true;
    this.embed = true;
    this.showWind = false;
    this.legendHidden = true;
    this.loadDb();
    this.applyConfig(this.urlConfig());
  }

  private loadDb(): void {
    loadLandingZones()
      .then((db) => {
        this.db = db as Record<string, unknown>;
        this.dbVersion++;
      })
      .catch(() => {});
  }

  private urlConfig(): EmbedConfig {
    if (typeof location === 'undefined') return { embed: false };
    return parseEmbed(location.hash || location.search);
  }

  /** Apply a parsed URL config onto the live state. */
  private applyConfig(cfg: EmbedConfig): void {
    if (cfg.basemap) this.basemap = cfg.basemap;
    if (cfg.windUnit) this.windUnit = cfg.windUnit;
    if (cfg.altUnit) this.altUnit = cfg.altUnit;
    if (cfg.canopy != null) this.canopy = cfg.canopy;
    if (cfg.weight != null) this.weight = cfg.weight;
    if (cfg.landingMode) this.landingMode = cfg.landingMode;
    if (cfg.landingDir != null) this.landingDir = cfg.landingDir;
    if (cfg.handed) this.handed = cfg.handed;
    if (cfg.dwAlt != null) this.dwAlt = cfg.dwAlt;
    if (cfg.baseAlt != null) this.baseAlt = cfg.baseAlt;
    if (cfg.finalAlt != null) this.finalAlt = cfg.finalAlt;
    if (cfg.jumpRefIdx != null) this.jumpRefIdx = cfg.jumpRefIdx;
    if (cfg.lock) this.circuitLocked = true;
    if (cfg.zoneAlt != null) this.zoneAlt = cfg.zoneAlt;
    if (cfg.windAlt != null) this.windAlt = cfg.windAlt;
    if (cfg.zoom != null) this.zoom = cfg.zoom;
    if (cfg.bearing != null) this.bearing = cfg.bearing;
    if (cfg.jumpRunDir != null) {
      this.jumpRunDir = cfg.jumpRunDir;
      this.jumpDirAuto = false;
    }
    if (cfg.jumpRunOffset != null) this.jumpRunOffset = cfg.jumpRunOffset;
    if (cfg.jumpRun != null) this.jumpRun = cfg.jumpRun;
    if (cfg.showOpenZone != null) this.showOpenZone = cfg.showOpenZone;
    if (cfg.showLegs != null) this.showLegs = cfg.showLegs;
    if (cfg.showCompass != null) this.showCompass = cfg.showCompass;
    if (cfg.showLabels != null) this.showLabels = cfg.showLabels;
    if (cfg.showIdeal != null) this.showIdeal = cfg.showIdeal;
    if (cfg.showCircuit != null) this.showCircuit = cfg.showCircuit;
    if (cfg.showWindLayer != null) this.showWindLayer = cfg.showWindLayer;
    if (cfg.target) {
      this.target = cfg.target;
      this.lastDz = cfg.target.name;
    }
    if (cfg.winds && cfg.winds.length) this.winds = cfg.winds;
    else if (this.target) void this.refreshWinds();
  }

  private embedSource(): EmbedSource {
    return {
      target: this.target ?? { lat: 0, lng: 0, name: '', country: '' },
      zoom: this.zoom,
      bearing: this.bearing,
      basemap: this.basemap,
      windUnit: this.windUnit,
      altUnit: this.altUnit,
      canopy: this.canopy,
      weight: this.weight,
      landingMode: this.landingMode,
      landingDir: this.landingDir,
      handed: this.handed,
      dwAlt: this.dwAlt,
      baseAlt: this.baseAlt,
      finalAlt: this.finalAlt,
      zoneAlt: this.zoneAlt,
      windAlt: this.windAlt,
      jumpRunDir: this.jumpRunDir,
      jumpRunOffset: this.jumpRunOffset,
      jumpRefIdx: this.jumpRefIdx,
      jumpRun: this.jumpRun,
      showOpenZone: this.showOpenZone,
      showLegs: this.showLegs,
      showCompass: this.showCompass,
      showLabels: this.showLabels,
      showIdeal: this.showIdeal,
      showCircuit: this.showCircuit,
      showWindLayer: this.showWindLayer,
      winds: this.winds,
    };
  }

  private origin(): string {
    if (typeof location === 'undefined') return '';
    return location.origin + base;
  }

  /** URL of the standalone embeddable map with the current view encoded. */
  embedUrl(): string {
    return `${this.origin()}/embed/#${buildEmbedParams(this.embedSource())}`;
  }

  /** URL of the full planner pre-configured with the current view. */
  configUrl(): string {
    const params = buildEmbedParams(this.embedSource()).replace(/(^|&)embed=1(&|$)/, '$1');
    return `${this.origin()}/#${params.replace(/^&/, '')}`;
  }

  embedSnippet(): string {
    return `<iframe src="${this.embedUrl()}" style="width:100%;height:600px;border:0;border-radius:12px" loading="lazy" allow="fullscreen"></iframe>`;
  }

  /** Shareable URL of the full planner with the current circuit imposed (QR code). */
  circuitShareUrl(): string {
    const t = this.target;
    if (!t) return this.origin() + '/';
    const params = buildCircuitShareParams({
      target: t,
      landingDir: landingHeading(this.phys),
      handed: this.handed,
      dwAlt: this.dwAlt,
      baseAlt: this.baseAlt,
      finalAlt: this.finalAlt,
      jumpRun: this.jumpRun,
      jumpRunDir: this.jumpRunDir,
      jumpRunOffset: this.jumpRunOffset,
      jumpRefIdx: this.jumpRefIdx,
    });
    return `${this.origin()}/#${params}`;
  }

  /** Persist settings to localStorage on any change (guarded). */
  private setupPersistence(): void {
    try {
      $effect.root(() => {
        $effect(() => {
          const data = this.serialize();
          if (typeof localStorage !== 'undefined') {
            try {
              localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
            } catch {
              /* quota / private mode — ignore */
            }
          }
        });
      });
    } catch (e) {
      console.warn('[spotplanner] persistence disabled:', e);
    }
  }

  /** Try the browser geolocation, then pick the closest dropzone. */
  async geolocateAndSelect(): Promise<void> {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      this.geoMsg = m.geo_unavailable();
      return;
    }
    if (typeof window !== 'undefined' && window.isSecureContext === false) {
      // getCurrentPosition is blocked on insecure origins (http on a LAN IP).
      this.geoMsg = m.geo_insecure();
      return;
    }
    this.geoMsg = m.geo_in_progress();
    const pos = await new Promise<GeolocationPosition | null>((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (p) => resolve(p),
        (err) => {
          console.warn('[spotplanner] geolocation error', err.code, err.message);
          resolve(null);
        },
        { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 },
      );
    });

    if (!pos) {
      this.geoMsg = m.geo_denied();
      return;
    }

    const me = { lat: pos.coords.latitude, lng: pos.coords.longitude };
    const { dz, km } = nearestDropzone(me);
    this.geoMsg = m.geo_nearest({ dz: dz.name, km: Math.round(km) });
    this.selectDz(dz, { keepMessage: true });
  }

  /** Select a dropzone: set the target, apply imposed axis, refresh winds. */
  selectDz(dz: Dropzone, opts: { keepMessage?: boolean } = {}): void {
    this.target = dzToTarget(dz);
    this.lastDz = dz.name;
    // Switching DZ releases an imposed "circuit of the day".
    this.circuitLocked = false;
    if (!opts.keepMessage) this.geoMsg = '';

    const entry = getDzEntry(this.db as never, dz.name);
    if (entry && typeof entry.landingDir === 'number') {
      this.landingMode = 'manual';
      this.landingDir = Math.round(entry.landingDir);
    }
    void this.refreshWinds();
  }

  /** Re-fetch open-meteo winds for a position (defaults to the active target). */
  async refreshWinds(coords?: { lat: number; lng: number }): Promise<void> {
    const t = coords ?? this.activeTarget;
    if (!t) return;
    const { lat, lng } = t;
    this.windsLoading = true;
    this.windsErr = '';
    try {
      const res: WindsResult = await loadRealWinds(lat, lng);
      this.winds = res.winds;
      this.windsSource = res.source;
      this.syncJumpDir();
    } catch {
      this.windsErr = m.winds_failed();
    } finally {
      this.windsLoading = false;
    }
  }

  resetSpeeds(): void {
    this.fwdOv = null;
    this.descOv = null;
  }

  /** True when the jump-run axis is anchored to the target itself (no runway). */
  get jumpRefIsTarget(): boolean {
    return this.jrRefs.length === 0;
  }

  /**
   * Auto-face the 4000 m wind — but only while untouched AND the axis is anchored
   * to the target (no runway reference). With a runway, the heading is left alone.
   */
  syncJumpDir(): void {
    if (this.jumpDirAuto && this.jumpRefIsTarget) {
      this.jumpRunDir = Math.round(windAt(this.winds, 4000).dir);
    }
  }

  /** A user-driven jump-run heading change (disables auto-tracking). */
  setJumpDir(deg: number): void {
    this.jumpRunDir = ((deg % 360) + 360) % 360;
    this.jumpDirAuto = false;
    this.jumpRun = true;
  }

  /** Explicit "into wind" button: always re-face the 4000 m wind (auto-tracked). */
  jumpDirToWind(): void {
    this.jumpDirAuto = true;
    this.jumpRunDir = Math.round(windAt(this.winds, 4000).dir);
    this.jumpRun = true;
  }

  /** Face the wind at a specific altitude (one-shot; no 4000 m auto-tracking). */
  jumpDirToWindAt(alt: number): void {
    this.jumpDirAuto = false;
    this.jumpRunDir = Math.round(windAt(this.winds, alt).dir);
    this.jumpRun = true;
  }

  // ——————————————— Admin (DZ editor) ———————————————

  openAdmin(mode: AdminMode): void {
    const t = this.target;
    this.adminOpen = true;
    this.adminMode = mode;
    this.adminResult = null;
    // On phones/tablets the drawer covers the map → go fullscreen so the map
    // stays visible (the drawer becomes a bottom sheet over it). Restored on close.
    if (
      typeof window !== 'undefined' &&
      window.matchMedia('(max-width: 1024px)').matches &&
      !this.fullscreen
    ) {
      this.fullscreen = true;
      this.adminEnteredFs = true;
    }
    if (mode === 'edit') {
      const name = t && DROPZONES.some((d) => d.name === t.name) ? t.name : DROPZONES[0].name;
      this.loadDraftFromDz(name);
    } else {
      this.adminTool = 'target';
      this.adminActiveZone = null;
      this.adminActiveRunway = null;
      this.adminDraft = emptyDraft({
        country: t?.country || 'France',
        lat: t?.lat ?? 46.6,
        lng: t?.lng ?? 2.5,
      });
    }
  }

  /**
   * Apply the current draft to the in-memory database so the edits are usable
   * right away this session. Not persisted (no localStorage) — gone on refresh;
   * the JSON proposal is still how changes get merged permanently.
   */
  applyDraftToSession(): void {
    const d = this.adminDraft;
    const name = d.name?.trim();
    if (!name) return;
    const entry = {
      landingDir: d.landingDir == null ? null : Math.round(+d.landingDir),
      zones: d.zones
        .filter((z) => z.polygon.length >= 3)
        .map((z) => ({
          name: z.name || 'Zone',
          color: z.color || '#36c2d6',
          polygon: z.polygon.map((p) => [p[0], p[1]] as LatLng),
        })),
      runways: d.runways
        .filter((rw) => rw.a && rw.b)
        .map((rw) => ({ ...(rw.name?.trim() ? { name: rw.name.trim() } : {}), a: rw.a, b: rw.b })),
      jrRefs: d.jrRefs.filter((r) => r && r.ll).map((r) => ({ name: r.name || 'repère', ll: r.ll })),
    };
    if (this.db) (this.db as Record<string, unknown>)[name] = entry;
    this.dbVersion++;
    const dz = DROPZONES.find((z) => z.name === name);
    if (dz) {
      dz.lat = d.lat;
      dz.lng = d.lng;
      dz.country = d.country || dz.country;
    } else {
      DROPZONES.push({ name, country: d.country || 'France', lat: d.lat, lng: d.lng });
    }
    this.target = { lat: d.lat, lng: d.lng, name, country: d.country || '' };
    this.lastDz = name;
  }

  closeAdmin(): void {
    this.applyDraftToSession();
    this.adminOpen = false;
    this.adminTool = 'target';
    this.adminActiveZone = null;
    this.adminActiveRunway = null;
    this.adminMoveIdx = null;
    if (this.adminEnteredFs) {
      this.fullscreen = false;
      this.adminEnteredFs = false;
    }
  }

  loadDraftFromDz(name: string): void {
    const dz = DROPZONES.find((d) => d.name === name);
    const entry = getDzEntry(this.db as never, name);
    this.adminDraft = {
      name,
      country: dz?.country ?? 'France',
      lat: dz?.lat ?? this.target?.lat ?? 46.6,
      lng: dz?.lng ?? this.target?.lng ?? 2.5,
      landingDir: entry && typeof entry.landingDir === 'number' ? entry.landingDir : null,
      zones: entry
        ? entry.zones.map((z) => ({
            name: z.name || 'Zone',
            color: z.color || '#36c2d6',
            polygon: z.polygon.map((p) => [p[0], p[1]] as LatLng),
          }))
        : [],
      runways: entry
        ? entry.runways.map((rw) => ({
            name: rw.name ?? '',
            a: [rw.a[0], rw.a[1]] as LatLng,
            b: [rw.b[0], rw.b[1]] as LatLng,
          }))
        : [],
      jrRefs: entry ? entry.jrRefs.map((r) => ({ name: r.name, ll: [r.ll[0], r.ll[1]] as LatLng })) : [],
    };
    this.adminTool = 'target';
    this.adminActiveZone = null;
    this.adminActiveRunway = null;
    this.adminResult = null;
  }

  patchDraft(patch: Partial<AdminDraft>): void {
    this.adminDraft = { ...this.adminDraft, ...patch };
    this.adminResult = null;
  }

  patchZone(i: number, patch: Partial<AdminDraft['zones'][number]>): void {
    const zones = this.adminDraft.zones.map((z, idx) => (idx === i ? { ...z, ...patch } : z));
    this.patchDraft({ zones });
  }

  addAdminZone(): void {
    const sw = ADMIN_SWATCHES;
    const n = this.adminDraft.zones.length;
    const zones = [...this.adminDraft.zones, { name: 'Zone ' + (n + 1), color: sw[n % sw.length], polygon: [] }];
    this.adminDraft = { ...this.adminDraft, zones };
    this.adminActiveZone = zones.length - 1;
    this.adminTool = 'zone';
    this.adminResult = null;
  }

  removeAdminZone(i: number): void {
    const zones = this.adminDraft.zones.filter((_, idx) => idx !== i);
    this.adminDraft = { ...this.adminDraft, zones };
    this.adminActiveZone = null;
    this.adminResult = null;
  }

  patchRunway(i: number, patch: Partial<AdminDraft['runways'][number]>): void {
    const runways = this.adminDraft.runways.map((rw, idx) => (idx === i ? { ...rw, ...patch } : rw));
    this.patchDraft({ runways });
  }

  /** Add a runway and arm the runway tool to draw its two ends. */
  addAdminRunway(): void {
    const runways = [...this.adminDraft.runways, { name: '', a: null, b: null }];
    this.adminDraft = { ...this.adminDraft, runways };
    this.adminActiveRunway = runways.length - 1;
    this.adminTool = 'runway';
    this.adminResult = null;
  }

  removeAdminRunway(i: number): void {
    const runways = this.adminDraft.runways.filter((_, idx) => idx !== i);
    this.adminDraft = { ...this.adminDraft, runways };
    this.adminActiveRunway = null;
    this.adminTool = 'none';
    this.adminResult = null;
  }

  /** Cancel an in-progress runway draw: drop it if it was never started. */
  cancelRunwayDraw(): void {
    const i = this.adminActiveRunway;
    if (i != null) {
      const rw = this.adminDraft.runways[i];
      if (rw && !rw.a) {
        this.removeAdminRunway(i);
        return;
      }
    }
    this.adminTool = 'none';
    this.adminActiveRunway = null;
  }

  patchRef(i: number, patch: Partial<AdminDraft['jrRefs'][number]>): void {
    const jrRefs = this.adminDraft.jrRefs.map((r, idx) => (idx === i ? { ...r, ...patch } : r));
    this.patchDraft({ jrRefs });
  }

  removeRef(i: number): void {
    const jrRefs = this.adminDraft.jrRefs.filter((_, idx) => idx !== i);
    this.patchDraft({ jrRefs });
  }

  /** Drag handlers: reposition a single draft point in place. */
  moveRef(i: number, ll: LatLng): void {
    this.patchRef(i, { ll });
  }

  moveZonePoint(zi: number, pi: number, ll: LatLng): void {
    const zones = this.adminDraft.zones.map((z, idx) =>
      idx === zi ? { ...z, polygon: z.polygon.map((p, k) => (k === pi ? ll : p)) } : z,
    );
    this.patchDraft({ zones });
  }

  moveRunwayEnd(ri: number, end: 'a' | 'b', ll: LatLng): void {
    this.patchRunway(ri, { [end]: ll });
  }

  setAdminTool(tool: AdminTool, idx: number | null = null): void {
    this.adminTool = tool;
    if (tool === 'zone') {
      if (idx != null) this.adminActiveZone = idx;
    } else if (tool === 'runway') {
      this.adminActiveRunway = idx;
    } else {
      this.adminActiveZone = idx;
    }
  }

  /** Map click while the admin drawer is open — depends on the active tool. */
  onMapClick(ll: LatLng): void {
    if (!this.adminOpen) return;
    const d = this.adminDraft;
    const tool = this.adminTool;
    if (tool === 'target') {
      this.patchDraft({ lat: ll[0], lng: ll[1] });
      void this.refreshWinds();
    } else if (tool === 'runway' && this.adminActiveRunway != null) {
      const i = this.adminActiveRunway;
      const rw = d.runways[i];
      if (!rw) return;
      if (!rw.a || (rw.a && rw.b)) {
        // First click (or restart): set the first threshold, clear the second.
        this.patchRunway(i, { a: ll, b: null });
      } else {
        // Second click: complete the runway. Default its name to "XX/YY" (its two
        // threshold numbers) when unnamed, then append mid + thresholds to the
        // editable reference list (all still freely tweakable afterwards).
        const a = rw.a;
        const name = rw.name?.trim()
          ? rw.name.trim()
          : `${seuilNum(bearingDeg(a, ll))}/${seuilNum(bearingDeg(ll, a))}`;
        const runways = d.runways.map((r2, idx) => (idx === i ? { ...r2, b: ll, name } : r2));
        const label = runwayLabel({ ...rw, b: ll, name }, i, runways.length);
        const jrRefs = [...d.jrRefs, ...runwayRefs(a, ll, label)];
        this.patchDraft({ runways, jrRefs });
        this.adminTool = 'none';
      }
    } else if (tool === 'jrref') {
      const jrRefs = [...d.jrRefs, { name: 'repère ' + (d.jrRefs.length + 1), ll }];
      this.patchDraft({ jrRefs });
      this.adminTool = 'none';
    } else if (tool === 'zone' && this.adminActiveZone != null) {
      const i = this.adminActiveZone;
      const zones = d.zones.map((z, idx) =>
        idx === i ? { ...z, polygon: [...z.polygon, ll] } : z,
      );
      this.patchDraft({ zones });
    }
  }

  adminValidate(): void {
    const today = new Date().toISOString().slice(0, 10);
    this.adminResult = JSON.stringify(buildProposal(this.adminDraft, this.adminMode, today), null, 2);
  }
}

export const app = new AppState();
export { DROPZONES };
export type { Dropzone, Target };
