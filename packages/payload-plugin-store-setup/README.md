# payload-plugin-store-setup

WooCommerce-style store onboarding for Payload 3: a store profile questionnaire, a setup
hub with a progress-tracked task list, and twelve guided wizards — one per area of a store.

The design follows WooCommerce's own onboarding (Core Profiler → task list → Launch Your
Store). The source-level analysis it is based on is in
[`docs/woocommerce-onboarding-analysis.md`](../../docs/woocommerce-onboarding-analysis.md).

## What you get

- **`/admin/store-setup`**: the hub. Essential tasks ("Get ready to sell") with a progress ring,
  skip/undo on optional tasks and "Hide this", plus a "Things to do next" grid.
- **`/admin/store-setup/<wizard>`**: each wizard, with a step rail, back/skip/continue, and
  saving on every step, so you can leave and resume.
- **Dashboard banner**: progress plus a link to the next task. It hides itself once the
  essentials are done, or when the task list is hidden.
- **Sidebar link** "Store setup".
- **Optional first-run redirect**: the first time staff open the dashboard, they are sent to the store profile.

| Wizard | Group | What it sets | Done when |
|---|---|---|---|
| `store-profile` | essential | Who's setting up, where you sell today, industry, country, product types. The country also picks currency and units. | profile completed |
| `location-currency` | essential | Store address, selling and shipping countries, default customer location, currency and number format, with a live price preview | wizard finished |
| `products` | essential | First products from a template, by hand, by CSV import (WooCommerce and Shopify headers), or as sample drafts. Also units and reviews. | any product exists |
| `payments` | essential | Stripe and PayPal (keys from env only), bank transfer with accounts, cheque, cash on delivery limited by shipping method, and a checkout-order preview | a usable gateway is enabled |
| `tax` | essential | On/off, prices incl./excl. with a worked example, display options, tax classes, and a rate table with country and EU OSS presets | tax off, or rates exist |
| `shipping` | essential | Suggested zones (home, EU, rest of world), flat rate, free shipping and local pickup, plus a "what does a customer pay" simulator | a zone with a method exists |
| `launch` | essential | Checklist of open tasks, coming soon (whole site or store pages only) or live, and a private preview link | store is live |
| `inventory` | next | Stock tracking, hold stock, alerts, thresholds and stock display, with a shopper preview | wizard finished |
| `checkout` | next | Guest checkout, account creation, field visibility, policy links and retention periods, with a checkout preview | wizard finished |
| `emails` | next | Sender, colours, header image, footer and per-email toggles, with a live preview and a test send | wizard finished |
| `brand` | next | Logo, brand colour, tagline and store notice bar, with a storefront preview | wizard finished |
| `marketing` | next | Coupons on/off, marketing consent, and a first coupon from ideas, read back as a plain sentence | a coupon exists |

The shipping task is hidden when the profile says you sell no physical goods, or when shipping is disabled. WooCommerce does the same.

## Install

```ts
import { storeSetupPlugin } from 'payload-plugin-store-setup'

export default buildConfig({
  plugins: [
    storeSetupPlugin({
      access: ({ req }) => req.user?.roles?.includes('admin'),
      uploadsCollection: 'media',
    }),
  ],
})
```

Then run `payload generate:importmap`.

### Options

| Option | Default | |
|---|---|---|
| `access` | any signed-in user | Who can run the wizards, read or write the settings, and manage the plugin's collections |
| `uploadsCollection` | — | Used for the logo and email header image. Without it, these are URL fields. |
| `products` | — | `{ collection, toDocument }` to write products into your own collection. Without it, a `store-products` collection is added. |
| `visibility` | — | `{ read, write }` to let your existing "shop is public" switch own launch state |
| `slugs` | `store-settings`, `store-products`, `store-tax-rates`, `store-shipping-zones`, `store-coupons` | Rename anything that clashes |
| `adminGroup` | `Store` | Sidebar group |
| `firstRunRedirect` | `true` | Send staff to the profile once |
| `componentsPath` | `payload-plugin-store-setup/components` | Import path for the admin components. In a monorepo, use the path alias to `src/components`. |
| `onSettingsChange` | — | Hook after every wizard save |
| `enabled` | `true` | `false` keeps the data model but drops the admin UI |

## Data model

- **`store-settings` global**, with one tab per area: profile, general, currency, products,
  inventory, tax, shipping, payments, checkout, emails, brand, marketing and visibility. A
  hidden `setup` group holds task status. Everything the wizards set can also be edited there.
- **`store-tax-rates`**: country, state, postcodes, cities, rate, name, priority, class, compound, shipping.
- **`store-shipping-zones`**: name, order, regions, and methods as blocks (`flat_rate`, `free_shipping`, `local_pickup`).
- **`store-coupons`**: code (stored lowercase), discount type, amount, free shipping, expiry, spend limits, usage limits.
- **`store-products`**: only when no `products` adapter is given.

Money is always stored in minor units (cents). Payment provider secrets are never stored:
the payments wizard only reports whether `STRIPE_SECRET_KEY` / `PAYPAL_CLIENT_ID` are set,
and whether Stripe is in test or live mode.

## Endpoints

All under `/api/store-setup`, and all require `access`:

| Method | Path | Body |
|---|---|---|
| GET | `/state` | — |
| POST | `/settings` | `{ patch, complete? }`. Deep-merged into the global; arrays replace. |
| POST | `/task` | `{ id, action: 'complete' \| 'skip' \| 'reopen' }` |
| POST | `/task-list` | `{ hidden }` |
| GET | `/records?kind=` | `taxRates` \| `shippingZones` \| `coupons` |
| POST | `/records` | `{ kind, docs, replace?, complete? }` (`kind` may be `products`) |
| POST | `/test-email` | `{ to }` |
| POST | `/launch` | `{ mode, scope?, message? }`. Issues a preview token. |

## Storefront helpers

```ts
import { getStoreSettings, formatPrice, canViewStore } from 'payload-plugin-store-setup'

const settings = await getStoreSettings(payload)
formatPrice(249900, settings) // "2.499,00 €" with the EU format
canViewStore({ settings, isStaff, previewToken: searchParams['store-preview'], area: 'store' })
```

## Not (yet) covered

These WooCommerce pieces are out of scope: the extension marketplace step of the Core Profiler, WooPayments onboarding, automated tax services, label printing, and multi-location pickup. The plugin stores the configuration; enforcing tax, shipping and coupon rules at checkout is up to the host app's cart code.
