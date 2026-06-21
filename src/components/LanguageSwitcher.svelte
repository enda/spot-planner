<script lang="ts">
  import { getLocale, setLocale, locales, LOCALE_NAMES, LOCALE_FLAGS } from '$lib/i18n';

  const current = getLocale();
  function onChange(e: Event) {
    const v = (e.currentTarget as HTMLSelectElement).value;
    // Persists to localStorage and reloads → the whole UI re-renders translated.
    setLocale(v as (typeof locales)[number]);
  }
</script>

<select class="lang" aria-label="Language" value={current} onchange={onChange}>
  {#each locales as code}
    <option value={code}>{LOCALE_FLAGS[code] ?? ''} {LOCALE_NAMES[code] ?? code}</option>
  {/each}
</select>

<style>
  .lang {
    cursor: pointer;
    background: var(--surface2);
    border: 1px solid var(--line);
    border-radius: 9px;
    padding: 7px 10px;
    font: 600 11px/1 var(--font-display);
    color: var(--fg);
    outline: none;
  }
</style>
