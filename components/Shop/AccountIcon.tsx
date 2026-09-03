'use client'

import Link from 'next/link'
import { UserRound } from 'lucide-react'

export default function AccountIcon({ isAuthed }: { isAuthed: boolean }) {
  return (
    <Link
      href={isAuthed ? '/account' : '/login'}
      aria-label={isAuthed ? 'My account' : 'Sign in'}
      title={isAuthed ? 'My account' : 'Sign in'}
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff',
        textDecoration: 'none',
      }}
    >
      <UserRound size={22} strokeWidth={1.8} aria-hidden="true" />
      {isAuthed ? (
        <span
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: -2,
            right: -3,
            width: 8,
            height: 8,
            borderRadius: 999,
            background: '#34d399',
            border: '2px solid #000d24',
          }}
        />
      ) : null}
    </Link>
  )
}
