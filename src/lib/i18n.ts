// Thin wrapper around the generated Paraglide runtime.
// setLocale() persists to localStorage and reloads, so messages re-render in
// the new language (ideal for this static SPA).
export { getLocale, setLocale, locales, baseLocale } from './paraglide/runtime';

export const LOCALE_NAMES: Record<string, string> = {
  en: 'English',
  fr: 'Français',
  it: 'Italiano',
  es: 'Español',
  pt: 'Português',
  de: 'Deutsch',
};

// Regional-indicator flag emojis (render as flags on most platforms; Windows
// shows the two-letter code instead, which is still readable).
export const LOCALE_FLAGS: Record<string, string> = {
  en: '🇬🇧',
  fr: '🇫🇷',
  it: '🇮🇹',
  es: '🇪🇸',
  pt: '🇵🇹',
  de: '🇩🇪',
};
