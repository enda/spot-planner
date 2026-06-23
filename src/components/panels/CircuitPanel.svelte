<script lang="ts">
  import { app } from '$lib/state.svelte';
  import { windAt, landingHeading, getFwd, angDiff, rad } from '$lib/physics';
  import { dispAlt, altToM, altLabel } from '$lib/units';
  import * as m from '$lib/paraglide/messages';
  import Dial from '../Dial.svelte';

  const surf = $derived(windAt(app.winds, 0));
  const lh = $derived(landingHeading(app.phys));
  const fwd = $derived(getFwd(app.phys));
  const delta = $derived(angDiff(lh, surf.dir));
  const cross = $derived(surf.spd * Math.sin(rad(delta)));
  const crab = $derived(
    (Math.asin(Math.max(-0.999, Math.min(0.999, cross / Math.max(0.5, fwd)))) * 180) / Math.PI,
  );
  const warnColor = $derived(
    Math.abs(delta) > 110 ? 'var(--danger)' : Math.abs(delta) > 35 ? 'var(--accent)' : 'var(--good)',
  );

  const aLabel = $derived(altLabel(app.altUnit));
  const num = (v: string) => {
    const f = parseFloat(v);
    return isNaN(f) ? 0 : f;
  };
  const dwDisp = $derived(dispAlt(app.dwAlt, app.altUnit));
  const baseDisp = $derived(dispAlt(app.baseAlt, app.altUnit));
  const finalDisp = $derived(dispAlt(app.finalAlt, app.altUnit));

  function setManual() {
    app.landingMode = 'manual';
    app.landingDir = Math.round(windAt(app.winds, 0).dir);
  }
</script>

