<script lang="ts">
  import { app } from '$lib/state.svelte';
  import * as m from '$lib/paraglide/messages';
  import Dial from '../Dial.svelte';

  const refs = $derived(app.jrRefs);
  const refName = $derived(app.jrRefName);
  const dir = $derived(Math.round(((app.jumpRunDir % 360) + 360) % 360));
  const offsetTxt = $derived.by(() => {
    const v = Math.round(app.jumpRunOffset || 0);
    return v === 0 ? m.offset_on_axis() : v > 0 ? m.offset_right({ v }) : m.offset_left({ v });
  });
  const num = (v: string) => {
    const f = parseFloat(v);
    return isNaN(f) ? 0 : f;
  };
</script>

<div class="card">
  <h2 class="eyebrow">{m.jumprun_heading()}</h2>

  <fieldset class="body" disabled={app.circuitLocked}>
  <div class="top">
    <Dial
      value={dir}
      size={110}
      variant="jump"
      cardinals={false}
      disabled={app.circuitLocked}
      onpick={(d) => app.setJumpDir(d)}
    />
    <div class="r">
      <div class="label">{m.aircraft_heading()}</div>
      <div class="inrow">
        <input
          class="field axis"
          type="number"
          value={dir}
          oninput={(e) => app.setJumpDir(num(e.currentTarget.value))}
        />
        <span class="deg">°</span>
      </div>
      {#if app.jumpDirAuto && app.jumpRefIsTarget}
        <div class="auto">↺ {m.jumprun_to_wind()}</div>
      {:else}
        <button class="towind" onclick={() => app.jumpDirToWind()}>↺ {m.jumprun_to_wind()}</button>
      {/if}
      <button class="towind" onclick={() => app.jumpDirToWindAt(6000)}>↺ {m.jumprun_to_wind_6000()}</button>
    </div>
  </div>

  {#if refs.length > 1}
    <label class="label" for="jrref">{m.reference_point()}</label>
    <select
      id="jrref"
      class="field select"
      value={app.jumpRefIdx || 0}
      onchange={(e) => (app.jumpRefIdx = num(e.currentTarget.value))}
    >
      {#each refs as rf, i}
        <option value={i}>{rf.name}</option>
      {/each}
    </select>
  {/if}

  <div class="label">{m.offset_label({ ref: refName, value: offsetTxt })}</div>
  <div class="offrow">
    <input
      class="range"
      type="range"
      min="-600"
      max="600"
      step="20"
      bind:value={app.jumpRunOffset}
      oninput={() => (app.jumpRun = true)}
    />
    <input
      class="field off"
      type="number"
      step="10"
      bind:value={app.jumpRunOffset}
      oninput={() => (app.jumpRun = true)}
    />
  </div>
  </fieldset>
  <div class="note">{m.jumprun_note()}</div>
</div>

<style>
  .eyebrow {
    display: block;
    margin-bottom: 12px;
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
  .top {
    display: flex;
    align-items: center;
    gap: 14px;
    margin-bottom: 11px;
  }
  .r {
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
    width: 60px;
    font: 700 17px/1 var(--font-mono);
    padding: 7px 8px;
  }
  .deg {
    font: 700 14px/1 var(--font-mono);
    color: var(--muted);
  }
  .auto {
    font: 500 9.5px/1.3 var(--font-mono);
    color: var(--accent2);
  }
  .towind {
    background: none;
    border: none;
    padding: 0;
    text-align: left;
    cursor: pointer;
    font: 600 9.5px/1.3 var(--font-mono);
    color: var(--accent2);
  }
  .select {
    margin-bottom: 11px;
    font-size: 12.5px;
    padding: 8px 9px;
  }
  .offrow {
    display: flex;
    align-items: center;
    gap: 9px;
  }
  .range {
    flex: 1;
    min-width: 0;
    accent-color: var(--jump);
    cursor: pointer;
  }
  .off {
    width: 64px;
    font-size: 13px;
    padding: 7px 8px;
  }
  .note {
    margin-top: 7px;
    font: 500 10px/1.45 var(--font-mono);
    color: var(--muted);
  }
</style>
