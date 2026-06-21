<script lang="ts">
  import qrcode from 'qrcode-generator';
  import { app } from '$lib/state.svelte';
  import { copyText } from '$lib/clipboard';
  import * as m from '$lib/paraglide/messages';

  let { open = $bindable(false) }: { open?: boolean } = $props();

  const url = $derived(open ? app.circuitShareUrl() : '');
  const qrSvg = $derived.by(() => {
    if (!url) return '';
    const qr = qrcode(0, 'M');
    qr.addData(url);
    qr.make();
    return qr.createSvgTag({ cellSize: 6, margin: 2, scalable: true });
  });

  let copied = $state(false);
  async function copy() {
    if (await copyText(url)) {
      copied = true;
      setTimeout(() => (copied = false), 1800);
    }
  }
  function download() {
    if (!url) return;
    // Render the QR straight onto a canvas → crisp PNG (broadly supported, unlike SVG).
    const qr = qrcode(0, 'M');
    qr.addData(url);
    qr.make();
    const count = qr.getModuleCount();
    const cell = 12;
    const margin = 4;
    const size = (count + margin * 2) * cell;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, size, size);
    ctx.fillStyle = '#000';
    for (let r = 0; r < count; r++) {
      for (let c = 0; c < count; c++) {
        if (qr.isDark(r, c)) ctx.fillRect((c + margin) * cell, (r + margin) * cell, cell, cell);
      }
    }
    const slug = (app.target?.name ?? 'circuit').replace(/[^a-z0-9]+/gi, '-').toLowerCase();
    canvas.toBlob((blob) => {
      if (!blob) return;
      const href = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = href;
      a.download = `circuit-${slug}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(href), 2000);
    }, 'image/png');
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
      aria-label={m.qr_title()}
      tabindex="-1"
      onclick={(e) => e.stopPropagation()}
    >
      <div class="head">
        <div class="ttl">{m.qr_title()}</div>
        <button class="x" aria-label={m.close()} onclick={() => (open = false)}>×</button>
      </div>

      <div class="dz">{app.target?.name ?? ''}</div>
      <!-- eslint-disable-next-line svelte/no-at-html-tags -->
      <div class="qr">{@html qrSvg}</div>

      <p class="lead">{m.qr_lead()}</p>

      <div class="linklabel">{m.qr_link()}</div>
      <textarea readonly value={url}></textarea>

      <div class="btns">
        <button class="copy" onclick={copy}>{copied ? m.embed_copied() : m.embed_copy()}</button>
        <button class="dl" onclick={download}>⤓ {m.qr_download()}</button>
      </div>
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
    width: 420px;
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
  .dz {
    font: 700 13px/1.2 var(--font-mono);
    color: var(--accent);
    margin: 0 0 10px;
    text-align: center;
  }
  .qr {
    width: 240px;
    max-width: 100%;
    margin: 0 auto;
    padding: 14px;
    background: #fff;
    border-radius: 12px;
  }
  .qr :global(svg) {
    display: block;
    width: 100%;
    height: auto;
  }
  .lead {
    margin: 14px 0 12px;
    font: 500 11.5px/1.6 var(--font-mono);
    color: var(--muted);
  }
  .linklabel {
    font: 600 8.5px/1 var(--font-display);
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--muted);
    margin: 0 0 6px;
  }
  textarea {
    width: 100%;
    box-sizing: border-box;
    height: 64px;
    resize: vertical;
    background: var(--bg);
    color: var(--fg);
    border: 1px solid var(--line);
    border-radius: 8px;
    padding: 9px;
    font: 500 10.5px/1.5 var(--font-mono);
    outline: none;
  }
  .btns {
    display: flex;
    gap: 8px;
    margin-top: 12px;
  }
  .copy,
  .dl {
    flex: 1;
    cursor: pointer;
    text-align: center;
    border-radius: 9px;
    padding: 11px;
    font: 700 12px/1 var(--font-display);
  }
  .copy {
    background: var(--accent2);
    color: var(--onAccent);
    border: none;
  }
  .dl {
    background: transparent;
    color: var(--fg);
    border: 1px solid var(--line);
  }
</style>
