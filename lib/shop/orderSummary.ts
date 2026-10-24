import type { CustomFieldDef } from './types'

/** An order line as saved (see the Orders collection). */
export type OrderLine = {
  productTitle?: string | null
  product?: unknown
  bundleParentLineId?: string | null
  membershipSeason?: string | null
  quantity?: number | null
  unitPrice?: number | null
  customFieldValues?: unknown
}

/** What the order's products ask, by product ID, for labelling answers. */
export type ProductQuestions = Record<string, { title?: string; customFields: CustomFieldDef[] }>

export type Answer = { label: string; value: string }

export type SummaryLine = {
  title: string
  answers: Answer[]
  quantity: number
  lineTotal: number
  /** Comes with the line above it, e.g. a bundle's contents. */
  included: boolean
}

export type SummaryMember = {
  name: string
  email?: string
  mobile?: string
  answers: Answer[]
  /** What this member gets with the membership, e.g. their T-shirt. */
  items: SummaryLine[]
}

export type OrderSummary = {
  membership?: { title: string; season: string; price: number; members: SummaryMember[] }
  /** Everything that isn't part of a membership. */
  lines: SummaryLine[]
}

export const idOf = (value: unknown): string | undefined => {
  if (value == null) return undefined
  if (typeof value === 'object') return idOf((value as { id?: unknown }).id)
  return String(value)
}

const valuesOf = (input: unknown): Record<string, string> => {
  let values = input
  if (typeof values === 'string') {
    try {
      values = JSON.parse(values)
    } catch {
      return {}
    }
  }
  if (!values || typeof values !== 'object') return {}
  return Object.fromEntries(
    Object.entries(values as Record<string, unknown>)
      .filter(([, v]) => v != null && String(v).trim() !== '')
      .map(([k, v]) => [k, String(v)]),
  )
}

/** "pickupLocation" → "Pickup location", for answers whose question no longer exists. */
const humanize = (key: string) => {
  const words = key.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/[_-]+/g, ' ').toLowerCase()
  return words.charAt(0).toUpperCase() + words.slice(1)
}

/**
 * Answers labelled with the question asked (without its "(e.g. …)" hint), and select answers
 * with the option's label.
 */
const answersFor = (values: Record<string, string>, fields: CustomFieldDef[] = []): Answer[] =>
  Object.entries(values).map(([key, value]) => {
    const field = fields.find((f) => f.name === key)
    // Pickers for products included with a MEMBRS plan aren't one of our products' questions.
    const label = field?.label ?? (/^membrsProduct\d+$/.test(key) ? 'MEMBRS item' : humanize(key))
    return {
      label: label.replace(/\s*\(e\.g\.[^)]*\)$/, ''),
      value: field?.options?.find((o) => o.value === value)?.label ?? value,
    }
  })

/**
 * Turns an order's lines into what was bought, and for a membership, who each member is and
 * what they get. `questions` labels the answers; without it they're labelled from their keys.
 */
export function summarizeOrder(items: OrderLine[], questions: ProductQuestions = {}): OrderSummary {
  const fieldsFor = (line: OrderLine) => questions[idOf(line.product) ?? '']?.customFields
  const toLine = (line: OrderLine): SummaryLine => {
    const quantity = line.quantity ?? 1
    return {
      title: line.productTitle ?? '',
      answers: answersFor(valuesOf(line.customFieldValues), fieldsFor(line)),
      quantity,
      lineTotal: (line.unitPrice ?? 0) * quantity,
      included: Boolean(line.bundleParentLineId),
    }
  }

  const memberLines = items.filter((line) => line.membershipSeason)
  if (memberLines.length === 0) return { lines: items.map(toLine) }

  const members: SummaryMember[] = memberLines.map((line, i) => {
    const { firstName = '', lastName = '', email, mobile, ...rest } = valuesOf(line.customFieldValues)
    return {
      name: `${firstName} ${lastName}`.trim() || `Member ${i + 1}`,
      email,
      mobile,
      answers: answersFor(rest, fieldsFor(line)),
      items: [],
    }
  })
  // A membership is bought on its own: its member lines, then what comes with it, one set per
  // member in member order (see buyMembership).
  const extras = items.filter((line) => !line.membershipSeason && line.bundleParentLineId === 'membership')
  extras.forEach((line, j) => members[j % members.length].items.push(toLine(line)))

  const first = memberLines[0]
  return {
    membership: {
      title: questions[idOf(first.product) ?? '']?.title ?? (first.productTitle ?? '').replace(/ — member \d+$/, ''),
      season: first.membershipSeason ?? '',
      price: memberLines.reduce((sum, line) => sum + (line.unitPrice ?? 0) * (line.quantity ?? 1), 0),
      members,
    },
    lines: items.filter((line) => !line.membershipSeason && !extras.includes(line)).map(toLine),
  }
}

/** One line for the orders list, e.g. "Couple Membership 2026/2027 · 2 members" or "Club T-Shirt + 2 more". */
export function orderItemsLabel(items: OrderLine[]): string {
  const { membership, lines } = summarizeOrder(items)
  const bought = lines.filter((line) => !line.included).map((line) => line.title)
  if (membership) {
    const count = membership.members.length
    bought.unshift(`${membership.title} · ${count} ${count === 1 ? 'member' : 'members'}`)
  }
  if (bought.length === 0) return ''
  return bought.length === 1 ? bought[0] : `${bought[0]} + ${bought.length - 1} more`
}
