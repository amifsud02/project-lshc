'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ArrowRight, Check, X } from 'lucide-react'
import { trackEvent } from '@/lib/analytics/gtag'
import styles from './PromoPopup.module.css'

export type Promotion = {
  id: string
  name: string
  startDate?: string
  endDate?: string
  badge?: string
  heading: string
  body?: string
  points: string[]
  highlight?: { label?: string; value?: string; valueCaption?: string }
  imageUrl?: string
  ctaLabel: string
  ctaLink: string
  footnote?: string
  showOn: 'all' | 'only' | 'except'
  paths: string[]
  delaySeconds: number
  snoozeDays: number
}

const DAY = 24 * 60 * 60 * 1000
const storageKey = (id: string) => `lshc:promotion:${id}:closed-at`

// Visitors in the middle of buying or signing in are never interrupted.
const QUIET_PATHS = ['/cart', '/checkout', '/account', '/login', '/logout', '/register']

const trimSlash = (path: string) => (path.length > 1 ? path.replace(/\/+$/, '') : path)

/** "/news" matches only /news; "/news/*" matches every page under /news. */
const matchesPath = (path: string, pattern: string) => {
  const p = trimSlash(pattern.trim())
  if (p.endsWith('/*')) {
    const base = p.slice(0, -2)
    return path === base || path.startsWith(`${base}/`)
  }
  return path === p
}

const isRunning = (promo: Promotion, now: number) =>
  (!promo.startDate || Date.parse(promo.startDate) <= now) && (!promo.endDate || Date.parse(promo.endDate) > now)

const isTargeted = (promo: Promotion, path: string) => {
  if (path === trimSlash(promo.ctaLink)) return false
  if (QUIET_PATHS.some((p) => path === p || path.startsWith(`${p}/`))) return false
  if (promo.showOn === 'all') return true
  const listed = promo.paths.some((pattern) => matchesPath(path, pattern))
  return promo.showOn === 'only' ? listed : !listed
}

const isSnoozed = (promo: Promotion, now: number) => {
  try {
    const closedAt = Number(window.localStorage.getItem(storageKey(promo.id)))
    return closedAt > 0 && now - closedAt < promo.snoozeDays * DAY
  } catch {
    return false
  }
}

const rememberClosed = (promo: Promotion) => {
  try {
    window.localStorage.setItem(storageKey(promo.id), String(Date.now()))
  } catch {
    // Storage blocked: the popup may open again on the next visit, which is acceptable.
  }
}

const gaPromotion = (promo: Promotion) => ({ promotion_id: promo.id, promotion_name: promo.name })

export default function PromoPopupDialog({ promotions }: { promotions: Promotion[] }) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const pathname = usePathname()
  const [promo, setPromo] = useState<Promotion | null>(null)

  useEffect(() => {
    if (dialogRef.current?.open) return
    const path = trimSlash(pathname)
    const now = Date.now()
    const next = promotions.find((p) => isRunning(p, now) && isTargeted(p, path) && !isSnoozed(p, now))
    if (!next) return

    const timer = window.setTimeout(() => {
      const dialog = dialogRef.current
      if (!dialog || dialog.open || trimSlash(window.location.pathname) !== path) return
      setPromo(next)
    }, next.delaySeconds * 1000)
    return () => window.clearTimeout(timer)
  }, [pathname, promotions])

  // Opened once the chosen promotion has rendered, so focus lands inside it.
  useEffect(() => {
    const dialog = dialogRef.current
    if (!promo || !dialog || dialog.open) return
    dialog.showModal()
    trackEvent('view_promotion', gaPromotion(promo))
  }, [promo])

  // Escape, the close buttons, the backdrop and the main button all end up here.
  const onClose = () => {
    if (promo) rememberClosed(promo)
  }

  const close = () => dialogRef.current?.close()

  const onBackdropClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    if (e.target === e.currentTarget) close()
  }

  const onCta = () => {
    if (promo) trackEvent('select_promotion', gaPromotion(promo))
    close()
  }

  const external = promo ? /^https?:\/\//.test(promo.ctaLink) : false

  return (
    <dialog
      ref={dialogRef}
      className={`${styles.dialog} ${promo?.imageUrl ? '' : styles.textOnly}`}
      aria-labelledby="promo-popup-title"
      onClose={onClose}
      onClick={onBackdropClick}
    >
      {promo ? (
        <div className={styles.panel}>
          {promo.imageUrl ? (
            <div className={styles.media} style={{ backgroundImage: `url("${promo.imageUrl}")` }} aria-hidden="true" />
          ) : null}

          <div className={styles.content}>
            <button type="button" className={styles.close} onClick={close} aria-label="Close">
              <X size={20} aria-hidden="true" />
            </button>

            <div className={styles.intro}>
              {promo.badge ? <span className={styles.badge}>{promo.badge}</span> : null}
              <h2 id="promo-popup-title" className={styles.heading}>
                {promo.heading}
              </h2>
              {promo.body ? <p className={styles.body}>{promo.body}</p> : null}
            </div>

            {promo.points.length ? (
              <ul className={styles.points}>
                {promo.points.map((point) => (
                  <li key={point}>
                    <Check size={18} strokeWidth={2.4} aria-hidden="true" />
                    {point}
                  </li>
                ))}
              </ul>
            ) : null}

            {promo.highlight ? (
              <div className={styles.highlight}>
                <span className={styles.highlightLabel}>{promo.highlight.label}</span>
                {promo.highlight.value ? (
                  <span className={styles.value}>
                    {promo.highlight.valueCaption ? <span>{promo.highlight.valueCaption}</span> : null}
                    <strong>{promo.highlight.value}</strong>
                  </span>
                ) : null}
              </div>
            ) : null}

            <div className={styles.footer}>
              <div className={styles.actions}>
                {external ? (
                  <a href={promo.ctaLink} target="_blank" rel="noopener" className={`btn ${styles.cta}`} onClick={onCta}>
                    {promo.ctaLabel}
                    <ArrowRight size={18} aria-hidden="true" />
                  </a>
                ) : (
                  <Link href={promo.ctaLink} className={`btn ${styles.cta}`} onClick={onCta}>
                    {promo.ctaLabel}
                    <ArrowRight size={18} aria-hidden="true" />
                  </Link>
                )}
                <button type="button" className={styles.later} onClick={close}>
                  Maybe later
                </button>
              </div>
              {promo.footnote ? <p className={styles.note}>{promo.footnote}</p> : null}
            </div>
          </div>
        </div>
      ) : null}
    </dialog>
  )
}
