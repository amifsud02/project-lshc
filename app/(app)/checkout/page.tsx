import PageHeader from '@/components/PageHeader/PageHeader'
import { getCurrentUser } from '@/lib/auth/server'
import CheckoutView from './CheckoutView'

export const metadata = { title: 'Checkout | La Salle Handball' }

export default async function CheckoutPage() {
  const user = await getCurrentUser()
  return (
    <>
      <PageHeader pageName="Checkout" />
      <section className="parent">
        <CheckoutView
          defaults={{
            email: user?.email ?? '',
            name: [user?.firstName, user?.lastName].filter(Boolean).join(' ').trim() || '',
            phone: user?.phone ?? '',
          }}
        />
      </section>
    </>
  )
}
