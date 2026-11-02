'use client'

import { useConfig } from '@payloadcms/ui'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

/** Sidebar link to the setup hub. */
export function SetupNavLink() {
  const {
    config: {
      routes: { admin },
    },
  } = useConfig()
  const href = `${admin}/store-setup`
  const active = usePathname()?.startsWith(href)
  return (
    <div style={{ marginTop: 16 }}>
      <Link href={href} className={`nav__link${active ? ' active' : ''}`} style={{ fontWeight: active ? 600 : undefined }}>
        <span className="nav__link-label">Store setup</span>
      </Link>
    </div>
  )
}
