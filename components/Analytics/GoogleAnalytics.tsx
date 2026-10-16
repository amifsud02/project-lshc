import Script from 'next/script'
import { GA_CONSENT_MODE, GA_MEASUREMENT_ID } from '@/lib/analytics/gtag'
import WebVitals from './WebVitals'

// GA treats any debug_mode value as on, so it is only sent when wanted (shows in DebugView).
const config: Record<string, unknown> =
  process.env.NEXT_PUBLIC_GA_DEBUG === 'true' ? { debug_mode: true } : {}

// Consent defaults must be queued before the config call.
const consentDefaults = GA_CONSENT_MODE
  ? `gtag('consent', 'default', {
  ad_storage: 'denied',
  ad_user_data: 'denied',
  ad_personalization: 'denied',
  analytics_storage: 'denied',
  functionality_storage: 'granted',
  security_storage: 'granted',
  wait_for_update: 500
});
gtag('set', 'ads_data_redaction', true);
gtag('set', 'url_passthrough', true);`
  : ''

/**
 * Google Analytics 4. Page views on client-side navigation are sent by GA4's enhanced
 * measurement ("Page changes based on browser history events"), which must stay switched on.
 */
export default function GoogleAnalytics() {
  if (!GA_MEASUREMENT_ID) return null

  return (
    <>
      {/* A plain inline script runs as the HTML is parsed, so the queue and the consent
          defaults exist before gtag.js and the CookieYes banner (both afterInteractive). */}
      <script
        id="ga-init"
        dangerouslySetInnerHTML={{
          __html: `window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
window.gtag = gtag;
${consentDefaults}
gtag('js', new Date());
gtag('config', '${GA_MEASUREMENT_ID}', ${JSON.stringify(config)});`,
        }}
      />
      <Script
        id="ga-loader"
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
      />
      <WebVitals />
    </>
  )
}
