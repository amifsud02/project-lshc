import { notFound } from 'next/navigation'
import PageHeader from '@/components/PageHeader/PageHeader'
import VerifyMagicLink from './VerifyMagicLink'
import '@/components/Shop/shop.css'
import '@/components/Auth/auth.css'
import { ACCOUNTS_ENABLED } from '@/lib/features'

export const metadata = {
  title: 'Signing you in',
  robots: { index: false, follow: false },
}

type SearchParams = Promise<{ token?: string }>

export default async function VerifyPage({ searchParams }: { searchParams: SearchParams }) {
  if (!ACCOUNTS_ENABLED) notFound()

  const { token } = await searchParams

  return (
    <>
      <PageHeader pageName="Sign in" />
      <section className="parent shop auth">
        <VerifyMagicLink token={typeof token === 'string' ? token : null} />
      </section>
    </>
  )
}
