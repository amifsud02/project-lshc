import { getPayload } from 'payload'

import config from '../payload.config'
import { getMembrsPlans } from '../lib/membrs/client'
import { checkMembrsCompatibility } from '../lib/membrs/compatibility'
import { buildUnitTemplates } from '../lib/shop/units'

/**
 * Checks every membership product against its MEMBRS plan: price, members covered, sizes and
 * stock. Plans can change in MEMBRS after a product is saved here, so run this after editing
 * plans in MEMBRS. Exits with 1 when an active membership can't be sold as set up.
 *
 *   pnpm check-membrs
 */

const payload = await getPayload({ config })
const plans = await getMembrsPlans()
const { docs } = await payload.find({
  collection: 'products',
  where: { type: { equals: 'membership' } },
  depth: 1,
  limit: 200,
  sort: 'title',
})

let broken = 0
for (const doc of docs as any[]) {
  const planId = Number(doc.membership?.membrsPlanId) || undefined
  const plan = plans.find((p) => p.id === planId)
  const { errors, warnings, pickers } = checkMembrsCompatibility(
    {
      price: Number(doc.price) || 0,
      membership: { membersCovered: Math.max(1, Number(doc.membership?.membersCovered) || 1), membrsPlanId: planId },
      unitTemplates: buildUnitTemplates(doc),
    },
    plan,
  )
  if (doc.active && errors.length) broken++

  const state = errors.length ? 'NOT OK' : 'OK'
  console.log(`\n${state}  ${doc.title}${doc.active ? '' : ' (inactive)'}  →  ${plan ? `MEMBRS plan ${plan.id} "${plan.name}"` : 'no MEMBRS plan'}`)
  for (const e of errors) console.log(`  ✗ ${e}`)
  for (const w of warnings) console.log(`  ! ${w}`)
  for (const p of pickers) console.log(`  · Members pick "${p.name}" (${p.variants.map((v) => v.name).join(', ')}) on the form.`)
}

const unused = plans.filter((plan) => !docs.some((d: any) => Number(d.membership?.membrsPlanId) === plan.id))
for (const plan of unused) console.log(`\n·  MEMBRS plan ${plan.id} "${plan.name}" isn't sold on the website.`)

console.log(broken ? `\n${broken} active membership(s) can't be sold as set up.` : '\nAll active memberships match MEMBRS.')
process.exit(broken ? 1 : 0)
