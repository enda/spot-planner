<script lang="ts">
  import { app } from '$lib/state.svelte';
  import { windAt, landingHeading, getFwd, getDesc, angDiff, rad } from '$lib/physics';
  import { grCol } from '$lib/colors';
  import * as m from '$lib/paraglide/messages';

  const surf = $derived(windAt(app.winds, 0));
  const lh = $derived(landingHeading(app.phys));
  const fwd = $derived(getFwd(app.phys));
  const desc = $derived(Math.max(0.5, getDesc(app.phys)));
  const hw = $derived(surf.spd * Math.cos(rad(angDiff(lh, surf.dir))));

  const grFinal = $derived((fwd - hw) / desc);
  const grStill = $derived(fwd / desc);
  const grDown = $derived((fwd + hw) / desc);
</script>

<div class="cards">
  <div class="card cell">
    <div class="t">{m.glide_final()}</div>
    <div class="v" style="color:{grCol(grFinal)}">{grFinal.toFixed(2)}<span class="u"> :1</span></div>
    {#if grFinal < 0}<div class="warn">{m.glide_backup()}</div>{/if}
  </div>
  <div class="card cell">
    <div class="t">{m.glide_still()}</div>
    <div class="v" style="color:{grCol(grStill)}">{grStill.toFixed(2)}<span class="u"> :1</span></div>
  </div>
  <div class="card cell">
    <div class="t">{m.glide_downwind()}</div>
    <div class="v" style="color:{grCol(grDown)}">{grDown.toFixed(2)}<span class="u"> :1</span></div>
  </div>
</div>

<style>
  .cards {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
  }
  .cell {
    flex: 1 1 90px;
    min-width: 86px;
    padding: 11px 13px;
  }
  .t {
    font: 600 9px/1.2 var(--font-display);
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--muted);
    margin: 0 0 7px;
  }
  .v {
    font: 700 23px/1 var(--font-mono);
  }
  .u {
    font-size: 13px;
    color: var(--muted);
  }
  .warn {
    margin-top: 5px;
    font: 700 9.5px/1.2 var(--font-display);
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: var(--danger);
  }
</style>
