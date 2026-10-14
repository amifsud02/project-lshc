'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { CartUnit, CustomFieldDef } from '@/lib/shop/types'

export function UnitForm({
  index,
  total,
  unit,
  onField,
}: {
  index: number
  total: number
  unit: Pick<CartUnit, 'productTitle' | 'customFields' | 'values'>
  onField: (field: string, value: string) => void
}) {
  if (unit.customFields.length === 0) return null
  return (
    <div className="flex flex-col gap-3 rounded-xl bg-muted/60 p-4">
      <p className="text-sm font-semibold">
        {unit.productTitle}
        {total > 1 ? ` · #${index + 1}` : ''}
      </p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {unit.customFields.map((field) => (
          <FieldInput
            key={field.name}
            field={field}
            value={unit.values[field.name] ?? ''}
            onChange={(v) => onField(field.name, v)}
          />
        ))}
      </div>
    </div>
  )
}

export function FieldInput({
  field,
  value,
  onChange,
}: {
  field: CustomFieldDef
  value: string
  onChange: (value: string) => void
}) {
  return (
    <Label className="flex flex-col items-start gap-1.5">
      <span>
        {field.label}
        {field.required && <span className="text-destructive"> *</span>}
      </span>
      {field.kind === 'select' ? (
        <select
          className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        >
          <option value="">Select…</option>
          {(field.options ?? []).map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      ) : (
        <Input
          type={field.kind === 'email' ? 'email' : field.kind === 'phone' ? 'tel' : 'text'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </Label>
  )
}
