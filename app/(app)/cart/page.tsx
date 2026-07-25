import PageHeader from '@/components/PageHeader/PageHeader'
import CartView from './CartView'
import '@/components/Shop/shop.css'

export const metadata = { title: 'Cart | La Salle Handball' }

export default function CartPage() {
  return (
    <>
      <PageHeader pageName="Cart" />
      <section className="parent shop">
        <CartView />
      </section>
    </>
  )
}
