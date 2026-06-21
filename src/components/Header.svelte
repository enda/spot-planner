<script lang="ts">
  import { base } from '$app/paths';
  import { app } from '$lib/state.svelte';
  import * as m from '$lib/paraglide/messages';
  import EmbedDialog from './EmbedDialog.svelte';
  import QrDialog from './QrDialog.svelte';
  import LanguageSwitcher from './LanguageSwitcher.svelte';

  let embedOpen = $state(false);
  let qrOpen = $state(false);
</script>

<header>
  <div class="brand">
    <img class="logo" src="{base}/logo.svg" alt="" width="34" height="34" />
    <div class="title">
      <h1 class="h1">{m.app_title()}</h1>
      <div class="sub">{m.app_subtitle()}</div>
    </div>
  </div>
  <div class="controls">
    <button
      class="refresh"
      data-tip={app.windsSource ? m.winds_source_tip({ source: app.windsSource }) : m.winds_default_tip()}
      disabled={app.windsLoading || !app.target}
      onclick={() => app.refreshWinds()}
    >
      {app.windsLoading ? m.loading() : m.refresh_winds()}
    </button>
    <button class="embed" disabled={!app.target} onclick={() => (embedOpen = true)}>
      {m.embed_button()}
    </button>
    <button class="embed" disabled={!app.target} onclick={() => (qrOpen = true)}>
      ▦ {m.qr_button()}
    </button>
    <div class="seg">
      <button class:on={app.windUnit === 'kt'} onclick={() => (app.windUnit = 'kt')}>kt</button>
      <button class:on={app.windUnit === 'ms'} onclick={() => (app.windUnit = 'ms')}>m/s</button>
    </div>
    <div class="seg">
      <button class:on={app.altUnit === 'm'} onclick={() => (app.altUnit = 'm')}>m</button>
      <button class:on={app.altUnit === 'ft'} onclick={() => (app.altUnit = 'ft')}>ft</button>
    </div>
    <LanguageSwitcher />
  </div>
</header>

<EmbedDialog bind:open={embedOpen} />
<QrDialog bind:open={qrOpen} />

<style>
  header {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
    align-items: center;
    justify-content: space-between;
    padding: 18px 22px 14px;
    border-bottom: 1px solid var(--line);
  }
  .brand {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .logo {
    flex: none;
    display: block;
    background: transparent;
  }
  .h1 {
    margin: 0;
    font: 700 19px/1 var(--font-display);
    letter-spacing: 0.01em;
  }
  .sub {
    margin-top: 6px;
    font: 500 11.5px/1 var(--font-mono);
    color: var(--muted);
  }
  .controls {
    display: flex;
    flex-wrap: wrap;
    gap: 9px;
    align-items: center;
  }
  .refresh {
    cursor: pointer;
    background: var(--surface2);
    border: 1px solid var(--accent2);
    border-radius: 9px;
    padding: 7px 12px;
    font: 600 11px/1 var(--font-display);
    color: var(--accent2);
  }
  .refresh:disabled,
  .embed:disabled {
    opacity: 0.55;
    cursor: default;
  }
  .embed {
    cursor: pointer;
    background: var(--surface2);
    border: 1px solid var(--line);
    border-radius: 9px;
    padding: 7px 12px;
    font: 600 11px/1 var(--font-display);
    color: var(--accent2);
  }
</style>
