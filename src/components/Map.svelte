<script lang="ts">
  import { onMount } from 'svelte';
  import { app } from '$lib/state.svelte';
  import {
    geomMeters,
    openZoneMeters,
    metersLatLng,
    rad,
    type Geom,
    type PhysState,
  } from '$lib/physics';
  import { fmtAlt } from '$lib/units';
  import * as m from '$lib/paraglide/messages';
  import type { Target } from '$lib/dropzones';
  import type { DzEntry } from '$lib/landingZones';
  import WindWidget from './WindWidget.svelte';
  import WindArrows from './WindArrows.svelte';
  import Compass from './Compass.svelte';
  import MapSummary from './MapSummary.svelte';
  import Legend from './panels/Legend.svelte';

  let { embed = false }: { embed?: boolean } = $props();

  const drawingZone = $derived(app.adminTool === 'zone' && app.adminActiveZone != null);
  // A point-placing tool is active → show a crosshair instead of the pan hand.
  const placing = $derived(app.adminOpen && app.adminTool !== 'none');
  const banner = $derived.by(() => {
    const tool = app.adminTool;
    const d = app.adminDraft;
    const zi = app.adminActiveZone;
    if (tool === 'target')
      return { main: m.admin_b_target_main(), sub: m.admin_b_target_sub(), dot: 'var(--accent)' };
    if (tool === 'runway')
      return { main: m.admin_b_runway_main(), sub: m.admin_b_runway_sub(), dot: 'var(--jump)' };
    if (tool === 'jrref')
      return { main: m.admin_b_ref_main(), sub: m.admin_b_ref_sub(), dot: 'var(--jump)' };
    if (tool === 'zone' && zi != null) {
      const z = d.zones[zi];
      return {
        main: m.admin_b_zone_main({ name: z?.name || 'zone' }),
        sub: m.admin_b_zone_sub({ count: z?.polygon.length ?? 0 }),
        dot: z?.color || 'var(--accent2)',
      };
    }
    return { main: m.admin_b_none_main(), sub: m.admin_b_none_sub(), dot: 'var(--muted)' };
  });

  /* eslint-disable @typescript-eslint/no-explicit-any */
  let mapEl: HTMLDivElement;
  let ready = $state(false);

  // Leaflet handles (kept outside the reactive graph).
  let L: any;
  let map: any;
  let renderer: any;
  let markerT: any;
  let tile: any;
  let tileMode = '';
  let lastName = '';

  let lCircuit: any, lIdeal: any, lJump: any, lJumpArrow: any;
  let lNodes: any[] = [];
  let lLegs: any[] = [];
  let zoneRing: any = null;
  let zoneLayers: any[] = [];
  let refLayers: any[] = [];
  let adminLayer: any = null;
  let dragMoved = false;

  const BLANK = 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==';

  onMount(() => {
    let disposed = false;
    (async () => {
      const mod = await import('leaflet');
      L = mod.default ?? mod;
      (window as any).L = L;
      await import('leaflet-rotate');
      if (disposed) return;
      buildMap();
    })();
    return () => {
      disposed = true;
      if (map) {
        map.remove();
        map = null;
      }
    };
  });

  function buildMap() {
    const t = app.activeTarget ?? { lat: 46.6, lng: 2.5 };
    const canRotate = !!(L.Map && L.Map.prototype.setBearing);
    const opts: any = { zoomControl: true, attributionControl: true, scrollWheelZoom: true };
    if (canRotate) {
      opts.rotate = true;
      opts.touchRotate = true;
      opts.shiftKeyRotate = true;
      opts.bearing = 0;
      opts.rotateControl = { position: 'bottomleft', closeOnZeroBearing: false };
    }
    map = L.map(mapEl, opts).setView([t.lat, t.lng], app.activeTarget ? app.zoom || 15 : 5);
    if (canRotate && app.bearing) {
      try {
        map.setBearing(app.bearing);
      } catch {
        /* ignore */
      }
    }
    map.zoomControl.setPosition('bottomright');
    L.control.scale({ position: 'bottomleft', imperial: true, metric: true }).addTo(map);

    renderer = L.svg({ padding: 2 });
    ensureTiles(app.basemap);

    const ring =
      '<div style="width:22px;height:22px;border-radius:50%;border:3px solid #f2a40c;box-shadow:0 0 0 2px rgba(0,0,0,.45);background:rgba(242,164,12,.25)"></div>';
    const icon = L.divIcon({ className: '', html: ring, iconSize: [22, 22], iconAnchor: [11, 11] });
    markerT = L.marker([t.lat, t.lng], { draggable: true, autoPan: false, icon }).addTo(map);
    markerT.on('drag', () => {
      const ll = markerT.getLatLng();
      app.moveActiveTarget(ll.lat, ll.lng);
    });
    markerT.on('dragend', () => {
      // Recompute winds for the new spot (handy when placing a bare/admin target).
      void app.refreshWinds();
    });

    if (canRotate) {
      map.on('rotate rotateend', () => {
        const b = Math.round(((map.getBearing() % 360) + 360) % 360);
        if (b !== app.bearing) app.bearing = b;
        repaint();
      });
    }
    map.on('moveend zoomend', repaint);
    map.on('zoomend', () => {
      app.zoom = map.getZoom();
    });

    // Admin: place points by clicking the map (suppressed right after a pan).
    map.on('movestart dragstart zoomstart', () => {
      dragMoved = true;
    });
    map.on('moveend zoomend', () => {
      setTimeout(() => {
        dragMoved = false;
      }, 60);
    });
    map.on('click', (e: any) => {
      if (app.adminOpen && !dragMoved) app.onMapClick([+e.latlng.lat, +e.latlng.lng]);
    });

    map.whenReady(() => {
      map.invalidateSize({ animate: false });
      renderer.addTo(map);
      ready = true;
      lastName = app.target?.name ?? '';
      repaint();
    });
  }

  function ensureTiles(mode: 'sat' | 'plan') {
    if (!map) return;
    if (tileMode === mode && tile) return;
    if (tile) map.removeLayer(tile);
    if (mode === 'sat') {
      tile = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        {
          maxZoom: 19,
          maxNativeZoom: 18,
          crossOrigin: 'anonymous',
          errorTileUrl: BLANK,
          attribution: 'Imagery © Esri, Maxar, Earthstar Geographics',
        },
      );
    } else {
      tile = L.tileLayer(
        'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
        {
          maxZoom: 19,
          subdomains: 'abcd',
          crossOrigin: 'anonymous',
          errorTileUrl: BLANK,
          attribution: '© OpenStreetMap, © CARTO',
        },
      );
    }
    tile.addTo(map);
    tile.bringToBack();
    tileMode = mode;
  }

  function buildLayers() {
    const R = renderer;
    const z = [
      [0, 0],
      [0, 0],
    ];
    lIdeal = L.polyline(z, {
      renderer: R,
      interactive: false,
      color: '#36c2d6',
      weight: 3,
      dashArray: '9 6',
      opacity: 0.95,
    }).addTo(map);
    lJump = L.polyline(z, {
      renderer: R,
      interactive: false,
      color: '#c77dff',
      weight: 3.5,
      dashArray: '2 8',
      opacity: 0,
      lineCap: 'round',
    }).addTo(map);
    lJumpArrow = L.polyline(z, {
      renderer: R,
      interactive: false,
      color: '#c77dff',
      weight: 3.5,
      opacity: 0,
      lineCap: 'round',
      lineJoin: 'round',
    }).addTo(map);
    lCircuit = L.polyline(z, {
      renderer: R,
      interactive: false,
      color: '#f2a40c',
      weight: 4,
      opacity: 0.97,
    }).addTo(map);
    lNodes = [0, 1, 2].map(() =>
      L.circleMarker([0, 0], {
        renderer: R,
        interactive: false,
        radius: 6,
        weight: 3,
        fillOpacity: 1,
      }).addTo(map),
    );
    lLegs = [0, 1, 2].map(() => L.marker([0, 0], { opacity: 0, interactive: false }).addTo(map));
  }

  function fmtA(m: number): string {
    return fmtAlt(m, app.altUnit);
  }

  function updateOverlays(s: PhysState, tgt: Target) {
    const g: Geom = geomMeters(s);
    const o = { lat: tgt.lat, lng: tgt.lng };
    const LL = (p: { e: number; n: number }) => metersLatLng(o, p.e, p.n);

    lIdeal
      .setLatLngs([LL(g.Di), LL(g.Bi), LL(g.Fi), [o.lat, o.lng]])
      .setStyle({ opacity: app.showIdeal ? 0.95 : 0 });
    lCircuit
      .setLatLngs([LL(g.D), LL(g.B), LL(g.F), [o.lat, o.lng]])
      .setStyle({ opacity: app.showCircuit ? 0.97 : 0 });

    const nd: [[number, number], string][] = [
      [LL(g.D), fmtA(s.dwAlt)],
      [LL(g.B), fmtA(s.baseAlt)],
      [LL(g.F), fmtA(s.finalAlt)],
    ];
    nd.forEach((n, i) => {
      const m = lNodes[i];
      m.setLatLng(n[0]).setStyle({
        color: '#f2a40c',
        fillColor: '#0c1014',
        opacity: app.showCircuit ? 1 : 0,
        fillOpacity: app.showCircuit ? 1 : 0,
      });
      if (app.showLabels && app.showCircuit) {
        if (!m.getTooltip())
          m.bindTooltip('', { permanent: true, direction: 'right', offset: [8, 0], className: 'dz-tip' });
        m.setTooltipContent(n[1]);
      } else if (m.getTooltip()) m.unbindTooltip();
    });

    const mid = (a: [number, number], b: [number, number]): [number, number] => [
      (a[0] + b[0]) / 2,
      (a[1] + b[1]) / 2,
    ];
    const legs: [[number, number], string][] = [
      [mid(LL(g.D), LL(g.B)), fmtA(g.dwDist)],
      [mid(LL(g.B), LL(g.F)), fmtA(g.baseDist)],
      [mid(LL(g.F), [o.lat, o.lng]), fmtA(g.finalDist)],
    ];
    legs.forEach((lg, i) => {
      const m = lLegs[i];
      m.setLatLng(lg[0]);
      if (app.showLegs) {
        if (!m.getTooltip())
          m.bindTooltip('', { permanent: true, direction: 'center', className: 'leg-tip' });
        m.setTooltipContent(lg[1]);
      } else if (m.getTooltip()) m.unbindTooltip();
    });

    if (markerT) {
      const tt = markerT.getTooltip();
      if (app.showLabels) {
        if (!tt)
          markerT.bindTooltip('Cible', {
            permanent: true,
            direction: 'bottom',
            offset: [0, 9],
            className: 'dz-tip',
          });
      } else if (tt) markerT.unbindTooltip();
    }

    updateJump(o);
  }

  function updateJump(o: { lat: number; lng: number }) {
    if (!lJump) return;
    if (!app.jumpRun) {
      lJump.setStyle({ opacity: 0 });
      lJumpArrow.setStyle({ opacity: 0 });
      return;
    }
    const a = rad(((app.jumpRunDir % 360) + 360) % 360);
    const dir = { e: Math.sin(a), n: Math.cos(a) };
    // Right of the flight direction, so a positive offset reads as "droite".
    const perp = { e: dir.n, n: -dir.e };
    const refs = app.jrRefs;
    const sel = refs[Math.min(app.jumpRefIdx || 0, refs.length - 1)];
    let originLL: [number, number];
    if (sel && sel.ll) originLL = sel.ll;
    else originLL = [o.lat, o.lng];

    const off = app.jumpRunOffset || 0;
    const oMid = metersLatLng({ lat: originLL[0], lng: originLL[1] }, perp.e * off, perp.n * off);
    const mpp = (156543.03392 * Math.cos((o.lat * Math.PI) / 180)) / Math.pow(2, map.getZoom());
    const sz = map.getSize();
    const viewMin = Math.min(sz.x, sz.y) * mpp;
    const half = Math.max(150, viewMin * 0.42);
    const ahLen = Math.max(12, viewMin * 0.025);
    const ahW = ahLen * 0.62;
    const p1 = metersLatLng({ lat: oMid[0], lng: oMid[1] }, dir.e * half, dir.n * half);
    const p2 = metersLatLng({ lat: oMid[0], lng: oMid[1] }, -dir.e * half, -dir.n * half);
    lJump.setLatLngs([p2, p1]).setStyle({ opacity: 0.95 });
    const aw1 = metersLatLng(
      { lat: p1[0], lng: p1[1] },
      -dir.e * ahLen - perp.e * ahW,
      -dir.n * ahLen - perp.n * ahW,
    );
    const aw2 = metersLatLng(
      { lat: p1[0], lng: p1[1] },
      -dir.e * ahLen + perp.e * ahW,
      -dir.n * ahLen + perp.n * ahW,
    );
    lJumpArrow.setLatLngs([aw1, p1, aw2]).setStyle({ opacity: 0.95 });
  }

  function drawZones(entry: DzEntry | null) {
    if (!map || !ready) return;
    zoneLayers.forEach((l) => map.removeLayer(l));
    zoneLayers = [];
    if (!entry || !entry.zones) return;
    for (const zn of entry.zones) {
      const c = zn.color || '#36c2d6';
      const poly = L.polygon(zn.polygon, {
        renderer,
        interactive: false,
        color: c,
        weight: 2,
        fillColor: c,
        fillOpacity: 0.16,
      }).addTo(map);
      if (app.showLabels)
        poly.bindTooltip(zn.name || 'Zone', {
          permanent: true,
          direction: 'center',
          className: 'zone-tip',
        });
      zoneLayers.push(poly);
    }
  }

  /** Jump-run reference points (mid runway / thresholds) as toggleable markers. */
  function drawRefs(entry: DzEntry | null) {
    if (!map || !ready) return;
    refLayers.forEach((l) => map.removeLayer(l));
    refLayers = [];
    if (!app.showJrRefs || !entry || !entry.jrRefs) return;
    entry.jrRefs.forEach((r) => {
      const mk = L.circleMarker(r.ll, {
        renderer,
        interactive: false,
        radius: 4,
        color: '#c77dff',
        weight: 2,
        fillColor: '#0c1014',
        fillOpacity: 1,
      }).addTo(map);
      if (app.showLabels)
        mk.bindTooltip(r.name || 'repère', {
          permanent: true,
          direction: 'right',
          offset: [6, 0],
          className: 'zone-tip',
        });
      refLayers.push(mk);
    });
  }

  function drawOpenZone(s: PhysState, tgt: Target) {
    if (!map || !ready) return;
    if (!app.showOpenZone) {
      if (zoneRing) {
        map.removeLayer(zoneRing);
        zoneRing = null;
      }
      return;
    }
    const o = { lat: tgt.lat, lng: tgt.lng };
    const ring = openZoneMeters(s).ring.map((p) => metersLatLng(o, p.e, p.n));
    if (!zoneRing) {
      zoneRing = L.polygon(ring, {
        renderer,
        interactive: false,
        color: '#36c2d6',
        weight: 2.5,
        dashArray: '1 7',
        lineCap: 'round',
        fillColor: '#36c2d6',
        fillOpacity: 0.07,
        opacity: 0.95,
      }).addTo(map);
    } else {
      zoneRing.setLatLngs(ring);
    }
  }

  /** A draggable admin handle (divIcon) that commits the new position on dragend. */
  function draftDot(
    ll: [number, number],
    color: string,
    fill: string,
    r: number,
    onMove: (ll: [number, number]) => void,
  ) {
    const html =
      `<div style="width:${r * 2}px;height:${r * 2}px;border-radius:50%;background:${fill};` +
      `border:2.5px solid ${color};box-sizing:border-box;box-shadow:0 0 0 1.5px rgba(0,0,0,.45);cursor:grab"></div>`;
    const icon = L.divIcon({ className: '', html, iconSize: [r * 2, r * 2], iconAnchor: [r, r] });
    const mk = L.marker(ll, { draggable: true, autoPan: false, keyboard: false, icon }).addTo(adminLayer);
    mk.on('dragend', () => {
      const p = mk.getLatLng();
      onMove([p.lat, p.lng]);
    });
    return mk;
  }

  function drawAdmin() {
    if (!map || !ready) return;
    if (!adminLayer) adminLayer = L.layerGroup().addTo(map);
    adminLayer.clearLayers();
    if (!app.adminOpen) return;
    const d = app.adminDraft;
    d.zones.forEach((z, i) => {
      const c = z.color || '#36c2d6';
      const active = i === app.adminActiveZone;
      if (z.polygon.length >= 3) {
        L.polygon(z.polygon, {
          renderer,
          interactive: false,
          color: c,
          weight: active ? 3 : 2,
          fillColor: c,
          fillOpacity: 0.2,
          dashArray: active ? '6 5' : undefined,
        }).addTo(adminLayer);
      } else if (z.polygon.length === 2) {
        L.polyline(z.polygon, { renderer, interactive: false, color: c, weight: 2.5, dashArray: '6 5' }).addTo(
          adminLayer,
        );
      }
      z.polygon.forEach((pt, pi) =>
        draftDot(pt, c, '#fff', active ? 6 : 5, (ll) => app.moveZonePoint(i, pi, ll)),
      );
    });
    // The draft target is shown by the main draggable marker (app.activeTarget).
    d.runways.forEach((rw, i) => {
      if (!rw.a) return;
      const active = i === app.adminActiveRunway;
      if (rw.b)
        L.polyline([rw.a, rw.b], {
          renderer,
          interactive: false,
          color: '#fff',
          weight: active ? 6 : 5,
          opacity: 0.9,
          dashArray: active ? '8 6' : undefined,
        }).addTo(adminLayer);
      (['a', 'b'] as const).forEach((end) => {
        const pt = rw[end];
        if (pt) draftDot(pt, '#fff', '#1b232d', 5, (ll) => app.moveRunwayEnd(i, end, ll));
      });
    });
    d.jrRefs.forEach((r, i) => {
      if (r && r.ll)
        draftDot(r.ll, '#c77dff', 'rgba(199,125,255,0.55)', 6, (ll) => app.moveRef(i, ll)).bindTooltip(
          r.name || 'repère',
          { permanent: true, direction: 'top', offset: [0, -8], className: 'zone-tip' },
        );
    });
  }

  /** Redraw everything from current app state (used by Leaflet event handlers). */
  function repaint() {
    if (!map || !ready) return;
    const tgt = app.activeTarget;
    if (tgt) {
      if (!lCircuit) buildLayers();
      updateOverlays(app.phys, tgt);
      drawZones(app.entry);
      drawRefs(app.entry);
      drawOpenZone(app.phys, tgt);
    }
    drawAdmin();
  }

  // — Reactive bridges: state → Leaflet —

  // Overlay geometry + toggles.
  $effect(() => {
    const s = app.phys;
    const tgt = app.activeTarget;
    // touch toggles so the effect re-runs on their change
    void [
      app.showCircuit,
      app.showIdeal,
      app.showLegs,
      app.showLabels,
      app.jumpRun,
      app.jumpRunDir,
      app.jumpRunOffset,
      app.jumpRefIdx,
      app.showOpenZone,
      app.showJrRefs,
      app.altUnit,
    ];
    const entry = app.entry;
    if (!map || !ready) return;
    // No target yet: leave the marker visible & draggable where it sits so the
    // user can place a bare target by dragging it; overlays wait for a target.
    if (!tgt) return;
    // Keep the marker glued to the active target (DZ, dragged, or admin draft).
    markerT.setLatLng([tgt.lat, tgt.lng]);
    if (!lCircuit) buildLayers();
    updateOverlays(s, tgt);
    drawZones(entry);
    drawRefs(entry);
    drawOpenZone(s, tgt);
  });

  // Basemap switch.
  $effect(() => {
    const bm = app.basemap;
    if (!map || !ready) return;
    ensureTiles(bm);
  });

  // Recenter only when a *new* DZ is selected (not on marker drag).
  $effect(() => {
    const tgt = app.target;
    if (!map || !ready || !tgt) return;
    if (tgt.name === lastName) return;
    lastName = tgt.name;
    map.setView([tgt.lat, tgt.lng], 15, { animate: false });
    markerT.setLatLng([tgt.lat, tgt.lng]);
    map.invalidateSize({ animate: false });
    repaint();
  });

  // Admin draft overlays.
  $effect(() => {
    void [app.adminOpen, app.adminDraft, app.adminActiveZone, app.adminActiveRunway];
    if (!map || !ready) return;
    drawAdmin();
  });
