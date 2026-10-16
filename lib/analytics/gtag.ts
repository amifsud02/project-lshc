// Google Analytics 4 helpers. Client-safe; every call is a no-op on the server or when GA
// hasn't loaded, so tracking can never break a page.
import { CURRENCY, type CartItem } from '@/lib/shop/types'

export { CURRENCY }

export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || 'G-R7TBRHBEYQ'

/**
 * Google Consent Mode v2. When on, analytics and ad storage start "denied" and the CookieYes
 * banner grants them once the visitor accepts. Requires "Support Google Consent Mode" in the
 * CookieYes dashboard, otherwise consent is never granted, so it is opt-in.
 */
export const GA_CONSENT_MODE = process.env.NEXT_PUBLIC_GA_CONSENT_MODE === 'true'

type GtagParams = Record<string, unknown>

declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: (...args: unknown[]) => void
  }
}

/** Sends a GA4 event. See https://developers.google.com/analytics/devguides/collection/ga4/reference/events */
export function trackEvent(name: string, params: GtagParams = {}): void {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') return
  try {
    window.gtag('event', name, params)
  } catch {
    // Analytics must never interrupt the visitor.
  }
}

/**
 * Like `trackEvent`, but at most once per browser tab for `key`, e.g. a purchase whose
 * confirmation page refreshes while the payment is processed.
 */
export function trackEventOnce(key: string, name: string, params: GtagParams = {}): void {
  const storageKey = `ga:${key}`
  try {
    if (window.sessionStorage.getItem(storageKey)) return
    window.sessionStorage.setItem(storageKey, '1')
  } catch {
    // Storage blocked: send anyway rather than lose the event.
  }
  trackEvent(name, params)
}

const PRODUCT_TYPE_LABEL: Record<string, string> = {
  membership: 'Membership',
  bundle: 'Bundle',
  item: 'Item',
}

/** A GA4 ecommerce item. Prices are stored in cents; GA expects currency units. */
export type GaItem = {
  item_id: string
  item_name: string
  item_category?: string
  price: number
  quantity: number
}

export const toGaItem = (p: {
  id: string
  title: string
  type?: string
  /** In cents. */
  price: number
  quantity?: number
}): GaItem => ({
  item_id: p.id,
  item_name: p.title,
  item_category: p.type ? (PRODUCT_TYPE_LABEL[p.type] ?? p.type) : undefined,
  price: p.price / 100,
  quantity: p.quantity ?? 1,
})

export const cartItemsToGa = (items: CartItem[]): GaItem[] =>
  items.map((i) =>
    toGaItem({ id: i.productId, title: i.productTitle, type: i.productType, price: i.unitPrice, quantity: i.quantity }),
  )

export const gaValue = (items: GaItem[]): number =>
  Math.round(items.reduce((sum, i) => sum + i.price * i.quantity, 0) * 100) / 100
