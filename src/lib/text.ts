// Fold a string to a diacritic-insensitive, lowercase form for searching,
// so "frety" matches "Frétoy" and "evora" matches "Évora".
const COMBINING = /[̀-ͯ]/g;

export function fold(s: string): string {
  return s.normalize('NFD').replace(COMBINING, '').toLowerCase().trim();
}
