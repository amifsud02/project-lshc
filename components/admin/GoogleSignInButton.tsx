import type { ServerProps } from 'payload'

import { GoogleMark } from '@/components/Auth/GoogleMark'

import {
  googleSignInErrorMessages,
  isGoogleSignInConfigured,
  type GoogleSignInError,
} from '@/lib/auth/google'

export const GoogleSignInButton = ({ searchParams }: ServerProps) => {
  if (!isGoogleSignInConfigured()) return null

  const errorCode = typeof searchParams?.google === 'string' ? searchParams.google : undefined
  const errorMessage = errorCode
    ? (googleSignInErrorMessages[errorCode as GoogleSignInError] ??
      googleSignInErrorMessages.server_error)
    : undefined

  return (
    <div style={{ marginBottom: 'var(--base)' }}>
      {errorMessage ? (
        <p
          style={{
            color: 'var(--theme-error-500)',
            fontSize: '0.8rem',
            marginBottom: 'calc(var(--base) / 2)',
          }}
        >
          {errorMessage}
        </p>
      ) : null}

      {/* A route handler, not a page — it must be a full navigation so the 302 to Google is followed. */}
      {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
      <a
        href="/api/oauth/google"
        style={{
          alignItems: 'center',
          background: 'var(--theme-elevation-0)',
          border: '1px solid var(--theme-elevation-150)',
          borderRadius: '4px',
          color: 'var(--theme-elevation-800)',
          display: 'flex',
          fontWeight: 600,
          gap: 'calc(var(--base) / 2)',
          justifyContent: 'center',
          padding: 'calc(var(--base) / 2)',
          textDecoration: 'none',
          width: '100%',
        }}
      >
        <GoogleMark />
        Sign in with Google
      </a>

      <div
        style={{
          alignItems: 'center',
          color: 'var(--theme-elevation-500)',
          display: 'flex',
          fontSize: '0.75rem',
          gap: 'calc(var(--base) / 2)',
          marginTop: 'var(--base)',
        }}
      >
        <span style={{ background: 'var(--theme-elevation-150)', flex: 1, height: '1px' }} />
        or
        <span style={{ background: 'var(--theme-elevation-150)', flex: 1, height: '1px' }} />
      </div>
    </div>
  )
}
