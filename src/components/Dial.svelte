<script lang="ts">
  import { rad } from '$lib/physics';

  interface Props {
    value: number;
    size?: number;
    variant?: 'landing' | 'jump';
    cardinals?: boolean;
    disabled?: boolean;
    onpick?: (deg: number) => void;
  }
  let {
    value = $bindable(),
    size = 128,
    variant = 'landing',
    cardinals = true,
    disabled = false,
    onpick,
  }: Props = $props();

  let el: HTMLDivElement;

  const ticks = Array.from({ length: 24 }, (_, k) => {
    const a = rad(k * 15);
    const major = k % 6 === 0;
    const r1 = major ? 39 : 43;
    const c = Math.cos(a);
    const s = Math.sin(a);
    return { x1: 50 + r1 * s, y1: 50 - r1 * c, x2: 50 + 47 * s, y2: 50 - 47 * c, w: major ? 1.6 : 0.8 };
  });

  const rot = $derived(Math.round(((value % 360) + 360) % 360));

  function down(e: PointerEvent) {
    if (!el || disabled) return;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const calc = (ev: PointerEvent) => {
      const dx = ev.clientX - cx;
      const dy = ev.clientY - cy;
      if (Math.hypot(dx, dy) < 6) return;
      let a = (Math.atan2(dx, -dy) * 180) / Math.PI;
      a = Math.round(((a % 360) + 360) % 360);
      value = a;
      onpick?.(a);
    };
    calc(e);
    const move = (ev: PointerEvent) => {
      ev.preventDefault();
      calc(ev);
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  }
</script>

<div
  bind:this={el}
  class="dial"
  class:disabled
  style="width:{size}px;height:{size}px"
  onpointerdown={down}
  role="slider"
  tabindex="0"
  aria-label="Cap"
  aria-valuenow={rot}
  aria-disabled={disabled}
>
  <svg viewBox="0 0 100 100">
    <circle cx="50" cy="50" r="47" fill="var(--surface2)" stroke="var(--line)" stroke-width="1.5" />
    {#each ticks as tk}
      <line x1={tk.x1} y1={tk.y1} x2={tk.x2} y2={tk.y2} stroke="var(--muted)" stroke-width={tk.w} />
    {/each}
    {#if cardinals}
      <text x="50" y="13" text-anchor="middle" font-size="9" font-weight="700" fill="var(--fg)">N</text>
      <text x="89" y="53" text-anchor="middle" font-size="8" font-weight="600" fill="var(--muted)">E</text>
      <text x="50" y="93" text-anchor="middle" font-size="8" font-weight="600" fill="var(--muted)">S</text>
      <text x="11" y="53" text-anchor="middle" font-size="8" font-weight="600" fill="var(--muted)">O</text>
    {/if}
    <g transform="rotate({rot} 50 50)">
      {#if variant === 'landing'}
        <line x1="50" y1="50" x2="50" y2="80" stroke="var(--muted)" stroke-width="2.4" />
        <line x1="50" y1="50" x2="50" y2="20" stroke="var(--accent)" stroke-width="3.2" />
        <path d="M50 13 L55.5 24 L44.5 24 Z" fill="var(--accent)" />
      {:else}
        <line x1="50" y1="50" x2="50" y2="14" stroke="#c77dff" stroke-width="3.4" />
        <path d="M50 8 L55 18 L45 18 Z" fill="#c77dff" />
        <line x1="50" y1="50" x2="50" y2="84" stroke="#c77dff" stroke-width="2.4" opacity="0.5" />
      {/if}
    </g>
    <circle cx="50" cy="50" r="3.6" fill="var(--fg)" />
  </svg>
</div>

<style>
  .dial {
    position: relative;
    flex: none;
    touch-action: none;
    cursor: grab;
    user-select: none;
  }
  .dial.disabled {
    cursor: default;
    opacity: 0.55;
  }
  .dial svg {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    overflow: visible;
    font-family: var(--font-display);
  }
</style>
