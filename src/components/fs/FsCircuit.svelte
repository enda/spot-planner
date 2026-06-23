<script lang="ts">
  import { app } from '$lib/state.svelte';
  import { windAt, landingHeading } from '$lib/physics';
  import * as m from '$lib/paraglide/messages';
  import Dial from '../Dial.svelte';

  let { back }: { back: () => void } = $props();

  const lh = $derived(Math.round(landingHeading(app.phys)));
  const windDir = $derived(((Math.round(windAt(app.winds, 0).dir) % 360) + 360) % 360);
  // "Face vent" is active whenever the landing axis equals the ground wind —
  // whether reached via auto mode or by dialing to it manually.
  const facing = $derived((((lh % 360) + 360) % 360) === windDir);
  const num = (v: string) => {
    const f = parseFloat(v);
    return isNaN(f) ? 0 : f;
  };
  // Base value used by the ±/field: current heading (wind dir in auto, else manual).
  const base = $derived(app.landingMode === 'manual' ? app.landingDir : Math.round(windAt(app.winds, 0).dir));
  const setDir = (deg: number) => {
    app.landingMode = 'manual';
    app.landingDir = (((Math.round(deg) % 360) + 360) % 360);
  };
</script>

<div class="head">
  <button class="back" aria-label="←" onclick={back}>←</button>
  <span class="title circuit">{m.sum_circuit()}</span>
</div>

<div class="lbl">{m.circuit_direction()}</div>
<div class="seg">
  <button class:on={app.handed === 'left'} onclick={() => (app.handed = 'left')}>{m.fs_left()}</button>
  <button class:on={app.handed === 'right'} onclick={() => (app.handed = 'right')}>{m.fs_right()}</button>
</div>

<div class="lbl c accent">{m.landing_axis()} · {lh}°</div>
<div class="dialwrap">
  <Dial value={lh} size={104} variant="landing" onpick={setDir} />
</div>

<div class="steprow">
  <button class="step" onclick={() => setDir(base - 5)}>−</button>
  <input class="field" type="number" value={lh} oninput={(e) => setDir(num(e.currentTarget.value))} />
  <button class="step" onclick={() => setDir(base + 5)}>+</button>
</div>

<button class="facewind" class:on={facing} onclick={() => (app.landingMode = 'wind')}>
  {m.into_wind()}
</button>

<style>
  .head {
    display: flex;
    align-items: center;
    gap: 9px;
    margin: 0 0 11px;
  }
  .back {
    flex: none;
    width: 26px;
    height: 26px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid var(--line);
    border-radius: 7px;
    background: none;
    color: var(--fg);
    cursor: pointer;
    font: 700 14px/1 var(--font-display);
  }
  .title {
    font: 700 11px/1 var(--font-display);
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }
  .title.circuit {
    color: var(--accent);
  }
  .lbl {
    font: 600 8px/1 var(--font-display);
    letter-spacing: 0.07em;
    text-transform: uppercase;
    color: var(--muted);
    margin: 0 0 5px;
  }
  .lbl.c {
    text-align: center;
  }
  .lbl.accent {
    color: var(--accent);
  }
  .seg {
    display: flex;
    gap: 3px;
    background: var(--surface2);
    border: 1px solid var(--line);
    border-radius: 8px;
    padding: 3px;
    margin: 0 0 11px;
  }
  .seg button {
    flex: 1;
    cursor: pointer;
    border: none;
    border-radius: 6px;
    background: transparent;
    color: var(--muted);
    padding: 7px 4px;
    font: 600 11px/1 var(--font-display);
  }
  .seg button.on {
    background: var(--accent);
    color: var(--onAccent);
  }
  .dialwrap {
    display: flex;
    justify-content: center;
  }
  .steprow {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    margin-top: 8px;
  }
  .step {
    width: 32px;
    cursor: pointer;
    border: 1px solid var(--line);
    border-radius: 7px;
    background: none;
    color: var(--fg);
    padding: 7px 0;
    font: 700 13px/1 var(--font-mono);
  }
  .field {
    width: 58px;
    box-sizing: border-box;
    text-align: center;
    background: var(--surface2);
    color: var(--fg);
    border: 1px solid var(--line);
    border-radius: 7px;
    padding: 7px 4px;
    font: 700 13px/1 var(--font-mono);
    outline: none;
  }
  .facewind {
    width: 100%;
    margin-top: 7px;
    cursor: pointer;
    border: 1px solid var(--line);
    border-radius: 7px;
    background: transparent;
    color: var(--muted);
    padding: 7px 0;
    font: 700 8.5px/1 var(--font-display);
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }
  .facewind.on {
    background: var(--accent);
    border-color: transparent;
    color: var(--onAccent);
  }
</style>
