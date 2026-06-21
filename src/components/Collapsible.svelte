<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    title: string;
    note?: string;
    // Kept for call-site compatibility — blocks are always shown (not collapsible).
    open?: boolean;
    summary?: Snippet;
    children: Snippet;
  }
  let { title, note = '', children }: Props = $props();
</script>

<div class="card">
  <div class="hwrap">
    <h2 class="eyebrow">{title}</h2>
    {#if note}<span class="note">{note}</span>{/if}
  </div>
  {@render children()}
</div>

<style>
  .hwrap {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 0 0 11px;
  }
  .note {
    font: 600 10px/1 var(--font-mono);
    color: var(--muted);
  }
</style>
