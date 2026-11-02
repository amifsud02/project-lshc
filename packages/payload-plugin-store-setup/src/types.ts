import type { PayloadRequest } from 'payload'

/** Product data collected by the Products wizard. Money is always in minor units (cents). */
export type WizardProductInput = {
  name: string
  type: 'simple' | 'variable' | 'grouped' | 'external'
  status: 'draft' | 'published'
  regularPrice: number
  salePrice?: number | null
  sku?: string
  virtual?: boolean
  downloadable?: boolean
  manageStock?: boolean
  stockQuantity?: number | null
  weight?: number | null
  dimensions?: { length?: number | null; width?: number | null; height?: number | null }
  shortDescription?: string
  externalUrl?: string
  buttonText?: string
  attributes?: { name: string; values: string[] }[]
}

/**
 * Point the Products wizard at a collection you already have. Without one, the plugin adds
 * its own `store-products` collection.
 */
export type ProductsAdapter = {
  /** Slug of the existing products collection. */
  collection: string
  /** Turns wizard input into a document for that collection. */
  toDocument: (product: WizardProductInput, req: PayloadRequest) => Record<string, unknown> | Promise<Record<string, unknown>>
}

export type VisibilityAdapter = {
  read: (req: PayloadRequest) => Promise<'live' | 'coming_soon'>
  write: (mode: 'live' | 'coming_soon', req: PayloadRequest) => Promise<void>
}

export type StoreSetupPluginOptions = {
  /** Set false to register the collections and global but leave the admin UI out. */
  enabled?: boolean
  /**
   * Who may run the wizards and change store settings. Defaults to any signed-in user that
   * can reach the admin panel.
   */
  access?: (args: { req: PayloadRequest }) => boolean | Promise<boolean>
  /** Upload collection used for the logo and email header image. Leave out to use URL fields. */
  uploadsCollection?: string
  products?: ProductsAdapter
  /** Slugs for everything the plugin adds, in case one clashes with your own. */
  slugs?: Partial<{
    settings: string
    products: string
    taxRates: string
    shippingZones: string
    coupons: string
  }>
  /** Sidebar group for the plugin's collections and global. */
  adminGroup?: string
  /** Send admins to the setup wizard the first time they open the dashboard. Default true. */
  firstRunRedirect?: boolean
  /**
   * Where the admin imports the plugin's React components from. Inside a repo this is the
   * path alias to `src/components`; for a published package it would be the package name.
   */
  componentsPath?: string
  /**
   * Let an existing "is the shop public" switch own store visibility. The Launch wizard and
   * task list then read and write through it instead of the plugin's own `visibility.mode`.
   */
  visibility?: VisibilityAdapter
  /** Runs after any wizard saves settings, e.g. to mirror a value into your own globals. */
  onSettingsChange?: (args: { settings: Record<string, any>; previous: Record<string, any>; req: PayloadRequest }) => void | Promise<void>
}

export type ResolvedSlugs = {
  settings: string
  products: string
  taxRates: string
  shippingZones: string
  coupons: string
}

export type TaskStatus = 'complete' | 'skipped'
export type TaskState = { id: string; complete: boolean; skipped: boolean; visible: boolean }

/** Data the admin view hands to the client wizards. */
export type SetupClientState = {
  apiRoute: string
  adminRoute: string
  slugs: ResolvedSlugs
  productsCollection: string
  ownsProducts: boolean
  uploadsCollection?: string
  settings: Record<string, any>
  tasks: TaskState[]
  counts: { products: number; taxRates: number; shippingZones: number; coupons: number }
  env: { stripe: 'live' | 'test' | 'missing'; paypal: boolean; email: boolean }
  userEmail?: string
}
