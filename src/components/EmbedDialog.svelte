<script lang="ts">
  import { app } from '$lib/state.svelte';
  import { copyText } from '$lib/clipboard';
  import * as m from '$lib/paraglide/messages';

  let { open = $bindable(false) }: { open?: boolean } = $props();

  let copied = $state(false);
  // Recompute URL/snippet whenever the dialog opens (captures current view).
  const url = $derived(open ? app.embedUrl() : '');
  const snippet = $derived(open ? app.embedSnippet() : '');

  async function copy() {
    if (await copyText(snippet)) {
      copied = true;
      setTimeout(() => (copied = false), 1800);
    }
  }
</script>

<svelte:window onkeydown={(e) => open && e.key === 'Escape' && (open = false)} />

{#if open}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <div class="backdrop" role="presentation" onclick={() => (open = false)}>
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <div
      class="dialog"
      role="dialog"
      aria-modal="true"
      aria-label={m.embed_title()}
      tabindex="-1"
      onclick={(e) => e.stopPropagation()}
    >
      <div class="head">
        <div class="ttl">{m.embed_title()}</div>
        <button class="x" aria-label={m.close()} onclick={() => (open = false)}>×</button>
      </div>
      <p class="lead">{m.embed_lead()}</p>

      <div class="eyebrow2">{m.embed_preview()}</div>
      <div class="preview">
        <iframe src={url} title={m.embed_preview()} loading="lazy"></iframe>
      </div>

      <textarea readonly value={snippet}></textarea>

      <button class="copy" onclick={copy}>{copied ? m.embed_copied() : m.embed_copy()}</button>
      <p class="foot">{m.embed_foot()}</p>
    </div>
  </div>
{/if}

<style>
  .backdrop {
    position: fixed;
    inset: 0;
    z-index: 5000;
    background: rgba(0, 0, 0, 0.55);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 18px;
  }
  .dialog {
    width: 680px;
    max-width: 100%;
    max-height: 90vh;
    overflow: auto;
    background: var(--surface);
    border: 1px solid var(--line);
    border-radius: 14px;
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.5);
    padding: 20px;
  }
  .head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin: 0 0 12px;
  }
  .ttl {
    font: 700 14px/1 var(--font-display);
    color: var(--fg);
  }
  .x {
    background: none;
    border: none;
    cursor: pointer;
    font: 600 20px/1 var(--font-display);
    color: var(--muted);
  }
  .lead {
    margin: 0 0 12px;
    font: 500 11.5px/1.6 var(--font-mono);
    color: var(--muted);
  }
  .eyebrow2 {
    font: 600 8.5px/1 var(--font-display);
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--muted);
    margin: 0 0 6px;
  }
  .preview {
    position: relative;
    width: 100%;
    height: 300px;
    border: 1px solid var(--line);
    border-radius: 10px;
    overflow: hidden;
    margin: 0 0 12px;
    background: var(--surface2);
  }
  .preview iframe {
    width: 100%;
    height: 100%;
    border: 0;
  }
  textarea {
    width: 100%;
    box-sizing: border-box;
    height: 96px;
    resize: vertical;
    background: var(--bg);
    color: var(--fg);
    border: 1px solid var(--line);
    border-radius: 8px;
    padding: 10px;
    font: 500 11px/1.5 var(--font-mono);
    outline: none;
  }
  .copy {
    width: 100%;
    margin-top: 12px;
    cursor: pointer;
    text-align: center;
    background: var(--accent2);
    color: var(--onAccent);
    border: none;
    border-radius: 9px;
    padding: 11px;
    font: 700 12px/1 var(--font-display);
  }
  .foot {
    margin: 11px 0 0;
    font: 500 10px/1.5 var(--font-mono);
    color: var(--muted);
  }
</style>
