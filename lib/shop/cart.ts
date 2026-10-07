'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { nanoid } from 'nanoid'
import type { CartItem, CartUnit, CustomFieldDef, ProductType } from './types'

type AddInput = {
  productId: string
  productSlug: string
  productTitle: string
  productType: ProductType
  unitPrice: number
  quantity: number
  unitTemplates: Array<{
    productId: string
    productTitle: string
    customFields: CustomFieldDef[]
  }>
}

type CartState = {
  items: CartItem[]
  addItem: (input: AddInput) => void
  removeItem: (lineId: string) => void
  updateQuantity: (lineId: string, quantity: number) => void
  setFieldValue: (lineId: string, unitIdx: number, fieldName: string, value: string) => void
  clear: () => void
  itemCount: () => number
  subtotal: () => number
}

const buildUnits = (
  templates: AddInput['unitTemplates'],
  quantity: number,
): CartUnit[] => {
  const units: CartUnit[] = []
  for (let q = 0; q < quantity; q++) {
    for (const tpl of templates) {
      units.push({
        productId: tpl.productId,
        productTitle: tpl.productTitle,
        customFields: tpl.customFields,
        values: {},
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
              unitPrice: input.unitPrice,
              quantity: input.quantity,
              units: buildUnits(input.unitTemplates, input.quantity),
            },
          ],
        })),
      removeItem: (lineId) =>
        set((state) => ({ items: state.items.filter((i) => i.lineId !== lineId) })),
      updateQuantity: (lineId, quantity) =>
        set((state) => ({
          items: state.items.map((item) => {
            if (item.lineId !== lineId) return item
            const nextQty = Math.max(1, quantity)
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
      clear: () => set({ items: [] }),
      itemCount: () => get().items.reduce((acc, item) => acc + item.quantity, 0),
      subtotal: () => get().items.reduce((acc, item) => acc + item.unitPrice * item.quantity, 0),
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
