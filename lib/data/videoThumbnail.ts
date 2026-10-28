import type { Media, Video } from '@/payload-types'
import { getGeneralGlobal } from '@/lib/utils/payload/globals'

/** The uploaded file's URL when the video is hosted in Media, otherwise null. */
export function uploadedVideoUrl(video: Video): string | null {
  if (video.source !== 'upload') return null
  const file = video.videoFile as Media | string | null | undefined
  return file && typeof file === 'object' && file.url ? file.url : null
}

/**
 * The chosen thumbnail, else YouTube's own. Uploaded videos without a thumbnail
 * get null: there is no service to generate a frame from the video.
 */
export function videoThumbnail(video: Video): string | null {
  const thumb = video.thumbnail as Media | string | null | undefined
  if (thumb && typeof thumb === 'object' && thumb.url) return thumb.url
  if (uploadedVideoUrl(video)) return null
  return `https://i.ytimg.com/vi/${video.youtubeId}/hqdefault.jpg`
}

/** `videoThumbnail`, falling back to the Fallback Image in Site Settings. */
export async function videoImage(video: Video): Promise<string> {
  return videoThumbnail(video) || (await getGeneralGlobal()).fallbackImageUrl || ''
}
