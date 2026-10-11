import type { Block, Field, SanitizedConfig } from 'payload'

const closures = new Map<string, string[]>()

/** Collections a field can pull documents from when a query populates it. */
function collectRelations(fields: Field[], config: SanitizedConfig, into: Set<string>) {
  const blockBySlug = (slug: string) => config.blocks?.find((b) => b.slug === slug)
  const add = (to: string | string[] | undefined) => {
    for (const slug of Array.isArray(to) ? to : to ? [to] : []) into.add(slug)
  }

  for (const field of fields) {
    if (field.type === 'relationship' || field.type === 'upload') add(field.relationTo)
    if (field.type === 'join') add(field.collection)
    // Rich text populates embedded uploads; other links are left to the 60 second expiry.
    if (field.type === 'richText') {
      for (const c of config.collections) if (c.upload) into.add(c.slug)
    }
    if ('fields' in field && Array.isArray(field.fields)) collectRelations(field.fields, config, into)
    if (field.type === 'tabs') {
      for (const tab of field.tabs) collectRelations(tab.fields, config, into)
    }
    if (field.type === 'blocks') {
      const blocks: (Block | string)[] = [...(field.blocks ?? []), ...(field.blockReferences ?? [])]
      for (const block of blocks) {
        const resolved = typeof block === 'string' ? blockBySlug(block) : block
        if (resolved) collectRelations(resolved.fields, config, into)
      }
    }
  }
}

/**
 * Every collection whose documents can end up in the result of a query on `collection`: the
 * collection itself plus everything reachable through its relationship, upload and join fields.
 * A change to any of them has to refresh that query.
 */
export function contentDependencies(config: SanitizedConfig, collection: string): string[] {
  const cached = closures.get(collection)
  if (cached) return cached

  const seen = new Set<string>([collection])
  const queue = [collection]
  while (queue.length > 0) {
    const slug = queue.shift()
    const current = config.collections.find((c) => c.slug === slug)
    if (!current) continue
    const direct = new Set<string>()
    collectRelations(current.fields, config, direct)
    for (const related of direct) {
      if (seen.has(related)) continue
      seen.add(related)
      queue.push(related)
    }
  }

  const result = [...seen]
  closures.set(collection, result)
  return result
}
