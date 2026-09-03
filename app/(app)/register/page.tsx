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
import '@/components/Shop/shop.css'
import '@/components/Auth/auth.css'

export const metadata = { title: 'Create an account | La Salle Handball' }

type SearchParams = Promise<{ redirect?: string; google?: string }>

export default async function RegisterPage({ searchParams }: { searchParams: SearchParams }) {
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
