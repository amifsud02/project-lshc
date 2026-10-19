import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { watermarkPhoto } from '@/lib/media/watermark'

/**
 * Serves a gallery photo as a download with the club logo stamped on it.
 * The photos shown on the site stay clean; this is what the lightbox's Download button links to.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const payload = await getPayload({ config })

  const media = await payload
    .findByID({ collection: 'media', id, depth: 0, overrideAccess: false })
    .catch(() => null)
  // Only ever fetch from our own Cloudinary account.
  if (!media?.url || !media.mimeType?.startsWith('image/') || !media.url.startsWith('https://res.cloudinary.com/')) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const res = await fetch(media.url)
  if (!res.ok) return NextResponse.json({ error: 'Image unavailable' }, { status: 502 })

  const original = Buffer.from(await res.arrayBuffer())
  const base = (media.filename ?? `photo-${id}`).replace(/\.[^.]+$/, '').replace(/[^\w.-]+/g, '-')

  try {
    const out = await watermarkPhoto(original)
    return new NextResponse(new Uint8Array(out), {
      headers: {
        'Content-Type': 'image/jpeg',
        'Content-Disposition': `attachment; filename="${base}-lshc.jpg"`,
        'Cache-Control': 'public, max-age=86400, s-maxage=604800',
      },
    })
  } catch (err) {
    // A photo the watermarker can't process still downloads, just without the logo.
    console.error(`Gallery download: watermarking ${id} failed, serving the original`, err)
    const ext = media.filename?.match(/\.[^.]+$/)?.[0] ?? ''
    return new NextResponse(new Uint8Array(original), {
      headers: {
        'Content-Type': media.mimeType,
        'Content-Disposition': `attachment; filename="${base}-lshc${ext}"`,
        // Short cache so a fixed watermarker takes over quickly.
        'Cache-Control': 'public, max-age=300',
      },
    })
  }
}