<div class="card">
  <h2 class="eyebrow">{m.circuit_heading()}</h2>

  {#if app.circuitLocked}
    <button class="lockbar" onclick={() => (app.circuitLocked = false)}>
      🔒 {m.circuit_locked()} · {m.circuit_unlock()}
    </button>
  {/if}

  <fieldset class="body" disabled={app.circuitLocked}>
    <div class="label" id="lbl-pose">{m.landing_direction()}</div>
  <div class="seg mb" role="group" aria-labelledby="lbl-pose">
    <button class:on={app.landingMode !== 'manual'} onclick={() => (app.landingMode = 'wind')}>
      {m.into_wind()}
    </button>
    <button class:on={app.landingMode === 'manual'} onclick={setManual}>{m.manual()}</button>
  </div>

  {#if app.landingMode === 'manual'}
    <div class="manual">
      <Dial bind:value={app.landingDir} size={128} variant="landing" disabled={app.circuitLocked} />
      <div class="manual-r">
        <div class="label">{m.landing_axis()}</div>
        <div class="inrow">
          <input
            class="field axis"
            type="number"
            value={Math.round(((app.landingDir % 360) + 360) % 360)}
            oninput={(e) => (app.landingDir = ((num(e.currentTarget.value) % 360) + 360) % 360)}
          />
          <span class="deg">°</span>
        </div>
        <div class="hint">{m.dial_hint()}</div>
      </div>
    </div>
  {/if}

  <div class="stats">
    <span>{m.stat_axis()} <b>{Math.round(lh)}°</b></span>
    <span>{m.stat_offset()} <b style="color:{warnColor}">{delta >= 0 ? '+' : ''}{Math.round(delta)}°</b></span>
    <span>{m.stat_crab()} <b style="color:var(--accent2)">{Math.round(Math.abs(crab))}°</b></span>
  </div>

  <div class="label" id="lbl-hand">{m.circuit_direction()}</div>
  <div class="seg mb" role="group" aria-labelledby="lbl-hand">
    <button class:on={app.handed === 'left'} onclick={() => (app.handed = 'left')}>{m.left_hand()}</button>
    <button class:on={app.handed === 'right'} onclick={() => (app.handed = 'right')}>{m.right_hand()}</button>
  </div>
  </fieldset>

  <div class="row3">
    <div>
      <label class="label" for="dw">{m.downwind_alt({ unit: aLabel })}</label>
      <input
        id="dw"
        class="field sm"
        type="number"
        value={dwDisp}
        oninput={(e) => (app.dwAlt = altToM(num(e.currentTarget.value), app.altUnit))}
      />
    </div>
    <div>
      <label class="label" for="base">{m.base_alt({ unit: aLabel })}</label>
      <input
        id="base"
        class="field sm"
        type="number"
        value={baseDisp}
        oninput={(e) => (app.baseAlt = altToM(num(e.currentTarget.value), app.altUnit))}
      />
    </div>
    <div>
      <label class="label" for="final">{m.final_alt({ unit: aLabel })}</label>
      <input
        id="final"
        class="field sm"
        type="number"
        value={finalDisp}
        oninput={(e) => (app.finalAlt = altToM(num(e.currentTarget.value), app.altUnit))}
      />
    </div>
  </div>

  <div class="presets">
    <button onclick={() => ((app.dwAlt = 300), (app.baseAlt = 200), (app.finalAlt = 100))}>
      300·200·100
    </button>
    <button onclick={() => ((app.dwAlt = 300), (app.baseAlt = 150), (app.finalAlt = 90))}>
      300·150·90
    </button>
  </div>
  <div class="note">{m.circuit_note()}</div>

  {#if app.circuitEdited}
    <button class="reset" onclick={() => app.resetCircuitNodes()}>{m.circuit_reset()}</button>
  {/if}
</div>

<style>
  .eyebrow {
    display: block;
    margin-bottom: 13px;
  }
  .body {
    border: none;
    margin: 0;
    padding: 0;
    min-width: 0;
  }
  .body:disabled {
    opacity: 0.55;
  }
  .lockbar {
    display: block;
    width: 100%;
    text-align: left;
    cursor: pointer;
    margin: 0 0 13px;
    padding: 8px 10px;
    border: 1px solid var(--accent2);
    border-radius: 8px;
    background: color-mix(in srgb, var(--accent2) 12%, transparent);
    font: 600 10.5px/1.4 var(--font-mono);
    color: var(--accent2);
  }
  .lockbar:hover {
    background: color-mix(in srgb, var(--accent2) 20%, transparent);
  }
  .mb {
    margin-bottom: 11px;
  }
  .manual {
    display: flex;
    align-items: center;
    gap: 14px;
    margin-bottom: 11px;
  }
  .manual-r {
    display: flex;
    flex-direction: column;
    gap: 7px;
  }
  .inrow {
    display: flex;
    align-items: baseline;
    gap: 3px;
  }
  .axis {
    width: 62px;
    font: 700 18px/1 var(--font-mono);
    padding: 7px 8px;
  }
  .deg {
    font: 700 15px/1 var(--font-mono);
    color: var(--muted);
  }
  .hint {
    font: 500 9.5px/1.4 var(--font-mono);
    color: var(--muted);
  }
  .stats {
    display: flex;
    justify-content: space-between;
    gap: 8px;
    margin: 4px 0 15px;
    font: 600 10.5px/1.3 var(--font-mono);
    color: var(--muted);
  }
  .stats b {
    color: var(--fg);
    font-weight: 700;
  }
  .reset {
    width: 100%;
    margin: 12px 0 0;
    cursor: pointer;
    background: var(--surface2);
    border: 1px solid var(--accent);
    border-radius: 8px;
    padding: 8px;
    font: 700 11px/1 var(--font-display);
    color: var(--accent);
  }
  .row3 {
    display: flex;
    gap: 8px;
  }
  .row3 > div {
    flex: 1;
  }
  .sm {
    padding: 8px 7px;
  }
  .presets {
    margin-top: 11px;
    display: flex;
    gap: 6px;
  }
  .presets button {
    flex: 1;
    cursor: pointer;
    text-align: center;
    border: 1px solid var(--line);
    border-radius: 7px;
    padding: 7px 6px;
    font: 600 11px/1 var(--font-mono);
    color: var(--fg);
    background: var(--surface2);
    white-space: nowrap;
  }
  .note {
    margin-top: 9px;
    font: 500 10.5px/1.5 var(--font-mono);
    color: var(--muted);
  }
</style>
