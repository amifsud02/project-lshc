'use server'

import { headers } from 'next/headers'
import { getPayload } from 'payload'
import config from '@payload-config'
import { getStripe } from '@/lib/stripe/server'
import { sendRegistrationEmail } from '@/lib/email/nurseryRegistration'
import {
  eligibleCategories,
  getActiveSeason,
  getSeasonCategories,
  isRegistrationOpen,
  tiersForCategory,
} from '@/lib/nursery/data'

export type RegistrationInput = {
  categoryId: string
  tierValue: string
  paymentMethod: 'card' | 'bank-transfer'
  parent: {
    firstName: string
    lastName: string
    email: string
    phone: string
    relationshipToChild: string
    idCardNumber: string
  }
  child: {
    firstName: string
    lastName: string
    dateOfBirth: string
    gender: 'boy' | 'girl'
    schoolYear: string
    school: string
    kitSize: string
  }
  emergencyContact: { name: string; phone: string; relationship: string }
  medical: {
    conditions: string
    allergies: string
    medication: string
    consentToTreatment: boolean
  }
  consents: { privacy: boolean; photo: boolean; taxRebate: boolean }
  parentNotes: string
}

export type RegistrationResult =
  | { ok: true; redirectTo: string }
  | { ok: false; error: string }

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const trim = (value: unknown) => String(value ?? '').trim()

/**
 * Every rule the form enforces in the browser is re-checked here: the client is
 * only a convenience, and this is the boundary that actually decides what a
 * parent is charged and which group the child lands in.
 */
