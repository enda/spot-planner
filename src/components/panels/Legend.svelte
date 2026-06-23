<script lang="ts">
  import { app } from '$lib/state.svelte';
  import * as m from '$lib/paraglide/messages';
</script>

<div class="legend">
  <button class:off={!app.showTarget} onclick={() => (app.showTarget = !app.showTarget)}>
    <span class="targetdot"></span>{m.leg_target()}
  </button>
  {#if !app.adminOpen}
    <button class:off={!app.showCircuit} onclick={() => (app.showCircuit = !app.showCircuit)}>
      <span class="bar" style="background:var(--accent)"></span>{m.leg_circuit()}
    </button>
    <button class:off={!app.showIdeal} onclick={() => (app.showIdeal = !app.showIdeal)}>
      <span class="dash" style="border-color:var(--accent2)"></span>{m.leg_ideal()}
    </button>
    <button class:off={!app.jumpRun} onclick={() => (app.jumpRun = !app.jumpRun)}>
      <span class="dot-dash"></span>{m.leg_jump()}
    </button>
    <button class:off={!app.showWindLayer} onclick={() => (app.showWindLayer = !app.showWindLayer)}>
      <svg class="wind" viewBox="-8 -8 16 16" aria-hidden="true">
        <defs>
          <linearGradient id="windgrad" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0" stop-color="#3fd07a" />
            <stop offset="0.5" stop-color="#f2a40c" />
            <stop offset="1" stop-color="#ff6b5e" />
          </linearGradient>
        </defs>
        <path d="M0 -6.5 L4 3.4 L0 1 L-4 3.4 Z" fill="url(#windgrad)" transform="rotate(35)" />
      </svg>{m.leg_wind()}
    </button>
    <button class:off={!app.showCompass} onclick={() => (app.showCompass = !app.showCompass)}>
      <span class="ring"></span>{m.leg_compass()}
    </button>
    <button class:off={!app.showOpenZone} onclick={() => (app.showOpenZone = !app.showOpenZone)}>
      <span class="ring2"></span>{m.leg_zone()}
    </button>
  {/if}
  <button class:off={!app.showJrRefs} onclick={() => (app.showJrRefs = !app.showJrRefs)}>
    <span class="refdot"></span>{m.leg_refs()}
  </button>
  <button class:off={!app.showRunways} onclick={() => (app.showRunways = !app.showRunways)}>
    <span class="runwaybar"></span>{m.leg_runways()}
  </button>
  <button class:off={!app.showZones} onclick={() => (app.showZones = !app.showZones)}>
    <span class="zonebox"></span>{m.leg_zones()}
  </button>
  {#if !app.adminOpen}
    <button class:off={!app.showLegs} onclick={() => (app.showLegs = !app.showLegs)}>
      <span class="legbox"></span>{m.leg_legs()}
    </button>
  {/if}
  <button class:off={!app.showLabels} onclick={() => (app.showLabels = !app.showLabels)}>
    <span class="tbox">T</span>{m.leg_labels()}
  </button>
</div>

<style>
  .legend {
    display: flex;
    flex-wrap: wrap;
    gap: 16px 18px;
    padding: 0 2px;
  }
  button {
    cursor: pointer;
    user-select: none;
    display: flex;
    align-items: center;
    gap: 7px;
    background: none;
    border: none;
    padding: 0;
    font: 600 11px/1.3 var(--font-display);
    color: var(--muted);
    transition: opacity 0.15s;
  }
  button.off {
    opacity: 0.5;
  }
  .bar {
    width: 18px;
    height: 4px;
    border-radius: 2px;
    display: inline-block;
  }
  .dash {
    width: 18px;
    height: 0;
    border-top: 3px dashed;
    display: inline-block;
  }
  .dot-dash {
    width: 18px;
    height: 0;
    border-top: 3px dotted var(--jump);
    display: inline-block;
  }
  .ring {
    width: 13px;
    height: 13px;
    border-radius: 50%;
    border: 1.5px solid var(--muted);
    display: inline-block;
  }
  .wind {
    width: 15px;
    height: 15px;
    flex: none;
    display: inline-block;
    overflow: visible;
  }
  .ring2 {
    width: 14px;
    height: 14px;
    border-radius: 50%;
    border: 2px dotted var(--accent2);
    display: inline-block;
  }
  .refdot {
    width: 9px;
    height: 9px;
    border-radius: 50%;
    background: #0c1014;
    border: 2px solid var(--jump);
    display: inline-block;
  }
  .targetdot {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: rgba(242, 164, 12, 0.25);
    border: 2.5px solid var(--accent);
    display: inline-block;
  }
  .legbox {
    width: 14px;
    height: 10px;
    border-radius: 2px;
    background: rgba(242, 164, 12, 0.55);
    border: 1.5px solid var(--accent);
    display: inline-block;
  }
  .zonebox {
    width: 14px;
    height: 11px;
    border-radius: 2px;
    background: rgba(63, 208, 122, 0.28);
    border: 1.5px solid #3fd07a;
    display: inline-block;
  }
  .runwaybar {
    width: 18px;
    height: 4px;
    border-radius: 1px;
    background: #fff;
    display: inline-block;
  }
  .tbox {
    width: 13px;
    height: 13px;
    border-radius: 3px;
    border: 1.5px solid var(--muted);
    display: flex;
    align-items: center;
    justify-content: center;
    font: 700 9px/1 var(--font-display);
    color: var(--muted);
  }
</style>
