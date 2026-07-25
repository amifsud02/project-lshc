import type { GlobalAfterChangeHook } from 'payload'
import { revalidateTag } from 'next/cache'

export const revalidateGlobal =
  (tag: string): GlobalAfterChangeHook =>
  ({ doc, req: { payload } }) => {
    payload.logger.info(`Revalidating cache tag: ${tag}`)
    revalidateTag(tag)
    return doc
  }
