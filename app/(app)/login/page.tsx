import { redirect } from 'next/navigation'
import PageHeader from '@/components/PageHeader/PageHeader'
import AuthForm from '@/components/Auth/AuthForm'
import { getCurrentUser } from '@/lib/auth/server'
import { safeRedirectPath } from '@/lib/auth/session'
import {
  isGoogleSignInConfigured,
  siteGoogleSignInErrorMessages,
  type GoogleSignInError,
} from '@/lib/auth/google'
import { magicLinkErrorMessages, type MagicLinkError } from '@/lib/auth/magicLinkMessages'
import '@/components/Shop/shop.css'
import '@/components/Auth/auth.css'

export const metadata = { title: 'Sign in | La Salle Handball' }

type SearchParams = Promise<{ redirect?: string; google?: string; link?: string }>

export default async function LoginPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams
  const redirectTo = safeRedirectPath(params.redirect)

  const user = await getCurrentUser()
  if (user) redirect(redirectTo)

  const googleError = params.google
    ? (siteGoogleSignInErrorMessages[params.google as GoogleSignInError] ??
      siteGoogleSignInErrorMessages.server_error)
    : null
  const linkError = params.link ? (magicLinkErrorMessages[params.link as MagicLinkError] ?? null) : null

  return (
    <>
      <PageHeader pageName="Sign in" />
      <section className="parent shop auth">
        <AuthForm
          mode="login"
          redirectTo={redirectTo}
          googleEnabled={isGoogleSignInConfigured()}
          googleError={googleError}
          linkError={linkError}
        />
      </section>
    </>
  )
}
