'use client'

import { useRef } from 'react'
import { trackEvent } from '@/lib/analytics/gtag'

type Props = React.VideoHTMLAttributes<HTMLVideoElement> & { title: string }

const MILESTONES = [25, 50, 75]

/**
 * A <video> that reports the same events as GA4's YouTube tracking (video_start,
 * video_progress, video_complete), so uploaded clips show up next to YouTube ones.
 */
export default function TrackedVideo({ title, ...props }: Props) {
  const sent = useRef(new Set<string>())

  const send = (key: string, name: string, video: HTMLVideoElement, extra: Record<string, unknown> = {}) => {
    if (sent.current.has(key)) return
    sent.current.add(key)
    trackEvent(name, {
      video_provider: 'self-hosted',
      video_title: title,
      video_url: video.currentSrc,
      video_duration: Math.round(video.duration || 0),
      video_current_time: Math.round(video.currentTime),
      ...extra,
    })
  }

  return (
    <video
      {...props}
      onPlay={(e) => send('start', 'video_start', e.currentTarget)}
      onTimeUpdate={(e) => {
        const v = e.currentTarget
        if (!v.duration) return
        const percent = (v.currentTime / v.duration) * 100
        for (const m of MILESTONES) {
          if (percent >= m) send(`p${m}`, 'video_progress', v, { video_percent: m })
        }
      }}
      onEnded={(e) => send('complete', 'video_complete', e.currentTarget, { video_percent: 100 })}
    />
  )
}
