<script lang="ts">
  import { onMount } from 'svelte';
  import * as m from '$lib/paraglide/messages';

  interface BeforeInstallPromptEvent extends Event {
    prompt: () => void;
    userChoice: Promise<{ outcome: string }>;
  }

  let deferred = $state<BeforeInstallPromptEvent | null>(null);
  let installed = $state(false);

  onMount(() => {
    // Already running as an installed app (standalone display / iOS home screen)?
    installed =
      window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as unknown as { standalone?: boolean }).standalone === true;

    const onPrompt = (e: Event) => {
      e.preventDefault(); // keep the browser's own mini-infobar from showing
      deferred = e as BeforeInstallPromptEvent;
    };
    const onInstalled = () => {
      installed = true;
      deferred = null;
    };
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  });

  async function install() {
    if (!deferred) return;
    deferred.prompt();
    await deferred.userChoice;
    deferred = null; // a prompt can only be used once
  }
</script>

{#if deferred && !installed}
  <button class="install" onclick={install}>⤓ {m.install_app()}</button>
{/if}

<style>
  .install {
    cursor: pointer;
    background: var(--accent);
    color: var(--onAccent);
    border: 1px solid var(--accent);
    border-radius: 9px;
    padding: 7px 12px;
    font: 700 11px/1 var(--font-display);
  }
</style>
