import Link from 'next/link'
import { redirect } from 'next/navigation'
import PageHeader from '@/components/PageHeader/PageHeader'
import { getCurrentUser } from '@/lib/auth/server'
import LoginForm from './LoginForm'
import '@/components/Shop/shop.css'

export const metadata = { title: 'Sign in | La Salle Handball' }

type SearchParams = Promise<{ redirect?: string }>

export default async function LoginPage({ searchParams }: { searchParams: SearchParams }) {
  const { redirect: redirectTo } = await searchParams
  const user = await getCurrentUser()
  if (user) redirect(redirectTo || '/account')

  return (
    <>
      <PageHeader pageName="Sign in" />
      <section className="parent shop" style={{ maxWidth: 520 }}>
        <p className="shop__intro">Access your orders and update your club details.</p>
        <LoginForm redirectTo={redirectTo ?? '/account'} />
        <p style={{ marginTop: 22, fontSize: 13, color: 'var(--shop-muted)' }}>
          New here?{' '}
          <Link href="/register" className="shop-link">
            Create an account
          </Link>
        </p>
      </section>
    </>
  )
}
