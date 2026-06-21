<script lang="ts">
  import { app } from '$lib/state.svelte';
  import * as m from '$lib/paraglide/messages';
</script>

<div class="legend">
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
    <span class="wind">↑</span>{m.leg_wind()}
  </button>
  <button class:off={!app.showCompass} onclick={() => (app.showCompass = !app.showCompass)}>
    <span class="ring"></span>{m.leg_compass()}
  </button>
  <button class:off={!app.showOpenZone} onclick={() => (app.showOpenZone = !app.showOpenZone)}>
    <span class="ring2"></span>{m.leg_zone()}
  </button>
  <button class:off={!app.showLegs} onclick={() => (app.showLegs = !app.showLegs)}>
    <span class="legbox"></span>{m.leg_legs()}
  </button>
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
    width: 13px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font: 700 13px/1 var(--font-mono);
    color: var(--accent2);
  }
  .ring2 {
    width: 14px;
    height: 14px;
    border-radius: 50%;
    border: 2px dotted var(--accent2);
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
