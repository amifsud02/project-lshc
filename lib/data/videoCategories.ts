export const VIDEO_CATEGORIES = [
  { value: 'highlights', label: 'Highlights' },
  { value: 'full-matches', label: 'Full matches' },
  { value: 'interviews', label: 'Interviews' },
  { value: 'press-conferences', label: 'Press conferences' },
  { value: 'behind-the-scenes', label: 'Behind the scenes' },
  { value: 'training', label: 'Training' },
  { value: 'goals', label: 'Goals & saves' },
  { value: 'club', label: 'Club' },
  { value: 'classics', label: 'Classic matches' },
] as const

export type VideoCategory = (typeof VIDEO_CATEGORIES)[number]['value']

export function videoCategoryLabel(value: string | null | undefined): string {
  return VIDEO_CATEGORIES.find((c) => c.value === value)?.label ?? ''
}

export function isVideoCategory(value: unknown): value is VideoCategory {
  return VIDEO_CATEGORIES.some((c) => c.value === value)
}
