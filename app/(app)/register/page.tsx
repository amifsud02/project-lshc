import { notFound, redirect } from 'next/navigation'
import PageHeader from '@/components/PageHeader/PageHeader'
import AuthForm from '@/components/Auth/AuthForm'
import { getCurrentUser } from '@/lib/auth/server'
import { safeRedirectPath } from '@/lib/auth/session'
import {
  isGoogleSignInConfigured,
  siteGoogleSignInErrorMessages,
  type GoogleSignInError,
} from '@/lib/auth/google'
import '@/components/Shop/shop.css'
import '@/components/Auth/auth.css'
import { ACCOUNTS_ENABLED } from '@/lib/features'

export const metadata = { title: 'Create an account', robots: { index: false, follow: true } }

type SearchParams = Promise<{ redirect?: string; google?: string }>

export default async function RegisterPage({ searchParams }: { searchParams: SearchParams }) {
  if (!ACCOUNTS_ENABLED) notFound()

  const params = await searchParams
  const redirectTo = safeRedirectPath(params.redirect)

  const user = await getCurrentUser()
  if (user) redirect(redirectTo)

  const googleError = params.google
    ? (siteGoogleSignInErrorMessages[params.google as GoogleSignInError] ??
      siteGoogleSignInErrorMessages.server_error)
    : null

  return (
    <>
      <PageHeader pageName="Create account" />
      <section className="parent shop auth">
        <AuthForm
          mode="register"
          redirectTo={redirectTo}
          googleEnabled={isGoogleSignInConfigured()}
          googleError={googleError}
        />
      </section>
    </>
  )
}
