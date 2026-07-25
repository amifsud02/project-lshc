export type CustomFieldKind = 'text' | 'email' | 'phone' | 'select'

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
  productType: 'single' | 'bundle'
  unitPrice: number
  quantity: number
  units: CartUnit[]
}

export const CURRENCY = 'EUR'

export function formatPrice(cents: number, currency: string = CURRENCY): string {
  return new Intl.NumberFormat('en-MT', {
    style: 'currency',
    currency,
  }).format(cents / 100)
}
