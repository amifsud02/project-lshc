import type { RichTextBlock } from '@/payload-types'

/**
 * Tiny builders for Lexical rich-text JSON, so seed content can be written as
 * plain strings instead of hand-rolled editor state.
 */

const text = (value: string, format = 0) => ({
  type: 'text',
  text: value,
  format,
  detail: 0,
  mode: 'normal',
  style: '',
  version: 1,
})

const base = { format: '' as const, indent: 0, version: 1, direction: 'ltr' as const }

export const p = (value: string) => ({ ...base, type: 'paragraph', textFormat: 0, children: [text(value)] })

export const h = (tag: 'h2' | 'h3', value: string) => ({ ...base, type: 'heading', tag, children: [text(value)] })

export const ul = (items: string[]) => ({
  ...base,
  type: 'list',
  listType: 'bullet',
  start: 1,
  tag: 'ul',
  children: items.map((item, i) => ({ ...base, type: 'listitem', value: i + 1, children: [text(item)] })),
})

type Node = ReturnType<typeof p> | ReturnType<typeof h> | ReturnType<typeof ul>

export const richText = (...children: Node[]): RichTextBlock['content'] => ({
  root: { ...base, type: 'root', children },
})
