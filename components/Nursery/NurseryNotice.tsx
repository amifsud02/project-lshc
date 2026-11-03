import Link from 'next/link'
import type { AcademyNotice } from '@/lib/nursery/notices'

type Props = {
  notice: AcademyNotice
  /** Replaces the notice's own text, e.g. a season's "registration closed" message. */
  text?: string | null
}

const isExternal = (url: string) => /^https?:\/\//.test(url)

/**
 * A club-navy panel for the academy's in-between states (no programme yet, registration closed).
 * Its wording and buttons are edited in Site Settings → Academy.
 */
export default function NurseryNotice({ notice, text }: Props) {
  const body = text || notice.text
  return (
    <div className="nursery-notice">
      {notice.tag ? <p className="nursery-notice__tag">{notice.tag}</p> : null}
      <h2 className="nursery-notice__title">{notice.title}</h2>
      {body ? (
        <div className="nursery-notice__body">
          <p>{body}</p>
        </div>
      ) : null}
      {notice.buttons.length ? (
        <div className="nursery-notice__actions">
          {notice.buttons.map((button) => {
            const className = `btn ${button.style === 'outline' ? 'btn--ghost' : 'btn--light'}`
            return isExternal(button.url) ? (
              <a key={button.url} href={button.url} className={className} target="_blank" rel="noopener">
                {button.label}
              </a>
            ) : (
              <Link key={button.url} href={button.url} className={className}>
                {button.label}
              </Link>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}
