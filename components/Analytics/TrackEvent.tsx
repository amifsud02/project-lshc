'use client'

import { useEffect } from 'react'
import { trackEvent, trackEventOnce } from '@/lib/analytics/gtag'

type Props = {
  name: string
  params?: Record<string, unknown>
  /** Send at most once per browser tab for this key, e.g. a transaction id. */
  onceKey?: string
}

/** Sends a GA4 event when a server-rendered page is shown, e.g. `view_item` on a product page. */
export default function TrackEvent({ name, params, onceKey }: Props) {
  const serialized = JSON.stringify(params ?? {})
  useEffect(() => {
    const p = JSON.parse(serialized)
    if (onceKey) trackEventOnce(onceKey, name, p)
    else trackEvent(name, p)
  }, [name, serialized, onceKey])
  return null
}
