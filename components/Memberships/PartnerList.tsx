import { Lock, MapPin, Phone } from 'lucide-react'
import CopyCode from '@/components/Memberships/CopyCode'
import { Card, CardContent } from '@/components/ui/card'
import type { MembrsDiscount, MembrsPartner } from '@/lib/membrs/client'
import { formatPrice } from '@/lib/shop/types'
import { cn } from '@/lib/utils'

/** "15% off" or "€5 off"; nothing when the offer text says it all (e.g. vouchers). */
const valueLabel = (d: MembrsDiscount) => {
  if (d.value <= 0) return null
  return d.kind === 'percent' ? `${d.value / 100}% off` : `${formatPrice(d.value)} off`
}

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter((w) => /^[A-Za-z0-9]/.test(w))
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('')

/**
 * The club's partner merchants and their offers. Codes only show for `members`; otherwise an
 * offer with a code says it's for members.
 */
export default function PartnerList({
  partners,
  members = false,
  columns = 3,
}: {
  partners: MembrsPartner[]
  members?: boolean
  /** At full width; 2 suits a narrower column such as the account pages. */
  columns?: 2 | 3
}) {
  return (
    <ul className={cn('grid grid-cols-1 gap-4 sm:grid-cols-2', columns === 3 && 'lg:grid-cols-3')}>
      {partners.map((partner) => {
        const best = partner.discounts.find((d) => valueLabel(d))
        const places = [...new Set(partner.outlets.map((o) => o.name))]
        return (
          <li key={partner.id}>
            <Card className="h-full">
              <CardContent className="flex h-full flex-col gap-4">
                <div className="flex items-start gap-3">
                  {partner.logo_url ? (
                    // Logos are hosted by MEMBRS, wherever its storage lives.
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={partner.logo_url}
                      alt=""
                      loading="lazy"
                      className="size-12 shrink-0 rounded-xl border bg-white object-contain p-1"
                    />
                  ) : (
                    <span
                      aria-hidden
                      className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-sm font-bold text-primary"
                    >
                      {initials(partner.name)}
                    </span>
                  )}
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <h3 className="text-base leading-snug font-semibold text-foreground">{partner.name}</h3>
                    {places.length > 0 && (
                      <p className="flex items-start gap-1 text-sm text-muted-foreground">
                        <MapPin className="mt-0.5 size-3.5 shrink-0" />
                        {places.join(' · ')}
                      </p>
                    )}
                  </div>
                  {best && (
                    <span className="shrink-0 rounded-full bg-primary px-2.5 py-1 text-xs font-semibold text-primary-foreground">
                      {valueLabel(best)}
                    </span>
                  )}
                </div>

                {partner.description && (
                  <p className="line-clamp-3 text-sm text-muted-foreground">{partner.description}</p>
                )}

                <ul className="flex flex-col gap-3">
                  {partner.discounts.map((d) => (
                    <li key={d.id} className="flex flex-col items-start gap-1.5">
                      <span className="text-sm font-medium text-foreground">{d.name}</span>
                      {d.scope && d.scope !== 'All outlets' && (
                        <span className="text-xs text-muted-foreground">At {d.scope}</span>
                      )}
                      {members && d.code ? (
                        <CopyCode code={d.code} />
                      ) : d.hasCode ? (
                        <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Lock className="size-3.5" />
                          Members get a code for this offer
                        </span>
                      ) : null}
                    </li>
                  ))}
                </ul>

                {partner.phone && (
                  <a
                    href={`tel:${partner.phone.replace(/\s+/g, '')}`}
                    className="mt-auto inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
                  >
                    <Phone className="size-3.5" />
                    {partner.phone}
                  </a>
                )}
              </CardContent>
            </Card>
          </li>
        )
      })}
    </ul>
  )
}
