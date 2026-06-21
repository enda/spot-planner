<script lang="ts">
  import '../styles/app.css';
  import { onMount } from 'svelte';
  import { getLocale } from '$lib/i18n';

  let { children } = $props();

  onMount(() => {
    document.documentElement.lang = getLocale();
  });
</script>

{@render children()}
