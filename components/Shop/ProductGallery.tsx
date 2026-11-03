'use client'

import Image from 'next/image'
import { useState } from 'react'
import { cn } from '@/lib/utils'

/** The main product photo, with thumbnails to switch between the product's other photos. */
export default function ProductGallery({ images, title }: { images: string[]; title: string }) {
  const [current, setCurrent] = useState(0)
  const main = images[current]
  return (
    <div className="flex flex-col gap-3">
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
        {main ? (
          <Image src={main} alt={title} fill priority sizes="(min-width: 1024px) 58vw, 100vw" className="object-cover" />
        ) : (
          <div className="flex size-full items-center justify-center bg-gradient-to-br from-primary to-foreground text-6xl font-extrabold tracking-wide text-primary-foreground/80">
            LS
          </div>
        )}
      </div>
      {images.length > 1 && (
        <div className="flex flex-wrap gap-2" role="group" aria-label="Product photos">
          {images.map((src, i) => (
            <button
              key={src}
              type="button"
              aria-label={`Photo ${i + 1} of ${images.length}`}
              aria-pressed={i === current}
              onClick={() => setCurrent(i)}
              className={cn(
                'relative size-20 cursor-pointer overflow-hidden border-2 bg-muted transition-colors',
                i === current ? 'border-primary' : 'border-transparent hover:border-primary/40',
              )}
            >
              <Image src={src} alt="" fill sizes="80px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
