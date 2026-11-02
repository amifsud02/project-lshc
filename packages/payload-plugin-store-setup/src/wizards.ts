/**
 * The wizard catalogue. Each entry is one task on the setup hub, mirroring WooCommerce's
 * onboarding task list: "essential" tasks are what you need to take a first order,
 * "extended" ones are the "things to do next" list.
 *
 * Plain data, shared by the server (progress) and the client (hub and wizards).
 */
export type WizardId =
  | 'store-profile'
  | 'location-currency'
  | 'products'
  | 'payments'
  | 'tax'
  | 'shipping'
  | 'launch'
  | 'inventory'
  | 'checkout'
  | 'emails'
  | 'brand'
  | 'marketing'

export type WizardMeta = {
  id: WizardId
  title: string
  /** Shown on the task row once done. */
  doneTitle: string
  description: string
  group: 'essential' | 'extended'
  minutes: number
  /** Skippable tasks get a "Skip" action, like WooCommerce's optional tasks. */
  skippable: boolean
}

export const WIZARDS: WizardMeta[] = [
  {
    id: 'store-profile',
    title: 'Tell us about your store',
    doneTitle: 'Store profile saved',
    description: 'Who is setting up, what you sell and where — the rest of setup adapts to your answers.',
    group: 'essential',
    minutes: 2,
    skippable: true,
  },
  {
    id: 'location-currency',
    title: 'Set your location and currency',
    doneTitle: 'Location and currency set',
    description: 'Store address, where you sell and ship, and how prices look.',
    group: 'essential',
    minutes: 3,
    skippable: false,
  },
  {
    id: 'products',
    title: 'Add your first products',
    doneTitle: 'Products added',
    description: 'Start from a template, type one in, import a CSV, or load sample products.',
    group: 'essential',
    minutes: 5,
    skippable: false,
  },
  {
    id: 'payments',
    title: 'Get paid',
    doneTitle: 'Payments set up',
    description: 'Choose how customers pay: cards, PayPal, bank transfer, cheque or cash on delivery.',
    group: 'essential',
    minutes: 4,
    skippable: false,
  },
  {
    id: 'tax',
    title: 'Collect sales tax',
    doneTitle: 'Tax set up',
    description: 'Turn on tax, decide how prices are entered and shown, and add your rates.',
    group: 'essential',
    minutes: 3,
    skippable: true,
  },
  {
    id: 'shipping',
    title: 'Set up shipping',
    doneTitle: 'Shipping set up',
    description: 'Shipping zones and the rates, free shipping and pickup options in each.',
    group: 'essential',
    minutes: 4,
    skippable: true,
  },
  {
    id: 'launch',
    title: 'Launch your store',
    doneTitle: 'Your store is live',
    description: 'Review what is left, share a preview link, and switch from coming soon to live.',
    group: 'essential',
    minutes: 1,
    skippable: false,
  },
  {
    id: 'inventory',
    title: 'Manage stock',
    doneTitle: 'Stock rules set',
    description: 'Stock tracking, held stock, low stock alerts and what shoppers see.',
    group: 'extended',
    minutes: 2,
    skippable: true,
  },
  {
    id: 'checkout',
    title: 'Checkout, accounts and privacy',
    doneTitle: 'Checkout configured',
    description: 'Guest checkout, account creation, checkout fields, policies and data retention.',
    group: 'extended',
    minutes: 3,
    skippable: true,
  },
  {
    id: 'emails',
    title: 'Customise store emails',
    doneTitle: 'Emails customised',
    description: 'Sender details, colours and which order emails go out — with a live preview.',
    group: 'extended',
    minutes: 3,
    skippable: true,
  },
  {
    id: 'brand',
    title: 'Personalise your storefront',
    doneTitle: 'Storefront personalised',
    description: 'Logo, brand colour, tagline and a store-wide notice bar.',
    group: 'extended',
    minutes: 2,
    skippable: true,
  },
  {
    id: 'marketing',
    title: 'Grow with coupons',
    doneTitle: 'First coupon created',
    description: 'Turn on coupons and create your first discount code.',
    group: 'extended',
    minutes: 2,
    skippable: true,
  },
]

export const wizardById = (id: string) => WIZARDS.find((w) => w.id === id)
