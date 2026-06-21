<script lang="ts">
  import { app } from '$lib/state.svelte';
  import { geomMeters } from '$lib/physics';
  import { fmtAlt } from '$lib/units';
  import * as m from '$lib/paraglide/messages';
  import Collapsible from '../Collapsible.svelte';

  const g = $derived(geomMeters(app.phys));
</script>

<Collapsible title={m.footprint_heading()}>
  <div class="row">
    <div>
      <div class="t">{m.footprint_downwind()}</div>
      <div class="v">{fmtAlt(g.dwDist, app.altUnit)}</div>
    </div>
    <div>
      <div class="t">{m.footprint_base()}</div>
      <div class="v">{fmtAlt(g.baseDist, app.altUnit)}</div>
    </div>
    <div>
      <div class="t">{m.footprint_final()}</div>
      <div class="v">{fmtAlt(g.finalDist, app.altUnit)}</div>
    </div>
  </div>
  <div class="note">{m.footprint_note()}</div>
</Collapsible>

<style>
  .row {
    display: flex;
    flex-wrap: wrap;
    gap: 18px;
  }
  .t {
    font: 600 9px/1.2 var(--font-display);
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--muted);
  }
  .v {
    margin-top: 5px;
    font: 700 18px/1 var(--font-mono);
    color: var(--fg);
  }
  .note {
    margin-top: 11px;
    font: 500 11px/1.5 var(--font-mono);
    color: var(--muted);
  }
</style>
