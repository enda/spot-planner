<script lang="ts">
  import { app } from '$lib/state.svelte';
  import { windAt } from '$lib/physics';
  import { windCol } from '$lib/colors';
  import { fmtSpeed, fmtAlt } from '$lib/units';
  import * as m from '$lib/paraglide/messages';

  const sw = $derived(windAt(app.winds, app.windAlt));
  const spd = $derived(fmtSpeed(sw.spd, app.windUnit));
  const col = $derived(windCol(sw.spd));
  // Arrow points the way the wind blows TO; on the rotated map a geographic
  // bearing β sits at screen angle (β + bearing), so add the map bearing.
  const arrowRot = $derived((((sw.dir + 180 + app.bearing) % 360) + 360) % 360);
  const northRot = $derived((((app.bearing % 360) + 360) % 360));
</script>

{#if app.showWind}
  <div class="widget">
    <button class="mini" title={m.wind_collapse()} onclick={() => (app.showWind = false)}>−</button>
    <div class="rose">
      <div class="north" style="transform:rotate({northRot}deg)"><span>N</span></div>
      <div class="arrow" style="transform:rotate({arrowRot}deg);color:{col}">
        <svg width="26" height="26" viewBox="0 0 28 28">
          <line x1="14" y1="23" x2="14" y2="9" stroke="currentColor" stroke-width="3" />
          <path d="M14 5 L19 13 L9 13 Z" fill="currentColor" />
        </svg>
      </div>
    </div>
    <div class="readout">
      <div class="spd" style="color:{col}">{spd}</div>
      <div class="dir">{Math.round(sw.dir)}°</div>
    </div>
    <input
      class="vslider"
      type="range"
      min="0"
      max="6000"
      step="100"
      bind:value={app.windAlt}
    />
    <div class="alt">{fmtAlt(app.windAlt, app.altUnit)}</div>
  </div>
{:else}
  <button class="collapsed" title={m.wind_expand()} onclick={() => (app.showWind = true)}>
    <div class="rose small">
      <div class="north" style="transform:rotate({northRot}deg)"><span>N</span></div>
      <div class="arrow" style="transform:rotate({arrowRot}deg);color:{col}">
        <svg width="19" height="19" viewBox="0 0 28 28">
          <line x1="14" y1="23" x2="14" y2="9" stroke="currentColor" stroke-width="3.4" />
          <path d="M14 5 L19 13 L9 13 Z" fill="currentColor" />
        </svg>
      </div>
    </div>
    <div class="alt">{fmtAlt(app.windAlt, app.altUnit)}</div>
  </button>
{/if}

<style>
  .widget {
    position: absolute;
    right: 12px;
    top: 12px;
    z-index: 1200;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 7px;
    background: var(--surface);
    border: 1px solid var(--line);
    border-radius: 13px;
    padding: 9px 8px 10px;
    box-shadow: 0 3px 12px rgba(0, 0, 0, 0.3);
  }
  .mini {
    align-self: flex-end;
    width: 18px;
    height: 18px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: none;
    background: transparent;
    border-radius: 5px;
    color: var(--muted);
    font: 700 13px/1 var(--font-display);
    cursor: pointer;
    margin: -3px -2px 0 0;
  }
  .rose {
    position: relative;
    width: 54px;
    height: 54px;
    border-radius: 50%;
    background: var(--surface2);
    border: 1px solid var(--line);
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .rose.small {
    width: 40px;
    height: 40px;
    flex: none;
  }
  .north {
    position: absolute;
    inset: 0;
    transition: transform 0.2s ease;
  }
  .north span {
    position: absolute;
    top: 3px;
    left: 0;
    right: 0;
    text-align: center;
    font: 700 8px/1 var(--font-display);
    color: var(--danger);
  }
  .rose.small .north span {
    top: 2px;
    font-size: 7px;
  }
  .arrow {
    transition:
      transform 0.2s ease,
      color 0.2s ease;
    display: flex;
  }
  .readout {
    text-align: center;
  }
  .spd {
    font: 700 12px/1 var(--font-mono);
    white-space: nowrap;
  }
  .dir {
    margin-top: 3px;
    font: 600 9px/1 var(--font-mono);
    color: var(--muted);
  }
  .vslider {
    writing-mode: vertical-lr;
    direction: rtl;
    width: 22px;
    height: 118px;
    accent-color: var(--accent2);
    cursor: pointer;
  }
  .alt {
    font: 700 10px/1 var(--font-mono);
    color: var(--fg);
    white-space: nowrap;
  }
  .collapsed {
    position: absolute;
    right: 12px;
    top: 12px;
    z-index: 1200;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 5px;
    cursor: pointer;
    background: var(--surface);
    border: 1px solid var(--line);
    border-radius: 12px;
    padding: 7px 9px 8px;
    box-shadow: 0 3px 12px rgba(0, 0, 0, 0.3);
  }
</style>
