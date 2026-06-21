# Circuit · winds & glide

Skydiving landing-circuit planner: **front-only SvelteKit (SPA, `adapter-static`), installable PWA**.
Flight maths (glide, drift, opening zone, circuit, jump run) in pure TypeScript, UI in Svelte 5
components, available in **6 languages** (English default + FR, IT, ES, PT, DE).

**▶ Live app: <https://spotplanner.mslk.me/>**

## Stack

- **SvelteKit 2** + `adapter-static` (`fallback: 404.html`, `ssr = false`, `prerender = true`) — 100% front, no server.
- **Svelte 5** (runes) for reactive state.
- **Leaflet 1.9** + **leaflet-rotate 0.2.8** (map rotation, SVG renderer required).
- Tiles: **Esri World Imagery** (satellite, default) / **CARTO Voyager** (plan), `crossOrigin: 'anonymous'`.
- **open-meteo** for live winds (pressure levels 1000→500 hPa → AGL altitude).
- **PWA**: `static/manifest.json` + `src/service-worker.ts` (app-shell precache, offline, runtime tile/font cache).
- **i18n**: [Paraglide JS](https://inlang.com/m/gerre34r/library-inlang-paraglideJs) (compiler-based, tree-shaken), `localStorage` strategy.
- Persistence: **localStorage** (units, canopy & pilot, circuit altitudes, jump run, legends, basemap, language, last DZ).

## Getting started

```bash
npm install
npm run dev        # dev server
npm run build      # static build → ./build
npm run preview    # preview the build
npm run check      # paraglide compile + svelte-check
npm test           # unit tests (vitest)
```

> `src/lib/paraglide/` is generated from `messages/*.json` (gitignored). The Vite plugin builds it on
> `dev`/`build`; `npm run paraglide` regenerates it for `check`/CI.

## Internationalization

- Base locale **English**; UI strings live in `messages/{en,fr,it,es,pt,de}.json` (inlang message format).
- Components call `import * as m from '$lib/paraglide/messages'` → `m.some_key()`.
- The header language picker calls `setLocale(code)`, which persists the choice to `localStorage`
  and reloads so the whole UI re-renders translated.
- To add a string: add the key to every `messages/*.json`, then use `m.key()`.

## GitHub Pages deployment

`.github/workflows/deploy.yml` builds and publishes to Pages on every push to `main`/`master`.
In GitHub: **Settings → Pages → Source = GitHub Actions** (once).

### Custom domain (`spotplanner.mslk.me`)

Served at the **root** of the domain, so the build has no base path (the workflow leaves `BASE_PATH` unset).

1. `static/CNAME` holds `spotplanner.mslk.me` (published in the output).
2. DNS at the `mslk.me` registrar: a **CNAME** record `spotplanner` → `<user>.github.io`.
3. GitHub: **Settings → Pages → Custom domain** = `spotplanner.mslk.me`, then **Enforce HTTPS**.

> For a `<user>.github.io/<repo>/` project URL instead: build with `BASE_PATH=/<repo>`
> (`kit.paths.base` reads it) and remove the `CNAME`.

### Handled details

- Prerendered assets use **relative** paths (portable under any path).
- `static/.nojekyll` stops Jekyll from ignoring the `_app/` folder.
- `fallback: 404.html` doubles as the SPA shell Pages serves on unknown paths.
- `manifest.json` uses relative `start_url`/`scope` (`.`) so it stays installable.
- The service worker is base-aware (precaches `/`, `/404.html`, `/embed/`).

## Startup behaviour

1. Hydrate persisted settings from localStorage.
2. Load the landing-zone database (`static/landing-zones.json`).
3. **Geolocate** (`navigator.geolocation`) and auto-select the **nearest DZ**.
   - If geolocation is denied/unavailable: **no DZ is selected** (wide map view, no target).
4. Selecting a DZ (auto or manual) triggers loading the **live winds** from open-meteo.

## Architecture

```
messages/           UI strings per locale (en is the base)
src/lib/
  physics.ts        ported flight maths (wl, getFwd/getDesc, windAt, glegVec,
                    geomMeters, drift, openZoneMeters, legDist) — pure, tested
  physics.spec.ts   unit tests (maths + nearest DZ + runway threshold numbering)
  winds.ts          open-meteo fetch / parsing
  dropzones.ts      DZ list (verified coords) + haversine + nearest
  landingZones.ts   loader + normalisation of landing-zones.json
  embed.ts          encode/decode the view into URL params
  admin.ts          DZ-editor model + JSON-proposal builder
  units.ts          kt↔m/s, m↔ft conversions + formatters
  colors.ts         wind / glide colour coding
  text.ts           accent-insensitive search fold
  i18n.ts           Paraglide locale helpers + native names
  state.svelte.ts   central state (runes) + localStorage persistence

src/components/
  Map.svelte        Leaflet + leaflet-rotate, overlays (circuit, ideal, nodes,
                    distances, jump run, opening zone, DZ zones, admin draft)
  WindArrows / WindWidget / Compass / Dial / Header / LanguageSwitcher /
  Collapsible / MapSummary / EmbedDialog / AdminDrawer
  panels/           Dropzone, Canopy & pilot, Circuit, Jump run, Legend,
                    Reach limit, Glide cards, Footprint, Canopy glide,
                    Winds aloft, Ground glide
```

## Adding or updating a DZ

Two files, linked by the DZ's **exact name** (the key):

- `src/lib/dropzones.ts` — the list for search / geoloc: `{ name, country, lat, lng }`
  (coords = landing area or mid-runway point).
- `static/landing-zones.json` — keyed by name: `landingDir`, `zones` (polygons), `runway`,
  `jrRefs` (jump-run references). Optional: without an entry here the DZ still works (bare target).

### Recommended: the in-app editor

1. **Dropzone panel → "+ Add a DZ"** or **"✎ Edit"**.
2. In the drawer: place the target, draw the runway (**thresholds are numbered automatically** =
   the runway heading flown departing from that threshold), add references, draw the landing zones.
3. **"Validate & generate the JSON"** → copy / download / email.

### Integration (no backend)

1. **List**: add/edit the entry in the `DROPZONES` array of `src/lib/dropzones.ts`.
2. **Zones**: paste the generated `landingZones["<name>"]` block into `static/landing-zones.json`
   (add a new key, or replace the existing one for an update).
3. Keep the **same name** in both files.
4. `npm run check`, then reload the app and select the DZ.

> Threshold check: a threshold carries the runway heading **in the direction you take off from it**
> (bearing from that threshold toward the far end). E.g. an east–west runway: east end = 27, west end = 09.

## Embed mode

The **`/embed`** route shows the map only (plus the summary box), configured by params encoded after
the `#` (`parseEmbed`/`buildEmbedParams`). The header's "Embed the map" button opens a dialog with an
iframe preview and a `<iframe>` snippet to copy. A config URL ("Plan your circuit ↗") reopens the full
planner pre-set. The embed does not geolocate and does not write localStorage (it never touches the
user's settings).
