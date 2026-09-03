import Link from 'next/link'
import { RichText } from '@payloadcms/richtext-lexical/react'
import PageHeader from '@/components/PageHeader/PageHeader'
import { getCurrentUser } from '@/lib/auth/server'
import {
  getActiveSeason,
  getSeasonCategories,
  isRegistrationOpen,
  tiersForCategory,
} from '@/lib/nursery/data'
import { sortSessions } from '@/lib/nursery/schedule'
import RegistrationForm, { type FormSeason } from './RegistrationForm'
import { submitNurseryRegistration } from './actions'
import '@/components/Shop/shop.css'
import '../nursery.css'

export const metadata = {
  title: 'Nursery registration | La Salle Handball',
  description: 'Register your child for the La Salle Handball Club nursery.',
  robots: { index: false },
}

export const dynamic = 'force-dynamic'

export default async function NurseryRegisterPage() {
  const season = await getActiveSeason()

  if (!season || !isRegistrationOpen(season)) {
    return (
      <>
        <PageHeader pageName="Nursery registration" />
        <section className="parent">
          <div className="nursery">
            <p className="nursery__lede">
              Online registration is closed at the moment.{' '}
              <Link href="/nursery">See this season&apos;s programme</Link> or get in touch with the
              Club.
            </p>
          </div>
        </section>
      </>
    )
  }

  const categories = await getSeasonCategories(String(season.id))
  const user = await getCurrentUser()

  // Flattened for the client: relationship documents and rich text stay on the
  // server, and the browser only ever receives what the form needs to render.
  const formSeason: FormSeason = {
    title: season.title,
    allowCardPayment: Boolean(season.allowCardPayment),
    allowBankTransfer: Boolean(season.allowBankTransfer),
    privacyConsentLabel:
      season.privacyConsentLabel ?? 'I accept the privacy notice.',
    photoConsentLabel:
      season.photoConsentLabel ?? 'I consent to photographs of my child being used by the Club.',
    taxRebateEnabled: Boolean(season.taxRebate?.enabled),
    taxRebateConsentLabel:
      season.taxRebate?.consentLabel ??
      'I authorise the Club to process the tax rebate documentation on my behalf.',
    categories: categories.map((category) => ({
      id: String(category.id),
      name: category.name,
      schoolYearsLabel: category.schoolYearsLabel,
      gender: category.gender,
      birthYearFrom: category.birthYearFrom,
      birthYearTo: category.birthYearTo,
      acceptingRegistrations: Boolean(category.acceptingRegistrations),
      sessions: sortSessions(category.sessions ?? []).map((session) => ({
        day: session.day,
        startTime: session.startTime,
        endTime: session.endTime,
        venueName: typeof session.venue === 'object' ? (session.venue?.name ?? '') : '',
        note: session.note ?? undefined,
      })),
      tiers: tiersForCategory(season, category).map((tier) => ({
        value: tier.value,
        label: tier.label,
        sessionsPerWeek: tier.sessionsPerWeek,
        priceCents: tier.priceCents,
      })),
    })),
  }

  return (
    <>
      <PageHeader pageName="Nursery registration" />
      <section className="parent shop">
        <div className="nursery">
          <RegistrationForm
            season={formSeason}
            privacyNotice={season.privacyNotice ? <RichText data={season.privacyNotice} /> : null}
            defaults={{
              email: user?.email ?? '',
              firstName: user?.firstName ?? '',
              lastName: user?.lastName ?? '',
              phone: user?.phone ?? '',
            }}
            submitAction={submitNurseryRegistration}
          />
        </div>
      </section>
    </>
  )
}
