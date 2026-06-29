<script lang="ts">
  import { app } from '$lib/state.svelte';
  import { wl, getFwd, getDesc, wlCategory } from '$lib/physics';
  import { dispSpeed, speedToMs, speedLabel } from '$lib/units';
  import * as m from '$lib/paraglide/messages';

  const wingload = $derived(wl(app.phys));
  const fwd = $derived(getFwd(app.phys));
  const desc = $derived(getDesc(app.phys));
  const fwdDisp = $derived(dispSpeed(fwd, app.windUnit));
  const descDisp = $derived(dispSpeed(desc, app.windUnit));
  const WL_LABEL = {
    student: m.wl_student,
    intermediate: m.wl_intermediate,
    sport: m.wl_sport,
    performance: m.wl_performance,
    elite: m.wl_elite,
  };
  const wlCat = $derived(WL_LABEL[wlCategory(app.phys)]());

  const num = (v: string) => {
    const f = parseFloat(v);
    return isNaN(f) ? 0 : f;
  };
</script>

<div class="card">
  <h2 class="eyebrow">{m.canopy_heading()}</h2>

  <div class="row2">
    <div>
      <label class="label" for="canopy">{m.canopy_surface()}</label>
      <input
        id="canopy"
        class="field"
        type="number"
        value={app.canopy}
        oninput={(e) => (app.canopy = num(e.currentTarget.value))}
      />
    </div>
    <div>
      <label class="label" for="weight">{m.canopy_weight()}</label>
      <input
        id="weight"
        class="field"
        type="number"
        value={app.weight}
        oninput={(e) => (app.weight = num(e.currentTarget.value))}
      />
    </div>
  </div>

  <div class="wl">
    <div class="wlval">{wingload.toFixed(2)}</div>
    <div class="wlcat">lb/ft²<br />{wlCat}</div>
  </div>

  <div class="hr"></div>

  <div class="row2">
    <div>
      <label class="label" for="fwd">{m.canopy_fwd({ unit: speedLabel(app.windUnit) })}</label>
      <input
        id="fwd"
        class="field"
        type="number"
        value={fwdDisp}
        oninput={(e) => (app.fwdOv = speedToMs(num(e.currentTarget.value), app.windUnit))}
      />
    </div>
    <div>
      <label class="label" for="desc">{m.canopy_desc({ unit: speedLabel(app.windUnit) })}</label>
      <input
        id="desc"
        class="field"
        type="number"
        value={descDisp}
        oninput={(e) => (app.descOv = speedToMs(num(e.currentTarget.value), app.windUnit))}
      />
    </div>
  </div>

  <button class="reset" onclick={() => app.resetSpeeds()}>{m.canopy_reset()}</button>
</div>

<style>
  .row2 {
    display: flex;
    gap: 10px;
  }
  .row2 > div {
    flex: 1;
  }
  .wl {
    display: flex;
    align-items: baseline;
    gap: 10px;
    margin: 15px 0 3px;
  }
  .wlval {
    font: 700 30px/1 var(--font-mono);
    color: var(--accent);
  }
  .wlcat {
    font: 600 10px/1.3 var(--font-display);
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--muted);
  }
  .hr {
    height: 1px;
    background: var(--line);
    margin: 13px 0;
  }
  .reset {
    margin-top: 11px;
    cursor: pointer;
    background: none;
    border: none;
    padding: 0;
    font: 600 11px/1 var(--font-display);
    color: var(--accent2);
  }
  .eyebrow {
    display: block;
    margin-bottom: 13px;
  }
</style>
