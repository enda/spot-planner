<script lang="ts">
  import { app } from '$lib/state.svelte';
  import { rad } from '$lib/physics';

  const bearing = $derived((((app.bearing || 0) % 360) + 360) % 360);

  const ticks = $derived(
    Array.from({ length: 36 }, (_, i) => {
      const d = i * 10;
      const major = d % 30 === 0;
      const a = rad(d);
      const r1 = major ? 128 : 134;
      return {
        x1: Math.sin(a) * r1,
        y1: -Math.cos(a) * r1,
        x2: Math.sin(a) * 138,
        y2: -Math.cos(a) * 138,
        w: major ? 1.5 : 0.7,
      };
    }),
  );

  const labels = $derived.by(() => {
    const cr = (360 - bearing) % 360;
    const out: { t: string; x: number; y: number; key: boolean }[] = [];
    for (let d = 0; d < 360; d += 30) {
      const a = rad(d);
      const key = d % 90 === 0;
      const r = key ? 110 : 118;
      const card = d === 0 ? 'N' : d === 90 ? 'E' : d === 180 ? 'S' : d === 270 ? 'O' : '';
      out.push({
        t: key ? `${card} ${d}°` : `${d}°`,
        x: Math.sin(a) * r,
        y: -Math.cos(a) * r,
        key,
      });
    }
    return { cr, out };
  });

</script>

<div class="compass" style="transform:rotate({bearing}deg)">
  <svg width="320" height="320" viewBox="-160 -160 320 320">
    <circle cx="0" cy="0" r="138" fill="none" stroke="rgba(255,255,255,.85)" stroke-width="1.8" />
    <circle cx="0" cy="0" r="3" fill="rgba(255,255,255,.9)" stroke="rgba(0,0,0,.5)" stroke-width="1.5" />
    {#each ticks as tk}
      <line x1={tk.x1} y1={tk.y1} x2={tk.x2} y2={tk.y2} stroke="rgba(255,255,255,.85)" stroke-width={tk.w} />
    {/each}
  </svg>
  {#each labels.out as lb}
    <div
      class="lbl"
      class:key={lb.key}
      style="left:{160 + lb.x}px;top:{160 + lb.y}px;transform:translate(-50%,-50%) rotate({labels.cr}deg)"
    >
      {lb.t}
    </div>
  {/each}
</div>

<style>
  .compass {
    position: absolute;
    left: 50%;
    top: 50%;
    width: 320px;
    height: 320px;
    margin-left: -160px;
    margin-top: -160px;
    z-index: 800;
    transition: transform 0.2s ease;
    pointer-events: none;
  }
  .compass svg {
    position: absolute;
    left: 0;
    top: 0;
    overflow: visible;
  }
  .lbl {
    position: absolute;
    font: 600 10px/1 var(--font-mono);
    color: #fff;
    text-shadow:
      0 0 3px #000,
      0 0 3px #000,
      0 1px 2px #000;
    white-space: nowrap;
    pointer-events: none;
  }
  .lbl.key {
    font: 700 13px/1 var(--font-mono);
    color: #f2a40c;
  }
</style>
