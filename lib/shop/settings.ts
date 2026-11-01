/** How the shop hands orders over, and what it adds to the price. Set in Site Settings → Shop. */
export type ShopSettings = {
  collection: { label: string; details: string; readyIn: string }
  delivery: { enabled: boolean; fee: number; details: string }
  /** Percent included in prices, e.g. 18. 0 hides the VAT line. */
  vatRate: number
  termsUrl?: string
  privacyUrl?: string
}

export type FulfilmentMethod = 'collect' | 'deliver'

export const shopSettingsFromPayload = (shop: any): ShopSettings => ({
  collection: {
    label: shop?.collectionLabel || 'Collect at the club',
    details: shop?.collectionDetails || "At a training session. We'll email you when it's ready.",
    readyIn: shop?.readyIn || '',
  },
  delivery: {
    enabled: Boolean(shop?.deliveryEnabled),
    fee: Math.max(0, Math.round(Number(shop?.deliveryFee) || 0)),
    details: shop?.deliveryDetails || '',
  },
  vatRate: Math.max(0, Number(shop?.vatRate) || 0),
  termsUrl: shop?.termsUrl || undefined,
  privacyUrl: shop?.privacyUrl || undefined,
})

/** The VAT already inside a VAT-inclusive amount, in cents. */
export const vatIncluded = (cents: number, ratePercent: number): number =>
  ratePercent > 0 ? Math.round(cents - cents / (1 + ratePercent / 100)) : 0

export const deliveryFeeFor = (method: FulfilmentMethod, settings: ShopSettings): number =>
  method === 'deliver' && settings.delivery.enabled ? settings.delivery.fee : 0
