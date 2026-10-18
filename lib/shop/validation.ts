import { isValidPhone, type CustomFieldDef } from './types'

const MAX_VALUE_LENGTH = 200

/** Server-side check of one unit's custom field answers; returns a message for the first problem. */
export function validateUnit(unit: {
  customFields: Pick<CustomFieldDef, 'name' | 'label' | 'kind' | 'required' | 'options'>[]
  values: Record<string, string>
}): string | null {
  for (const field of unit.customFields) {
    const value = unit.values?.[field.name]
    if (value != null && typeof value !== 'string') {
      return `invalid answer in "${field.label}"`
    }
    if (field.required && (!value || value.trim() === '')) {
      return `missing "${field.label}"`
    }
    if (value && value.length > MAX_VALUE_LENGTH) {
      return `"${field.label}" is too long`
    }
    if (value && field.kind === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      return `invalid email in "${field.label}"`
    }
    if (value && field.kind === 'phone' && !isValidPhone(value)) {
      return `invalid phone number in "${field.label}"`
    }
    if (value && field.kind === 'select' && field.options?.length && !field.options.some((o) => o.value === value)) {
      return `choose one of the options for "${field.label}"`
    }
  }
  return null
}

/** Keeps only the answers to the unit's own fields, so a tampered cart can't store anything else on the order. */
export function cleanUnitValues(
  customFields: Pick<CustomFieldDef, 'name'>[],
  values: Record<string, string> | undefined,
): Record<string, string> {
  const clean: Record<string, string> = {}
  for (const { name } of customFields) {
    const value = values?.[name]
    if (typeof value === 'string' && value !== '') clean[name] = value.trim()
  }
  return clean
}
