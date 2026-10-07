import { headers } from 'next/headers'
import { getPayload } from 'payload'
import config from '@payload-config'
import { isAdmin } from '@/lib/auth/roles'

export type CurrentUser = {
  id: string
  email: string
  firstName?: string
  lastName?: string
  phone?: string
  isAdmin: boolean
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  try {
    const payload = await getPayload({ config })
    const reqHeaders = await headers()
    const { user } = await payload.auth({ headers: reqHeaders })
    if (!user) return null
    return {
      id: String(user.id),
      email: user.email,
      firstName: (user as any).firstName ?? undefined,
      lastName: (user as any).lastName ?? undefined,
      phone: (user as any).phone ?? undefined,
      isAdmin: isAdmin(user),
    }
  } catch {
    return null
  }
}
