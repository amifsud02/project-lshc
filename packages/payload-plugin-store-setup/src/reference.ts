/**
 * Choice lists shared by the settings global (server) and the wizards (client).
 * Plain data only, so it can be imported from both sides.
 */

import { COUNTRY_TABLE, CURRENCY_TABLE } from './data'

export type Option = { label: string; value: string; description?: string }

export const COUNTRIES: Option[] = COUNTRY_TABLE.map(([value, label]) => ({ value, label }))
const countryNames = new Map(COUNTRY_TABLE)
export const countryName = (code?: string | null) => (code ? (countryNames.get(code) ?? code) : '')

const currencies = new Map(CURRENCY_TABLE.map((row) => [row[0], row]))
export const currencySymbol = (code: string) => currencies.get(code)?.[2] ?? code

export const CURRENCIES: Option[] = CURRENCY_TABLE.map(([value, name, symbol]) => ({ value, label: `${name} (${symbol}) — ${value}` }))

/** WooCommerce's locale-info sets imperial units for these countries; everyone else gets kg/cm. */
export const IMPERIAL_COUNTRIES = ['US', 'LR', 'MM']

/** Minor-unit digits for a currency, e.g. 2 for EUR, 0 for JPY. */
export const currencyDecimals = (code: string) => currencies.get(code)?.[3] ?? 2

/** A sensible currency for a store's country, used to prefill the Location & currency wizard. */
export const currencyForCountry = (country?: string | null): string | undefined => {
  if (!country) return undefined
  const euro = 'AT BE CY DE EE ES FI FR GR HR IE IT LT LU LV MT NL PT SI SK AD MC SM VA ME XK'.split(' ')
  if (euro.includes(country)) return 'EUR'
  const map: Record<string, string> = {
    AU: 'AUD', BR: 'BRL', CA: 'CAD', CH: 'CHF', CN: 'CNY', CZ: 'CZK', DK: 'DKK', GB: 'GBP', HU: 'HUF', IN: 'INR',
    JP: 'JPY', MX: 'MXN', NO: 'NOK', NZ: 'NZD', PL: 'PLN', RO: 'RON', SE: 'SEK', SG: 'SGD', US: 'USD', ZA: 'ZAR',
    BG: 'BGN', IS: 'ISK', TR: 'TRY', AE: 'AED', IL: 'ILS', KR: 'KRW', HK: 'HKD',
  }
  return map[country]
}

// Store profile (WooCommerce core profiler).

export const SETUP_FOR: Option[] = [
  { value: 'starting', label: "I'm just starting my business", description: 'No sales yet — set up the essentials and launch.' },
  { value: 'selling', label: "I'm already selling", description: 'Bring an existing shop or market stall online.' },
  { value: 'client', label: "I'm setting up a store for a client", description: 'Configure everything, then hand it over.' },
]

export const SELLING_WHERE: Option[] = [
  { value: 'online', label: "Yes, I'm selling online" },
  { value: 'offline', label: "No, I'm selling offline" },
  { value: 'both', label: "I'm selling both online and offline" },
]

export const PLATFORMS: Option[] = [
  ['amazon', 'Amazon'],
  ['adobe_commerce', 'Adobe Commerce'],
  ['big_cartel', 'Big Cartel'],
  ['big_commerce', 'BigCommerce'],
  ['ebay', 'eBay'],
  ['ecwid', 'Ecwid'],
  ['etsy', 'Etsy'],
  ['facebook_marketplace', 'Facebook Marketplace'],
  ['google_shopping', 'Google Shopping'],
  ['pinterest', 'Pinterest'],
  ['shopify', 'Shopify'],
  ['square', 'Square'],
  ['squarespace', 'Squarespace'],
  ['wix', 'Wix'],
  ['wordpress', 'WordPress'],
  ['other', 'Other'],
].map(([value, label]) => ({ value, label }))

