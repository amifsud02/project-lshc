'use client'

import { useEffect, useRef } from 'react'

declare global {
  interface Window {
    adsbygoogle: unknown[]
  }
}

export const AD_CLIENT = 'ca-pub-6327648024245847'

export type AdFormat = 'auto' | 'horizontal' | 'vertical' | 'rectangle' | 'fluid'

type AdSenseProps = {
  adSlot: string
  format?: AdFormat | null
  className?: string
}

// `fluid` is the only format that takes a layout, and it must not be marked
// full-width-responsive. Everything else is a display format.
const layoutFor = (format: AdFormat) => (format === 'fluid' ? 'in-article' : undefined)
const responsiveFor = (format: AdFormat) => (format === 'auto' ? 'true' : 'false')

const AdSense = ({ adSlot, format, className }: AdSenseProps) => {
  const insRef = useRef<HTMLModElement>(null)
  const pushed = useRef(false)

  useEffect(() => {
    const ins = insRef.current
    if (!ins) return

    // adsbygoogle.js binds each queued push to the next unprocessed <ins> and
    // measures it immediately. Pushing before layout gives it a zero-width
    // element, which throws "No slot size for availableWidth=0" and burns the
    // slot for the rest of the page load. Wait for a real width instead.
    const tryPush = () => {
      if (pushed.current) return true
      if (ins.getAttribute('data-ad-status')) return true
      if (ins.getBoundingClientRect().width === 0) return false

      pushed.current = true
      try {
        ;(window.adsbygoogle = window.adsbygoogle || []).push({})
      } catch {
        pushed.current = false
      }
      return pushed.current
    }

    if (tryPush()) return

    const observer = new ResizeObserver(() => {
      if (tryPush()) observer.disconnect()
    })
    observer.observe(ins)
    return () => observer.disconnect()
  }, [])

  const resolved: AdFormat = format ?? 'auto'

  // The adsbygoogle.js loader itself lives in the root layout so that Auto ads
  // also runs on pages without a manual unit.
  return (
    <ins
      ref={insRef}
      className={className ? `adsbygoogle ${className}` : 'adsbygoogle'}
      style={{ display: 'block' }}
      data-ad-client={AD_CLIENT}
      data-ad-slot={adSlot}
      data-ad-format={resolved}
      data-ad-layout={layoutFor(resolved)}
      data-full-width-responsive={responsiveFor(resolved)}
    />
  )
}

export default AdSense
