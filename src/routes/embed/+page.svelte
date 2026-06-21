<script lang="ts">
  import { onMount } from 'svelte';
  import { app } from '$lib/state.svelte';
  import * as m from '$lib/paraglide/messages';
  import Map from '$components/Map.svelte';

  onMount(() => {
    app.initEmbed();
  });
</script>

<svelte:head>
  <title>{m.app_title()}</title>
  <meta name="robots" content="noindex" />
</svelte:head>

<div class="embed-root">
  <Map embed />
</div>

<style>
  .embed-root {
    position: fixed;
    inset: 0;
  }
  /* Make the map fill the iframe viewport instead of the 1:1 card. */
  .embed-root :global(.map-card) {
    width: 100%;
    height: 100%;
    aspect-ratio: auto;
    border: none;
    border-radius: 0;
  }
</style>
