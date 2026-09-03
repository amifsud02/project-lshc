'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, LogOut, Package, School, UserRound } from 'lucide-react'

const items = [
  { href: '/account', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/account/orders', label: 'Orders', icon: Package },
  { href: '/account/nursery', label: 'Nursery', icon: School },
  { href: '/account/details', label: 'Account details', icon: UserRound },
]

export default function AccountNav() {
  const pathname = usePathname()

  return (
    <nav className="account-nav" aria-label="Account">
      {items.map(({ href, label, icon: Icon, exact }) => {
        const active = exact ? pathname === href : pathname.startsWith(href)
        return (
          <Link
            key={href}
            href={href}
            className={`account-nav__link${active ? ' account-nav__link--active' : ''}`}
            aria-current={active ? 'page' : undefined}
          >
            <Icon aria-hidden="true" />
            {label}
          </Link>
        )
      })}
      <Link href="/logout" prefetch={false} className="account-nav__link account-nav__link--signout">
        <LogOut aria-hidden="true" />
        Sign out
      </Link>
    </nav>
  )
}