</script>

<div class="map-card" class:fs={app.fullscreen}>
  <div bind:this={mapEl} class="map" class:placing></div>

  <div class="topleft">
    <MapSummary />
    {#if app.fullscreen}
      {#if app.legendHidden}
        <button class="legend-reopen" onclick={() => (app.legendHidden = false)}>
          ▤ {m.legend_label()}
        </button>
      {:else}
        <div class="legend-overlay">
          <button
            class="legend-close"
            aria-label={m.close()}
            onclick={() => (app.legendHidden = true)}>×</button
          >
          <Legend />
        </div>
      {/if}
    {/if}
  </div>
  {#if app.showCompass}<Compass />{/if}
  {#if app.showWindLayer}
    <WindArrows />
    <WindWidget />
  {/if}

  {#if app.adminOpen}
    <div class="admin-banner">
      <span class="adot" style="background:{banner.dot}"></span>
      <div class="bcol">
        <div class="bmain">{banner.main}</div>
        <div class="bsub">{banner.sub}</div>
      </div>
      {#if drawingZone}
        <button class="bdone" onclick={() => (app.adminTool = 'none')}>✓ Terminer</button>
      {/if}
    </div>
  {/if}

  <div class="tabs">
    <div class="seg">
      <button class:on={app.basemap !== 'sat'} onclick={() => (app.basemap = 'plan')}>{m.map_plan()}</button>
      <button class:on={app.basemap === 'sat'} onclick={() => (app.basemap = 'sat')}>{m.map_satellite()}</button>
      {#if !embed}
        <button
          class="fsbtn"
          data-tip={app.fullscreen ? m.exit_fullscreen() : m.fullscreen()}
          aria-label={app.fullscreen ? m.exit_fullscreen() : m.fullscreen()}
          onclick={() => {
            app.fullscreen = !app.fullscreen;
            setTimeout(() => map && map.invalidateSize(), 150);
          }}
        >
          {#if app.fullscreen}
            <!-- minimize -->
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M8 3v3a2 2 0 0 1-2 2H3" />
              <path d="M21 8h-3a2 2 0 0 1-2-2V3" />
              <path d="M3 16h3a2 2 0 0 1 2 2v3" />
              <path d="M16 21v-3a2 2 0 0 1 2-2h3" />
            </svg>
          {:else}
            <!-- maximize -->
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M8 3H5a2 2 0 0 0-2 2v3" />
              <path d="M21 8V5a2 2 0 0 0-2-2h-3" />
              <path d="M3 16v3a2 2 0 0 0 2 2h3" />
              <path d="M16 21h3a2 2 0 0 0 2-2v-3" />
            </svg>
          {/if}
        </button>
      {/if}
    </div>
  </div>
</div>

<style>
  .map-card {
    position: relative;
    width: 100%;
    aspect-ratio: 1 / 1;
    border-radius: 16px;
    overflow: hidden;
    border: 1px solid var(--line);
    background: var(--surface2);
  }
  .map-card.fs {
    position: fixed;
    inset: 0;
    width: 100dvw;
    height: 100dvh;
    aspect-ratio: auto;
    border-radius: 0;
    border: none;
    z-index: 99999;
  }
  .map {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
  }
  /* Point-placing tool active → crosshair over the map (drag handles keep grab). */
  .map.placing :global(.leaflet-container) {
    cursor: crosshair;
  }
  .tabs {
    position: absolute;
    left: 50%;
    top: 12px;
    transform: translateX(-50%);
    z-index: 1200;
  }
  .seg {
    display: flex;
    gap: 3px;
    background: var(--surface);
    border: 1px solid var(--line);
    border-radius: 9px;
    padding: 3px;
  }
  .seg > button {
    cursor: pointer;
    user-select: none;
    padding: 7px 11px;
    border-radius: 7px;
    font: 600 11px/1 var(--font-display);
    border: 1px solid transparent;
    background: transparent;
    color: var(--muted);
    white-space: nowrap;
  }
  .seg > button.on {
    background: var(--accent);
    color: var(--onAccent);
  }
  .fsbtn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    padding: 0;
    color: var(--fg);
  }
  .fsbtn svg {
    width: 18px;
    height: 18px;
  }
  .fsbtn:hover {
    color: var(--accent2);
  }
  @media (max-width: 700px) {
    .tabs {
      top: auto;
      bottom: calc(10px + env(safe-area-inset-bottom, 0px));
    }
  }

  /* Top-left stack: DZ summary, then (fullscreen) the legend right below it,
     so the legend follows the summary's height whether it's collapsed or not. */
  .topleft {
    position: absolute;
    left: 10px;
    top: 10px;
    z-index: 1250;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
    max-width: calc(100% - 20px);
  }

  /* Fullscreen-only legend overlay (the in-flow legend is covered by the map). */
  .legend-overlay {
    position: relative;
    max-width: 260px;
    max-height: 60dvh;
    overflow: auto;
    background: var(--surface);
    border: 1px solid var(--line);
    border-radius: 10px;
    padding: 12px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
  }
  .legend-overlay :global(.legend) {
    flex-direction: column;
    flex-wrap: nowrap;
    gap: 9px;
    align-items: flex-start;
  }
  .legend-close {
    position: absolute;
    right: 8px;
    top: 8px;
    width: 22px;
    height: 22px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid var(--line);
    border-radius: 6px;
    background: var(--surface2);
    color: var(--muted);
    cursor: pointer;
    font: 700 14px/1 var(--font-display);
  }
  .legend-reopen {
    display: flex;
    align-items: center;
    gap: 6px;
    cursor: pointer;
    background: var(--surface);
    border: 1px solid var(--line);
    border-radius: 10px;
    padding: 9px 13px;
    font: 700 11px/1 var(--font-display);
    color: var(--fg);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
  }

  .admin-banner {
    position: absolute;
    left: 50%;
    top: 54px;
    transform: translateX(-50%);
    max-width: calc(100% - 40px);
    width: max-content;
    z-index: 1200;
    display: flex;
    align-items: center;
    gap: 11px;
    background: var(--surface);
    border: 1px solid var(--line);
    border-radius: 11px;
    padding: 10px 13px;
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.35);
  }
  .adot {
    width: 11px;
    height: 11px;
    border-radius: 50%;
    flex: none;
  }
  .bmain {
    font: 700 12px/1.25 var(--font-display);
    color: var(--fg);
  }
  .bsub {
    font: 500 10.5px/1.25 var(--font-mono);
    color: var(--muted);
  }
  .bdone {
    cursor: pointer;
    flex: none;
    border: 1px solid var(--line);
    border-radius: 8px;
    padding: 7px 11px;
    font: 700 10.5px/1 var(--font-display);
    color: var(--fg);
    background: var(--surface2);
  }
</style>
