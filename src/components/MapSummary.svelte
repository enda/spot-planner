<script lang="ts">
  import { app } from '$lib/state.svelte';
  import { windAt, landingHeading } from '$lib/physics';
  import { windCol } from '$lib/colors';
  import { fmtSpeed, dispAlt, altLabel } from '$lib/units';
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

  // Little arrows, aligned to the map rotation. Jump run points the drop
  // direction; the ground wind points where the wind blows TO (it comes FROM dir).
  const norm = (a: number) => ((a % 360) + 360) % 360;
  const jumpAngle = $derived(norm(Math.round(app.jumpRunDir) + app.bearing));
  const windAngle = $derived(norm(Math.round(surf.dir) + 180 + app.bearing));

  // Full winds profile (display view shows every level, not just the ground wind).
  const allWinds = $derived(
    app.winds
      .slice()
      .sort((a, b) => b.alt - a.alt)
      .map((w) => ({
        alt: `${dispAlt(w.alt, app.altUnit)} ${altLabel(app.altUnit)}`,
        dir: Math.round(w.dir),
        spd: fmtSpeed(w.spd, app.windUnit),
        col: windCol(w.spd),
        angle: norm(Math.round(w.dir) + 180 + app.bearing),
      })),
  );

  // No DZ selected (bare target) → show the GPS coordinates instead of a name.
  const dzLabel = $derived(
    app.target?.name?.trim()
      ? app.target.name
      : app.target
        ? `${app.target.lat.toFixed(4)}, ${app.target.lng.toFixed(4)}`
        : '',
  );

  let open = $state(true);
  let fsEdit = $state<'circuit' | 'jump' | 'wind' | null>(null);

  // Rows are clickable for quick edits everywhere — except the read-only display view.
  const editable = $derived(!app.displayMode);
</script>

{#snippet arrow(angle: number, color: string)}
  <span class="arr" style="transform:rotate({angle}deg);color:{color}">↑</span>
{/snippet}

{#if app.target}
  <div class="summary">
    {#if fsEdit}
      {#if fsEdit === 'circuit'}
        <FsCircuit back={() => (fsEdit = null)} />
      {:else if fsEdit === 'jump'}
        <FsJump back={() => (fsEdit = null)} />
      {:else}
        <FsWind back={() => (fsEdit = null)} />
      {/if}
    {:else}
      <button class="hdr" onclick={() => (open = !open)} aria-expanded={open}>
        <span class="dz">{dzLabel}</span>
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
            <span class="v jump">{@render arrow(jumpAngle, 'var(--jump)')}{jump}</span>
          </button>
          {#if app.displayMode}
            <div class="rw">
              <span class="k">{m.windsaloft_heading()}</span>
              <div class="wlist">
                {#each allWinds as w}
                  <div class="wrow">
                    <span class="wa">{w.alt}</span>
                    <span class="warr">{@render arrow(w.angle, w.col)}</span>
                    <span class="wd">{w.dir}°</span>
                    <span class="ws" style="color:{w.col}">{w.spd}</span>
                  </div>
                {/each}
              </div>
            </div>
          {:else}
            <button class="rw" class:click={editable} disabled={!editable} onclick={() => (fsEdit = 'wind')}>
              <span class="k">{m.sum_ground_wind()}</span>
              <span class="v">
                {@render arrow(windAngle, windCol(surf.spd))}{Math.round(surf.dir)}° ·
                <span style="color:{windCol(surf.spd)}">{fmtSpeed(surf.spd, app.windUnit)}</span>
              </span>
            </button>
          {/if}
        </div>
        {#if app.circuitEdited}
          <button class="reset" onclick={() => app.resetCircuitNodes()}>{m.circuit_reset()}</button>
        {/if}
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
  .wlist {
    margin-top: 4px;
    display: grid;
    grid-template-columns: 1fr auto auto auto;
    align-items: center;
    gap: 3px 8px;
    max-height: 46vh;
    overflow: auto;
    font: 600 10.5px/1.2 var(--font-mono);
    color: var(--fg);
  }
  /* Each row contributes its cells to the shared grid so columns line up. */
  .wrow {
    display: contents;
  }
  .wa {
    color: var(--muted);
  }
  .warr {
    display: flex;
    justify-content: center;
  }
  .wd {
    text-align: right;
  }
  .ws {
    text-align: right;
    font-weight: 700;
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
  .arr {
    display: inline-block;
    margin-right: 3px;
    font: 700 11px/1 var(--font-mono);
  }
  .reset {
    display: block;
    width: 100%;
    margin-top: 10px;
    cursor: pointer;
    background: var(--surface2);
    border: 1px solid var(--accent);
    border-radius: 8px;
    padding: 7px;
    font: 700 10px/1 var(--font-display);
    color: var(--accent);
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

  /* Print: no collapse toggle or reset/CTA controls — just the read-out. */
  @media print {
    .chev,
    .reset,
    .cta {
      display: none !important;
    }
  }
</style>
