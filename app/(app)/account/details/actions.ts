'use server'

import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { getPayload } from 'payload'
import config from '@payload-config'

export type ActionState = { ok: boolean; message: string } | null

const clean = (value: FormDataEntryValue | null, max = 80): string =>
  typeof value === 'string' ? value.trim().slice(0, max) : ''

async function currentUser() {
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: await headers() })
  return { payload, user }
}

export async function updateDetails(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { payload, user } = await currentUser()
  if (!user) return { ok: false, message: 'Your session has expired. Please sign in again.' }

  const firstName = clean(formData.get('firstName'))
  const lastName = clean(formData.get('lastName'))
  const phone = clean(formData.get('phone'), 40)

  try {
    await payload.update({
      collection: 'users',
      data: { firstName, lastName, phone },
      id: user.id,
      overrideAccess: true,
    })
  } catch (err) {
    console.error('[account] could not update details', err)
    return { ok: false, message: 'We could not save your changes. Please try again.' }
  }

  revalidatePath('/account')
  revalidatePath('/account/details')
  return { ok: true, message: 'Your details have been saved.' }
}

export async function changePassword(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { payload, user } = await currentUser()
  if (!user) return { ok: false, message: 'Your session has expired. Please sign in again.' }

  const current = clean(formData.get('currentPassword'), 200)
  const next = clean(formData.get('newPassword'), 200)
  const confirm = clean(formData.get('confirmPassword'), 200)

  if (!current || !next || !confirm) return { ok: false, message: 'Fill in all three password fields.' }
  if (next.length < 8) return { ok: false, message: 'Your new password needs at least 8 characters.' }
  if (next !== confirm) return { ok: false, message: 'The new passwords do not match.' }

  try {
    // Prove the current password before changing anything. This goes through
    // the normal login path, so repeated wrong guesses lock the account.
    await payload.login({
      collection: 'users',
      data: { email: user.email, password: current },
      overrideAccess: true,
    })
  } catch {
    return { ok: false, message: 'Your current password is not correct.' }
  }

  try {
    await payload.update({
      collection: 'users',
      data: { password: next },
      id: user.id,
      overrideAccess: true,
    })
  } catch (err) {
    console.error('[account] could not change password', err)
    return { ok: false, message: 'We could not change your password. Please try again.' }
  }

  return { ok: true, message: 'Your password has been changed.' }
}
