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

  // Filled "dart" arrow (pointing up), matching the legend arrow shape, scaled up.
  // Legend path: M0 -6.5 L4 3.4 L0 1 L-4 3.4 Z  → here ×3.
  const tip = -13; // tip distance from centre
  const wingY = 6.8; // y of the two trailing wings
  const notch = 2; // y of the inner notch (tail)
  const headW = 8; // half-width at the wings
  const stagger = 50; // middle arrow leads; the two sides sit further back (V formation)
  const gap = 34;
  // Centre the whole formation on the map centre: bounding-box midpoint between
  // the leading middle tip and the trailing side wings sits at y = 0.
  const forward = (stagger + wingY + tip) / 2;

  const arrows = [-1, 0, 1].map((k) => {
    const x = k * gap;
    const dy = Math.abs(k) * stagger - forward; // +y is "behind"; arrows point up
    const p = (px: number, py: number) => `${(px + x).toFixed(1)} ${(py + dy).toFixed(1)}`;
    return `M ${p(0, tip)} L ${p(headW, wingY)} L ${p(0, notch)} L ${p(-headW, wingY)} Z`;
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
