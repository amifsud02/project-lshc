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

/** A run of text inside a paragraph: plain, bold, or a link. */
export type Inline = string | { bold: string } | { link: string; url: string }

const inline = (part: Inline) =>
  typeof part === 'string'
    ? text(part)
    : 'bold' in part
      ? text(part.bold, 1)
      : {
          ...base,
          type: 'link',
          version: 3,
          fields: { linkType: 'custom', url: part.url, newTab: /^https?:/.test(part.url) },
          children: [text(part.link)],
        }

/** A paragraph mixing plain text, bold text and links. */
export const para = (...parts: Inline[]) => ({ ...base, type: 'paragraph', textFormat: 0, children: parts.map(inline) })

/** A bulleted list whose items can mix bold text and links. */
export const list = (items: Inline[][]) => ({
  ...base,
  type: 'list',
  listType: 'bullet',
  start: 1,
  tag: 'ul',
  children: items.map((parts, i) => ({ ...base, type: 'listitem', value: i + 1, children: parts.map(inline) })),
})

type Node = ReturnType<typeof p> | ReturnType<typeof h> | ReturnType<typeof ul> | ReturnType<typeof para> | ReturnType<typeof list>

export const richText = (...children: Node[]): RichTextBlock['content'] => ({
  root: { ...base, type: 'root', children },
})
