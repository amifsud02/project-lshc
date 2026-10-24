import type { CustomFieldDef } from '@/lib/shop/types'
import { orList, type UnitTemplate } from '@/lib/shop/units'
import { includedProducts, type MembrsPlan } from './client'

type MembrsProduct = MembrsPlan['products'][number]

export type MembershipSetup = {
  price: number
  membership?: { membersCovered: number; membrsPlanId?: number }
  unitTemplates: UnitTemplate[]
}

export type Compatibility = {
  /** The membership can't be sold as set up: MEMBRS would reject it or charge something else. */
  errors: string[]
  /** Worth a look, but checkout still works. */
  warnings: string[]
  /** Included MEMBRS products that none of our included products ask about; the buyer picks them per member. */
  pickers: MembrsProduct[]
}

export const sameText = (a?: string | null, b?: string | null) =>
  Boolean(a && b && a.trim().toLowerCase() === b.trim().toLowerCase())

const matchesVariant = (answer: string, product: MembrsProduct) =>
  product.variants.some((v) => sameText(answer, v.name) || sameText(answer, v.sku))

const euros = (cents: number) => `€${(cents / 100).toFixed(2)}`

/**
 * Checks a membership product on our site against the MEMBRS plan it is sold as, so what the
 * buyer is asked for and charged here is what MEMBRS will accept.
 */
export function checkMembrsCompatibility(product: MembershipSetup, plan: MembrsPlan | undefined): Compatibility {
  const errors: string[] = []
  const warnings: string[] = []
  const pickers: MembrsProduct[] = []

  const planId = product.membership?.membrsPlanId
  if (!planId) return { errors: ['No MEMBRS plan ID is set.'], warnings, pickers }
  if (!plan) {
    errors.push(`MEMBRS has no plan ${planId} for this API key (it may be archived or belong to another organisation).`)
    return { errors, warnings, pickers }
  }

  const membersCovered = product.membership?.membersCovered ?? 1
  if (plan.members_covered !== membersCovered) {
    errors.push(`Members covered is ${membersCovered} here but ${plan.members_covered} on MEMBRS plan "${plan.name}".`)
  }
  if (plan.currency && plan.currency.toLowerCase() !== 'eur') {
    errors.push(`MEMBRS plan "${plan.name}" is priced in ${plan.currency.toUpperCase()}; the shop sells in EUR.`)
  }
  const planCents = Math.round(Number(plan.price) * 100)
  if (planCents !== product.price) {
    errors.push(`Price is ${euros(product.price)} here but ${euros(planCents)} on MEMBRS; buyers are charged the MEMBRS price.`)
  }

  // Our own included products (e.g. a T-shirt with a size question) follow the member units,
  // one set per member, and their answers pick the MEMBRS variant.
  const extraUnits = product.unitTemplates.slice(membersCovered)
  if (extraUnits.length % membersCovered !== 0) {
    errors.push(
      `There ${extraUnits.length === 1 ? 'is 1 included product unit' : `are ${extraUnits.length} included product units`} for ${membersCovered} members; each member needs the same set.`,
    )
  }
  const selectFieldsOf = (fields: CustomFieldDef[]) =>
    fields.filter((f): f is CustomFieldDef & { options: NonNullable<CustomFieldDef['options']> } =>
      Boolean(f.kind === 'select' && f.options?.length),
    )
  const selectFields = selectFieldsOf(extraUnits.filter((u) => !u.choices).flatMap((u) => u.customFields))
  const usedFields = new Set<string>()

  // MEMBRS has no choices: every member gets every included product. So a pick between our
  // products (e.g. a T-shirt or a hoodie) stays on our side and the club fulfils it from the order.
  const choiceUnits = extraUnits.filter((u) => u.choices)
  for (const unit of choiceUnits) {
    warnings.push(
      `Members choose ${orList(unit.choices!.map((c) => c.productTitle))}. MEMBRS doesn't record the pick; the club fulfils it from the order.`,
    )
  }
  const choiceFields = choiceUnits.flatMap((unit) =>
    unit.choices!.flatMap((option) => selectFieldsOf(option.customFields).map((field) => ({ unit, option, field }))),
  )

  for (const membrsProduct of includedProducts(plan)) {
    const covering = selectFields.filter((f) => f.options.some((o) => matchesVariant(o.value, membrsProduct)))
    const inChoice = choiceFields.find(({ field }) => field.options.some((o) => matchesVariant(o.value, membrsProduct)))
    if (covering.length === 0 && inChoice) {
      errors.push(
        `"${membrsProduct.name}" comes with every membership on MEMBRS, but here members only get it if they pick ${inChoice.option.productTitle} in "${inChoice.unit.productTitle}". Take it off the MEMBRS plan; the club then fulfils the choice from the order.`,
      )
    } else if (covering.length === 0) {
      pickers.push(membrsProduct)
    }
    for (const field of covering) {
      usedFields.add(field.name)
      const unknown = field.options.filter((o) => !matchesVariant(o.value, membrsProduct)).map((o) => o.label)
      if (unknown.length) {
        errors.push(
          `"${field.label}" offers ${[...new Set(unknown)].join(', ')}, which "${membrsProduct.name}" doesn't have on MEMBRS.`,
        )
      }
    }

    const soldOut = membrsProduct.variants.filter((v) => !v.in_stock)
    if (soldOut.length === membrsProduct.variants.length) {
      errors.push(`"${membrsProduct.name}" is sold out on MEMBRS.`)
    } else if (soldOut.length) {
      warnings.push(`"${membrsProduct.name}" is sold out on MEMBRS in ${soldOut.map((v) => v.name).join(', ')}.`)
    }
  }

  for (const field of selectFields) {
    if (!usedFields.has(field.name)) {
      warnings.push(
        `"${field.label}" doesn't match any product included with the MEMBRS plan, so MEMBRS won't record it; the club fulfils it from the order.`,
      )
    }
  }
  for (const addOn of plan.products.filter((p) => !p.included)) {
    warnings.push(`Optional add-on "${addOn.name}" on MEMBRS isn't offered on the website.`)
  }

  return { errors: [...new Set(errors)], warnings: [...new Set(warnings)], pickers }
}
