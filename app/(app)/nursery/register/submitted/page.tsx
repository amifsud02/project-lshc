import Link from 'next/link'
import { getPayload } from 'payload'
import config from '@payload-config'
import PageHeader from '@/components/PageHeader/PageHeader'
import { formatFee } from '@/lib/nursery/data'
import type { NurserySeason } from '@/payload-types'
import '@/components/Shop/shop.css'
import '../../nursery.css'

export const metadata = {
  title: 'Registration received | La Salle Handball',
  robots: { index: false },
}

export const dynamic = 'force-dynamic'

/**
 * Reached from both payment paths. Nothing identifying about the child is shown
 * here — the reference is enough to reassure the parent, and the full details go
 * to their inbox rather than to whoever opens the link.
 */
export default async function SubmittedPage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string }>
}) {
  const { ref } = await searchParams
  const payload = await getPayload({ config })

  const { docs } = ref
    ? await payload.find({
        collection: 'nursery-registrations',
        where: { registrationNumber: { equals: ref } },
        limit: 1,
        depth: 1,
      })
    : { docs: [] as any[] }

  const registration = docs[0]

  if (!registration) {
    return (
      <>
        <PageHeader pageName="Registration received" />
        <section className="parent shop">
          <div className="nursery-submitted">
            <p className="nursery__lede">
              We couldn&apos;t find that registration. If you completed the form, check your email
              for the confirmation — otherwise please{' '}
              <Link href="/nursery/register">try again</Link>.
            </p>
          </div>
        </section>
      </>
    )
  }

  const season = (typeof registration.season === 'object' ? registration.season : null) as
    | NurserySeason
    | null
  const awaitingTransfer = registration.status === 'awaiting-transfer'
  const paid = registration.status === 'paid'
  const bank = season?.bankTransfer ?? {}
  const contact = season?.contact ?? {}

  return (
    <>
      <PageHeader pageName="Registration received" />
      <section className="parent shop">
        <div className="nursery-submitted">
          <h2>
            {paid
              ? 'Thank you — the place is confirmed.'
              : awaitingTransfer
                ? 'Thank you — the place is held.'
                : 'Thank you — we’re confirming your payment.'}
          </h2>
          <p className="nursery__lede">
            Your reference is
            <br />
            <span className="nursery-submitted__ref">{registration.registrationNumber}</span>
          </p>

          {awaitingTransfer && (
            <div className="nursery-submitted__bank">
              <h3>Paying by bank transfer</h3>
              <p>
                Please transfer <strong>{formatFee(registration.fee?.priceCents ?? 0)}</strong>{' '}
                quoting <strong>{registration.registrationNumber}</strong> as the reference.
              </p>
              <dl>
                {bank.accountName && (
                  <>
                    <dt>Account</dt>
                    <dd>{bank.accountName}</dd>
                  </>
                )}
                {bank.iban && (
                  <>
                    <dt>IBAN</dt>
                    <dd>{bank.iban}</dd>
                  </>
                )}
                {bank.swift && (
                  <>
                    <dt>BIC / SWIFT</dt>
                    <dd>{bank.swift}</dd>
                  </>
                )}
              </dl>
              {bank.instructions && <p>{bank.instructions}</p>}
            </div>
          )}

          {!paid && !awaitingTransfer && (
            <p>
              Card payments can take a moment to settle. You&apos;ll get a confirmation email as
              soon as it clears.
            </p>
          )}

          <p>
            We&apos;ve emailed the details and the training schedule.
            {contact.email ? (
              <>
                {' '}
                Any questions, write to <a href={`mailto:${contact.email}`}>{contact.email}</a>
                {contact.phone ? ` or call ${contact.phone}` : ''}.
              </>
            ) : null}
          </p>

          <p>
            <Link href="/nursery" className="btn btn--ghost">
              Back to the nursery programme
            </Link>
          </p>
        </div>
      </section>
    </>
  )
}
