import type { Block } from 'payload'

export const LatestVideosBlock: Block = {
  slug: 'latestVideos',
  interfaceName: 'LatestVideosBlock',
  labels: { singular: 'Latest videos', plural: 'Latest videos' },
  fields: [
    { name: 'heading', type: 'text', defaultValue: 'Latest on La Salle TV' },
    { name: 'limit', type: 'number', defaultValue: 3, min: 1, max: 6 },
  ],
}
