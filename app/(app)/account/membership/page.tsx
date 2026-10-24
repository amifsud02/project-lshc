import { redirect } from 'next/navigation'

// Benefits are the only membership page in the account for now.
export default function AccountMembershipPage() {
  redirect('/account/membership/benefits')
}
