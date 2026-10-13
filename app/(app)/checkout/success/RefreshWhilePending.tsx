'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

/** Payment confirmation arrives by webhook, so re-render every few seconds until it has. */
export default function RefreshWhilePending({ intervalMs = 3000 }: { intervalMs?: number }) {
  const router = useRouter()
  useEffect(() => {
    const id = setInterval(() => router.refresh(), intervalMs)
    return () => clearInterval(id)
  }, [router, intervalMs])
  return null
}
