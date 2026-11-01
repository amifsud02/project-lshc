'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

/** Sidebar link to the email test page (/admin/emails), under the collections. */
export function EmailsNavLink() {
  const active = usePathname()?.startsWith('/admin/emails')
  return (
    <div style={{ marginTop: 16 }}>
      <Link href="/admin/emails" className={`nav__link${active ? ' active' : ''}`} style={{ fontWeight: active ? 600 : undefined }}>
        <span className="nav__link-label">Email templates</span>
      </Link>
    </div>
  )
}
