import PageHeader from '@/components/PageHeader/PageHeader'
import { getCurrentUser } from '@/lib/auth/server'
import { getGeneralGlobal } from '@/lib/utils/payload/globals'
import CheckoutView from './CheckoutView'

export const metadata = { title: 'Checkout' }

export default async function CheckoutPage() {
  const [user, { shop }] = await Promise.all([getCurrentUser(), getGeneralGlobal()])
  return (
    <>
      <PageHeader pageName="Checkout" />
      <section className="parent">
        <CheckoutView
          shop={shop}
          defaults={{
            email: user?.email ?? '',
            firstName: user?.firstName ?? '',
            lastName: user?.lastName ?? '',
            phone: user?.phone ?? '',
          }}
        />
      </section>
    </>
  )
}
