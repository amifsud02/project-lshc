import { getPayload } from 'payload'

import config from '../payload.config'
import { p, richText, ul } from '../lib/seed/lexical'

/**
 * Creates the 2026/2027 membership products, mirroring the four tiers sold on
 * the old memberships site (memberships.lasallehandball.com):
 *
 *   Membership                          €25  1 member
 *   Membership with Merchandise         €30  1 member  + 1 club T-shirt
 *   Couple Membership                   €40  2 members
 *   Couple Membership with Merchandise  €50  2 members + 2 club T-shirts
 *
 * Everything is created inactive so it can be reviewed in the admin before it
 * goes on sale. Safe to re-run: products are matched on slug and updated, but
 * `active` is never changed on an existing product.
 *
 *   pnpm seed-memberships
 */

const SEASON = '2026/2027'

const payload = await getPayload({ config })

const upsert = async (slug: string, data: Record<string, unknown>) => {
  const { docs } = await payload.find({ collection: 'products', where: { slug: { equals: slug } }, limit: 1 })
  if (docs[0]) {
    const { active: _keep, ...rest } = data
    const doc = await payload.update({ collection: 'products', id: docs[0].id, data: { ...rest, slug } as any })
    payload.logger.info(`Product updated: ${doc.title}`)
    return doc
  }
  const doc = await payload.create({ collection: 'products', data: { ...data, slug } as any })
  payload.logger.info(`Product created: ${doc.title}`)
  return doc
}

// The T-shirt is only sold as part of a membership, so it stays inactive in the shop.
const tShirt = await upsert('club-t-shirt', {
  title: 'Club T-Shirt',
  type: 'single',
  active: false,
  price: 1000,
  customFields: [
    {
      name: 'size',
      label: 'T-shirt size',
      kind: 'select',
      required: true,
      options: ['XS', 'S', 'M', 'L', 'XL', 'XXL'].map((size) => ({ value: size, label: size })),
    },
  ],
})

const pickupField = {
  name: 'pickupLocation',
  label: 'Card pick-up (e.g. a training session)',
  kind: 'text',
  required: true,
}

const benefits = ul([
  'Official La Salle Handball membership card for the 2026/2027 season',
  'Discounts with over 25 partners across Malta — restaurants, gyms, retail and more',
  'Support our teams, from the nursery to the senior squads',
])

const tiers = [
  {
    slug: 'membership-2026-2027',
    title: 'Membership 2026/2027',
    price: 2500,
    membersCovered: 1,
    shirts: 0,
    intro: 'Your La Salle Handball membership for the 2026/2027 season.',
  },
  {
    slug: 'membership-with-merchandise-2026-2027',
    title: 'Membership with Merchandise 2026/2027',
    price: 3000,
    membersCovered: 1,
    shirts: 1,
    intro: 'Your 2026/2027 membership together with an official club T-shirt.',
  },
  {
    slug: 'couple-membership-2026-2027',
    title: 'Couple Membership 2026/2027',
    price: 4000,
    membersCovered: 2,
    shirts: 0,
    intro: 'Two memberships for the 2026/2027 season — one for each of you.',
  },
  {
    slug: 'couple-membership-with-merchandise-2026-2027',
    title: 'Couple Membership with Merchandise 2026/2027',
    price: 5000,
    membersCovered: 2,
    shirts: 2,
    intro: 'Two memberships for the 2026/2027 season, each with an official club T-shirt.',
  },
]

for (const tier of tiers) {
  await upsert(tier.slug, {
    title: tier.title,
    type: 'membership',
    active: false,
    price: tier.price,
    membership: { season: SEASON, membersCovered: tier.membersCovered },
    description: richText(p(tier.intro), benefits),
    customFields: [pickupField],
    bundleItems: tier.shirts ? [{ product: tShirt.id, quantity: tier.shirts }] : [],
  })
}

payload.logger.info('Done — membership products are inactive; review them in the admin, then tick "active".')
process.exit(0)
