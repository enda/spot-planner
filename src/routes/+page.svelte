<script lang="ts">
  import { onMount } from 'svelte';
  import { app } from '$lib/state.svelte';
  import Header from '$components/Header.svelte';
  import Map from '$components/Map.svelte';
  import DropzonePanel from '$components/panels/DropzonePanel.svelte';
  import CanopyPanel from '$components/panels/CanopyPanel.svelte';
  import CircuitPanel from '$components/panels/CircuitPanel.svelte';
  import JumpRunPanel from '$components/panels/JumpRunPanel.svelte';
  import Legend from '$components/panels/Legend.svelte';
  import RangePanel from '$components/panels/RangePanel.svelte';
  import GlideCards from '$components/panels/GlideCards.svelte';
  import FootprintPanel from '$components/panels/FootprintPanel.svelte';
  import CanopyGlideTable from '$components/panels/CanopyGlideTable.svelte';
  import WindsAloftTable from '$components/panels/WindsAloftTable.svelte';
  import GroundGlideTable from '$components/panels/GroundGlideTable.svelte';
  import AdminDrawer from '$components/AdminDrawer.svelte';
  import * as m from '$lib/paraglide/messages';

  onMount(() => {
    void app.init();
  });
</script>

<svelte:head>
  <title>{m.app_title()}</title>
</svelte:head>

<Header />

{#if app.adminOpen}<AdminDrawer />{/if}

<main>
  <section class="col left">
    <DropzonePanel />
    <CanopyPanel />
    <CircuitPanel />
    <JumpRunPanel />
  </section>

  <section class="col center">
    <Map />
    <Legend />
    <GlideCards />
    <FootprintPanel />
    <RangePanel />
  </section>

  <section class="col right">
    <CanopyGlideTable />
    <WindsAloftTable />
    <GroundGlideTable />
  </section>

  <footer>
    {m.footer_disclaimer()} &nbsp;·&nbsp;
    <a href="https://www.linkedin.com/in/jeromemusialak/" target="_blank" rel="noopener">
      {m.footer_by()}
    </a>
  </footer>
</main>

<style>
  main {
    display: flex;
    flex-wrap: wrap;
    gap: 18px;
    padding: 18px 22px 32px;
    align-items: flex-start;
  }
  .col {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  .left {
    order: 1;
    flex: 0 1 330px;
    min-width: 300px;
    max-width: 360px;
  }
  .center {
    order: 2;
    flex: 1 1 560px;
    min-width: 380px;
    gap: 14px;
  }
  .right {
    order: 3;
    flex: 1 1 320px;
    min-width: 300px;
  }
  footer {
    order: 9;
    flex: 1 1 100%;
    width: 100%;
    text-align: center;
    font: 500 11px/1.6 var(--font-mono);
    color: var(--muted);
    padding: 4px 3px 0;
    border-top: 1px solid var(--line);
    margin-top: 4px;
  }
  footer a {
    color: var(--accent2);
    text-decoration: none;
    font-weight: 700;
  }

  @media (max-width: 1040px) {
    .col,
    .left,
    .center,
    .right {
      flex: 1 1 100%;
      min-width: 0;
      max-width: none;
    }
    .right {
      flex-direction: row;
      flex-wrap: nowrap;
    }
    /* The three data blocks share one row on tablet. */
    .right > :global(*) {
      flex: 1 1 0;
      min-width: 0;
    }
  }

  @media (max-width: 700px) {
    main {
      padding: 13px 12px 26px;
      gap: 13px;
    }
    .right {
      flex-direction: column;
    }
  }
</style>
