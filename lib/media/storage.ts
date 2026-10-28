import { GetObjectCommand, S3Client, type S3ClientConfig } from '@aws-sdk/client-s3'
import { getFileKey } from '@payloadcms/plugin-cloud-storage/utilities'

/**
 * Media files live in a Railway storage bucket under `media/`. Railway buckets are
 * private, so files are served through Payload at /api/media/file/<filename>,
 * which streams them from the bucket.
 *
 * The AWS_* variables are the ones Railway adds when a service is connected to the
 * bucket with the "AWS SDK (Generic)" style.
 */

export const MEDIA_PREFIX = 'media'

export const mediaBucket = process.env.AWS_S3_BUCKET_NAME || ''

export const mediaS3Config: S3ClientConfig = {
  endpoint: process.env.AWS_ENDPOINT_URL,
  region: process.env.AWS_DEFAULT_REGION || 'auto',
  // Buckets created before Railway switched to virtual-hosted URLs need path-style.
  forcePathStyle: process.env.AWS_S3_FORCE_PATH_STYLE === 'true',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
}

let client: S3Client | undefined
export const mediaS3Client = () => (client ??= new S3Client(mediaS3Config))

/** The object key for a Media file — the same key the S3 adapter uploads to. */
export function mediaFileKey(filename: string, prefix?: string | null): string {
  return getFileKey({ collectionPrefix: MEDIA_PREFIX, docPrefix: prefix ?? undefined, filename }).fileKey
}

/** Reads a Media file straight from the bucket, or null if it isn't there. */
export async function readMediaFile(filename: string, prefix?: string | null): Promise<Buffer | null> {
  try {
    const object = await mediaS3Client().send(
      new GetObjectCommand({ Bucket: mediaBucket, Key: mediaFileKey(filename, prefix) }),
    )
    return object.Body ? Buffer.from(await object.Body.transformToByteArray()) : null
  } catch (err) {
    if ((err as { name?: string }).name === 'NoSuchKey') return null
    throw err
  }
}
