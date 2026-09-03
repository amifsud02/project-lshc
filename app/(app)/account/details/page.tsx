import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth/server'
import DetailsForm from './DetailsForm'

export const metadata = { title: 'Account details | La Salle Handball' }

export default async function AccountDetailsPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login?redirect=/account/details')

  return (
    <>
      <h2 className="account-title">Account details</h2>
      <p className="account-lead">
        Keep your contact details current so we can reach you about orders and nursery sessions.
      </p>
      <DetailsForm
        email={user.email}
        firstName={user.firstName ?? ''}
        lastName={user.lastName ?? ''}
        phone={user.phone ?? ''}
      />
    </>
  )
}
