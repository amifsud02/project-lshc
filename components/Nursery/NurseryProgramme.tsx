import Link from 'next/link'
import { RichText } from '@payloadcms/richtext-lexical/react'
import JsonLd from '@/components/Seo/JsonLd'
import { getNurseryLetter, formatFee, formatLongDate, isRegistrationOpen } from '@/lib/nursery/data'
import { dayLabel, formatTimeRange, sortSessions } from '@/lib/nursery/schedule'
import { academyJsonLd } from '@/lib/seo/structuredData'
import type { NurseryCategory, Venue } from '@/payload-types'
import PrintButton from './PrintButton'
import '@/components/Shop/shop.css'
import './nursery.css'

type Props = {
  /** The academy's name in search results and AI answers. */
  academyName?: string | null
  /** Path of the page the block sits on, for structured data. */
  pagePath?: string
}

/** Each venue the season trains at, once, in schedule order. */
const seasonVenues = (categories: NurseryCategory[]): Venue[] => {
  const byId = new Map<string, Venue>()
  for (const category of categories) {
    for (const session of category.sessions ?? []) {
      if (typeof session.venue === 'object' && !byId.has(session.venue.id)) {
        byId.set(session.venue.id, session.venue)
      }
    }
  }
  return [...byId.values()]
}

/**
 * The active season's letter to parents: registration, schedule, venues, fees and kit,
 * all from the Nursery collections. Rendered by the "Academy programme" page block.
 */
export default async function NurseryProgramme({ academyName, pagePath }: Props) {
  const letter = await getNurseryLetter()
  const name = academyName || 'La Salle Handball Academy'

  if (!letter) {
    return (
      <section className="parent shop nursery-programme">
        <div className="nursery">
          <p className="nursery__lede">
            Next season&apos;s academy programme has not been published yet. Please check back
            shortly.
          </p>
        </div>
      </section>
    )
  }

  const { season, categories } = letter
  const open = isRegistrationOpen(season)
  const contact = season.contact ?? {}
  const venues = seasonVenues(categories)

  return (
    <section className="parent shop nursery-programme">
      <JsonLd
        data={academyJsonLd({
          path: pagePath,
          name,
          description: `Handball training in Malta for boys and girls, run by La Salle Handball Club. ${season.title} season schedule, fees and online registration.`,
          venues,
        })}
      />
      <article className="nursery">
        <h2 className="section-title">{season.title} season</h2>

        {season.introduction && (
          <div className="prose nursery__lede">
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
            <Link href="/academy/register" className="btn">
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
            <h2 className="section-title">Regular attendance matters</h2>
            <div className="prose">
              <RichText data={season.attendanceNote} />
            </div>
          </section>
        )}

        <section className="nursery__section">
          <h2 className="section-title">Training schedule</h2>
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
            <div className="prose">
              <RichText data={season.festivalNote} />
            </div>
          )}
        </section>

        {venues.length > 0 && (
          <section className="nursery__section">
            <h2 className="section-title">Where we train</h2>
            <ul className="nursery__venues">
              {venues.map((venue) => (
                <li key={venue.id} className="nursery__venue">
                  <h3 className="nursery__venue-name">
                    {venue.name}
                    {venue.locality ? <span>, {venue.locality}</span> : null}
                  </h3>
                  {venue.address && <p className="nursery__venue-address">{venue.address}</p>}
                  {venue.notes && <p className="nursery__venue-notes">{venue.notes}</p>}
                  {venue.mapUrl && (
                    <a href={venue.mapUrl} className="nursery__venue-map" target="_blank" rel="noopener noreferrer">
                      Open in Maps
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="nursery__section">
          <h2 className="section-title">Registration fees (entire season)</h2>
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
            <h2 className="section-title">Tax rebate</h2>
            <div className="prose">
              <RichText data={season.taxRebate.copy} />
            </div>
          </section>
        )}

        {season.trainingAttire && (
          <section className="nursery__section">
            <h2 className="section-title">Training attire</h2>
            <div className="prose">
              <RichText data={season.trainingAttire} />
            </div>
            {categories.some((category) => category.kitNote) && (
              <ul className="prose">
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
          <p className="prose">
            <strong>
              The first training sessions will commence during the week beginning{' '}
              {formatLongDate(season.firstTrainingDate)}.
            </strong>
          </p>
        )}

        {season.closingNote && (
          <div className="prose">
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
  )
}
