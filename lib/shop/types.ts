export type CustomFieldKind = 'text' | 'email' | 'phone' | 'select'

export type ProductType = 'single' | 'bundle' | 'membership'

/** Bundles and memberships both expand into their included products at checkout. */
export const hasBundleItems = (type: ProductType) => type === 'bundle' || type === 'membership'

export type CustomFieldOption = {
  value: string
  label: string
}

export type CustomFieldDef = {
  name: string
  label: string
  kind: CustomFieldKind
  required: boolean
  options?: CustomFieldOption[]
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
  unitPrice: number
  quantity: number
  units: CartUnit[]
}

/**
 * Asked once for every person a membership covers, ahead of the product's own
 * custom fields. Built in rather than configured so a membership can never be
 * sold without a contact number.
 */
export const MEMBER_FIELDS: CustomFieldDef[] = [
  { name: 'firstName', label: 'First name', kind: 'text', required: true },
  { name: 'lastName', label: 'Last name', kind: 'text', required: true },
  { name: 'mobile', label: 'Mobile number', kind: 'phone', required: true },
  { name: 'email', label: 'Email', kind: 'email', required: false },
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
