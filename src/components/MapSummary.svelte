<script lang="ts">
  import { app } from '$lib/state.svelte';
  import { windAt, landingHeading } from '$lib/physics';
  import { windCol } from '$lib/colors';
  import { fmtSpeed } from '$lib/units';
  import * as m from '$lib/paraglide/messages';
  import FsCircuit from './fs/FsCircuit.svelte';
  import FsJump from './fs/FsJump.svelte';
  import FsWind from './fs/FsWind.svelte';

  const surf = $derived(windAt(app.winds, 0));
  const lh = $derived(Math.round(landingHeading(app.phys)));
  const circuit = $derived(
    `${app.handed === 'left' ? m.left_hand() : m.right_hand()} · ${m.stat_axis()} ${lh}°`,
  );
  const jump = $derived(
    `${Math.round(((app.jumpRunDir % 360) + 360) % 360)}° · ${Math.round(app.jumpRunOffset || 0)} m / ${app.jrRefName}`,
  );

  let open = $state(true);
  let fsEdit = $state<'circuit' | 'jump' | 'wind' | null>(null);

  // Rows are only clickable in fullscreen; leaving fullscreen closes the editor.
  const editable = $derived(app.fullscreen);
  $effect(() => {
    if (!app.fullscreen) fsEdit = null;
  });
</script>

{#if app.target}
  <div class="summary">
    {#if fsEdit && app.fullscreen}
      {#if fsEdit === 'circuit'}
        <FsCircuit back={() => (fsEdit = null)} />
      {:else if fsEdit === 'jump'}
        <FsJump back={() => (fsEdit = null)} />
      {:else}
        <FsWind back={() => (fsEdit = null)} />
      {/if}
    {:else}
      <button class="hdr" onclick={() => (open = !open)} aria-expanded={open}>
        <span class="dz">{app.target.name}</span>
        <span class="chev">{open ? '−' : '+'}</span>
      </button>
      {#if open}
        <div class="rows">
          <button class="rw" class:click={editable} disabled={!editable} onclick={() => (fsEdit = 'circuit')}>
            <span class="k">{m.sum_circuit()}</span>
            <span class="v">{circuit}</span>
          </button>
          <button class="rw" class:click={editable} disabled={!editable} onclick={() => (fsEdit = 'jump')}>
            <span class="k">{m.sum_jump()}</span>
            <span class="v jump">{jump}</span>
          </button>
          <button class="rw" class:click={editable} disabled={!editable} onclick={() => (fsEdit = 'wind')}>
            <span class="k">{m.sum_ground_wind()}</span>
            <span class="v">
              {Math.round(surf.dir)}° ·
              <span style="color:{windCol(surf.spd)}">{fmtSpeed(surf.spd, app.windUnit)}</span>
            </span>
          </button>
        </div>
        {#if app.embed}
          <a class="cta" href={app.configUrl()} target="_blank" rel="noopener">{m.sum_prepare()}</a>
        {/if}
      {/if}
    {/if}
  </div>
{/if}

<style>
  .summary {
    max-width: 244px;
    background: rgba(20, 26, 33, 0.95);
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
  .rw {
    display: block;
    width: 100%;
    text-align: left;
    background: none;
    border: none;
    padding: 0;
    cursor: default;
  }
  .rw.click {
    cursor: pointer;
  }
  .k {
    display: block;
    font: 600 8px/1 var(--font-display);
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--muted);
    margin-bottom: 2px;
  }
  .v {
    display: block;
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
