<script lang="ts">
  import { tick } from 'svelte';
  import { app, DROPZONES } from '$lib/state.svelte';
  import { fold } from '$lib/text';
  import * as m from '$lib/paraglide/messages';
  import type { Dropzone } from '$lib/dropzones';

  const zones = $derived(app.entry?.zones ?? []);

  // The search collapses once a DZ is selected; a button reopens it.
  let searchOpen = $state(false);
  let inputEl: HTMLInputElement | undefined = $state();
  const searchVisible = $derived(!app.target || searchOpen);

  async function openSearch() {
    searchOpen = true;
    await tick();
    inputEl?.focus();
    inputEl?.select();
  }
  function pick(dz: Dropzone) {
    app.selectDz(dz);
    searchOpen = false;
  }

  const groups = $derived.by(() => {
    const q = fold(app.query);
    const matches = DROPZONES.filter(
      (d) => !q || fold(d.name).includes(q) || fold(d.country).includes(q),
    );
    const byC: Record<string, Dropzone[]> = {};
    for (const d of matches) (byC[d.country] ??= []).push(d);
    return Object.keys(byC)
      .sort()
      .map((c) => ({ country: c, items: byC[c] }));
  });
</script>

<div class="card">
  <h2 class="eyebrow">{m.dz_heading()}</h2>
  <div class="name">{app.target?.name || m.dz_none()}</div>
  <div class="coords">
    {#if app.target}
      {app.target.lat.toFixed(4)}, {app.target.lng.toFixed(4)}{app.target.country
        ? ` · ${app.target.country}`
        : ''}
    {:else}
      {m.dz_hint()}
    {/if}
  </div>

  {#if zones.length}
    <div class="chips">
      {#each zones as z}
        <span class="chip"><span class="dot" style="background:{z.color || '#36c2d6'}"></span>{z.name}</span>
      {/each}
    </div>
  {/if}

  {#if searchVisible}
    <div class="search">
      <input class="field" placeholder={m.dz_search()} bind:value={app.query} bind:this={inputEl} />
      <button class="geo" title={m.dz_locate()} onclick={() => app.geolocateAndSelect()}>⌖</button>
    </div>
    {#if app.geoMsg}<div class="geomsg">{app.geoMsg}</div>{/if}

    <div class="list">
      {#each groups as grp}
        <div class="country">{grp.country}</div>
        {#each grp.items as dz}
          <button class="row" class:active={app.target?.name === dz.name} onclick={() => pick(dz)}>
            {dz.name}
          </button>
        {/each}
      {/each}
    </div>
  {:else}
    <button class="reopen" onclick={openSearch}>🔍 {m.dz_search()}</button>
  {/if}

  <div class="admin">
    <button class="add" onclick={() => app.openAdmin('add')}>{m.dz_add()}</button>
    <button class="edit" onclick={() => app.openAdmin('edit')}>{m.dz_edit()}</button>
  </div>
</div>

<style>
  .name {
    font: 700 15px/1.2 var(--font-mono);
    color: var(--fg);
    margin-top: 11px;
  }
  .coords {
    margin: 3px 0 10px;
    font: 500 10px/1.2 var(--font-mono);
    color: var(--muted);
  }
  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 6px 12px;
    margin: 0 0 12px;
  }
  .chip {
    display: flex;
    align-items: center;
    gap: 6px;
    font: 600 10.5px/1.2 var(--font-mono);
    color: var(--fg);
  }
  .dot {
    width: 10px;
    height: 10px;
    border-radius: 2px;
    flex: none;
  }
  .search {
    display: flex;
    gap: 8px;
    align-items: stretch;
  }
  .geo {
    flex: none;
    width: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid var(--line);
    border-radius: 8px;
    cursor: pointer;
    background: var(--surface2);
    color: var(--accent2);
    font: 600 17px/1 var(--font-display);
  }
  .geomsg {
    margin-top: 8px;
    font: 600 10.5px/1.3 var(--font-mono);
    color: var(--accent2);
  }
  .list {
    max-height: 240px;
    overflow: auto;
    margin-top: 11px;
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding-right: 2px;
  }
  .country {
    margin: 7px 0 3px;
    font: 700 8.5px/1 var(--font-display);
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--muted);
  }
  .row {
    text-align: left;
    cursor: pointer;
    padding: 6px 8px;
    border-radius: 6px;
    font: 500 12px/1.2 var(--font-mono);
    color: var(--fg);
    background: transparent;
    border: none;
  }
  .row.active {
    color: var(--onAccent);
    background: var(--accent);
  }
  .reopen {
    width: 100%;
    text-align: left;
    cursor: pointer;
    background: var(--surface2);
    border: 1px solid var(--line);
    border-radius: 8px;
    padding: 8px 10px;
    font: 600 12px/1.1 var(--font-mono);
    color: var(--muted);
  }
  .reopen:hover {
    color: var(--fg);
    border-color: var(--accent2);
  }
  .admin {
    display: flex;
    gap: 8px;
    margin-top: 12px;
  }
  .admin button {
    flex: 1;
    cursor: pointer;
    text-align: center;
    border: 1px dashed var(--line);
    border-radius: 8px;
    padding: 8px;
    font: 600 11px/1 var(--font-display);
    background: transparent;
  }
  .admin .add {
    color: var(--accent2);
  }
  .admin .edit {
    color: var(--muted);
  }
</style>
