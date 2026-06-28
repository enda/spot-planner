<script lang="ts">
  import { app } from '$lib/state.svelte';
  import { windCol } from '$lib/colors';
  import { fmtSpeed, dispAlt, altLabel, fmtTemp, tempLabel } from '$lib/units';
  import * as m from '$lib/paraglide/messages';
  import Collapsible from '../Collapsible.svelte';

  const rows = $derived.by(() =>
    app.winds
      .slice()
      .sort((a, b) => b.alt - a.alt)
      .map((w) => ({
        alt: `${dispAlt(w.alt, app.altUnit)} ${altLabel(app.altUnit)}`,
        dir: Math.round(w.dir),
        spd: fmtSpeed(w.spd, app.windUnit),
        col: windCol(w.spd),
        arrow: (w.dir + 180) % 360,
        temp: w.temp != null ? fmtTemp(w.temp, app.tempUnit) : '—',
      })),
  );
</script>

<Collapsible title={m.windsaloft_heading()}>
  {#if app.windsErr}<div class="err">{app.windsErr}</div>{/if}

  <div class="hdr">
    <div>{m.col_altitude()}</div>
    <div>{m.col_direction()}</div>
    <div>{m.col_speed()}</div>
    <div>{m.col_temp()} ({tempLabel(app.tempUnit)})</div>
  </div>
  {#each rows as r}
    <div class="row">
      <div class="alt">{r.alt}</div>
      <div class="dir">
        <span class="arr" style="transform:rotate({r.arrow}deg)">↑</span>{r.dir}°
      </div>
      <div class="spd" style="color:{r.col}">{r.spd}</div>
      <div class="temp">{r.temp}</div>
    </div>
  {/each}
</Collapsible>

<style>
  .err {
    margin: 0 0 9px;
    font: 600 9.5px/1.3 var(--font-mono);
    color: var(--danger);
  }
  .hdr,
  .row {
    display: grid;
    grid-template-columns: 1fr 1.25fr 0.9fr 0.8fr;
    gap: 8px;
    align-items: center;
  }
  .hdr {
    margin: 0 0 7px;
    font: 600 8.5px/1 var(--font-display);
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--muted);
  }
  .row {
    margin-bottom: 7px;
  }
  .alt,
  .dir {
    font: 600 12px/1.1 var(--font-mono);
    color: var(--fg);
  }
  .dir {
    display: flex;
    align-items: center;
    gap: 5px;
  }
  .arr {
    display: inline-block;
    color: var(--accent2);
    font: 700 12px/1 var(--font-mono);
  }
  .spd {
    font: 700 12px/1.1 var(--font-mono);
  }
  .temp {
    font: 600 12px/1.1 var(--font-mono);
    color: var(--muted);
  }
</style>
