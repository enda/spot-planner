<script lang="ts">
  import { app, DROPZONES } from '$lib/state.svelte';
  import { ADMIN_EMAIL, ADMIN_SWATCHES, GITHUB_REPO, GITHUB_BRANCH } from '$lib/admin';
  import { countryLabel } from '$lib/countries';
  import { copyText } from '$lib/clipboard';
  import * as m from '$lib/paraglide/messages';
  import type { LatLng } from '$lib/physics';

  const D = $derived(app.adminDraft);
  const dzNames = DROPZONES.map((d) => d.name).sort();
  // Country picker: the countries already in the list (+ the draft's own), shown
  // translated, value stored as the French name used throughout the data.
  const countries = $derived(
    Array.from(new Set([...DROPZONES.map((d) => d.country), D.country].filter(Boolean)))
      .map((c) => ({ value: c, label: countryLabel(c) }))
      .sort((a, b) => a.label.localeCompare(b.label)),
  );
  const latlngTxt = $derived(
    isFinite(D.lat) && isFinite(D.lng) ? `${D.lat.toFixed(5)}, ${D.lng.toFixed(5)}` : m.admin_not_placed(),
  );
  const toolHint = $derived(
    app.adminTool === 'target'
      ? m.admin_hint_target()
      : app.adminActiveZone != null
        ? m.admin_hint_zone()
        : m.admin_hint_pick(),
  );
  const mailto = $derived.by(() => {
    const subject = 'DZ: ' + (D.name || '—');
    const body = (app.adminResult || '') + '\n';
    return `mailto:${ADMIN_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  });
  // Prefilled "new file" page → GitHub then offers "commit + open a pull request".
  const githubUrl = $derived.by(() => {
    const slug = (D.name || 'dz').replace(/[^a-z0-9]+/gi, '-').toLowerCase();
    const path = `proposals/${slug}.json`;
    const content = (app.adminResult || '') + '\n';
    return (
      `https://github.com/${GITHUB_REPO}/new/${GITHUB_BRANCH}` +
      `?filename=${encodeURIComponent(path)}&value=${encodeURIComponent(content)}`
    );
  });

  let copied = $state(false);
  async function copyJson() {
    if (await copyText(app.adminResult || '')) {
      copied = true;
      setTimeout(() => (copied = false), 1800);
    }
  }
  function download() {
    const t = app.adminResult || '';
    const blob = new Blob([t], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = (D.name || 'dz').replace(/[^a-z0-9]+/gi, '-').toLowerCase() + '.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }

  // Scroll the generated proposal into view when it appears (it sits below the
  // fold, so validating looked like a no-op otherwise).
  let resultEl: HTMLDivElement | undefined = $state();
  $effect(() => {
    if (app.adminResult && resultEl) {
      requestAnimationFrame(() =>
        resultEl?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
      );
    }
  });

  const rwState = (rw: { a: LatLng | null; b: LatLng | null }) =>
    rw.a && rw.b
      ? m.admin_runway_state_done()
      : rw.a
        ? m.admin_runway_state_half()
        : m.admin_runway_state_none();
  const num = (v: string) => {
    const f = parseFloat(v);
    return isNaN(f) ? 0 : f;
  };
  // typed helper to satisfy the editor when reading polygon points
  const pts = (p: LatLng[]) => p.length;
</script>

<aside class="drawer">
  <div class="dhead">
    <div class="dtitle">{app.adminMode === 'edit' ? m.admin_edit_title() : m.admin_add_title()}</div>
    <button class="x" aria-label={m.close()} onclick={() => app.closeAdmin()}>×</button>
  </div>

  <div class="dbody">
    <div class="seg">
      <button class:on={app.adminMode === 'add'} onclick={() => app.openAdmin('add')}>{m.admin_tab_add()}</button>
      <button class:on={app.adminMode === 'edit'} onclick={() => app.openAdmin('edit')}>{m.admin_tab_edit()}</button>
    </div>

    {#if app.adminMode === 'edit'}
      <div>
        <label class="label" for="adm-pick">{m.admin_dz_to_edit()}</label>
        <select
          id="adm-pick"
          class="field"
          value={D.name}
          onchange={(e) => app.loadDraftFromDz(e.currentTarget.value)}
        >
          {#each dzNames as nm}<option value={nm}>{nm}</option>{/each}
        </select>
      </div>
    {/if}

    <div class="row2">
      <div style="flex:2">
        <label class="label" for="adm-name">{m.admin_name()}</label>
        <input
          id="adm-name"
          class="field"
          placeholder={m.admin_dz_name_ph()}
          value={D.name}
          oninput={(e) => app.patchDraft({ name: e.currentTarget.value })}
        />
      </div>
      <div style="flex:1">
        <label class="label" for="adm-country">{m.admin_country()}</label>
        <select
          id="adm-country"
          class="field"
          value={D.country}
          onchange={(e) => app.patchDraft({ country: e.currentTarget.value })}
        >
          {#each countries as c}<option value={c.value}>{c.label}</option>{/each}
        </select>
      </div>
    </div>

    <div class="box">
      <div class="boxhead">
        <span class="boxttl accent">{m.admin_target()}</span>
        <span class="boxstate">{latlngTxt}</span>
      </div>
      <button
        class="tool"
        class:on={app.adminTool === 'target'}
        onclick={() => app.setAdminTool('target')}>{m.admin_place_target()}</button
      >
    </div>

    <div>
      <div class="zhead">
        <span class="boxttl jump">{m.admin_runway_refs()}</span>
        <button class="addzone" onclick={() => app.addAdminRunway()}>{m.admin_add_runway()}</button>
      </div>
      <div class="sub">{m.admin_runways_hint()}</div>
      {#each D.runways as rw, i}
        <div class="zone">
          <div class="zrow">
            <input
              class="field small"
              placeholder={m.admin_runway_name_ph()}
              value={rw.name}
              oninput={(e) => app.patchRunway(i, { name: e.currentTarget.value })}
            />
            <span class="zcount" class:ok={!!(rw.a && rw.b)}>{rwState(rw)}</span>
            <button class="iconbtn" aria-label={m.close()} onclick={() => app.removeAdminRunway(i)}>×</button>
          </div>
          <div class="zbtns">
            <button
              class="tool jumptool draw"
              class:on={app.adminActiveRunway === i && app.adminTool === 'runway'}
              onclick={() => app.setAdminTool('runway', i)}>{m.admin_draw_runway()}</button
            >
            <button class="ghost" onclick={() => app.patchRunway(i, { a: null, b: null })}>{m.admin_clear()}</button>
          </div>
        </div>
      {/each}
    </div>

    <div>
      <div class="zhead">
        <span class="boxttl jump">{m.admin_jrrefs()}</span>
        <button
          class="addzone"
          class:on={app.adminTool === 'jrref'}
          onclick={() => app.setAdminTool('jrref')}>{m.admin_add_ref()}</button
        >
      </div>
      <div class="sub">{m.admin_jrrefs_hint()}</div>
      {#each D.jrRefs as rf, i}
        <div class="zrow refrow">
          <input
            class="field small"
            placeholder={m.admin_ref_name_ph()}
            value={rf.name}
            oninput={(e) => app.patchRef(i, { name: e.currentTarget.value })}
          />
          <button class="iconbtn" aria-label={m.close()} onclick={() => app.removeRef(i)}>×</button>
        </div>
      {/each}
    </div>

    <div>
      <div class="zhead">
        <span class="boxttl accent">{m.admin_zones()}</span>
        <button class="addzone" onclick={() => app.addAdminZone()}>{m.admin_add_zone()}</button>
      </div>
      {#each D.zones as z, i}
        <div class="zone">
          <div class="zrow">
            <input
              class="field small"
              value={z.name}
              oninput={(e) => app.patchZone(i, { name: e.currentTarget.value })}
            />
            <span class="zcount" class:ok={pts(z.polygon) >= 3}>{z.polygon.length} {m.admin_points()}</span>
            <button class="iconbtn" aria-label={m.close()} onclick={() => app.removeAdminZone(i)}>×</button>
          </div>
          <div class="swatches">
            {#each ADMIN_SWATCHES as c}
              <button
                class="swatch"
                class:sel={c === z.color}
                style="background:{c}"
                aria-label="Couleur"
                onclick={() => app.patchZone(i, { color: c })}
              ></button>
            {/each}
          </div>
          <div class="zbtns">
            <button
              class="tool draw"
              class:on={app.adminActiveZone === i && app.adminTool === 'zone'}
              onclick={() => app.setAdminTool('zone', i)}>{m.admin_draw()}</button
            >
            <button
              class="ghost"
              onclick={() => app.patchZone(i, { polygon: z.polygon.slice(0, -1) })}>{m.admin_undo_pt()}</button
            >
            <button class="ghost" onclick={() => app.patchZone(i, { polygon: [] })}>{m.admin_clear()}</button>
          </div>
        </div>
      {/each}
    </div>

    <div class="hint">{toolHint}</div>

    {#if app.adminResult}
      <div class="result" bind:this={resultEl}>
        <div class="rlead">{m.admin_result_lead({ email: ADMIN_EMAIL })}</div>
        <textarea readonly value={app.adminResult}></textarea>
        <div class="rbtns">
          <a class="mail" href={mailto}>{m.admin_email_send()}</a>
          <a class="gh" href={githubUrl} target="_blank" rel="noopener">{m.admin_github_pr()}</a>
          <button class="ghost" onclick={copyJson}>{copied ? m.embed_copied() : m.admin_copy()}</button>
          <button class="ghost" aria-label="download" onclick={download}>⤓</button>
        </div>
      </div>
    {/if}
  </div>

  <div class="dfoot">
    <button class="validate" onclick={() => app.adminValidate()}>{m.admin_validate()}</button>
  </div>
</aside>

<style>
  .drawer {
    position: fixed;
    left: 0;
    top: 0;
    bottom: 0;
    width: 392px;
    max-width: 94vw;
    z-index: 4000;
    background: var(--surface);
    border-right: 1px solid var(--line);
    box-shadow: 3px 0 30px rgba(0, 0, 0, 0.45);
    display: flex;
    flex-direction: column;
  }
  /* Phones & tablets: the map goes fullscreen and the editor becomes a bottom
     sheet over it, so the map (and the points being placed) stays visible. */
  @media (max-width: 1024px) {
    .drawer {
      top: auto;
      left: 0;
      right: 0;
      bottom: 0;
      width: 100%;
      max-width: none;
      max-height: 50dvh;
      z-index: 100002;
      border-right: none;
      border-top: 1px solid var(--line);
      border-radius: 14px 14px 0 0;
      box-shadow: 0 -3px 30px rgba(0, 0, 0, 0.5);
      padding-bottom: env(safe-area-inset-bottom, 0px);
    }
  }
  .dhead {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 18px;
    border-bottom: 1px solid var(--line);
  }
  .dtitle {
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
  .dbody {
    flex: 1;
    overflow: auto;
    padding: 16px 18px;
    display: flex;
    flex-direction: column;
    gap: 15px;
  }
  .row2 {
    display: flex;
    gap: 10px;
  }
  .box {
    background: var(--surface2);
    border: 1px solid var(--line);
    border-radius: 10px;
    padding: 12px;
  }
  .boxhead {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    margin-bottom: 9px;
  }
  .boxttl {
    font: 700 10px/1.2 var(--font-display);
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }
  .boxttl.accent {
    color: var(--accent);
  }
  .boxttl.jump {
    color: var(--jump);
  }
  .boxstate {
    font: 600 10.5px/1 var(--font-mono);
    color: var(--muted);
  }
  .tool {
    width: 100%;
    cursor: pointer;
    text-align: center;
    border-radius: 7px;
    padding: 8px 10px;
    font: 600 11px/1 var(--font-display);
    border: 1px solid var(--line);
    background: transparent;
    color: var(--muted);
    white-space: nowrap;
  }
  .tool.on {
    background: var(--accent);
    color: var(--onAccent);
    border-color: transparent;
  }
  .jumptool.on {
    background: var(--jump);
    color: #1b1230;
  }
  .draw.on {
    background: var(--accent2);
    color: var(--onAccent);
  }
  .jumptool {
    margin-top: 6px;
  }
  .ghost {
    cursor: pointer;
    border: 1px solid var(--line);
    border-radius: 7px;
    padding: 8px 10px;
    font: 600 10.5px/1 var(--font-display);
    color: var(--muted);
    background: transparent;
    white-space: nowrap;
  }
  .sub {
    font: 600 9px/1 var(--font-display);
    letter-spacing: 0.07em;
    text-transform: uppercase;
    color: var(--muted);
    margin: 8px 0 5px;
  }
  .field.small {
    flex: 1;
    min-width: 0;
    padding: 7px 9px;
    font-size: 11px;
  }
  .iconbtn {
    flex: none;
    width: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid var(--line);
    border-radius: 7px;
    color: var(--muted);
    background: transparent;
    cursor: pointer;
    font: 700 14px/1 var(--font-display);
  }
  .zhead {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 9px;
  }
  .addzone {
    cursor: pointer;
    background: none;
    border: none;
    font: 600 11px/1 var(--font-display);
    color: var(--accent2);
  }
  .addzone.on {
    color: var(--jump);
  }
  .refrow {
    margin-bottom: 6px;
  }
  .zone {
    border: 1px solid var(--line);
    border-radius: 10px;
    padding: 10px;
    margin-bottom: 9px;
  }
  .zrow {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;
  }
  .zcount {
    font: 600 10px/1 var(--font-mono);
    color: var(--muted);
    white-space: nowrap;
  }
  .zcount.ok {
    color: var(--good);
  }
  .swatches {
    display: flex;
    align-items: center;
    gap: 7px;
    margin-bottom: 9px;
  }
  .swatch {
    width: 18px;
    height: 18px;
    border-radius: 4px;
    cursor: pointer;
    border: 2px solid transparent;
    box-sizing: border-box;
    padding: 0;
  }
  .swatch.sel {
    border-color: var(--fg);
  }
  .zbtns {
    display: flex;
    gap: 6px;
  }
  .draw {
    width: auto;
    flex: none;
    padding: 6px 9px;
    font-size: 10.5px;
    color: var(--fg);
  }
  .hint {
    background: var(--surface2);
    border: 1px solid var(--line);
    border-radius: 8px;
    padding: 9px 11px;
    font: 600 10.5px/1.4 var(--font-mono);
    color: var(--accent2);
  }
  .result {
    border-top: 1px solid var(--line);
    padding-top: 13px;
  }
  .rlead {
    font: 600 10.5px/1.5 var(--font-mono);
    color: var(--muted);
    margin-bottom: 8px;
  }
  textarea {
    width: 100%;
    box-sizing: border-box;
    height: 130px;
    resize: vertical;
    background: var(--bg);
    color: var(--fg);
    border: 1px solid var(--line);
    border-radius: 8px;
    padding: 9px;
    font: 500 10.5px/1.45 var(--font-mono);
    outline: none;
  }
  .rbtns {
    display: flex;
    gap: 7px;
    margin-top: 9px;
  }
  .mail {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 7px;
    text-decoration: none;
    background: var(--accent);
    color: var(--onAccent);
    border-radius: 8px;
    padding: 9px;
    font: 700 11px/1 var(--font-display);
  }
  .gh {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    text-decoration: none;
    background: var(--surface2);
    border: 1px solid var(--line);
    color: var(--fg);
    border-radius: 8px;
    padding: 9px;
    font: 700 11px/1 var(--font-display);
  }
  .dfoot {
    padding: 13px 18px;
    border-top: 1px solid var(--line);
  }
  .validate {
    width: 100%;
    cursor: pointer;
    text-align: center;
    background: var(--accent2);
    color: var(--onAccent);
    border: none;
    border-radius: 9px;
    padding: 11px;
    font: 700 12px/1 var(--font-display);
  }
</style>
