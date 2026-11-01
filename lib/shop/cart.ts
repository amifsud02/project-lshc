'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { nanoid } from 'nanoid'
import { itemTotal, type CartItem, type CartUnit, type CustomFieldDef, type ProductType } from './types'

type AddInput = {
  productId: string
  productSlug: string
  productTitle: string
  productType: ProductType
  imageUrl?: string
  unitPrice: number
  quantity: number
  /** Answers picked on the product page (e.g. a size), given to every unit of that product. */
  values?: Record<string, string>
  unitTemplates: Array<{
    productId: string
    productTitle: string
    customFields: CustomFieldDef[]
  }>
}

/** Most of one product a single cart line takes. */
export const MAX_QUANTITY = 10

export type PriceChange = { title: string; from: number; to: number | null }

type CartState = {
  items: CartItem[]
  addItem: (input: AddInput) => void
  removeItem: (lineId: string) => void
  updateQuantity: (lineId: string, quantity: number) => void
  setFieldValue: (lineId: string, unitIdx: number, fieldName: string, value: string) => void
  /** Applies today's prices; drops lines no longer for sale. Returns what changed. */
  syncPrices: (current: Record<string, { price: number; available: boolean; imageUrl?: string }>) => PriceChange[]
  clear: () => void
  itemCount: () => number
  subtotal: () => number
}

const buildUnits = (
  templates: AddInput['unitTemplates'],
  quantity: number,
  productId: string,
  values: Record<string, string> = {},
): CartUnit[] => {
  const units: CartUnit[] = []
  for (let q = 0; q < quantity; q++) {
    for (const tpl of templates) {
      units.push({
        productId: tpl.productId,
        productTitle: tpl.productTitle,
        customFields: tpl.customFields,
        values: tpl.productId === productId ? { ...values } : {},
      })
    }
  }
  return units
}

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (input) =>
        set((state) => ({
          items: [
            ...state.items,
            {
              lineId: nanoid(),
              productId: input.productId,
              productSlug: input.productSlug,
              productTitle: input.productTitle,
              productType: input.productType,
              imageUrl: input.imageUrl,
              unitPrice: input.unitPrice,
              quantity: input.quantity,
              units: buildUnits(input.unitTemplates, input.quantity, input.productId, input.values),
            },
          ],
        })),
      removeItem: (lineId) =>
        set((state) => ({ items: state.items.filter((i) => i.lineId !== lineId) })),
      updateQuantity: (lineId, quantity) =>
        set((state) => ({
          items: state.items.map((item) => {
            if (item.lineId !== lineId) return item
            const nextQty = Math.min(MAX_QUANTITY, Math.max(1, quantity))
            const templates = uniqueTemplatesFromUnits(item.units, item.quantity)
            return {
              ...item,
              quantity: nextQty,
              units: extendUnits(item.units, templates, item.quantity, nextQty),
            }
          }),
        })),
      setFieldValue: (lineId, unitIdx, fieldName, value) =>
        set((state) => ({
          items: state.items.map((item) => {
            if (item.lineId !== lineId) return item
            const nextUnits = item.units.map((unit, idx) =>
              idx === unitIdx
                ? { ...unit, values: { ...unit.values, [fieldName]: value } }
                : unit,
            )
            return { ...item, units: nextUnits }
          }),
        })),
      syncPrices: (current) => {
        const changes: PriceChange[] = []
        const items = get().items.flatMap((item) => {
          const now = current[item.productId]
          if (!now?.available) {
            changes.push({ title: item.productTitle, from: item.unitPrice, to: null })
            return []
          }
          const withImage = now.imageUrl && now.imageUrl !== item.imageUrl ? { ...item, imageUrl: now.imageUrl } : item
          if (now.price === item.unitPrice) return [withImage]
          changes.push({ title: item.productTitle, from: item.unitPrice, to: now.price })
          return [{ ...withImage, unitPrice: now.price }]
        })
        set({ items })
        return changes
      },
      clear: () => set({ items: [] }),
      itemCount: () => get().items.reduce((acc, item) => acc + item.quantity, 0),
      subtotal: () => get().items.reduce((acc, item) => acc + itemTotal(item), 0),
    }),
    {
      name: 'lshc-cart',
      version: 1,
    },
  ),
)

function uniqueTemplatesFromUnits(
  units: CartUnit[],
  oldQuantity: number,
): Array<{ productId: string; productTitle: string; customFields: CustomFieldDef[] }> {
  const perQuantity = oldQuantity > 0 ? units.length / oldQuantity : units.length
  return units.slice(0, Math.max(1, perQuantity)).map((u) => ({
    productId: u.productId,
    productTitle: u.productTitle,
    customFields: u.customFields,
  }))
}

function extendUnits(
  existing: CartUnit[],
  templates: Array<{ productId: string; productTitle: string; customFields: CustomFieldDef[] }>,
  oldQuantity: number,
  newQuantity: number,
): CartUnit[] {
  if (newQuantity === oldQuantity) return existing
  const perQuantity = templates.length
  const desired = newQuantity * perQuantity
  if (desired < existing.length) return existing.slice(0, desired)
  const next = [...existing]
  while (next.length < desired) {
    for (const tpl of templates) {
      next.push({
        productId: tpl.productId,
        productTitle: tpl.productTitle,
        customFields: tpl.customFields,
        values: {},
      })
      if (next.length >= desired) break
    }
  }
  return next
}
