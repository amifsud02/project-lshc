import type { ReactNode } from 'react'
import { CircleCheck, Clock, Mail } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { formatPrice } from '@/lib/shop/types'

export type ReceiptLine = {
  title: string
  quantity: number
  lineTotal: number
  isChild?: boolean
  fields?: [string, string][]
}

type Props = {
  orderNumber: string
  email: string
  statusLabel: string
  paid: boolean
  dateLabel?: string
  lines: ReceiptLine[]
  subtotal?: number
  total: number
  currency?: string
  actions?: ReactNode
  details?: [string, string][]
}

export default function OrderReceipt({
  orderNumber,
  email,
  statusLabel,
  paid,
  dateLabel,
  lines,
  subtotal,
  total,
  currency,
  actions,
  details,
}: Props) {
  const Icon = paid ? CircleCheck : Clock
  return (
    <Card>
      <CardContent className="flex flex-col gap-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <span
              className={`flex size-10 shrink-0 items-center justify-center rounded-full ${
                paid ? 'bg-emerald-600/10 text-emerald-700' : 'bg-amber-500/15 text-amber-700'
              }`}
            >
              <Icon className="size-5" />
            </span>
            <div className="flex flex-col gap-0.5">
              <p className="text-lg font-semibold tabular-nums">Order № {orderNumber}</p>
              <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Mail className="size-3.5" />
                Receipt sent to <strong className="text-foreground">{email}</strong>
              </p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <Badge variant="secondary" className="rounded-full px-3 py-0.5">
              {statusLabel}
            </Badge>
            {dateLabel && <span className="text-xs text-muted-foreground">{dateLabel}</span>}
          </div>
        </div>

        <Separator />

        <ul className="flex flex-col divide-y">
          {lines.map((line, i) => (
            <li
              key={i}
              className={`flex justify-between gap-4 py-3 first:pt-0 ${line.isChild ? 'pl-6' : ''}`}
            >
              <div className="flex flex-col gap-1">
                <span
                  className={`text-sm ${line.isChild ? 'text-muted-foreground' : 'font-medium'}`}
                >
                  {line.isChild ? '↳ ' : ''}
                  {line.title}{' '}
                  <span className="font-normal text-muted-foreground">× {line.quantity}</span>
                </span>
                {line.fields && line.fields.length > 0 && (
                  <ul className="text-xs text-muted-foreground">
                    {line.fields.map(([key, value]) => (
                      <li key={key}>
                        {key}: {value}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <span className="text-sm font-medium tabular-nums">
                {line.lineTotal > 0 ? formatPrice(line.lineTotal, currency) : ''}
              </span>
            </li>
          ))}
        </ul>

        <Separator />

        <dl className="flex flex-col gap-2 text-sm">
          {subtotal !== undefined && subtotal !== total && (
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Subtotal</dt>
              <dd className="font-medium tabular-nums">{formatPrice(subtotal, currency)}</dd>
            </div>
          )}
          <div className="flex justify-between text-base font-semibold">
            <dt>Total</dt>
            <dd className="tabular-nums">{formatPrice(total, currency)}</dd>
          </div>
        </dl>

        {details && details.length > 0 && (
          <>
            <Separator />
            <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-3">
              {details.map(([label, value]) => (
                <div key={label} className="flex flex-col gap-0.5">
                  <dt className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    {label}
                  </dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
          </>
        )}

        {actions && <div className="flex flex-wrap gap-3">{actions}</div>}
      </CardContent>
    </Card>
  )
}
