<script lang="ts">
  import { app } from '$lib/state.svelte';
  import { setConsent, getConsent } from '$lib/analytics';
  import * as m from '$lib/paraglide/messages';

  let decided = $state(getConsent() !== null);
  let showPolicy = $state(false);
  const visible = $derived(!decided || app.consentOpen);

  function choose(granted: boolean) {
    setConsent(granted);
    decided = true;
    app.consentOpen = false;
    showPolicy = false;
  }
</script>

{#if visible}
  <div class="cc" role="dialog" aria-label="cookies">
    <div class="txt">
      {m.consent_text()}
      <button class="more" onclick={() => (showPolicy = !showPolicy)}>{m.consent_more()}</button>
      {#if showPolicy}
        <p class="policy">{m.consent_policy()}</p>
      {/if}
    </div>
    <div class="btns">
      <button class="refuse" onclick={() => choose(false)}>{m.consent_refuse()}</button>
      <button class="accept" onclick={() => choose(true)}>{m.consent_accept()}</button>
    </div>
  </div>
{/if}

<style>
  .cc {
    position: fixed;
    left: 12px;
    right: 12px;
    bottom: 12px;
    z-index: 100050;
    margin: 0 auto;
    max-width: 560px;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 10px 14px;
    background: rgba(16, 21, 27, 0.97);
    border: 1px solid var(--line);
    border-radius: 12px;
    padding: 13px 15px;
    box-shadow: 0 8px 28px rgba(0, 0, 0, 0.5);
  }
  .txt {
    flex: 1 1 240px;
    font: 500 11.5px/1.5 var(--font-mono);
    color: var(--fg);
  }
  .more {
    background: none;
    border: none;
    padding: 0;
    cursor: pointer;
    text-decoration: underline;
    color: var(--accent2);
    font: 600 11.5px/1.5 var(--font-mono);
  }
  .policy {
    margin: 8px 0 0;
    font: 500 10.5px/1.55 var(--font-mono);
    color: var(--muted);
  }
  .btns {
    display: flex;
    gap: 8px;
    flex: 0 0 auto;
  }
  .btns button {
    cursor: pointer;
    border-radius: 8px;
    padding: 8px 14px;
    font: 700 11px/1 var(--font-display);
  }
  .refuse {
    background: var(--surface2);
    border: 1px solid var(--line);
    color: var(--muted);
  }
  .accept {
    background: var(--accent2);
    border: 1px solid var(--accent2);
    color: var(--onAccent);
  }
</style>
