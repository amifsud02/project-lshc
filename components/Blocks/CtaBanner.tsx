import Link from 'next/link'
import './blocks.css'

type LinkField = { label?: string | null; url?: string | null } | null | undefined
type Props = { heading: string; body?: string | null; primary?: LinkField; secondary?: LinkField; tone?: 'navy' | 'light' | null }

const isExternal = (url: string) => /^https?:\/\//.test(url)

function Button({ link, className }: { link: LinkField; className: string }) {
  if (!link?.label || !link.url) return null
  return isExternal(link.url) ? (
    <a href={link.url} className={className} target="_blank" rel="noopener">
      {link.label}
    </a>
  ) : (
    <Link href={link.url} className={className}>
      {link.label}
    </Link>
  )
}

/** A closing call to action with up to two buttons. */
export default function CtaBanner({ heading, body, primary, secondary, tone }: Props) {
  if (!heading) return null
  const navy = tone !== 'light'
  return (
    <section className="parent block-cta-wrap">
      <div className={`block-cta ${navy ? 'block-cta--navy' : 'block-cta--light'}`}>
        <div className="block-cta__text">
          <h2 className="block-cta__heading">{heading}</h2>
          {body ? <p className="block-cta__body">{body}</p> : null}
        </div>
        <div className="block-cta__actions">
          <Button link={primary} className={navy ? 'btn btn--light' : 'btn'} />
          <Button link={secondary} className={navy ? 'btn btn--ghost block-cta__ghost' : 'btn btn--ghost'} />
        </div>
      </div>
    </section>
  )
}
