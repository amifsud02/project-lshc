import { NextResponse, type NextRequest } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

/**
 * Counts a click on an advertisement and sends the visitor on to the advertiser. The count is
 * bumped straight in the database so a click doesn't run the save hooks (which would refresh
 * the cached site on every click).
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const payload = await getPayload({ config })

  let link: string | undefined
  try {
    const ad = await payload.findByID({ collection: 'advertisements', id, depth: 0 })
    link = typeof ad.link === 'string' ? ad.link : undefined
  } catch {
    link = undefined
  }

  if (!link) return NextResponse.redirect(new URL('/', request.url))

  try {
    await payload.db.collections.advertisements.updateOne({ _id: id }, { $inc: { clicks: 1 } })
  } catch (err) {
    payload.logger.error({ err, id }, 'Could not count an ad click')
  }

  return NextResponse.redirect(link, { headers: { 'Cache-Control': 'no-store' } })
}
