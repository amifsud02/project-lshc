'use client'

import { useState, useSyncExternalStore } from 'react'
import styles from './Advertisement.module.css'

export type AdCandidate = {
  id: string
  format: 'banner' | 'rectangle'
  imageUrl: string
  mobileImageUrl?: string
  alt: string
  startDate?: string
  endDate?: string
}

const isRunning = (ad: AdCandidate, now: number) =>
  (!ad.startDate || Date.parse(ad.startDate) <= now) && (!ad.endDate || Date.parse(ad.endDate) > now)

/**
 * Pages are cached, so the ad is picked in the browser: each visit gets one running ad at
 * random. The space is reserved before then so the page doesn't jump.
 */
const subscribeNever = () => () => {}

export default function Advertisement({ format, ads }: { format: AdCandidate['format']; ads: AdCandidate[] }) {
  // The server renders the empty space; the browser picks the ad.
  const inBrowser = useSyncExternalStore(subscribeNever, () => true, () => false)
  const [pick] = useState(() => ({ at: Date.now(), roll: Math.random() }))

  const running = inBrowser ? ads.filter((a) => isRunning(a, pick.at)) : []
  // undefined: not picked yet; null: nothing is running.
  const ad = !inBrowser ? undefined : running.length ? running[Math.floor(pick.roll * running.length)] : null

  if (ad === null) return null

  const formatClass = (ad?.format ?? format) === 'rectangle' ? styles.rectangle : styles.banner

  return (
    <aside className={`parent ${styles.wrapper}`} aria-label="Advertisement">
      <div className={`${styles.slot} ${formatClass}`}>
        <span className={styles.label}>Advertisement</span>
        {ad ? (
          <a
            href={`/api/ads/${ad.id}/click`}
            target="_blank"
            rel="sponsored noopener"
            className={`${styles.link} ${ad.mobileImageUrl ? styles.hasMobile : ''}`}
          >
            <picture>
              {ad.mobileImageUrl ? <source media="(max-width: 640px)" srcSet={ad.mobileImageUrl} /> : null}
              <img src={ad.imageUrl} alt={ad.alt} className={styles.image} loading="lazy" />
            </picture>
          </a>
        ) : (
          <div className={styles.link} aria-hidden="true" />
        )}
      </div>
    </aside>
  )
}
