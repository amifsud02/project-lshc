import Link from 'next/link'
import { redirect } from 'next/navigation'
import PageHeader from '@/components/PageHeader/PageHeader'
import { getCurrentUser } from '@/lib/auth/server'
import RegisterForm from './RegisterForm'
import '@/components/Shop/shop.css'

export const metadata = { title: 'Create an account | La Salle Handball' }

export default async function RegisterPage() {
  const user = await getCurrentUser()
  if (user) redirect('/account')

  return (
    <>
      <PageHeader pageName="Create account" />
      <section className="parent shop" style={{ maxWidth: 520 }}>
        <p className="shop__intro">
          Set up an account to keep track of your purchases and club memberships.
        </p>
        <RegisterForm />
        <p style={{ marginTop: 22, fontSize: 13, color: 'var(--shop-muted)' }}>
          Already have an account?{' '}
          <Link href="/login" className="shop-link">
            Sign in
          </Link>
        </p>
      </section>
    </>
  )
}
