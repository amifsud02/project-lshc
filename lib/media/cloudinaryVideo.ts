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

/** A JPEG frame taken `atSeconds` into the video, for use as a poster or thumbnail. */
export function cloudinaryVideoPoster(videoUrl: string, atSeconds = 2): string {
  return toCloudinaryVideoUrl(videoUrl)
    .replace('/video/upload/', `/video/upload/so_${atSeconds},w_1280,c_limit/`)
    .replace(/\.[a-z0-9]+(\?.*)?$/i, '.jpg')
}
