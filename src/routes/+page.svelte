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

  // XXL (3-column) only: move Circuit + jump run to the top of the right column
  // and "ground glide vs wind" down into the left column.
  let xxl = $state(typeof window !== 'undefined' && window.matchMedia('(min-width: 1290px)').matches);

  onMount(() => {
    void app.init();
    const mq = window.matchMedia('(min-width: 1290px)');
    const onChange = (e: MediaQueryListEvent) => (xxl = e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
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
    {#if !xxl}
      <CircuitPanel />
      <JumpRunPanel />
    {/if}
  </section>

  <section class="col center">
    <Map />
    <Legend />
    <GlideCards />
    <FootprintPanel />
    {#if !xxl}
      <RangePanel />
    {/if}
  </section>

  <section class="col right">
    {#if xxl}
      <CircuitPanel />
      <JumpRunPanel />
      <RangePanel />
    {:else}
      <CanopyGlideTable />
      <WindsAloftTable />
      <GroundGlideTable />
    {/if}
  </section>

  {#if xxl}
    <section class="bottom">
      <CanopyGlideTable />
      <WindsAloftTable />
      <GroundGlideTable />
    </section>
  {/if}

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
  /* XXL only: the three data blocks as one full-width row under the columns. */
  .bottom {
    order: 8;
    flex: 1 1 100%;
    width: 100%;
    display: flex;
    gap: 16px;
    align-items: stretch;
  }
  .bottom > :global(*) {
    flex: 1 1 0;
    min-width: 0;
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

  /* Above mobile (≥701px): glide cards (3rd) and footprint (4th) move above the
     map inside the centre column. */
  @media (min-width: 701px) {
    .center > :global(:nth-child(3)) {
      order: -2;
    }
    .center > :global(:nth-child(4)) {
      order: -1;
    }
  }

  /* Desktop AND tablet (701–1289px) share the same layout: controls + map side
     by side on top, the three data blocks in one full-width row below.
     The centre's flex-basis is lowered so it still pairs with the controls on a
     narrow tablet (it regrows via flex-grow on wider screens). */
  @media (min-width: 701px) and (max-width: 1289px) {
    .left {
      flex: 0 1 300px;
    }
    .center {
      flex: 1 1 300px;
      min-width: 0;
    }
    .right {
      flex: 1 1 100%;
      flex-direction: row;
      flex-wrap: nowrap;
    }
    .right > :global(*) {
      flex: 1 1 0;
      min-width: 0;
    }
  }

  /* Mobile (≤700px): stack everything; map first; three data blocks stacked. */
  @media (max-width: 700px) {
    main {
      padding: 13px 12px 26px;
      gap: 13px;
    }
    .col,
    .left,
    .center,
    .right {
      flex: 1 1 100%;
      min-width: 0;
      max-width: none;
    }
    .right {
      flex-direction: column;
    }
  }
</style>
