<script lang="ts">
  import { app } from '$lib/state.svelte';
  import { windAt } from '$lib/physics';
  import { windCol } from '$lib/colors';

  // Wind at the selected altitude; arrows point the way the wind blows.
  const sw = $derived(windAt(app.winds, app.windAlt));
  const wc = $derived(windCol(sw.spd));
  // Arrows are drawn pointing "up". A geographic bearing β shows on the rotated
  // map at screen angle (β + bearing), so orient the group to (blow + bearing).
  const rot = $derived((((sw.dir + 180 + app.bearing) % 360) + 360) % 360);

  // Sleek filled arrow (pointing up) with a flat tail, built once.
  const L = 20; // half-length
  const headLen = 12;
  const headW = 6.6;
  const shaftW = 2.1;
  const stagger = 11; // middle arrow leads; the two sides sit back (V formation)
  const gap = 21;

  const arrows = [-1, 0, 1].map((k) => {
    const x = k * gap;
    const dy = Math.abs(k) * stagger; // +y is "behind" (arrows point up)
    const p = (px: number, py: number) => `${(px + x).toFixed(1)} ${(py + dy).toFixed(1)}`;
    const d =
      `M ${p(0, -L)} L ${p(headW, -L + headLen)} L ${p(shaftW, -L + headLen)} ` +
      `L ${p(shaftW, L)} L ${p(-shaftW, L)} ` +
      `L ${p(-shaftW, -L + headLen)} L ${p(-headW, -L + headLen)} Z`;
    return d;
  });
</script>

<div class="warrows" style="transform:translate(-50%,-50%) rotate({rot}deg)">
  <svg viewBox="-60 -60 120 120" width="118" height="118">
    {#each arrows as d}
      <path {d} fill={wc} stroke="rgba(0,0,0,.45)" stroke-width="0.9" stroke-linejoin="round" />
    {/each}
  </svg>
</div>

<style>
  .warrows {
    position: absolute;
    left: 50%;
    top: 50%;
    z-index: 850;
    pointer-events: none;
    transition: transform 0.2s ease;
    filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.5));
  }
  .warrows svg {
    display: block;
    overflow: visible;
  }
</style>
