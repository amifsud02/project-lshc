export type CustomFieldKind = 'text' | 'email' | 'phone' | 'select'

export type ProductType = 'single' | 'bundle' | 'membership'

/** Bundles and memberships both expand into their included products at checkout. */
export const hasBundleItems = (type: ProductType) => type === 'bundle' || type === 'membership'

export type CustomFieldOption = {
  value: string
  label: string
  /** Left in stock; undefined when not tracked. */
  stock?: number
}

export type CustomFieldDef = {
  name: string
  label: string
  kind: CustomFieldKind
  required: boolean
  options?: CustomFieldOption[]
  /** Text answers only. */
  maxLength?: number
  /** Cents added to the unit's price when the answer is filled in, e.g. printing a name. */
  surcharge?: number
  /** Printed on the item, so it can't be returned. */
  personalised?: boolean
}

export type CartUnit = {
  productId: string
  productTitle: string
  customFields: CustomFieldDef[]
  values: Record<string, string>
}

export type CartItem = {
  lineId: string
  productId: string
  productSlug: string
  productTitle: string
  productType: ProductType
  /** Product photo for the cart line; filled in when prices are re-read if missing. */
  imageUrl?: string
  unitPrice: number
  quantity: number
  units: CartUnit[]
  /** Set when the product has variants: which one, e.g. "M / Black". */
  variantId?: string
  variantTitle?: string
}

/** Cart lines of the same product but different variants are priced separately. */
export const priceKey = (item: Pick<CartItem, 'productId' | 'variantId'>) => (item.variantId ? `${item.productId}:${item.variantId}` : item.productId)

/**
 * Asked once for every person a membership covers, ahead of the product's own
 * custom fields. Built in rather than configured so a membership can never be
 * sold without a contact number.
 */
export const MEMBER_FIELDS: CustomFieldDef[] = [
  { name: 'firstName', label: 'First name', kind: 'text', required: true },
  { name: 'lastName', label: 'Last name', kind: 'text', required: true },
  { name: 'mobile', label: 'Mobile number', kind: 'phone', required: true },
  // Each member gets their own MEMBRS account and digital card, so everyone needs an email.
  { name: 'email', label: 'Email', kind: 'email', required: true },
]

/** Accepts local ("7912 3456") and international ("+356 7912 3456") numbers: 8–15 digits. */
export const isValidPhone = (value: string): boolean => {
  if (!/^\+?[\d\s()-]+$/.test(value.trim())) return false
  const digits = value.replace(/\D/g, '').length
  return digits >= 8 && digits <= 15
}

export const CURRENCY = 'EUR'

export function formatPrice(cents: number, currency: string = CURRENCY): string {
  return new Intl.NumberFormat('en-MT', {
    style: 'currency',
    currency,
  }).format(cents / 100)
}

/** What a unit's answers add to its price, e.g. a printed name. */
export const unitExtras = (unit: { customFields: CustomFieldDef[]; values: Record<string, string> }): number =>
  unit.customFields.reduce((sum, f) => sum + (f.surcharge && String(unit.values?.[f.name] ?? '').trim() ? f.surcharge : 0), 0)

/** A cart line's price: its units plus anything their answers add. */
export const itemTotal = (item: Pick<CartItem, 'unitPrice' | 'quantity' | 'units'>): number =>
  item.unitPrice * item.quantity + item.units.reduce((sum, unit) => sum + unitExtras(unit), 0)

/** True when any unit has a filled-in answer that gets printed on the item. */
export const isPersonalised = (item: Pick<CartItem, 'units'>): boolean =>
  item.units.some((u) => u.customFields.some((f) => f.personalised && String(u.values?.[f.name] ?? '').trim()))
