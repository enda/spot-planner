// Google Tag Manager + GA4, with Consent Mode v2 (denied by default).
//
// GA isn't on the CNIL exemption list, so nothing is granted until the user
// accepts in the cookie banner. The GTM container is loaded with consent
// defaulted to "denied" (cookieless pings only); accepting flips
// analytics_storage to "granted". The GA4 measurement ID lives in the GTM
// container config (gtm/GTM.json), not here.

export const GTM_ID = 'GTM-KTN62VPF';

const CONSENT_KEY = 'sp-consent';

export type Consent = 'granted' | 'denied';

/** The stored consent choice, or null if the user hasn't decided yet. */
export function getConsent(): Consent | null {
  try {
    const v = localStorage.getItem(CONSENT_KEY);
    return v === 'granted' || v === 'denied' ? v : null;
  } catch {
    return null;
  }
}

let started = false;

/** Set up dataLayer + Consent Mode v2 defaults, then load the GTM container. */
export function initAnalytics(): void {
  if (started || typeof window === 'undefined') return;
  started = true;

  const w = window as unknown as { dataLayer: unknown[]; gtag?: (...a: unknown[]) => void };
  w.dataLayer = w.dataLayer || [];
  function gtag(..._args: unknown[]) {
    // gtag.js requires the raw `arguments` object pushed to the dataLayer.
    // eslint-disable-next-line prefer-rest-params
    w.dataLayer.push(arguments);
  }
  w.gtag = gtag as unknown as (...a: unknown[]) => void;

  // Consent Mode v2 — everything denied by default; restore a prior "granted".
  const stored = getConsent();
  gtag('consent', 'default', {
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    analytics_storage: stored === 'granted' ? 'granted' : 'denied',
    wait_for_update: 500,
  });

  // Standard GTM bootstrap (consent default is already in the dataLayer above).
  w.dataLayer.push({ 'gtm.start': new Date().getTime(), event: 'gtm.js' });
  const f = document.getElementsByTagName('script')[0];
  const j = document.createElement('script');
  j.async = true;
  j.src = 'https://www.googletagmanager.com/gtm.js?id=' + GTM_ID;
  f.parentNode?.insertBefore(j, f);
}

// Context attached to every event so GA can segment by DZ / country / language:
// the active DZ name, its country, and the app locale. Kept current by
// setAnalyticsContext() and also pushed to the dataLayer so the GA4 config tag
// can read it for auto events (page_view) too.
let ctx: Record<string, unknown> = { dz_name: '(none)', dz_country: '(none)', lang: '' };

/** Update the global event context (active DZ, country, locale). */
export function setAnalyticsContext(next: {
  dz_name?: string | null;
  dz_country?: string | null;
  lang?: string;
}): void {
  ctx = {
    dz_name: next.dz_name || '(none)',
    dz_country: next.dz_country || '(none)',
    lang: next.lang || ctx.lang || '',
  };
  if (typeof window === 'undefined') return;
  const w = window as unknown as { dataLayer?: unknown[] };
  (w.dataLayer = w.dataLayer || []).push({ ...ctx });
}

/** Record (and persist) the user's consent choice; update GA accordingly. */
export function setConsent(granted: boolean): void {
  try {
    localStorage.setItem(CONSENT_KEY, granted ? 'granted' : 'denied');
  } catch {
    /* ignore */
  }
  const w = window as unknown as { gtag?: (...a: unknown[]) => void };
  w.gtag?.('consent', 'update', {
    analytics_storage: granted ? 'granted' : 'denied',
  });
}

/** Push a custom event to the dataLayer, merged with the active DZ/lang context. */
export function track(event: string, params: Record<string, unknown> = {}): void {
  if (typeof window === 'undefined') return;
  const w = window as unknown as { dataLayer?: unknown[] };
  (w.dataLayer = w.dataLayer || []).push({ event, ...ctx, ...params });
}
