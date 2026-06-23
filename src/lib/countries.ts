// Country names are stored in French in the DZ list. Translate them to the
// active locale at display time via Intl.DisplayNames (no per-country messages).

import { getLocale } from './i18n';

const ISO: Record<string, string> = {
  France: 'FR',
  'États-Unis': 'US',
  'Royaume-Uni': 'GB',
  Italie: 'IT',
  Belgique: 'BE',
  Allemagne: 'DE',
  Tchéquie: 'CZ',
  Espagne: 'ES',
  Suisse: 'CH',
  'Pays-Bas': 'NL',
  Autriche: 'AT',
  'Nouvelle-Zélande': 'NZ',
  Norvège: 'NO',
  Maroc: 'MA',
  Finlande: 'FI',
  Émirats: 'AE',
  Australie: 'AU',
  Thaïlande: 'TH',
  Suède: 'SE',
  Portugal: 'PT',
  Pologne: 'PL',
  Maurice: 'MU',
  Koweït: 'KW',
  Hongrie: 'HU',
  Géorgie: 'GE',
  Danemark: 'DK',
  Croatie: 'HR',
  Canada: 'CA',
  Brésil: 'BR',
};

/** Localised name for a stored (French) country, falling back to the original. */
export function countryLabel(stored: string): string {
  const code = ISO[stored];
  if (!code) return stored;
  try {
    return new Intl.DisplayNames([getLocale()], { type: 'region' }).of(code) ?? stored;
  } catch {
    return stored;
  }
}
