import { HeadObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3'
import { getPayload } from 'payload'
import sharp from 'sharp'

import config from '../payload.config'
import { mediaBucket as bucket, mediaFileKey, mediaS3Client, readMediaFile } from '../lib/media/storage'

/**
 * Re-encodes Media images uploaded before Media.ts converted uploads to WebP, with the
 * same settings: WebP at quality 80, at most 2560px on the longest side.
 *
 * Each converted image is written to the bucket as <name>.webp and its document is
 * pointed at it. The original object is left in the bucket, so a document can be
 * pointed back at it if anything looks wrong. Images that wouldn't get smaller are
 * left alone.
 *
 * Run it only once the bucket-backed code is deployed: the Cloudinary build can't
 * serve the new filenames.
 *
 * Safe to re-run: documents already pointing at a WebP no larger than 2560px are skipped.
 *
 *   pnpm convert-media-to-webp           convert everything
 *   pnpm convert-media-to-webp dry-run   convert in memory and report sizes, write nothing
 *
 * `payload run` drops --flags before the script sees them, hence a bare word.
 */

const DRY_RUN = process.argv.includes('dry-run')
const CONCURRENCY = 4
const MAX_SIDE = 2560

const CONVERTIBLE = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/tiff', 'image/avif']
const ANIMATABLE = ['image/gif', 'image/webp', 'image/avif']

if (!bucket) throw new Error('AWS_S3_BUCKET_NAME is not set')

const s3 = mediaS3Client()
const payload = await getPayload({ config })

const { docs } = await payload.find({
  collection: 'media',
  depth: 0,
  limit: 0,
  pagination: false,
  overrideAccess: true,
})

const takenNames = new Set(docs.map((doc) => doc.filename).filter((name): name is string => Boolean(name)))

const existsInBucket = async (key: string) => {
  try {
    await s3.send(new HeadObjectCommand({ Bucket: bucket, Key: key }))
    return true
  } catch (err) {
    if ((err as { name?: string }).name === 'NotFound') return false
    throw err
  }
}

/** photo.jpg → photo.webp, or photo-1.webp if another document or object already has that name. */
const webpName = async (filename: string, prefix?: string | null) => {
  const base = filename.replace(/\.[^/.]+$/, '')
  for (let n = 0; ; n++) {
    const candidate = `${base}${n ? `-${n}` : ''}.webp`
    if (!takenNames.has(candidate) && !(await existsInBucket(mediaFileKey(candidate, prefix)))) {
      takenNames.add(candidate)
      return candidate
    }
  }
}

let converted = 0
let skipped = 0
let before = 0
let after = 0
const failed: string[] = []

const convert = async (doc: (typeof docs)[number]) => {
  const { filename, mimeType } = doc
  if (!filename || !mimeType || !CONVERTIBLE.includes(mimeType)) {
    skipped++
    return
  }
  if (mimeType === 'image/webp' && Math.max(doc.width ?? Infinity, doc.height ?? Infinity) <= MAX_SIDE) {
    skipped++
    return
  }

  const original = await readMediaFile(filename, doc.prefix)
  if (!original) {
    failed.push(`${doc.id} ${filename}: not in the bucket`)
    return
  }

  const output = await sharp(original, { animated: ANIMATABLE.includes(mimeType) })
    .rotate()
    .resize({ width: MAX_SIDE, height: MAX_SIDE, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 80 })
    .toBuffer({ resolveWithObject: true })
  const pages = (await sharp(original, { animated: true }).metadata()).pages ?? 1

  if (output.data.length >= original.length) {
    skipped++
    return
  }

  before += original.length
  after += output.data.length
  converted++

  const kb = (bytes: number) => `${(bytes / 1024).toFixed(0)} KB`
  if (DRY_RUN) {
    payload.logger.info(`would convert ${filename}: ${kb(original.length)} -> ${kb(output.data.length)}`)
    return
  }

  const newName = await webpName(filename, doc.prefix)
  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: mediaFileKey(newName, doc.prefix),
      Body: output.data,
      ContentType: 'image/webp',
    }),
  )
  // Straight to the database: going through payload.update would run the upload hooks again.
  await payload.db.updateOne({
    collection: 'media',
    id: doc.id,
    data: {
      filename: newName,
      mimeType: 'image/webp',
      filesize: output.data.length,
      width: output.info.width,
      height: Math.round(output.info.height / pages),
      url: `/api/media/file/${encodeURIComponent(newName)}`,
    },
  })
  payload.logger.info(`converted ${filename} -> ${newName}: ${kb(original.length)} -> ${kb(output.data.length)}`)
}

for (let i = 0; i < docs.length; i += CONCURRENCY) {
  await Promise.all(
    docs.slice(i, i + CONCURRENCY).map((doc) =>
      convert(doc).catch((err) => {
        failed.push(`${doc.id} ${doc.filename}: ${err instanceof Error ? err.message : String(err)}`)
      }),
    ),
  )
}

const mb = (bytes: number) => `${(bytes / 1024 / 1024).toFixed(1)} MB`
payload.logger.info(
  `${DRY_RUN ? 'Would convert' : 'Converted'} ${converted} (${mb(before)} -> ${mb(after)}), skipped ${skipped}, failed ${failed.length}`,
)
for (const line of failed) payload.logger.warn(line)

process.exit(failed.length ? 1 : 0)
