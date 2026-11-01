import Image from 'next/image'
import Link from 'next/link'
import { RichText } from '@payloadcms/richtext-lexical/react'
import type { Media } from '@/payload-types'
import './blocks.css'

type Props = {
  eyebrow?: string | null
  heading: string
  body: any
  image?: Media | string | null
  imagePosition?: 'left' | 'right' | null
  linkLabel?: string | null
  linkUrl?: string | null
}

/** A heading and rich text beside a photo; without a photo the text spans the page. */
export default function MediaText({ eyebrow, heading, body, image, imagePosition, linkLabel, linkUrl }: Props) {
  const media = image && typeof image === 'object' && image.url ? image : null
  return (
    <section className={`parent block-media ${media ? '' : 'block-media--solo'} ${imagePosition === 'left' ? 'block-media--left' : ''}`}>
      <div className="block-media__text">
        {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
        <h2 className="block-media__heading">{heading}</h2>
        <div className="prose block-media__body">
          <RichText data={body} />
        </div>
        {linkLabel && linkUrl ? (
          <Link href={linkUrl} className="btn block-media__link">
            {linkLabel}
          </Link>
        ) : null}
      </div>
      {media ? (
        <div className="block-media__image">
          <Image
            src={media.url!}
            alt={media.alt ?? ''}
            fill
            sizes="(min-width: 900px) 45vw, 100vw"
            className="block-media__img"
          />
        </div>
      ) : null}
    </section>
  )
}
