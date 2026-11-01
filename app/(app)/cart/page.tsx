import PageHeader from '@/components/PageHeader/PageHeader'
import { getGeneralGlobal } from '@/lib/utils/payload/globals'
import CartView from './CartView'

export const metadata = { title: 'Cart' }

export default async function CartPage() {
  const { shop } = await getGeneralGlobal()
  return (
    <>
      <PageHeader pageName="Cart" />
      <section className="parent">
        <CartView shop={shop} />
      </section>
    </>
  )
}
