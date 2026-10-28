import { HeadObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3'
import { getPayload } from 'payload'

import config from '../payload.config'
import { mediaBucket as bucket, mediaFileKey, mediaS3Client } from '../lib/media/storage'

/**
 * Copies every Media file from Cloudinary into the Railway bucket, at the same key the
 * S3 adapter uses for new uploads (media/<filename>), so no documents need changing.
 *
 * The old Cloudinary adapter stored each file under the public ID
 * `media/<filename without extension>`. Requesting that ID without an extension
 * returns the original, untransformed file.
 *
 * Safe to re-run: files already in the bucket are skipped.
 *
 *   pnpm migrate-media-to-bucket           copy everything
 *   pnpm migrate-media-to-bucket dry-run   only report what would be copied
 *
 * `payload run` drops --flags before the script sees them, hence a bare word.
 */

const DRY_RUN = process.argv.includes('dry-run')
const CONCURRENCY = 4

const cloudName = process.env.CLOUDINARY_NAME
if (!cloudName) throw new Error('CLOUDINARY_NAME is not set')

if (!bucket) throw new Error('AWS_S3_BUCKET_NAME is not set')

const s3 = mediaS3Client()

const cloudinaryUrl = (filename: string, mimeType?: string | null) => {
  const resourceType = mimeType?.startsWith('video/') ? 'video' : 'image'
  const publicId = `media/${filename.replace(/\.[^/.]+$/, '')}`
  return `https://res.cloudinary.com/${cloudName}/${resourceType}/upload/${publicId.split('/').map(encodeURIComponent).join('/')}`
}

const existsInBucket = async (key: string) => {
  try {
    await s3.send(new HeadObjectCommand({ Bucket: bucket, Key: key }))
    return true
  } catch (err) {
    if ((err as { name?: string }).name === 'NotFound') return false
    throw err
  }
}

const payload = await getPayload({ config })

const { docs } = await payload.find({
  collection: 'media',
  depth: 0,
  limit: 0,
  pagination: false,
  overrideAccess: true,
})

payload.logger.info(`${docs.length} media documents${DRY_RUN ? ' (dry run)' : ''}`)

let copied = 0
let skipped = 0
const failed: string[] = []

const migrate = async (doc: (typeof docs)[number]) => {
  if (!doc.filename) {
    failed.push(`${doc.id}: no filename`)
    return
  }
  const key = mediaFileKey(doc.filename, doc.prefix)

  if (await existsInBucket(key)) {
    skipped++
    return
  }

  const source = cloudinaryUrl(doc.filename, doc.mimeType)
  const res = await fetch(source)
  if (!res.ok) {
    failed.push(`${doc.id} ${doc.filename}: Cloudinary returned ${res.status} for ${source}`)
    return
  }

  if (DRY_RUN) {
    payload.logger.info(`would copy ${source} -> ${key}`)
    copied++
    return
  }

  const body = Buffer.from(await res.arrayBuffer())
  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: doc.mimeType || res.headers.get('content-type') || undefined,
    }),
  )
  copied++
  payload.logger.info(`copied ${key} (${(body.length / 1024).toFixed(0)} KB)`)
}

for (let i = 0; i < docs.length; i += CONCURRENCY) {
  await Promise.all(
    docs.slice(i, i + CONCURRENCY).map((doc) =>
      migrate(doc).catch((err) => {
        failed.push(`${doc.id} ${doc.filename}: ${err instanceof Error ? err.message : String(err)}`)
      }),
    ),
  )
}

payload.logger.info(`${DRY_RUN ? 'Would copy' : 'Copied'} ${copied}, already in bucket ${skipped}, failed ${failed.length}`)
for (const line of failed) payload.logger.warn(line)

process.exit(failed.length ? 1 : 0)
