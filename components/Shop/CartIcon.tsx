'use client'

import Link from 'next/link'
import { useSyncExternalStore } from 'react'
import { useCart } from '@/lib/shop/cart'

const emptySubscribe = () => () => {}

export default function CartIcon() {
  const count = useCart((s) => s.itemCount())
  // Render the badge only after hydration so the server/client markup match
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  )

  return (
    <Link
      href="/cart"
      aria-label="Cart"
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff',
        textDecoration: 'none',
        transition: 'transform 0.2s ease',
      }}
    >
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
        <line x1="3" y1="6" x2="21" y2="6" />
        <path d="M16 10a4 4 0 0 1-8 0" />
      </svg>
      {mounted && count > 0 && (
        <span
          style={{
            position: 'absolute',
            top: -6,
            right: -8,
            minWidth: 18,
            height: 18,
            padding: '0 5px',
            background: '#01296f',
            color: '#fff',
            borderRadius: 999,
            fontSize: 10,
            fontWeight: 700,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '2px solid #000d24',
            fontFamily: 'var(--font-manrope), sans-serif',
          }}
        >
          {count}
        </span>
      )}
    </Link>
  )
}
