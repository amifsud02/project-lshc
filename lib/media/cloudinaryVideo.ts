/**
 * Cloudinary serves images from /image/upload/ and videos from /video/upload/.
 * `generateFileURL` in payload.config.ts only receives the filename, so it always
 * builds an image URL; these helpers correct it for video files.
 */

export function isVideoMime(mimeType: unknown): boolean {
  return typeof mimeType === 'string' && mimeType.startsWith('video/')
}

export function toCloudinaryVideoUrl(url: string): string {
  return url.replace('/image/upload/', '/video/upload/')
}
