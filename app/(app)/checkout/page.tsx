import PageHeader from '@/components/PageHeader/PageHeader'
import { getCurrentUser } from '@/lib/auth/server'
import { getGeneralGlobal } from '@/lib/utils/payload/globals'
import { getStoreRules } from '@/lib/shop/storeRules'
import CheckoutView from './CheckoutView'

export const metadata = { title: 'Checkout' }

export default async function CheckoutPage() {
  const [user, { shop }, rules] = await Promise.all([getCurrentUser(), getGeneralGlobal(), getStoreRules()])
  return (
    <>
      <PageHeader pageName="Checkout" />
      <section className="parent">
        <CheckoutView
          shop={shop}
          rules={rules}
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
