<script lang="ts">
  import { app } from '$lib/state.svelte';
  import { fmtSpeed, fmtTemp, dispAlt, altLabel } from '$lib/units';
  import { getLocale } from '$lib/i18n';
  import * as m from '$lib/paraglide/messages';
  import Collapsible from '../Collapsible.svelte';

  // — Forecast échéance (today → +3 days, hourly) —
  const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
  const dayLabel = (iso: string): string => {
    const base = app.forecast[app.forecastBase]?.time ?? iso;
    const d = (s: string) => Date.parse(s.slice(0, 10) + 'T00:00Z');
    const diff = Math.round((d(iso) - d(base)) / 86400000);
    if (diff <= 0) return m.fc_today();
    if (diff === 1) return m.fc_tomorrow();
    return cap(new Intl.DateTimeFormat(getLocale(), { weekday: 'long' }).format(new Date(iso.slice(0, 10) + 'T12:00:00')));
  };
  const hhmm = (iso: string) => iso.slice(11, 16);
  const fstep = $derived(app.forecastStep);
  const isNow = $derived(app.forecastIdx === app.forecastBase);

  // WMO weather-code → [label message, emoji].
  const WMO: Record<number, [() => string, string]> = {
    0: [m.wmo_clear, '☀️'], 1: [m.wmo_mostly_clear, '🌤️'], 2: [m.wmo_partly_cloudy, '⛅'], 3: [m.wmo_overcast, '☁️'],
    45: [m.wmo_fog, '🌫️'], 48: [m.wmo_rime_fog, '🌫️'],
    51: [m.wmo_drizzle_light, '🌦️'], 53: [m.wmo_drizzle, '🌦️'], 55: [m.wmo_drizzle_dense, '🌦️'],
    61: [m.wmo_rain_light, '🌧️'], 63: [m.wmo_rain, '🌧️'], 65: [m.wmo_rain_heavy, '🌧️'],
    66: [m.wmo_freezing_rain, '🌧️'], 67: [m.wmo_freezing_rain, '🌧️'],
    71: [m.wmo_snow_light, '🌨️'], 73: [m.wmo_snow, '🌨️'], 75: [m.wmo_snow_heavy, '❄️'], 77: [m.wmo_sleet, '🌨️'],
    80: [m.wmo_showers, '🌦️'], 81: [m.wmo_showers, '🌧️'], 82: [m.wmo_showers_violent, '⛈️'],
    85: [m.wmo_snow_showers, '🌨️'], 86: [m.wmo_snow_showers, '🌨️'],
    95: [m.wmo_thunderstorm, '⛈️'], 96: [m.wmo_thunderstorm_hail, '⛈️'], 99: [m.wmo_thunderstorm_hail, '⛈️'],
  };
  const WMO_FALLBACK: [() => string, string] = [() => '—', '❓'];

  const cloudCol = (p: number) => (p >= 85 ? 'var(--danger)' : p >= 60 ? 'var(--accent)' : p >= 30 ? 'var(--accent2)' : 'var(--good)');
  // FFP no-go limits, applied to any instantaneous reading (7 m/s élèves, 11 m/s autonomes).
  const windCol = (ms: number) => (ms >= 11 ? 'var(--danger)' : ms >= 7 ? 'var(--accent)' : 'var(--good)');
  const gustCol = windCol;
  const visCol = (m: number) => (m < 3000 ? 'var(--danger)' : m < 8000 ? 'var(--accent)' : 'var(--good)');

  const c = $derived(app.conditions);
  const wmo = $derived(c?.weatherCode != null ? (WMO[c.weatherCode] ?? WMO_FALLBACK) : WMO_FALLBACK);

  const fmt = (v: number | null | undefined, d = 0) => (v == null ? '—' : v.toFixed(d));

  // Cloud base: lowest pressure level that's meaningfully clouded (≥ 25%).
  const cloudBase = $derived(
    (c?.cloudProfile ?? [])
      .slice()
      .sort((a, b) => a.alt - b.alt)
      .find((p) => p.pct >= 25)?.alt ?? null,
  );

  type Level = 'go' | 'maybe' | 'no';
  const LEVEL_COL: Record<Level, string> = { go: 'var(--good)', maybe: 'var(--accent)', no: 'var(--danger)' };

  // Go / watch / no-go heuristic from the blocking factors — usable for any hour.
  // Wind thresholds follow the FFP no-go limits: 7 m/s (élèves), 11 m/s (autonomes),
  // applied to the worst instantaneous reading (gust).
  type Cond = NonNullable<typeof c>;
  const evaluate = (x: Cond): { level: Level; reasons: string[] } => {
    const reasons: string[] = [];
    let level: Level = 'go';
    const bump = (l: 'maybe' | 'no') => { if (l === 'no') level = 'no'; else if (level === 'go') level = 'maybe'; };
    const low = x.cloudLow ?? 0, mid = x.cloudMid ?? 0, wind = x.wind ?? 0, gust = x.gust ?? 0;
    const vis = x.visibility ?? 99999, cape = x.cape ?? 0, pr = x.precip ?? 0;
    const wmax = Math.max(wind, gust);
    if (wmax >= 11) { level = 'no'; reasons.push(m.reason_wind_auto()); } else if (wmax >= 7) { bump('maybe'); reasons.push(m.reason_wind_student()); }
    if (low >= 85) { level = 'no'; reasons.push(m.reason_ceiling()); } else if (low >= 60) { bump('maybe'); reasons.push(m.reason_low_cloud()); }
    if (mid >= 85) { bump('maybe'); reasons.push(m.reason_mid_cloud()); }
    if (vis < 3000) { level = 'no'; reasons.push(m.reason_vis_low()); } else if (vis < 8000) { bump('maybe'); reasons.push(m.reason_vis_mid()); }
    if (cape >= 800) { level = 'no'; reasons.push(m.reason_storm_risk()); } else if (cape >= 300) { bump('maybe'); reasons.push(m.reason_convection()); }
    if (pr > 0.2) { level = 'no'; reasons.push(m.reason_precip()); }
    if (x.weatherCode != null && [95, 96, 99].includes(x.weatherCode)) { level = 'no'; reasons.push(m.reason_storm()); }
    return { level, reasons };
  };

  const verdict = $derived.by(() => {
    if (!c) return null;
    const { level, reasons } = evaluate(c);
    const map = {
      go: ['🪂', m.verdict_ok()],
      maybe: ['⚠️', m.verdict_watch()],
      no: ['🚫', m.verdict_bad()],
    } as const;
    return { ico: map[level][0], txt: map[level][1], col: LEVEL_COL[level], why: reasons.length ? reasons.join(' · ') : m.cond_none_blocking() };
  });

  // One coloured segment per hour in the scrub range, with day-change markers,
  // so the slider reads at a glance: green = OK, orange = watch, red = no-go.
  const wkShort = (iso: string) =>
    new Intl.DateTimeFormat(getLocale(), { weekday: 'short' }).format(new Date(iso.slice(0, 10) + 'T12:00:00'));
  const segs = $derived.by(() => {
    const out: { col: string; boundary: boolean; dayStart: boolean; label: string }[] = [];
    for (let i = app.forecastBase; i <= app.forecastMaxIdx; i++) {
      const s = app.forecast[i];
      if (!s) continue;
      const prev = app.forecast[i - 1];
      const newDay = i === app.forecastBase || (prev && prev.time.slice(0, 10) !== s.time.slice(0, 10));
      out.push({
        col: LEVEL_COL[evaluate(s.conditions).level],
        boundary: !!newDay && i !== app.forecastBase,
        dayStart: !!newDay,
        label: newDay ? wkShort(s.time) : '',
      });
    }
    return out;
  });
