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