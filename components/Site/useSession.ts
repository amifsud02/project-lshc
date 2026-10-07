'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'

export type SiteSession = { authed: boolean; isAdmin: boolean }

const ANONYMOUS: SiteSession = { authed: false, isAdmin: false }
// Pages where signing in or out can happen without a full page load.
const AUTH_PATHS = ['/login', '/register', '/account', '/logout']

/** Loads the visitor's session once the page is up, and again after anything auth related. */
export function useSession(): SiteSession {
  const [session, setSession] = useState<SiteSession>(ANONYMOUS)
  const pathname = usePathname()
  const authRelated = AUTH_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))

  useEffect(() => {
    let cancelled = false
    fetch('/api/me', { cache: 'no-store', credentials: 'same-origin' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data) setSession({ authed: !!data.authed, isAdmin: !!data.isAdmin })
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
    // Refetch when entering or leaving the auth pages, not on every navigation.
  }, [authRelated])

  return session
}
