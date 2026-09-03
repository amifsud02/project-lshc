import Link from 'next/link'
import { RichText } from '@payloadcms/richtext-lexical/react'
import PageHeader from '@/components/PageHeader/PageHeader'
import { getNurseryLetter, formatFee, formatLongDate, isRegistrationOpen } from '@/lib/nursery/data'
import { dayLabel, formatTimeRange, sortSessions } from '@/lib/nursery/schedule'
import PrintButton from './PrintButton'
import '@/components/Shop/shop.css'
import './nursery.css'

const title = 'La Salle Handball | Nursery'
const description =
  'Training programmes for boys and girls aged 5 to 16 — schedule, fees and online registration for the La Salle Handball Club nursery.'
const baseSiteUrl = process.env.NEXT_PUBLIC_API_URL
const canonical = `${baseSiteUrl}/nursery`

export const metadata = {
  title,
  description,
  alternates: { canonical },
  openGraph: { title, description, url: canonical },
}

export const revalidate = 300

export default async function NurseryPage() {
  const letter = await getNurseryLetter()

  if (!letter) {
    return (
      <>
        <PageHeader pageName="Nursery" />
        <section className="parent">
          <div className="nursery">
            <p className="nursery__lede">
              Next season&apos;s nursery programme has not been published yet. Please check back
              shortly.
            </p>
          </div>
        </section>
      </>
    )
  }

  const { season, categories } = letter
  const open = isRegistrationOpen(season)
  const contact = season.contact ?? {}

  return (
    <>
      <PageHeader pageName={`Nursery ${season.title}`} />
      <section className="parent">
        <article className="nursery">
          {season.introduction && (
            <div className="nursery__prose nursery__lede">
              <RichText data={season.introduction} />
            </div>
          )}

          {open ? (
            <div className="nursery__cta">
              <p className="nursery__cta-copy">
                Registration for {season.title} is open.
                {season.registrationClosesAt
                  ? ` Applications close on ${formatLongDate(season.registrationClosesAt)}.`
                  : ''}
              </p>
              <Link href="/nursery/register" className="shop-btn">
                Register your child
              </Link>
            </div>
          ) : (
            <p className="nursery__closed">
              Online registration for {season.title} is currently closed.
              {contact.email ? ` Contact ${contact.email} to enquire about a place.` : ''}
            </p>
          )}

          {season.attendanceNote && (
            <section className="nursery__section">
              <h2 className="nursery__section-title">Regular attendance matters</h2>
              <div className="nursery__prose">
                <RichText data={season.attendanceNote} />
              </div>
            </section>
          )}

          <section className="nursery__section">
            <h2 className="nursery__section-title">Training schedule</h2>
            {categories.map((category) => (
              <div key={category.id} className="nursery__group">
                <div className="nursery__group-head">
                  <h3 className="nursery__group-name">{category.name}</h3>
                  <span className="nursery__group-years">{category.schoolYearsLabel}</span>
                  {!category.acceptingRegistrations && (
                    <span className="nursery__group-full">Full</span>
                  )}
                </div>
                <table className="nursery__sessions">
                  <tbody>
                    {sortSessions(category.sessions ?? []).map((session, index) => (
                      <tr key={session.id ?? index}>
                        <td>{dayLabel(session.day)}</td>
                        <td>{formatTimeRange(session.startTime, session.endTime)}</td>
                        <td>
                          {typeof session.venue === 'object' ? session.venue?.name : ''}
                          {session.note && (
                            <span className="nursery__session-note">{session.note}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {category.festivalNote && (
                  <p className="nursery__group-note">{category.festivalNote}</p>
                )}
              </div>
            ))}
            {season.festivalNote && (
              <div className="nursery__prose">
                <RichText data={season.festivalNote} />
              </div>
            )}
          </section>

          <section className="nursery__section">
            <h2 className="nursery__section-title">Registration fees (entire season)</h2>
            <div className="nursery__fees">
              {(season.feeTiers ?? []).map((tier) => (
                <div key={tier.value} className="nursery__fee">
                  <div className="nursery__fee-price">{formatFee(tier.priceCents)}</div>
                  <p className="nursery__fee-label">{tier.label}</p>
                </div>
              ))}
            </div>
          </section>

          {season.taxRebate?.enabled && season.taxRebate.copy && (
            <section className="nursery__section">
              <h2 className="nursery__section-title">Tax rebate</h2>
              <div className="nursery__prose">
                <RichText data={season.taxRebate.copy} />
              </div>
            </section>
          )}

          {season.trainingAttire && (
            <section className="nursery__section">
              <h2 className="nursery__section-title">Training attire</h2>
              <div className="nursery__prose">
                <RichText data={season.trainingAttire} />
              </div>
              {categories.some((category) => category.kitNote) && (
                <ul className="nursery__prose">
                  {categories
                    .filter((category) => category.kitNote)
                    .map((category) => (
                      <li key={category.id}>
                        <strong>{category.name}:</strong> {category.kitNote}
                      </li>
                    ))}
                </ul>
              )}
            </section>
          )}

          {season.firstTrainingDate && (
            <p className="nursery__prose">
              <strong>
                The first training sessions will commence during the week beginning{' '}
                {formatLongDate(season.firstTrainingDate)}.
              </strong>
            </p>
          )}

          {season.closingNote && (
            <div className="nursery__prose">
              <RichText data={season.closingNote} />
            </div>
          )}

          <footer className="nursery__contact">
            {(contact.name || contact.phone || contact.email) && (
              <p>
                For any further information, contact {contact.name ?? 'the Club'}
                {contact.phone ? ` on ${contact.phone}` : ''}
                {contact.email ? (
                  <>
                    {' '}
                    or by email at <a href={`mailto:${contact.email}`}>{contact.email}</a>
                  </>
                ) : null}
                .
              </p>
            )}
            <div className="nursery__print">
              <PrintButton />
            </div>
          </footer>
        </article>
      </section>
    </>
  )
}
