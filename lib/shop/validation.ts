import { isValidPhone, type CustomFieldDef } from './types'

/** Server-side check of one unit's custom field answers; returns a message for the first problem. */
export function validateUnit(unit: {
  customFields: Pick<CustomFieldDef, 'name' | 'label' | 'kind' | 'required' | 'options' | 'maxLength'>[]
  values: Record<string, string>
}): string | null {
  for (const field of unit.customFields) {
    const value = unit.values?.[field.name]
    if (field.required && (!value || String(value).trim() === '')) {
      return `missing "${field.label}"`
    }
    if (value && field.kind === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      return `invalid email in "${field.label}"`
    }
    if (value && field.kind === 'phone' && !isValidPhone(value)) {
      return `invalid phone number in "${field.label}"`
    }
    if (value && field.kind === 'select' && field.options?.length && !field.options.some((o) => o.value === value)) {
      return `"${value}" isn't one of the choices for "${field.label}"`
    }
    if (value && field.maxLength && String(value).length > field.maxLength) {
      return `"${field.label}" can be at most ${field.maxLength} characters`
    }
  }
  return null
}
