<script lang="ts">
  import { app } from '$lib/state.svelte';
  import { windAt, landingHeading } from '$lib/physics';
  import { windCol } from '$lib/colors';
  import { fmtSpeed } from '$lib/units';
  import * as m from '$lib/paraglide/messages';

  const surf = $derived(windAt(app.winds, 0));
  const lh = $derived(Math.round(landingHeading(app.phys)));
  const circuit = $derived(
    `${app.handed === 'left' ? m.left_hand() : m.right_hand()} · ${m.stat_axis()} ${lh}°`,
  );
  const refName = $derived(app.jrRefName);
  const jump = $derived(
    `${Math.round(((app.jumpRunDir % 360) + 360) % 360)}° · ${Math.round(app.jumpRunOffset || 0)} m / ${refName}`,
  );

  let open = $state(true);
</script>

{#if app.target}
  <div class="summary">
    <button class="hdr" onclick={() => (open = !open)} aria-expanded={open}>
      <span class="dz">{app.target.name}</span>
      <span class="chev">{open ? '−' : '+'}</span>
    </button>
    {#if open}
    <div class="rows">
      <div>
        <div class="k">{m.sum_circuit()}</div>
        <div class="v">{circuit}</div>
      </div>
      <div>
        <div class="k">{m.sum_jump()}</div>
        <div class="v jump">{jump}</div>
      </div>
      <div>
        <div class="k">{m.sum_ground_wind()}</div>
        <div class="v">
          {Math.round(surf.dir)}° · <span style="color:{windCol(surf.spd)}"
            >{fmtSpeed(surf.spd, app.windUnit)}</span
          >
        </div>
      </div>
    </div>
    {#if app.embed}
      <a class="cta" href={app.configUrl()} target="_blank" rel="noopener">{m.sum_prepare()}</a>
    {/if}
    {/if}
  </div>
{/if}

<style>
  .summary {
    max-width: 230px;
    background: rgba(20, 26, 33, 0.9);
    border: 1px solid var(--line);
    border-radius: 11px;
    padding: 11px 13px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.45);
  }
  .hdr {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    width: 100%;
    background: none;
    border: none;
    padding: 0;
    cursor: pointer;
  }
  .dz {
    font: 700 13px/1.2 var(--font-display);
    color: var(--fg);
    text-align: left;
  }
  .chev {
    flex: none;
    width: 18px;
    height: 18px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid var(--line);
    border-radius: 5px;
    color: var(--muted);
    font: 700 14px/1 var(--font-mono);
  }
  .rows {
    margin-top: 8px;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .k {
    font: 600 8px/1 var(--font-display);
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--muted);
    margin-bottom: 2px;
  }
  .v {
    font: 600 11px/1.3 var(--font-mono);
    color: var(--fg);
  }
  .v.jump {
    color: var(--jump);
  }
  .cta {
    display: block;
    margin-top: 10px;
    text-align: center;
    text-decoration: none;
    background: var(--accent2);
    color: var(--onAccent);
    border-radius: 8px;
    padding: 8px;
    font: 700 10.5px/1 var(--font-display);
  }
</style>
