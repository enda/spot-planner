<script lang="ts">
  import { app } from '$lib/state.svelte';
  import { fmtSpeed, fmtTemp, dispAlt, altLabel } from '$lib/units';
  import * as m from '$lib/paraglide/messages';
  import Collapsible from '../Collapsible.svelte';

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

  // Simple go / watch / no-go heuristic from the blocking factors.
  // Wind thresholds follow the FFP no-go limits: 7 m/s (students), 11 m/s (confirmed).
  const verdict = $derived.by(() => {
    if (!c) return null;
    const reasons: string[] = [];
    let level: 'go' | 'maybe' | 'no' = 'go';
    const bump = (l: 'maybe' | 'no') => { if (l === 'no') level = 'no'; else if (level === 'go') level = 'maybe'; };
    const low = c.cloudLow ?? 0, mid = c.cloudMid ?? 0, wind = c.wind ?? 0, gust = c.gust ?? 0;
    const vis = c.visibility ?? 99999, cape = c.cape ?? 0, pr = c.precip ?? 0;
    // FFP no-go applies to any instantaneous wind reading → take the worst (gust).
    // Limits: 7 m/s (élèves), 11 m/s (autonomes).
    const wmax = Math.max(wind, gust);
    if (wmax >= 11) { level = 'no'; reasons.push(m.reason_wind_auto()); } else if (wmax >= 7) { bump('maybe'); reasons.push(m.reason_wind_student()); }
    // Low clouds = landing/canopy ceiling.
    if (low >= 85) { level = 'no'; reasons.push(m.reason_ceiling()); } else if (low >= 60) { bump('maybe'); reasons.push(m.reason_low_cloud()); }
    // Mid clouds = exit / freefall altitude (~3–8 km).
    if (mid >= 85) { bump('maybe'); reasons.push(m.reason_mid_cloud()); }
    if (vis < 3000) { level = 'no'; reasons.push(m.reason_vis_low()); } else if (vis < 8000) { bump('maybe'); reasons.push(m.reason_vis_mid()); }
    if (cape >= 800) { level = 'no'; reasons.push(m.reason_storm_risk()); } else if (cape >= 300) { bump('maybe'); reasons.push(m.reason_convection()); }
    if (pr > 0.2) { level = 'no'; reasons.push(m.reason_precip()); }
    if (c.weatherCode != null && [95, 96, 99].includes(c.weatherCode)) { level = 'no'; reasons.push(m.reason_storm()); }
    const map = {
      go: ['🪂', m.verdict_ok(), 'var(--good)'],
      maybe: ['⚠️', m.verdict_watch(), 'var(--accent)'],
      no: ['🚫', m.verdict_bad(), 'var(--danger)'],
    } as const;
    return { ico: map[level][0], txt: map[level][1], col: map[level][2], why: reasons.length ? reasons.join(' · ') : m.cond_none_blocking() };
  });
</script>

<Collapsible title={m.cond_title()}>
  {#if c}
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
        <div class="ck">☁️ {m.cond_clouds()} <span class="tot">{m.cond_clouds_total({ pct: fmt(c.cloudTotal) })}</span></div>
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
      </div>
      <div class="tile">
        <div class="k">🌧️ {m.cond_precip()}</div>
        <div class="v">{fmt(c.precip, 1)} <small>mm</small></div>
        <div class="s">{m.cond_showers()} {fmt(c.showers, 1)}</div>
      </div>
    </div>
  {:else}
    <div class="empty">{app.windsErr || m.cond_loading()}</div>
  {/if}
</Collapsible>

<style>
  /* Verdict + cloud cover side by side once there's room (desktop), stacked otherwise. */
  .top {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 10px;
    margin-bottom: 10px;
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
    align-items: center;
    gap: 7px;
    font: 600 8.5px/1 var(--font-display);
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--muted);
    margin-bottom: 10px;
  }
  .tot {
    font: 600 9px/1 var(--font-mono);
    text-transform: none;
    letter-spacing: 0;
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
    grid-template-columns: repeat(auto-fill, minmax(158px, 1fr));
    gap: 9px;
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
