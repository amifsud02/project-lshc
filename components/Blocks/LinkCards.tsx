import Link from 'next/link'
import styles from './LinkCards.module.css'

type Card = { eyebrow?: string | null; title: string; text?: string | null; url: string }
type Props = { heading?: string | null; intro?: string | null; cards?: Card[] | null }

const isExternal = (url: string) => /^https?:\/\//.test(url)

/** A short intro and a row of cards that each link somewhere, e.g. the youth teams page. */
export default function LinkCards({ heading, intro, cards }: Props) {
  if (!cards?.length) return null
  return (
    <section className={`parent ${styles.section}`}>
      {heading ? <h2 className={styles.heading}>{heading}</h2> : null}
      {intro ? <p className={styles.lead}>{intro}</p> : null}
      <div className={styles.cards}>
        {cards.map((card, i) => {
          const body = (
            <>
              {card.eyebrow ? <span className="eyebrow">{card.eyebrow}</span> : null}
              <h3>{card.title}</h3>
              {card.text ? <p>{card.text}</p> : null}
            </>
          )
          return isExternal(card.url) ? (
            <a key={i} href={card.url} className={`card ${styles.card}`} target="_blank" rel="noopener">
              {body}
            </a>
          ) : (
            <Link key={i} href={card.url} className={`card ${styles.card}`}>
              {body}
            </Link>
          )
        })}
      </div>
    </section>
  )
}
