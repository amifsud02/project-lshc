import type { Config, Plugin } from 'payload'
import { couponsCollection, productsCollection, shippingZonesCollection, taxRatesCollection } from './collections'
import { storeSetupEndpoints } from './endpoints'
import { storeSettingsGlobal } from './globals/storeSettings'
import { OPTIONS_KEY, type ResolvedOptions } from './server'
import type { ResolvedSlugs, StoreSetupPluginOptions } from './types'

export type { ProductsAdapter, StoreSetupPluginOptions, VisibilityAdapter, WizardProductInput } from './types'
export { canViewStore, formatPrice, getStoreSettings } from './server'
export { WIZARDS } from './wizards'

/**
 * WooCommerce-style store onboarding for Payload: a store profile questionnaire, a setup
 * hub with a progress-tracked task list, and one guided wizard per area of the store.
 */
export const storeSetupPlugin =
  (options: StoreSetupPluginOptions = {}): Plugin =>
  (config: Config): Config => {
    const slugs: ResolvedSlugs = {
      settings: options.slugs?.settings ?? 'store-settings',
      products: options.slugs?.products ?? 'store-products',
      taxRates: options.slugs?.taxRates ?? 'store-tax-rates',
      shippingZones: options.slugs?.shippingZones ?? 'store-shipping-zones',
      coupons: options.slugs?.coupons ?? 'store-coupons',
    }
    const resolved: ResolvedOptions = {
      ...options,
      slugs,
      productsCollection: options.products?.collection ?? slugs.products,
    }

    const collections = [
      ...(config.collections ?? []),
      taxRatesCollection(options, slugs),
      shippingZonesCollection(options, slugs),
      couponsCollection(options, slugs),
      ...(options.products ? [] : [productsCollection(options, slugs)]),
    ]
    const next: Config = {
      ...config,
      collections,
      globals: [...(config.globals ?? []), storeSettingsGlobal(options, slugs)],
      custom: { ...(config.custom ?? {}), [OPTIONS_KEY]: resolved },
    }
    if (options.enabled === false) return next

    const c = options.componentsPath ?? 'payload-plugin-store-setup/components'
    const components = config.admin?.components ?? {}
    return {
      ...next,
      endpoints: [...(config.endpoints ?? []), ...storeSetupEndpoints()],
      admin: {
        ...config.admin,
        components: {
          ...components,
          beforeDashboard: [...(components.beforeDashboard ?? []), `${c}/SetupBanner#SetupBanner`],
          afterNavLinks: [...(components.afterNavLinks ?? []), `${c}/SetupNavLink#SetupNavLink`],
          views: {
            ...(components.views ?? {}),
            // Not exact: also serves /store-setup/<wizard-id>.
            storeSetup: { Component: `${c}/SetupView#SetupView`, path: '/store-setup' },
          },
        },
      },
    }
  }