export async function submitNurseryRegistration(
  input: RegistrationInput,
): Promise<RegistrationResult> {
  const season = await getActiveSeason()
  if (!season) return { ok: false, error: 'Registration is not open at the moment.' }
  if (!isRegistrationOpen(season)) {
    return { ok: false, error: `Registration for ${season.title} is closed.` }
  }

  const parentEmail = trim(input.parent?.email).toLowerCase()
  if (!EMAIL_PATTERN.test(parentEmail)) {
    return { ok: false, error: 'Please enter a valid email address.' }
  }
  if (!trim(input.parent?.firstName) || !trim(input.parent?.lastName)) {
    return { ok: false, error: 'Please enter the parent or guardian’s full name.' }
  }
  if (!trim(input.parent?.phone)) {
    return { ok: false, error: 'A contact phone number is required.' }
  }
  if (!trim(input.child?.firstName) || !trim(input.child?.lastName)) {
    return { ok: false, error: 'Please enter the child’s full name.' }
  }
  if (!trim(input.child?.schoolYear)) {
    return { ok: false, error: 'Please enter the child’s school year.' }
  }
  if (input.child?.gender !== 'boy' && input.child?.gender !== 'girl') {
    return { ok: false, error: 'Please select the child’s category.' }
  }

  const dob = new Date(input.child?.dateOfBirth ?? '')
  if (Number.isNaN(dob.getTime())) {
    return { ok: false, error: 'Please enter a valid date of birth.' }
  }

  if (!input.consents?.privacy) {
    return { ok: false, error: 'The privacy notice must be accepted to register.' }
  }

  // The child must genuinely be eligible for the group that was picked — the
  // select is populated client-side and nothing stops a crafted request.
  const categories = await getSeasonCategories(String(season.id))
  const category = categories.find((candidate) => String(candidate.id) === input.categoryId)
  if (!category) return { ok: false, error: 'Please choose an age group.' }
  if (!category.acceptingRegistrations) {
    return { ok: false, error: `${category.name} is full. Please contact the Club.` }
  }

  const eligible = eligibleCategories([category], {
    birthYear: dob.getFullYear(),
    gender: input.child.gender,
  })
  if (!eligible.length) {
    return {
      ok: false,
      error: `${category.name} does not match the child’s date of birth. Please choose another group.`,
    }
  }

  const tier = tiersForCategory(season, category).find((candidate) => candidate.value === input.tierValue)
  if (!tier) {
    return { ok: false, error: 'Please choose how many sessions a week your child will attend.' }
  }

  const method = input.paymentMethod
  if (method === 'card' && !season.allowCardPayment) {
    return { ok: false, error: 'Card payment is not available for this season.' }
  }
  if (method === 'bank-transfer' && !season.allowBankTransfer) {
    return { ok: false, error: 'Bank transfer is not available for this season.' }
  }

  const payload = await getPayload({ config })

  // Guard against a parent submitting twice and paying twice.
  const { docs: existing } = await payload.find({
    collection: 'nursery-registrations',
    where: {
      and: [
        { season: { equals: season.id } },
        { 'child.firstName': { equals: trim(input.child.firstName) } },
        { 'child.lastName': { equals: trim(input.child.lastName) } },
        { status: { not_in: ['cancelled', 'refunded'] } },
      ],
    },
    limit: 1,
  })
  if (existing.length) {
    return {
      ok: false,
      error:
        'A registration for this child already exists for this season. Please contact the Club if you need to change it.',
    }
  }

  let currentUserId: string | undefined
  try {
    const reqHeaders = await headers()
    const { user } = await payload.auth({ headers: reqHeaders })
    if (user) currentUserId = String(user.id)
  } catch {
    currentUserId = undefined
  }

  const registration = await payload.create({
    collection: 'nursery-registrations',
    data: {
      status: method === 'card' ? 'pending' : 'awaiting-transfer',
      paymentMethod: method,
      season: season.id,
      category: category.id,
      user: currentUserId,
      parent: {
        firstName: trim(input.parent.firstName),
        lastName: trim(input.parent.lastName),
        email: parentEmail,
        phone: trim(input.parent.phone),
        relationshipToChild: trim(input.parent.relationshipToChild) || undefined,
        idCardNumber: input.consents?.taxRebate ? trim(input.parent.idCardNumber) || undefined : undefined,
      },
      child: {
        firstName: trim(input.child.firstName),
        lastName: trim(input.child.lastName),
        dateOfBirth: dob.toISOString(),
        gender: input.child.gender,
        schoolYear: trim(input.child.schoolYear),
        school: trim(input.child.school) || undefined,
        kitSize: trim(input.child.kitSize) || undefined,
      },
      emergencyContact: {
        name: trim(input.emergencyContact?.name) || undefined,
        phone: trim(input.emergencyContact?.phone) || undefined,
        relationship: trim(input.emergencyContact?.relationship) || undefined,
      },
      medical: {
        conditions: trim(input.medical?.conditions) || undefined,
        allergies: trim(input.medical?.allergies) || undefined,
        medication: trim(input.medical?.medication) || undefined,
        consentToTreatment: Boolean(input.medical?.consentToTreatment),
      },
      fee: {
        tierValue: tier.value,
        tierLabel: tier.label,
        sessionsPerWeek: tier.sessionsPerWeek,
        priceCents: tier.priceCents,
      },
      consents: {
        privacy: Boolean(input.consents?.privacy),
        photo: Boolean(input.consents?.photo),
        taxRebate: Boolean(input.consents?.taxRebate),
      },
      parentNotes: trim(input.parentNotes) || undefined,
    } as any,
  })

  const reference = String(registration.registrationNumber ?? '')
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000'

  if (method === 'bank-transfer') {
    try {
      await sendRegistrationEmail(registration, 'awaiting-transfer')
    } catch (err) {
      console.error('[nursery] failed to send transfer instructions', err)
    }
    return { ok: true, redirectTo: `/nursery/register/submitted?ref=${encodeURIComponent(reference)}` }
  }

  const stripe = getStripe()
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'eur',
          product_data: {
            name: `${category.name} — ${season.title}`,
            description: `${tier.label} · ${trim(input.child.firstName)} ${trim(input.child.lastName)}`,
          },
          unit_amount: tier.priceCents,
        },
        quantity: 1,
      },
    ],
    customer_email: parentEmail,
    metadata: {
      nurseryRegistrationId: String(registration.id),
      registrationNumber: reference,
    },
    success_url: `${appUrl}/nursery/register/submitted?ref=${encodeURIComponent(reference)}`,
    cancel_url: `${appUrl}/nursery/register?cancelled=1`,
  })

  await payload.update({
    collection: 'nursery-registrations',
    id: registration.id,
    data: { stripeCheckoutSessionId: session.id } as any,
  })

  if (!session.url) {
    return { ok: false, error: 'Stripe did not return a checkout URL.' }
  }

  return { ok: true, redirectTo: session.url }
}
