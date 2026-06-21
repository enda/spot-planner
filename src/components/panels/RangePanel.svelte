<script lang="ts">
  import { app } from '$lib/state.svelte';
  import { openZoneMeters, windAt, unit } from '$lib/physics';
  import { fmtAlt, dispAlt, altToM, altLabel } from '$lib/units';
  import * as m from '$lib/paraglide/messages';
  import Collapsible from '../Collapsible.svelte';

  const surf = $derived(windAt(app.winds, 0));
  const zone = $derived(openZoneMeters(app.phys));
  const blow = $derived(unit((surf.dir + 180) % 360));
  const upwind = $derived(zone.reach(-blow.e, -blow.n));
  const downwind = $derived(zone.reach(blow.e, blow.n));
  const aLabel = $derived(altLabel(app.altUnit));
  const num = (v: string) => {
    const f = parseFloat(v);
    return isNaN(f) ? 0 : f;
  };
</script>

<Collapsible title={m.range_heading()}>
  <div class="intro">{m.range_intro()}</div>

  <div class="hrow">
    <div class="label">{m.range_alt_label()}</div>
    <div class="stepper">
      <button onclick={() => (app.zoneAlt = Math.max(50, Math.round(app.zoneAlt / 50) * 50 - 50))}>
        −
      </button>
      <div class="box">
        <input
          class="hinput"
          type="number"
          value={dispAlt(app.zoneAlt, app.altUnit)}
          oninput={(e) => (app.zoneAlt = Math.max(50, altToM(num(e.currentTarget.value), app.altUnit)))}
        />
        <span class="u">{aLabel}</span>
      </div>
      <button onclick={() => (app.zoneAlt = Math.max(50, Math.round(app.zoneAlt / 50) * 50 + 50))}>
        +
      </button>
    </div>
  </div>

  <div class="cards">
    <div class="rcard">
      <div class="t up">{m.range_upwind()}</div>
      <div class="v">{fmtAlt(upwind, app.altUnit)}</div>
      <div class="s">{m.range_upwind_sub()}</div>
    </div>
    <div class="rcard">
      <div class="t dn">{m.range_downwind()}</div>
      <div class="v">{fmtAlt(downwind, app.altUnit)}</div>
      <div class="s">{m.range_downwind_sub()}</div>
    </div>
  </div>
  <div class="note">{m.range_note()}</div>
</Collapsible>

<style>
  .intro {
    font: 500 11px/1.5 var(--font-mono);
    color: var(--muted);
  }
  .hrow {
    margin-top: 13px;
  }
  .stepper {
    display: flex;
    align-items: stretch;
    gap: 6px;
  }
  .stepper button {
    width: 32px;
    cursor: pointer;
    border: 1px solid var(--line);
    border-radius: 8px;
    background: var(--surface2);
    color: var(--fg);
    font: 700 16px/1 var(--font-mono);
  }
  .box {
    display: flex;
    align-items: baseline;
    gap: 4px;
    background: var(--surface2);
    border: 1px solid var(--line);
    border-radius: 8px;
    padding: 0 10px;
  }
  .hinput {
    width: 60px;
    background: transparent;
    color: var(--fg);
    border: none;
    padding: 8px 0;
    font: 700 16px/1 var(--font-mono);
    outline: none;
    text-align: center;
  }
  .u {
    font: 600 11px/1 var(--font-mono);
    color: var(--muted);
  }
  .cards {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin-top: 14px;
  }
  .rcard {
    flex: 1 1 150px;
    background: var(--surface2);
    border: 1px solid var(--line);
    border-radius: 9px;
    padding: 9px 11px;
  }
  .t {
    font: 600 9px/1.2 var(--font-display);
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }
  .t.up {
    color: var(--good);
  }
  .t.dn {
    color: var(--accent);
  }
  .v {
    margin-top: 4px;
    font: 700 18px/1 var(--font-mono);
    color: var(--fg);
  }
  .s {
    margin-top: 3px;
    font: 500 9.5px/1.3 var(--font-mono);
    color: var(--muted);
  }
  .note {
    margin-top: 11px;
    font: 500 10px/1.5 var(--font-mono);
    color: var(--muted);
  }
</style>
