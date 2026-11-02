'use client'

import { useState, type ReactNode } from 'react'
import { COUNTRIES, type Option } from '../../reference'

export function Field({ label, help, children, inline }: { label?: ReactNode; help?: ReactNode; children: ReactNode; inline?: boolean }) {
  return (
    <div className={`ss-field${inline ? ' ss-field--inline' : ''}`}>
      {label && <span className="ss-field__label">{label}</span>}
      {children}
      {help && <span className="ss-field__help">{help}</span>}
    </div>
  )
}

export function Row({ children }: { children: ReactNode }) {
  return <div className="ss-row">{children}</div>
}

export function TextInput({
  value,
  onChange,
  placeholder,
  type = 'text',
  maxLength,
}: {
  value?: string | null
  onChange: (v: string) => void
  placeholder?: string
  type?: 'text' | 'email' | 'url'
  maxLength?: number
}) {
  return (
    <input
      className="ss-input"
      type={type}
      value={value ?? ''}
      placeholder={placeholder}
      maxLength={maxLength}
      onChange={(e) => onChange(e.target.value)}
    />
  )
}

export function TextArea({ value, onChange, rows = 3, placeholder }: { value?: string | null; onChange: (v: string) => void; rows?: number; placeholder?: string }) {
  return <textarea className="ss-input" rows={rows} value={value ?? ''} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
}

export function NumberInput({
  value,
  onChange,
  min,
  max,
  step,
  suffix,
  placeholder,
}: {
  value?: number | null
  onChange: (v: number | null) => void
  min?: number
  max?: number
  step?: number
  suffix?: string
  placeholder?: string
}) {
  return (
    <span className="ss-affix">
      <input
        className="ss-input"
        type="number"
        value={value ?? ''}
        min={min}
        max={max}
        step={step}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))}
      />
      {suffix && <span className="ss-affix__text">{suffix}</span>}
    </span>
  )
}

/** Edits a minor-unit amount (cents) as a major-unit decimal. */
export function MoneyInput({ value, onChange, symbol, digits = 2 }: { value?: number | null; onChange: (v: number | null) => void; symbol: string; digits?: number }) {
  const factor = 10 ** digits
  const [text, setText] = useState(value == null ? '' : (value / factor).toFixed(digits))
  return (
    <span className="ss-affix ss-affix--before">
      <span className="ss-affix__text">{symbol}</span>
      <input
        className="ss-input"
        inputMode="decimal"
        value={text}
        placeholder={(0).toFixed(digits)}
        onChange={(e) => {
          setText(e.target.value)
          const n = Number(e.target.value.replace(',', '.'))
          onChange(e.target.value.trim() === '' || Number.isNaN(n) ? null : Math.round(n * factor))
        }}
        onBlur={() => value != null && setText((value / factor).toFixed(digits))}
      />
    </span>
  )
}

export function Select({ value, onChange, options, placeholder }: { value?: string | null; onChange: (v: string) => void; options: Option[]; placeholder?: string }) {
  return (
    <select className="ss-input ss-select" value={value ?? ''} onChange={(e) => onChange(e.target.value)}>
      {placeholder !== undefined && <option value="">{placeholder}</option>}
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  )
}

export function Toggle({ checked, onChange, label, help }: { checked?: boolean | null; onChange: (v: boolean) => void; label: ReactNode; help?: ReactNode }) {
  return (
    <label className="ss-toggle">
      <input type="checkbox" checked={Boolean(checked)} onChange={(e) => onChange(e.target.checked)} />
      <span className="ss-toggle__track" aria-hidden />
      <span className="ss-toggle__text">
        <span>{label}</span>
        {help && <small>{help}</small>}
      </span>
    </label>
  )
}

/** Big clickable cards for single or multiple choice, the core-profiler look. */
export function ChoiceCards({
  options,
  value,
  onChange,
  multiple,
  columns = 1,
}: {
  options: Option[]
  value: string | string[] | null | undefined
  onChange: (v: any) => void
  multiple?: boolean
  columns?: 1 | 2 | 3
}) {
  const selected = new Set(Array.isArray(value) ? value : value ? [value] : [])
  return (
    <div className={`ss-cards ss-cards--${columns}`} role={multiple ? 'group' : 'radiogroup'}>
      {options.map((o) => {
        const on = selected.has(o.value)
        return (
          <button
            key={o.value}
            type="button"
            role={multiple ? 'checkbox' : 'radio'}
            aria-checked={on}
            className={`ss-card${on ? ' is-on' : ''}`}
            onClick={() => {
              if (!multiple) return onChange(o.value)
              const next = new Set(selected)
              if (on) next.delete(o.value)
              else next.add(o.value)
              onChange([...next])
            }}
          >
            <span className={`ss-card__mark${multiple ? ' is-box' : ''}`} aria-hidden />
            <span className="ss-card__body">
              <strong>{o.label}</strong>
              {o.description && <small>{o.description}</small>}
            </span>
          </button>
        )
      })}
    </div>
  )
}

/** Chips for picking many countries without a giant multi-select. */
export function CountryChips({ value, onChange }: { value?: string[] | null; onChange: (v: string[]) => void }) {
  const list = value ?? []
  return (
    <div className="ss-chips">
      {list.map((code) => (
        <span key={code} className="ss-chip">
          {COUNTRIES.find((c) => c.value === code)?.label ?? code}
          <button type="button" aria-label="Remove" onClick={() => onChange(list.filter((c) => c !== code))}>
            ×
          </button>
        </span>
      ))}
      <select
        className="ss-input ss-select ss-chips__add"
        value=""
        onChange={(e) => e.target.value && onChange([...list, e.target.value])}
      >
        <option value="">Add a country…</option>
        {COUNTRIES.filter((c) => !list.includes(c.value)).map((c) => (
          <option key={c.value} value={c.value}>
            {c.label}
          </option>
        ))}
      </select>
    </div>
  )
}

export function ColorInput({ value, onChange }: { value?: string | null; onChange: (v: string) => void }) {
  return (
    <span className="ss-color">
      <input type="color" value={value || '#000000'} onChange={(e) => onChange(e.target.value)} />
      <input className="ss-input" value={value ?? ''} onChange={(e) => onChange(e.target.value)} />
    </span>
  )
}

export function Callout({ tone = 'info', children }: { tone?: 'info' | 'success' | 'warning'; children: ReactNode }) {
  return <div className={`ss-callout ss-callout--${tone}`}>{children}</div>
}

export function Badge({ tone = 'neutral', children }: { tone?: 'neutral' | 'success' | 'warning' | 'danger'; children: ReactNode }) {
  return <span className={`ss-badge ss-badge--${tone}`}>{children}</span>
}

export function Button({
  children,
  onClick,
  kind = 'primary',
  disabled,
  type = 'button',
}: {
  children: ReactNode
  onClick?: () => void
  kind?: 'primary' | 'secondary' | 'ghost' | 'danger'
  disabled?: boolean
  type?: 'button' | 'submit'
}) {
  return (
    <button type={type} className={`ss-btn ss-btn--${kind}`} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  )
}
