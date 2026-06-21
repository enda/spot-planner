<script lang="ts">
  import { app } from '$lib/state.svelte';
  import { windAt, getFwd, getDesc } from '$lib/physics';
  import { windCol, grCol } from '$lib/colors';
  import { fmtSpeed, dispAlt, altLabel } from '$lib/units';
  import * as m from '$lib/paraglide/messages';
  import Collapsible from '../Collapsible.svelte';

  const PMAX = 1000;
  const STEP = 100;

  const rows = $derived.by(() => {
    const fwd = getFwd(app.phys);
    const desc = Math.max(0.5, getDesc(app.phys));
    const out = [];
    for (let a = PMAX; a >= 0; a -= STEP) {
      const w = windAt(app.winds, a);
      const gf = (fwd - w.spd) / desc;
      const gd = (fwd + w.spd) / desc;
      out.push({
        alt: `${dispAlt(a, app.altUnit)} ${altLabel(app.altUnit)}`,
        dir: Math.round(w.dir),
        wind: fmtSpeed(w.spd, app.windUnit),
        windCol: windCol(w.spd),
        gf: gf.toFixed(2),
        gd: gd.toFixed(2),
        fcol: grCol(gf),
        arrow: (w.dir + 180) % 360,
      });
    }
    return out;
  });
</script>

<Collapsible title={m.canopyglide_heading()}>
  <div class="hdr">
    <div>{m.col_altitude()}</div>
    <div>{m.col_wind()}</div>
    <div>{m.col_facing()}</div>
    <div>{m.col_back()}</div>
  </div>
  {#each rows as r}
    <div class="row">
      <div class="alt">{r.alt}</div>
      <div class="wind">
        <span class="arr" style="transform:rotate({r.arrow}deg);color:{r.windCol}">↑</span>{r.dir}° ·
        <span style="color:{r.windCol}">{r.wind}</span>
      </div>
      <div style="color:{r.fcol}" class="gr">{r.gf}<span class="u"> :1</span></div>
      <div style="color:{r.windCol}" class="gr">{r.gd}<span class="u"> :1</span></div>
    </div>
  {/each}
</Collapsible>

<style>
  .hdr,
  .row {
    display: grid;
    grid-template-columns: 0.8fr 1.3fr 1.05fr 0.55fr;
    gap: 8px;
    align-items: center;
  }
  .hdr {
    margin: 0 0 8px;
    font: 600 8.5px/1 var(--font-display);
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--muted);
  }
  .row {
    margin-bottom: 8px;
  }
  .alt {
    font: 600 12px/1.1 var(--font-mono);
    color: var(--fg);
  }
  .wind {
    display: flex;
    align-items: center;
    gap: 5px;
    font: 500 11.5px/1.1 var(--font-mono);
    color: var(--muted);
  }
  .arr {
    display: inline-block;
    font: 700 12px/1 var(--font-mono);
  }
  .gr {
    font: 600 12px/1.1 var(--font-mono);
  }
  .u {
    font-size: 9px;
    color: var(--muted);
  }
</style>
