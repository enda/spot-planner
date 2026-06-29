<script lang="ts">
  import { app } from '$lib/state.svelte';
  import { windAt, getFwd, getDesc } from '$lib/physics';
  import { windCol, grCol } from '$lib/colors';
  import { fmtSpeed, dispAlt, altLabel, fmtTemp, tempLabel } from '$lib/units';
  import * as m from '$lib/paraglide/messages';

  let { back }: { back: () => void } = $props();

  const PMAX = 1000;
  const STEP = 100;

  const aLabel = $derived(altLabel(app.altUnit));

  // "Plané sous voile": ground-glide profile (into-wind / downwind) up to PMAX.
  const profile = $derived.by(() => {
    const fwd = getFwd(app.phys);
    const desc = Math.max(0.5, getDesc(app.phys));
    const out = [];
    for (let a = PMAX; a >= 0; a -= STEP) {
      const w = windAt(app.winds, a);
      const gf = (fwd - w.spd) / desc;
      const gd = (fwd + w.spd) / desc;
      out.push({
        alt: `${dispAlt(a, app.altUnit)} ${aLabel}`,
        dir: Math.round(w.dir),
        wind: fmtSpeed(w.spd, app.windUnit),
        wcol: windCol(w.spd),
        gf: gf.toFixed(2),
        gd: gd.toFixed(2),
        fcol: grCol(gf),
        arrow: (w.dir + 180) % 360,
      });
    }
    return out;
  });

  // "Vents en altitude > 1000 m": only the layers the profile above doesn't cover.
  const high = $derived(
    app.winds
      .filter((w) => w.alt > 1000)
      .slice()
      .sort((a, b) => b.alt - a.alt)
      .map((w) => ({
        alt: `${dispAlt(w.alt, app.altUnit)} ${aLabel}`,
        dir: Math.round(w.dir),
        wind: fmtSpeed(w.spd, app.windUnit),
        wcol: windCol(w.spd),
        arrow: (w.dir + 180) % 360,
        temp: w.temp != null ? fmtTemp(w.temp, app.tempUnit) : '—',
      })),
  );
</script>

<div class="head">
  <button class="back" aria-label="←" onclick={back}>←</button>
  <span class="title">{m.fs_wind_title()}</span>
</div>

<div class="scroll">
  <div class="sec accent">{m.windsaloft_heading()}</div>
  <div class="hdr wfour">
    <div>{m.fs_c_alt()}</div>
    <div>{m.fs_c_dir()}</div>
    <div>{m.fs_c_spd()}</div>
    <div>{tempLabel(app.tempUnit)}</div>
  </div>
  {#each high as r}
    <div class="row wfour">
      <div class="cell">{r.alt}</div>
      <div class="cell dir">
        <span class="arr" style="transform:rotate({r.arrow}deg);color:{r.wcol}">↑</span>{r.dir}°
      </div>
      <div class="cell" style="color:{r.wcol}">{r.wind}</div>
      <div class="cell t">{r.temp}</div>
    </div>
  {/each}

  <div class="sec accent hi">{m.canopyglide_heading()}</div>
  <div class="hdr five">
    <div>{m.fs_c_alt()}</div>
    <div>{m.fs_c_dir()}</div>
    <div>{m.fs_c_spd()}</div>
    <div>{m.fs_c_face()}</div>
    <div>{m.fs_c_dos()}</div>
  </div>
  {#each profile as r}
    <div class="row five">
      <div class="cell">{r.alt}</div>
      <div class="cell dir">
        <span class="arr" style="transform:rotate({r.arrow}deg);color:{r.wcol}">↑</span>{r.dir}°
      </div>
      <div class="cell" style="color:{r.wcol}">{r.wind}</div>
      <div class="cell b" style="color:{r.fcol}">{r.gf}</div>
      <div class="cell" style="color:{r.wcol}">{r.gd}</div>
    </div>
  {/each}
</div>

<style>
  .head {
    display: flex;
    align-items: center;
    gap: 9px;
    margin: 0 0 11px;
  }
  .back {
    flex: none;
    box-sizing: border-box;
    width: 26px;
    height: 26px;
    padding: 0;
    -webkit-appearance: none;
    appearance: none;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid var(--line);
    border-radius: 7px;
    background: none;
    color: var(--fg);
    cursor: pointer;
    font: 700 15px/1 var(--font-display);
  }
  .title {
    font: 700 11px/1 var(--font-display);
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--accent);
  }
  .scroll {
    max-height: 60vh;
    overflow: auto;
  }
  .sec {
    font: 600 8px/1 var(--font-display);
    letter-spacing: 0.06em;
    text-transform: uppercase;
    margin: 0 0 6px;
  }
  .sec.accent {
    color: var(--accent);
  }
  .sec.hi {
    margin-top: 11px;
  }
  .hdr,
  .row {
    display: grid;
    gap: 4px;
    align-items: center;
  }
  .five {
    grid-template-columns:
      minmax(min-content, 0.9fr) minmax(min-content, 1fr) minmax(min-content, 0.9fr)
      minmax(min-content, 0.7fr) minmax(min-content, 0.7fr);
  }
  .wfour {
    grid-template-columns:
      minmax(min-content, 0.9fr) minmax(min-content, 1fr)
      minmax(min-content, 0.9fr) minmax(min-content, 0.7fr);
  }
  .cell.t {
    color: var(--fg);
  }
  .hdr {
    margin: 0 0 5px;
    font: 600 7.5px/1 var(--font-display);
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: var(--muted);
  }
  .row {
    margin-bottom: 5px;
  }
  .cell {
    font: 600 9.5px/1.1 var(--font-mono);
    color: var(--fg);
    white-space: nowrap;
  }
  .cell.b {
    font-weight: 700;
  }
  .dir {
    display: flex;
    align-items: center;
    gap: 3px;
  }
  .arr {
    display: inline-block;
    font: 700 11px/1 var(--font-mono);
  }
</style>