export const INDUSTRIES: Option[] = [
  ['clothing_and_accessories', 'Clothing and accessories'],
  ['health_and_beauty', 'Health and beauty'],
  ['food_and_drink', 'Food and drink'],
  ['home_furniture_and_garden', 'Home, furniture and garden'],
  ['education_and_learning', 'Education and learning'],
  ['electronics_and_computers', 'Electronics and computers'],
  ['arts_and_crafts', 'Arts and crafts'],
  ['sports_and_recreation', 'Sports and recreation'],
  ['clubs_and_memberships', 'Clubs, associations and memberships'],
  ['other', 'Other'],
].map(([value, label]) => ({ value, label }))

export const PRODUCT_TYPES: Option[] = [
  { value: 'physical', label: 'Physical products', description: 'Things you post or hand over.' },
  { value: 'downloads', label: 'Downloads', description: 'Files the buyer downloads after paying.' },
  { value: 'services', label: 'Services and bookings', description: 'Appointments, lessons, event places.' },
  { value: 'memberships', label: 'Memberships', description: 'Paid access for a period or season.' },
  { value: 'subscriptions', label: 'Subscriptions', description: 'Charged again on a schedule.' },
  { value: 'bundles', label: 'Bundles', description: 'Several products sold together.' },
]

export const REVENUE: Option[] = [
  ['none', "I haven't sold yet"],
  ['up-to-2500', 'Up to 2,500 a month'],
  ['2500-10000', '2,500 – 10,000 a month'],
  ['10000-50000', '10,000 – 50,000 a month'],
  ['50000-250000', '50,000 – 250,000 a month'],
  ['more-than-250000', 'More than 250,000 a month'],
].map(([value, label]) => ({ value, label }))

// General settings.

export const CURRENCY_POSITIONS: Option[] = [
  { value: 'left', label: 'Left — €99.99' },
  { value: 'right', label: 'Right — 99.99€' },
  { value: 'left_space', label: 'Left with space — € 99.99' },
  { value: 'right_space', label: 'Right with space — 99.99 €' },
]

export const SELLING_LOCATIONS: Option[] = [
  { value: 'all', label: 'Sell to all countries' },
  { value: 'all_except', label: 'Sell to all countries, except for…' },
  { value: 'specific', label: 'Sell to specific countries' },
]

export const SHIP_TO: Option[] = [
  { value: 'all_selling', label: 'Ship to all countries you sell to' },
  { value: 'all', label: 'Ship to all countries' },
  { value: 'specific', label: 'Ship to specific countries only' },
  { value: 'disabled', label: 'Disable shipping and shipping calculations' },
]

export const CUSTOMER_LOCATION: Option[] = [
  { value: 'none', label: 'No location by default' },
  { value: 'base', label: 'Shop country/region' },
  { value: 'geolocation', label: 'Geolocate from the visitor’s IP address' },
]

export const WEIGHT_UNITS: Option[] = ['kg', 'g', 'lbs', 'oz'].map((v) => ({ value: v, label: v }))
export const DIMENSION_UNITS: Option[] = ['m', 'cm', 'mm', 'in', 'yd'].map((v) => ({ value: v, label: v }))

export const STOCK_FORMATS: Option[] = [
  { value: 'always', label: 'Always show quantity remaining — “12 in stock”' },
  { value: 'low_amount', label: 'Only show when low — “Only 2 left in stock”' },
  { value: 'no_amount', label: 'Never show quantity remaining' },
]

// Tax.

export const TAX_BASED_ON: Option[] = [
  { value: 'shipping', label: 'Customer shipping address' },
  { value: 'billing', label: 'Customer billing address' },
  { value: 'base', label: 'Shop base address' },
]

/** EU standard VAT rates plus a few common neighbours. Rates change — check before launch. */
export const VAT_STANDARD_RATES: Record<string, number> = {
  AT: 20, BE: 21, BG: 20, CY: 19, CZ: 21, DE: 19, DK: 25, EE: 24, ES: 21, FI: 25.5, FR: 20, GR: 24, HR: 25,
  HU: 27, IE: 23, IT: 22, LT: 21, LU: 17, LV: 21, MT: 18, NL: 21, PL: 23, PT: 23, RO: 21, SE: 25, SI: 22, SK: 23,
  GB: 20, CH: 8.1, NO: 25, IS: 24,
}
export const EU_COUNTRIES = 'AT BE BG CY CZ DE DK EE ES FI FR GR HR HU IE IT LT LU LV MT NL PL PT RO SE SI SK'.split(' ')

