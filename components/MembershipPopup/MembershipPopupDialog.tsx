'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ArrowRight, Check, Lock, X } from 'lucide-react'
import type { MembershipPopupSettings } from '@/lib/utils/normalize/globals'
import { trackEvent } from '@/lib/analytics/gtag'
import styles from './MembershipPopup.module.css'

type Props = Omit<MembershipPopupSettings, 'enabled'> & {
  membershipCount: number
  fromPrice?: string
}

const STORAGE_KEY = 'lshc:membership-popup:closed-at'
const DAY = 24 * 60 * 60 * 1000
const PROMOTION = { promotion_id: 'membership-popup', promotion_name: 'Membership popup' }

// Visitors already buying, or signing in, are not interrupted, nor is the page the button opens.
const QUIET_PATHS = ['/shop', '/cart', '/checkout', '/account', '/login', '/logout', '/register']

const isQuietPath = (path: string, ctaLink: string) =>
  path === ctaLink || QUIET_PATHS.some((p) => path === p || path.startsWith(`${p}/`))

const readClosedAt = (): number | null => {
  try {
    const value = Number(window.localStorage.getItem(STORAGE_KEY))
    return value > 0 ? value : null
  } catch {
    return null
  }
}

const rememberClosed = () => {
  try {
    window.localStorage.setItem(STORAGE_KEY, String(Date.now()))
  } catch {
    // Storage blocked: the popup may open again on the next visit, which is acceptable.
  }
}

export default function MembershipPopupDialog({
  badge,
  heading,
  body,
  benefits,
  imageUrl,
  ctaLabel,
  ctaLink,
  partnerNote,
  delaySeconds,
  snoozeDays,
  membershipCount,
  fromPrice,
}: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const pathname = usePathname()

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog || dialog.open || isQuietPath(pathname, ctaLink)) return

    const closedAt = readClosedAt()
    if (closedAt && Date.now() - closedAt < snoozeDays * DAY) return

    const timer = window.setTimeout(() => {
      if (dialog.open || isQuietPath(window.location.pathname, ctaLink)) return
      dialog.showModal()
      trackEvent('view_promotion', PROMOTION)
    }, delaySeconds * 1000)
    return () => window.clearTimeout(timer)
  }, [pathname, ctaLink, delaySeconds, snoozeDays])

  // Escape, the close buttons and the backdrop all end up here.
  const onClose = () => rememberClosed()

  const close = () => dialogRef.current?.close()

  const onBackdropClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    if (e.target === e.currentTarget) close()
  }

  const onCta = () => {
    trackEvent('select_promotion', PROMOTION)
    close()
  }

  const summary =
    membershipCount > 1
      ? `${membershipCount} memberships to choose from`
      : membershipCount === 1
        ? 'One membership for the whole season'
        : null

  return (
    <dialog
      ref={dialogRef}
      className={styles.dialog}
      aria-labelledby="membership-popup-title"
      onClose={onClose}
      onClick={onBackdropClick}
    >
      <div className={styles.panel}>
        <div
          className={styles.media}
          style={imageUrl ? { backgroundImage: `url("${imageUrl}")` } : undefined}
          aria-hidden="true"
        >
          <div className={styles.card}>
            <div className={styles.cardTop}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/lshc.png" alt="" width={44} height={44} />
              <span>Member</span>
            </div>
            <div>
              <div className={styles.cardName}>La Salle Handball</div>
              <div className={styles.cardFoot}>
                <span>Digital card</span>
                <span className={styles.cardPartner}>
                  <span className={styles.cardDot} />
                  Rypple
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.content}>
          <button type="button" className={styles.close} onClick={close} aria-label="Close">
            <X size={20} aria-hidden="true" />
          </button>

          <div className={styles.intro}>
            {badge ? <span className={styles.badge}>{badge}</span> : null}
            <h2 id="membership-popup-title" className={styles.heading}>
              {heading}
            </h2>
            {body ? <p className={styles.body}>{body}</p> : null}
          </div>

          {benefits.length ? (
            <ul className={styles.benefits}>
              {benefits.map((benefit) => (
                <li key={benefit}>
                  <Check size={18} strokeWidth={2.4} aria-hidden="true" />
                  {benefit}
                </li>
              ))}
            </ul>
          ) : null}

          {summary || fromPrice ? (
            <div className={styles.summary}>
              {summary ? <span className={styles.summaryTitle}>{summary}</span> : <span />}
              {fromPrice ? (
                <span className={styles.price}>
                  <span>from</span>
                  <strong>{fromPrice}</strong>
                </span>
              ) : null}
            </div>
          ) : null}

          <div className={styles.footer}>
            <div className={styles.actions}>
              <Link href={ctaLink} className={`btn ${styles.cta}`} onClick={onCta}>
                {ctaLabel}
                <ArrowRight size={18} aria-hidden="true" />
              </Link>
              <button type="button" className={styles.later} onClick={close}>
                Maybe later
              </button>
            </div>
            {partnerNote ? (
              <p className={styles.note}>
                <Lock size={14} aria-hidden="true" />
                {partnerNote}
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </dialog>
  )
}
