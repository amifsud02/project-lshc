import { cachedFind } from '@/lib/utils/payload/cached'
import PromoPopupDialog, { type Promotion } from './PromoPopupDialog'

const mediaUrl = (m: any): string | undefined => (m && typeof m === 'object' ? (m.url ?? undefined) : undefined)

const toPromotion = (doc: any): Promotion => ({
  id: String(doc.id),
  name: doc.name ?? '',
  startDate: doc.startDate ?? undefined,
  endDate: doc.endDate ?? undefined,
  badge: doc.badge || undefined,
  heading: doc.heading ?? '',
  body: doc.body || undefined,
  points: (doc.points ?? []).map((p: any) => p?.text).filter(Boolean),
  highlight:
    doc.highlight?.label || doc.highlight?.value
      ? {
          label: doc.highlight.label || undefined,
          value: doc.highlight.value || undefined,
          valueCaption: doc.highlight.valueCaption || undefined,
        }
      : undefined,
  imageUrl: mediaUrl(doc.image),
  ctaLabel: doc.ctaLabel ?? '',
  ctaLink: doc.ctaLink ?? '/',
  footnote: doc.footnote || undefined,
  showOn: doc.showOn === 'only' || doc.showOn === 'except' ? doc.showOn : 'all',
  paths: (doc.paths ?? []).map((p: any) => p?.path).filter(Boolean),
  delaySeconds: Math.min(120, Math.max(0, Number(doc.delaySeconds ?? 6) || 0)),
  snoozeDays: Math.min(365, Math.max(1, Number(doc.snoozeDays ?? 14) || 14)),
})

/**
 * The site-wide promotion popup (Marketing › Promotions in the admin). Every active promotion
 * is sent to the browser, highest priority first; the browser picks the first one whose dates
 * are running, that targets the current page and that the visitor hasn't closed recently, so
 * cached pages still start and stop promotions on time.
 */
export default async function PromoPopup() {
  const { docs } = await cachedFind({
    collection: 'promotions',
    where: { active: { equals: true } },
    depth: 1,
    limit: 20,
    sort: '-priority',
  })
  if (!docs.length) return null
  return <PromoPopupDialog promotions={docs.map(toPromotion)} />
}
