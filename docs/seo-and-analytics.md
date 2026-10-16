# SEO, GEO and Google Analytics

How the site gets found by search engines and AI assistants, and what it reports to GA4.

## Editing SEO in the admin

Pages, News, Galleries, Videos and Products have SEO fields from the
[Payload SEO plugin](https://payloadcms.com/docs/plugins/seo): a meta title, a meta description
and a share image, with a Google-style preview and length checks. **Auto-generate** fills them
from the document (title + site name, the excerpt, the featured image).

- Leave them empty and the site falls back to the document's own title, description and image.
- A meta title is used exactly as written, so keep the site name in it (the generator adds it).
- Pages keep their SEO in the **SEO** tab, as before (same fields, nothing to migrate), plus
  **noIndex** to hide a page from search engines and the sitemap.

Plugin set-up: `lib/seo/plugin.ts`.

## What the site publishes for crawlers

| URL | What it is |
| --- | --- |
| `/sitemap.xml` | Every public page, news post, gallery, video and fixture, plus the shop when it is public. Built from the CMS, refreshed hourly (`app/sitemap.ts`). |
| `/robots.txt` | Allows everything except admin, API and per-visitor pages. AI search crawlers (GPTBot, ClaudeBot, PerplexityBot, Google-Extended…) are listed explicitly as allowed (`app/robots.ts`). |
| `/llms.txt` | A plain-language guide to the club and the site for AI assistants ([llmstxt.org](https://llmstxt.org)), with the latest news and upcoming fixtures (`app/llms.txt/route.ts`). |
| `/news/feed.xml` | RSS feed of the latest 30 news posts. |

Every page also carries schema.org structured data (`lib/seo/structuredData.ts`): the club as a
`SportsOrganization` and the `WebSite` on every page, `NewsArticle` on news posts, `SportsEvent`
on fixtures, `VideoObject` on La Salle TV videos, `Product` on shop products, and breadcrumbs.
This is what lets Google show rich results and lets AI answers cite the club accurately.

Account, cart, checkout and sign-in pages are `noindex`. `/news/photogallery/*` repeats
`/news/gallery/*`, so its canonical URL points there.

After deploying, submit `https://lasallehandball.com/sitemap.xml` in
[Google Search Console](https://search.google.com/search-console) and
[Bing Webmaster Tools](https://www.bing.com/webmasters) (Bing also feeds ChatGPT and Copilot search).

## Google Analytics 4

Loaded by `components/Analytics/GoogleAnalytics.tsx`; send events with `trackEvent` from
`lib/analytics/gtag.ts`. Page views, scrolls, outbound clicks, site search, file downloads and
YouTube plays come from GA4's **enhanced measurement**, which must stay on in the GA4 data stream
(including "Page changes based on browser history events", which counts page views as visitors
move around the site).

| Event | When | Useful parameters |
| --- | --- | --- |
| `view_item` | A shop product page is shown | `items`, `value` |
| `add_to_cart` / `remove_from_cart` | Cart changes | `items`, `value` |
| `view_cart` | The cart page is shown | `items`, `value` |
| `begin_checkout` | The checkout page is shown, or a membership is sent to MEMBRS (`checkout_provider: membrs`) | `items`, `value` |
| `add_payment_info` | "Pay with card" is pressed | `payment_type` |
| `purchase` | A paid order's confirmation page (once per order) | `transaction_id`, `value`, `items` |
| `generate_lead` | Contact form sent, or nursery registration submitted | `form_name`, `enquiry_type`, `age_group`, `payment_method` |
| `sign_up` | Sign-up link requested, or Google sign-up started | `method` |
| `login` | Signed in with a password or an emailed link, or Google sign-in started | `method` |
| `video_start` / `video_progress` / `video_complete` | Uploaded La Salle TV videos (YouTube ones are tracked by enhanced measurement) | `video_title`, `video_percent` |
| `LCP`, `INP`, `CLS`, `FCP`, `TTFB` | Core Web Vitals from real visitors | `metric_rating`, `metric_value` |

### One-off set-up in GA4 (Admin)

1. **Key events**: mark `purchase`, `generate_lead` and `sign_up` as key events.
2. **Custom dimensions** (event-scoped), so the parameters appear in reports: `form_name`,
   `enquiry_type`, `age_group`, `method`, `metric_rating`, `video_title`.
3. **Custom metric**: `metric_value` (for Web Vitals, unit: milliseconds; CLS is ×1000 in `value`).
4. Link **Search Console** to GA4 to see search queries next to on-site behaviour.

### Environment variables

| Variable | Default | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | `NEXT_PUBLIC_API_URL`, then `https://lasallehandball.com` | Public origin for canonical URLs, the sitemap and structured data |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | `G-R7TBRHBEYQ` | GA4 property |
| `NEXT_PUBLIC_GA_CONSENT_MODE` | off | `true` turns on Google Consent Mode v2 (see below) |
| `NEXT_PUBLIC_GA_DEBUG` | off | `true` sends events to GA4 DebugView |
| `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` | — | Search Console verification meta tag |
| `NEXT_PUBLIC_BING_SITE_VERIFICATION` | — | Bing Webmaster Tools verification meta tag |

`NEXT_PUBLIC_*` values are built into the site, so on Railway they must also be passed as build
args (see the `Dockerfile`).

### Consent Mode

With `NEXT_PUBLIC_GA_CONSENT_MODE=true`, analytics and ad cookies start denied and are granted
when the visitor accepts the CookieYes banner; GA4 models the visitors who decline. Before turning
it on, enable **Support Google Consent Mode (GCM)** in the CookieYes dashboard, or consent is never
granted and GA4 and AdSense only receive cookieless data.