</script>

<Collapsible title={m.cond_title()}>
  {#if c}
    {#if app.forecast.length > 1 && fstep}
      <div class="fc">
        <div class="fchead">
          <span class="fcwhen">
            <span class="fcday" class:now={isNow}>{dayLabel(fstep.time)}</span>
            <span class="fctime">{hhmm(fstep.time)}</span>
          </span>
          <button class="fcnow" disabled={isNow} onclick={() => app.setForecastIdx(app.forecastBase)}>
            ↺ {m.fc_now()}
          </button>
        </div>

        <div class="fclabels">
          {#each segs as seg}<span class="fclbl" class:on={seg.dayStart}>{seg.label}</span>{/each}
        </div>
        <div class="fctrack">
          <div class="fcstrip">
            {#each segs as seg}<span class="fcseg" class:bound={seg.boundary} style="background:{seg.col}"></span>{/each}
          </div>
          <input
            class="fcrange"
            type="range"
            min={app.forecastBase}
            max={app.forecastMaxIdx}
            step="1"
            value={app.forecastIdx}
            oninput={(e) => app.setForecastIdx(+e.currentTarget.value)}
          />
        </div>
      </div>
    {/if}

    <div class="body">
    <div class="top">
      {#if verdict}
        <div class="verdict">
          <span class="ico">{verdict.ico}</span>
          <div class="vtext">
            <div class="big" style="color:{verdict.col}">{verdict.txt}</div>
            <div class="why">{verdict.why}</div>
          </div>
          <div class="wx">
            <div class="wxico">{wmo[1]}</div>
            <div class="wxlbl">{wmo[0]()}</div>
          </div>
        </div>
      {/if}

      <div class="clouds">
        <div class="ck">
          ☁️ {m.cond_clouds()}
          <span class="tot">{m.cond_clouds_total({ pct: fmt(c.cloudTotal) })}</span>
          <span class="tot base">· {m.cond_cloudbase()}
            {#if cloudBase != null}<strong>{dispAlt(cloudBase, app.altUnit)} {altLabel(app.altUnit)}</strong>{:else}<strong class="clear">{m.cond_clear()}</strong>{/if}
          </span>
        </div>
        {#each [[m.cloud_low(), '≤ 3 km', c.cloudLow], [m.cloud_mid(), '3–8 km', c.cloudMid], [m.cloud_high(), '≥ 8 km', c.cloudHigh]] as [lbl, rng, p]}
          <div class="crow">
            <span class="clbl">{lbl} <span class="rng">{rng}</span></span>
            <span class="track"><span class="fill" style="width:{(p as number) ?? 0}%;background:{cloudCol((p as number) ?? 0)}"></span></span>
            <span class="cpct" style="color:{cloudCol((p as number) ?? 0)}">{fmt(p as number)}%</span>
          </div>
        {/each}
      </div>
    </div>

    <div class="grid">
      <div class="tile">
        <div class="k">💨 {m.cond_gusts()}</div>
        <div class="v" style="color:{gustCol(c.gust ?? 0)}">{c.gust != null ? fmtSpeed(c.gust, app.windUnit) : '—'}</div>
        <div class="s">{m.cond_wind()} <span style="color:{windCol(c.wind ?? 0)}">{c.wind != null ? fmtSpeed(c.wind, app.windUnit) : '—'}</span></div>
      </div>
      <div class="tile">
        <div class="k">👁️ {m.cond_visibility()}</div>
        <div class="v" style="color:{visCol(c.visibility ?? 0)}">{c.visibility != null ? (c.visibility >= 10000 ? '10+' : (c.visibility / 1000).toFixed(1)) : '—'} <small>km</small></div>
      </div>
      <div class="tile">
        <div class="k">⚡ CAPE</div>
        <div class="v">{fmt(c.cape)} <small>J/kg</small></div>
        <div class="s">{(c.cape ?? 0) >= 300 ? m.cond_cape_sub_conv() : m.cond_cape_sub_stable()}</div>
      </div>
      <div class="tile">
        <div class="k">🎚️ QNH</div>
        <div class="v">{fmt(c.qnh)} <small>hPa</small></div>
        <div class="s">{m.cond_qnh_sub()}</div>
      </div>
      <div class="tile">
        <div class="k">🧊 {m.cond_freezing()}</div>
        <div class="v">{c.freezing != null ? dispAlt(c.freezing, app.altUnit) : '—'} <small>{altLabel(app.altUnit)}</small></div>
      </div>
      <div class="tile">
        <div class="k">💧 {m.cond_humidity()}</div>
        <div class="v">{fmt(c.humidity)} <small>%</small></div>
        <div class="s">{m.cond_dew()} {c.dewpoint != null ? fmtTemp(c.dewpoint, app.tempUnit) : '—'}</div>
      </div>
      <div class="tile">
        <div class="k">🌡️ {m.cond_temp_ground()}</div>
        <div class="v">{c.temp != null ? fmtTemp(c.temp, app.tempUnit) : '—'}{c.temp != null ? app.tempUnit : ''}</div>
        {#if c.feels != null}<div class="s">{m.cond_feels()} {fmtTemp(c.feels, app.tempUnit)}{app.tempUnit}</div>{/if}
      </div>
      <div class="tile">
        <div class="k">🌧️ {m.cond_precip()}</div>
        <div class="v">{fmt(c.precip, 1)} <small>mm</small></div>
        <div class="s">{m.cond_showers()} {fmt(c.showers, 1)}</div>
      </div>
    </div>
    </div>
  {:else}
    <div class="empty">{app.windsErr || m.cond_loading()}</div>
  {/if}
</Collapsible>

<style>
  /* Forecast échéance control (day + hour selector) at the top of the panel. */
  .fc {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-bottom: 12px;
    padding: 10px 12px;
    background: var(--surface2);
    border: 1px solid var(--line);
    border-radius: 10px;
  }
  .fchead {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .fcwhen {
    display: flex;
    align-items: baseline;
    gap: 8px;
  }
  .fcday {
    font: 700 14px/1 var(--font-display);
    color: var(--accent);
  }
  .fcday.now {
    color: var(--good);
  }
  .fctime {
    font: 700 14px/1 var(--font-mono);
    color: var(--fg);
  }
  .fcnow {
    margin-left: auto;
    flex: none;
    cursor: pointer;
    background: var(--surface);
    border: 1px solid var(--accent);
    border-radius: 8px;
    padding: 6px 10px;
    font: 700 9.5px/1 var(--font-display);
    color: var(--accent);
  }
  .fcnow:disabled {
    cursor: default;
    border-color: var(--line);
    color: var(--muted);
    opacity: 0.7;
  }
  /* Day labels aligned with the strip below (one cell per hour). */
  .fclabels {
    display: flex;
    height: 11px;
  }
  .fclbl {
    flex: 1;
    font: 700 7.5px/1 var(--font-mono);
    color: var(--muted);
    text-transform: uppercase;
    white-space: nowrap;
    overflow: visible;
  }
  .fclbl.on {
    color: var(--fg);
  }
  /* Favourability strip + transparent range overlay sharing the same width. */
  .fctrack {
    position: relative;
    height: 20px;
  }
  .fcstrip {
    position: absolute;
    inset: 6px 0;
    display: flex;
    border-radius: 5px;
    overflow: hidden;
  }
  .fcseg {
    flex: 1;
    height: 100%;
  }
  .fcseg.bound {
    box-shadow: inset 1.5px 0 0 var(--bg);
  }
  .fcrange {
    position: absolute;
    inset: 0;
    width: 100%;
    margin: 0;
    background: transparent;
    -webkit-appearance: none;
    appearance: none;
    cursor: pointer;
  }
  .fcrange::-webkit-slider-runnable-track {
    background: transparent;
    height: 20px;
  }
  .fcrange::-moz-range-track {
    background: transparent;
    height: 20px;
  }
  .fcrange::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 5px;
    height: 20px;
    border-radius: 3px;
    background: var(--fg);
    border: 1.5px solid var(--bg);
    box-shadow: 0 0 3px rgba(0, 0, 0, 0.6);
    cursor: grab;
  }
  .fcrange::-moz-range-thumb {
    width: 5px;
    height: 20px;
    border-radius: 3px;
    background: var(--fg);
    border: 1.5px solid var(--bg);
    box-shadow: 0 0 3px rgba(0, 0, 0, 0.6);
    cursor: grab;
  }
  /* Default (narrow column): verdict+clouds row on top, tiles below. */
  .body {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .top {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
    gap: 10px;
  }
  .verdict {
    display: flex;
    align-items: center;
    gap: 12px;
    background: var(--surface2);
    border: 1px solid var(--line);
    border-radius: 10px;
    padding: 12px 13px;
  }
  .ico {
    font-size: 30px;
    line-height: 1;
  }
  .vtext {
    min-width: 0;
  }
  .big {
    font: 700 16px/1 var(--font-display);
  }
  .why {
    margin-top: 4px;
    font: 500 9.5px/1.4 var(--font-mono);
    color: var(--muted);
  }
  .wx {
    margin-left: auto;
    text-align: right;
    flex: none;
  }
  .wxico {
    font-size: 22px;
    line-height: 1;
  }
  .wxlbl {
    margin-top: 3px;
    max-width: 92px;
    font: 600 8.5px/1.3 var(--font-mono);
    color: var(--muted);
  }
  .clouds {
    background: var(--surface2);
    border: 1px solid var(--line);
    border-radius: 10px;
    padding: 11px 13px;
  }
  .ck {
    display: flex;
    align-items: baseline;
    flex-wrap: wrap;
    gap: 4px 7px;
    font: 600 8.5px/1 var(--font-display);
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--muted);
    margin-bottom: 10px;
  }
  .tot {
    font: 600 9px/1.2 var(--font-mono);
    text-transform: none;
    letter-spacing: 0;
  }
  .tot.base strong {
    color: var(--fg);
    font-weight: 700;
  }
  .tot.base strong.clear {
    color: var(--good);
  }
  .crow {
    display: grid;
    grid-template-columns: 96px 1fr 34px;
    align-items: center;
    gap: 9px;
    margin-bottom: 7px;
  }
  .crow:last-child {
    margin-bottom: 0;
  }
  .clbl {
    font: 600 9.5px/1 var(--font-mono);
    color: var(--fg);
  }
  .rng {
    color: var(--muted);
    font-size: 8.5px;
  }
  .track {
    height: 8px;
    border-radius: 4px;
    background: var(--bg);
    overflow: hidden;
  }
  .fill {
    display: block;
    height: 100%;
    border-radius: 4px;
  }
  .cpct {
    font: 700 10px/1 var(--font-mono);
    text-align: right;
  }
  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 9px;
  }
  /* XXL (full-width panel): one shared grid so row heights line up. Verdict and
     clouds stack in column 1 (rows 1 & 2); the 8 tiles fill 4 columns to their
     right (4 per row). display:contents flattens .top/.grid into this grid. */
  @media (min-width: 1290px) {
    .body {
      display: grid;
      grid-template-columns: 1.85fr repeat(4, 1fr);
      grid-auto-rows: 1fr;
      gap: 9px;
      align-items: stretch;
    }
    .top,
    .grid {
      display: contents;
    }
    .verdict {
      grid-column: 1;
      grid-row: 1;
      padding: 15px 17px;
    }
    .clouds {
      grid-column: 1;
      grid-row: 2;
      padding: 14px 17px;
    }
    .verdict .big {
      font-size: 18px;
    }
    .ico {
      font-size: 34px;
    }
    .tile {
      min-width: 0;
    }
  }
  .tile {
    background: var(--surface2);
    border: 1px solid var(--line);
    border-radius: 9px;
    padding: 11px 13px;
  }
  .k {
    font: 600 8.5px/1 var(--font-display);
    letter-spacing: 0.05em;
    text-transform: uppercase;
    color: var(--muted);
    margin-bottom: 8px;
  }
  .v {
    font: 700 18px/1 var(--font-mono);
    color: var(--fg);
  }
  .v small {
    font: 600 9px/1 var(--font-mono);
    color: var(--muted);
  }
  .s {
    margin-top: 5px;
    font: 500 9px/1.3 var(--font-mono);
    color: var(--muted);
  }
  .empty {
    font: 500 10.5px/1.5 var(--font-mono);
    color: var(--muted);
  }
</style>
