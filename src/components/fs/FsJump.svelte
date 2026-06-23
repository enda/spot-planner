<script lang="ts">
  import { app } from '$lib/state.svelte';
  import { windAt } from '$lib/physics';
  import * as m from '$lib/paraglide/messages';
  import Dial from '../Dial.svelte';

  let { back }: { back: () => void } = $props();

  const refs = $derived(app.jrRefs);
  const dir = $derived(Math.round(((app.jumpRunDir % 360) + 360) % 360));
  const wind15 = $derived(((Math.round(windAt(app.winds, 1500).dir) % 360) + 360) % 360);
  const wind4k = $derived(((Math.round(windAt(app.winds, 4000).dir) % 360) + 360) % 360);
  const offsetTxt = $derived.by(() => {
    const v = Math.round(app.jumpRunOffset || 0);
    return v === 0 ? m.offset_on_axis() : v > 0 ? m.offset_right({ v }) : m.offset_left({ v });
  });
  const num = (v: string) => {
    const f = parseFloat(v);
    return isNaN(f) ? 0 : f;
  };
  const setOff = (v: number) => {
    app.jumpRunOffset = Math.round(v);
    app.jumpRun = true;
  };
</script>

<div class="head">
  <button class="back" aria-label="←" onclick={back}>←</button>
  <span class="title">{m.sum_jump()}</span>
</div>

{#if refs.length > 1}
  <div class="lbl">{m.reference_point()}</div>
  <select
    class="select"
    value={app.jumpRefIdx || 0}
    onchange={(e) => (app.jumpRefIdx = num(e.currentTarget.value))}
  >
    {#each refs as rf, i}
      <option value={i}>{rf.name}</option>
    {/each}
  </select>
{/if}

<div class="lbl c">{m.aircraft_heading()} · {dir}°</div>
<div class="dialwrap">
  <Dial value={dir} size={104} variant="jump" cardinals={false} onpick={(d) => app.setJumpDir(d)} />
</div>

<div class="steprow">
  <button class="step" onclick={() => app.setJumpDir(dir - 5)}>−</button>
  <input class="field" type="number" value={dir} oninput={(e) => app.setJumpDir(num(e.currentTarget.value))} />
  <button class="step" onclick={() => app.setJumpDir(dir + 5)}>+</button>
</div>

<div class="lbl c top">{m.into_wind()}</div>
<div class="seg2">
  <button class:on={dir === wind15} onclick={() => app.jumpDirToWindAt(1500)}>1500 m</button>
  <button class:on={dir === wind4k} onclick={() => app.jumpDirToWind()}>4000 m</button>
</div>

<div class="lbl c top">{m.fs_offset()} · {offsetTxt}</div>
<input
  class="range"
  type="range"
  min="-600"
  max="600"
  step="20"
  value={Math.round(app.jumpRunOffset || 0)}
  oninput={(e) => setOff(num(e.currentTarget.value))}
/>
<div class="steprow">
  <button class="step" onclick={() => setOff((app.jumpRunOffset || 0) - 20)}>−</button>
  <input
    class="field"
    type="number"
    step="20"
    value={Math.round(app.jumpRunOffset || 0)}
    oninput={(e) => setOff(num(e.currentTarget.value))}
  />
  <button class="step" onclick={() => setOff((app.jumpRunOffset || 0) + 20)}>+</button>
</div>

<style>
  .head {
    display: flex;
    align-items: center;
    gap: 9px;
    margin: 0 0 11px;
  }
  .back {
    flex: none;
    box-sizing: border-box;
    width: 26px;
    height: 26px;
    padding: 0;
    -webkit-appearance: none;
    appearance: none;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid var(--line);
    border-radius: 7px;
    background: none;
    color: var(--fg);
    cursor: pointer;
    font: 700 15px/1 var(--font-display);
  }
  .title {
    font: 700 11px/1 var(--font-display);
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--accent);
  }
  .lbl {
    font: 600 8px/1 var(--font-display);
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--jump);
    margin: 0 0 5px;
  }
  .lbl.c {
    text-align: center;
  }
  .lbl.top {
    margin-top: 10px;
  }
  .select {
    width: 100%;
    box-sizing: border-box;
    margin: 0 0 10px;
    background: var(--surface2);
    color: var(--fg);
    border: 1px solid var(--line);
    border-radius: 8px;
    padding: 7px 9px;
    font: 600 11px/1.1 var(--font-mono);
    outline: none;
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
    color: var(--jump);
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
  .seg2 {
    display: flex;
    gap: 6px;
  }
  .seg2 button {
    flex: 1;
    cursor: pointer;
    border: 1px solid var(--accent2);
    border-radius: 7px;
    background: transparent;
    color: var(--accent2);
    padding: 7px 0;
    font: 700 10px/1 var(--font-mono);
  }
  .seg2 button.on {
    background: var(--accent2);
    border-color: transparent;
    color: var(--onAccent);
  }
  .range {
    width: 100%;
    box-sizing: border-box;
    accent-color: var(--jump);
    cursor: pointer;
    margin: 0 0 4px;
  }
</style>
