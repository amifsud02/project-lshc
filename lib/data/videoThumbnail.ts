import type { Media, Video } from '@/payload-types'
import { cloudinaryVideoPoster } from '@/lib/media/cloudinaryVideo'

/** The uploaded file's URL when the video is hosted in Media, otherwise null. */
export function uploadedVideoUrl(video: Video): string | null {
  if (video.source !== 'upload') return null
  const file = video.videoFile as Media | string | null | undefined
  return file && typeof file === 'object' && file.url ? file.url : null
}

export function videoThumbnail(video: Video): string {
  const thumb = video.thumbnail as Media | string | null | undefined
  if (thumb && typeof thumb === 'object' && thumb.url) return thumb.url
  const uploaded = uploadedVideoUrl(video)
  if (uploaded) return cloudinaryVideoPoster(uploaded)
  return `https://i.ytimg.com/vi/${video.youtubeId}/hqdefault.jpg`
}
