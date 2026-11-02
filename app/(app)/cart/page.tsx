import PageHeader from '@/components/PageHeader/PageHeader'
import { getStoreRules } from '@/lib/shop/storeRules'
import CartView from './CartView'

export const metadata = { title: 'Cart' }

export default async function CartPage() {
  const rules = await getStoreRules()
  return (
    <>
      <PageHeader pageName="Cart" />
      <section className="parent">
        <CartView rules={rules} />
      </section>
    </>
  )
}