// Shipping.

export const SHIPPING_METHODS: Option[] = [
  { value: 'flat_rate', label: 'Flat rate', description: 'A fixed cost per order, optionally per item.' },
  { value: 'free_shipping', label: 'Free shipping', description: 'Free, optionally above an order amount or with a coupon.' },
  { value: 'local_pickup', label: 'Local pickup', description: 'Buyers collect from you.' },
]

export const FREE_SHIPPING_REQUIRES: Option[] = [
  { value: 'none', label: 'Nothing — always free' },
  { value: 'coupon', label: 'A valid free shipping coupon' },
  { value: 'min_amount', label: 'A minimum order amount' },
  { value: 'either', label: 'A minimum order amount OR a coupon' },
  { value: 'both', label: 'A minimum order amount AND a coupon' },
]

// Checkout & accounts.

export const FIELD_VISIBILITY: Option[] = [
  { value: 'hidden', label: 'Hidden' },
  { value: 'optional', label: 'Optional' },
  { value: 'required', label: 'Required' },
]

export const RETENTION_UNITS: Option[] = ['days', 'weeks', 'months', 'years'].map((v) => ({ value: v, label: v }))

// Marketing.

export const DISCOUNT_TYPES: Option[] = [
  { value: 'percent', label: 'Percentage discount' },
  { value: 'fixed_cart', label: 'Fixed cart discount' },
  { value: 'fixed_product', label: 'Fixed product discount' },
]

// Launch.

export const VISIBILITY_MODES: Option[] = [
  { value: 'coming_soon', label: 'Coming soon', description: 'Only you and people with the preview link can see the store.' },
  { value: 'live', label: 'Live', description: 'Everyone can see and buy.' },
]

export const COMING_SOON_SCOPES: Option[] = [
  { value: 'store', label: 'Store pages only', description: 'Shop, product, cart and checkout pages are hidden. The rest of the site stays up.' },
  { value: 'site', label: 'Entire site', description: 'Every public page shows the coming soon message.' },
]

export const PAYMENT_GATEWAYS = ['stripe', 'paypal', 'bacs', 'cheque', 'cod'] as const
export type PaymentGateway = (typeof PAYMENT_GATEWAYS)[number]

export const EMAIL_NOTIFICATIONS: { key: string; label: string; to: 'admin' | 'customer'; description: string }[] = [
  { key: 'newOrder', label: 'New order', to: 'admin', description: 'Sent to you when an order is received.' },
  { key: 'cancelledOrder', label: 'Cancelled order', to: 'admin', description: 'Sent to you when an order is cancelled.' },
  { key: 'failedOrder', label: 'Failed order', to: 'admin', description: 'Sent to you when a payment fails.' },
  { key: 'customerOnHold', label: 'Order on hold', to: 'customer', description: 'Sent while awaiting a bank transfer or cheque.' },
  { key: 'customerProcessing', label: 'Processing order', to: 'customer', description: 'Sent once payment is received.' },
  { key: 'customerCompleted', label: 'Completed order', to: 'customer', description: 'Sent when the order is shipped or collected.' },
  { key: 'customerRefunded', label: 'Refunded order', to: 'customer', description: 'Sent when an order is refunded.' },
  { key: 'customerNote', label: 'Customer note', to: 'customer', description: 'Sent when you add a note for the customer.' },
  { key: 'customerResetPassword', label: 'Reset password', to: 'customer', description: 'Sent when a customer asks to reset their password.' },
  { key: 'customerNewAccount', label: 'New account', to: 'customer', description: 'Sent when a customer creates an account.' },
]
