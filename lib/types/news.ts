export interface INewsPost {
    _id: string
    title: string
    date: Date
    slug: {
        current: string
    }
    featuredImage: {
        asset: {
            _ref: string
        }
    }
    description: string
    content: any
    tags: string[]
}

export type HardcodedNewsContentBlock =
    | { type: 'p'; text: string }
    | { type: 'h3'; text: string }
    | {
          type: 'image'
          src: string
          alt: string
          width?: number
          height?: number
      }

export interface IHardcodedNewsPost {
    _id: string
    title: string
    date: string // ISO date string
    slug: {
        current: string
    }
    featuredImageUrl: string
    description: string
    content: HardcodedNewsContentBlock[]
    tags: string[]
}