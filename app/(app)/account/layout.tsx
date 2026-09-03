import { redirect } from 'next/navigation'
import PageHeader from '@/components/PageHeader/PageHeader'
import AccountNav from '@/components/Account/AccountNav'
import { getCurrentUser } from '@/lib/auth/server'
import '@/components/Shop/shop.css'
import '@/components/Account/account.css'

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser()
  if (!user) redirect('/login?redirect=/account')

  return (
    <>
      <PageHeader pageName="My account" />
      <section className="parent shop account">
        <div className="account__layout">
          <AccountNav />
          <div className="account-panel">{children}</div>
        </div>
      </section>
    </>
  )
}
