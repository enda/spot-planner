<script lang="ts">
  import { app } from '$lib/state.svelte';
  import { getFwd, getDesc } from '$lib/physics';
  import { windCol, WIND_BANDS } from '$lib/colors';
  import { fromKt } from '$lib/units';
  import * as m from '$lib/paraglide/messages';
  import Collapsible from '../Collapsible.svelte';

  // [labelFn, kt, sign]  sign +1 = tailwind, -1 = headwind, 0 = calm
  const CONDS: [() => string, number, number][] = [
    [m.cond_strong_tail_high, 21, 1],
    [m.cond_strong_tail, 15, 1],
    [m.cond_med_tail, 8, 1],
    [m.cond_light, 2, 0],
    [m.cond_med_head, 8, -1],
    [m.cond_strong_head, 15, -1],
    [m.cond_strong_head_high, 21, -1],
  ];

  const rows = $derived.by(() => {
    const fwd = getFwd(app.phys);
    const desc = Math.max(0.5, getDesc(app.phys));
    return CONDS.map(([label, kt, sign]) => {
      const wms = fromKt(kt) * sign;
      const gr = (fwd + wms) / desc;
      const wc = windCol(Math.abs(wms));
      return {
        label: label(),
        windTxt: sign === 0 ? '≈ 0 kt' : `${sign > 0 ? '+' : '−'}${kt} kt`,
        wc,
        gr: gr.toFixed(2),
      };
    });
  });
</script>

<Collapsible title={m.groundglide_heading()}>
  <div class="hdr">
    <div>{m.col_condition()}</div>
    <div>{m.col_wind()}</div>
    <div>{m.col_groundglide()}</div>
  </div>
  {#each rows as r}
    <div class="row">
      <div class="lbl">{r.label}</div>
      <div class="wind" style="color:{r.wc}">{r.windTxt}</div>
      <div class="gr" style="color:{r.wc}">{r.gr}<span class="u"> :1</span></div>
    </div>
  {/each}

  <div class="bands">
    {#each WIND_BANDS as b}
      <span class="band"><span class="chip" style="background:{b.c}"></span>{b.t}</span>
    {/each}
  </div>
</Collapsible>

<style>
  .hdr,
  .row {
    display: grid;
    grid-template-columns: 1.5fr 0.7fr 1fr;
    gap: 9px;
    align-items: center;
  }
  .hdr {
    margin: 0 0 8px;
    font: 600 8.5px/1 var(--font-display);
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--muted);
  }
  .row {
    margin-bottom: 9px;
  }
  .lbl {
    font: 600 11px/1.2 var(--font-display);
    color: var(--fg);
  }
  .wind {
    font: 700 11.5px/1 var(--font-mono);
  }
  .gr {
    font: 700 13px/1 var(--font-mono);
  }
  .u {
    font-size: 9px;
    color: var(--muted);
  }
  .bands {
    display: flex;
    flex-wrap: wrap;
    gap: 8px 12px;
    margin-top: 11px;
    padding-top: 11px;
    border-top: 1px solid var(--line);
  }
  .band {
    display: flex;
    align-items: center;
    gap: 5px;
    font: 600 9.5px/1 var(--font-mono);
    color: var(--muted);
  }
  .chip {
    width: 12px;
    height: 12px;
    border-radius: 3px;
    flex: none;
    display: inline-block;
  }
</style>
