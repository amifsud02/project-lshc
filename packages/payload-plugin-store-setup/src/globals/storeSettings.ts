import type { Field, GlobalConfig, Tab } from 'payload'
import {
  COMING_SOON_SCOPES,
  COUNTRIES,
  CURRENCIES,
  CURRENCY_POSITIONS,
  CUSTOMER_LOCATION,
  DIMENSION_UNITS,
  EMAIL_NOTIFICATIONS,
  FIELD_VISIBILITY,
  INDUSTRIES,
  PLATFORMS,
  PRODUCT_TYPES,
  RETENTION_UNITS,
  REVENUE,
  SELLING_LOCATIONS,
  SELLING_WHERE,
  SETUP_FOR,
  SHIP_TO,
  SHIPPING_METHODS,
  STOCK_FORMATS,
  TAX_BASED_ON,
  VISIBILITY_MODES,
  WEIGHT_UNITS,
} from '../reference'
import type { ResolvedSlugs, StoreSetupPluginOptions } from '../types'

const strip = (options: { label: string; value: string }[]) => options.map(({ label, value }) => ({ label, value }))

const imageField = (name: string, label: string, uploads?: string): Field =>
  uploads
    ? { name, label, type: 'upload', relationTo: uploads as any }
    : { name, label, type: 'text', admin: { description: 'Image URL' } }

const retention = (name: string, label: string): Field => ({
  type: 'row',
  fields: [
    { name: `${name}Value`, label, type: 'number', min: 0, admin: { width: '50%', description: 'Leave empty to keep forever.' } },
    { name: `${name}Unit`, label: 'Unit', type: 'select', defaultValue: 'months', options: RETENTION_UNITS, admin: { width: '50%' } },
  ],
})

const gateway = (name: string, label: string, title: string, description: string, extra: Field[] = []): Field => ({
  name,
  label,
  type: 'group',
  fields: [
    { name: 'enabled', type: 'checkbox', defaultValue: false },
    {
      type: 'row',
      fields: [
        { name: 'title', type: 'text', defaultValue: title, admin: { width: '50%', description: 'What customers see at checkout.' } },
        { name: 'sortOrder', label: 'Order', type: 'number', defaultValue: 0, admin: { width: '50%' } },
      ],
    },
    { name: 'description', type: 'textarea', defaultValue: description },
    ...extra,
  ],
})

export const storeSettingsGlobal = (opts: StoreSetupPluginOptions, slugs: ResolvedSlugs): GlobalConfig => {
  const tabs: Tab[] = [
    {
      name: 'profile',
      label: 'Profile',
      fields: [
        { name: 'storeName', type: 'text' },
        { name: 'setupFor', label: 'Setting up as', type: 'select', options: strip(SETUP_FOR) },
        { name: 'sellingWhere', type: 'select', options: SELLING_WHERE },
        { name: 'platforms', label: 'Already selling on', type: 'select', hasMany: true, options: PLATFORMS },
        { name: 'revenue', type: 'select', options: REVENUE },
        { name: 'industry', type: 'select', options: INDUSTRIES },
        { name: 'industryOther', type: 'text', admin: { condition: (_, s) => s?.industry === 'other' } },
        { name: 'productTypes', label: 'What you sell', type: 'select', hasMany: true, options: strip(PRODUCT_TYPES) },
        { name: 'completedAt', type: 'date', admin: { readOnly: true } },
      ],
    },
    {
      name: 'general',
      label: 'General',
      fields: [
        {
          type: 'collapsible',
          label: 'Store address',
          fields: [
            { name: 'address1', label: 'Address line 1', type: 'text' },
            { name: 'address2', label: 'Address line 2', type: 'text' },
            {
              type: 'row',
              fields: [
                { name: 'city', type: 'text', admin: { width: '33%' } },
                { name: 'postcode', label: 'Postcode / ZIP', type: 'text', admin: { width: '33%' } },
                { name: 'state', label: 'State / county', type: 'text', admin: { width: '33%' } },
              ],
            },
            { name: 'country', type: 'select', options: COUNTRIES },
          ],
        },
        { name: 'sellingLocations', type: 'select', defaultValue: 'all', options: SELLING_LOCATIONS },
        {
          name: 'sellingExcept',
          label: 'Sell to all countries, except',
          type: 'select',
          hasMany: true,
          options: COUNTRIES,
          admin: { condition: (_, s) => s?.sellingLocations === 'all_except' },
        },
        {
          name: 'sellingSpecific',
          label: 'Sell to these countries',
          type: 'select',
          hasMany: true,
          options: COUNTRIES,
          admin: { condition: (_, s) => s?.sellingLocations === 'specific' },
        },
        { name: 'shipTo', label: 'Shipping locations', type: 'select', defaultValue: 'all_selling', options: SHIP_TO },
        {
          name: 'shipToSpecific',
          label: 'Ship to these countries',
          type: 'select',
          hasMany: true,
          options: COUNTRIES,
          admin: { condition: (_, s) => s?.shipTo === 'specific' },
        },
        { name: 'defaultCustomerLocation', type: 'select', defaultValue: 'base', options: CUSTOMER_LOCATION },
      ],
    },
    {
      name: 'currency',
      label: 'Currency',
      fields: [
        { name: 'code', label: 'Currency', type: 'select', defaultValue: 'EUR', options: CURRENCIES },
        { name: 'position', label: 'Currency position', type: 'select', defaultValue: 'left', options: CURRENCY_POSITIONS },
        {
          type: 'row',
          fields: [
            { name: 'thousandSeparator', type: 'text', defaultValue: ',', admin: { width: '33%' } },
            { name: 'decimalSeparator', type: 'text', defaultValue: '.', admin: { width: '33%' } },
            { name: 'decimals', label: 'Number of decimals', type: 'number', defaultValue: 2, min: 0, max: 4, admin: { width: '33%' } },
          ],
        },
      ],
    },
    {
      name: 'products',
      label: 'Products',
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'weightUnit', type: 'select', defaultValue: 'kg', options: WEIGHT_UNITS, admin: { width: '50%' } },
            { name: 'dimensionUnit', type: 'select', defaultValue: 'cm', options: DIMENSION_UNITS, admin: { width: '50%' } },
          ],
        },
        { name: 'redirectToCart', label: 'Go to the cart after adding a product', type: 'checkbox', defaultValue: false },
        { name: 'enableReviews', label: 'Enable product reviews', type: 'checkbox', defaultValue: true },
        { name: 'verifiedOwnerLabel', label: 'Show “verified owner” on reviews by buyers', type: 'checkbox', defaultValue: true },
        { name: 'verifiedOnly', label: 'Only buyers can leave reviews', type: 'checkbox', defaultValue: false },
        { name: 'enableRatings', label: 'Enable star ratings on reviews', type: 'checkbox', defaultValue: true },
        { name: 'ratingsRequired', label: 'Star rating is required', type: 'checkbox', defaultValue: true },
      ],
    },
    {
      name: 'inventory',
      label: 'Inventory',
      fields: [
        { name: 'manageStock', label: 'Track stock quantity', type: 'checkbox', defaultValue: true },
        {
          name: 'holdStockMinutes',
          label: 'Hold stock (minutes)',
          type: 'number',
          defaultValue: 60,
          min: 0,
          admin: { description: 'How long stock stays reserved for an unpaid order. Leave empty to disable.' },
        },
        {
          type: 'row',
          fields: [
            { name: 'notifyLowStock', label: 'Email when stock is low', type: 'checkbox', defaultValue: true, admin: { width: '50%' } },
            { name: 'notifyNoStock', label: 'Email when out of stock', type: 'checkbox', defaultValue: true, admin: { width: '50%' } },
          ],
        },
        { name: 'notificationRecipient', type: 'email' },
        {
          type: 'row',
          fields: [
            { name: 'lowStockThreshold', type: 'number', defaultValue: 2, min: 0, admin: { width: '50%' } },
            { name: 'outOfStockThreshold', type: 'number', defaultValue: 0, min: 0, admin: { width: '50%' } },
          ],
        },
        { name: 'hideOutOfStock', label: 'Hide out of stock items from the catalogue', type: 'checkbox', defaultValue: false },
        { name: 'stockFormat', label: 'Stock display format', type: 'select', defaultValue: 'always', options: STOCK_FORMATS },
      ],
    },
    {
      name: 'tax',
      label: 'Tax',
      fields: [
        { name: 'enabled', label: 'Enable tax rates and calculations', type: 'checkbox', defaultValue: false },
        {
          name: 'pricesIncludeTax',
          label: 'Prices entered with tax',
          type: 'radio',
          defaultValue: 'no',
          options: [
            { label: 'Yes, I will enter prices inclusive of tax', value: 'yes' },
            { label: 'No, I will enter prices exclusive of tax', value: 'no' },
          ],
        },
        { name: 'basedOn', label: 'Calculate tax based on', type: 'select', defaultValue: 'shipping', options: TAX_BASED_ON },
        { name: 'shippingTaxClass', type: 'text', defaultValue: 'inherit', admin: { description: '“inherit” uses the tax class of the items in the cart.' } },
        { name: 'roundAtSubtotal', label: 'Round tax at subtotal level, instead of per line', type: 'checkbox', defaultValue: false },
        {
          name: 'classes',
          label: 'Additional tax classes',
          type: 'array',
          defaultValue: [{ name: 'Reduced rate' }, { name: 'Zero rate' }],
          fields: [{ name: 'name', type: 'text', required: true }],
        },
        {
          type: 'row',
          fields: [
            {
              name: 'displayShop',
              label: 'Display prices in the shop',
              type: 'select',
              defaultValue: 'excl',
              options: [
                { label: 'Including tax', value: 'incl' },
                { label: 'Excluding tax', value: 'excl' },
              ],
              admin: { width: '50%' },
            },
            {
              name: 'displayCart',
              label: 'Display prices in cart and checkout',
              type: 'select',
              defaultValue: 'excl',
              options: [
                { label: 'Including tax', value: 'incl' },
                { label: 'Excluding tax', value: 'excl' },
              ],
              admin: { width: '50%' },
            },
          ],
        },
        { name: 'priceSuffix', label: 'Price display suffix', type: 'text', admin: { description: 'e.g. “incl. VAT”' } },
        {
          name: 'totalsDisplay',
          label: 'Display tax totals',
          type: 'select',
          defaultValue: 'itemized',
          options: [
            { label: 'As a single total', value: 'single' },
            { label: 'Itemized', value: 'itemized' },
          ],
        },
      ],
    },
    {
      name: 'shipping',
      label: 'Shipping',
      fields: [
        { name: 'enableCalculator', label: 'Show the shipping calculator on the cart page', type: 'checkbox', defaultValue: true },
        { name: 'hideUntilAddress', label: 'Hide shipping costs until an address is entered', type: 'checkbox', defaultValue: false },
        {
          name: 'destination',
          label: 'Shipping destination',
          type: 'select',
          defaultValue: 'shipping',
          options: [
            { label: 'Default to customer shipping address', value: 'shipping' },
            { label: 'Default to customer billing address', value: 'billing' },
            { label: 'Force shipping to the customer billing address', value: 'billing_only' },
          ],
        },
      ],
    },
    {
      name: 'payments',
      label: 'Payments',
      fields: [
        gateway('stripe', 'Card payments (Stripe)', 'Credit / debit card', 'Pay securely with your card.', [
          {
            type: 'row',
            fields: [
              { name: 'statementDescriptor', type: 'text', maxLength: 22, admin: { width: '50%', description: 'Shown on card statements. Up to 22 characters.' } },
              {
                name: 'capture',
                type: 'select',
                defaultValue: 'automatic',
                options: [
                  { label: 'Charge immediately', value: 'automatic' },
                  { label: 'Authorise now, capture later', value: 'manual' },
                ],
                admin: { width: '50%' },
              },
            ],
          },
          { name: 'walletButtons', label: 'Offer Apple Pay and Google Pay', type: 'checkbox', defaultValue: true },
        ]),
        gateway('paypal', 'PayPal', 'PayPal', 'Pay with your PayPal account.'),
        gateway('bacs', 'Direct bank transfer', 'Direct bank transfer', 'Make your payment directly into our bank account. Use your order number as the reference.', [
          { name: 'instructions', type: 'textarea', admin: { description: 'Added to the thank-you page and order emails.' } },
          {
            name: 'accounts',
            type: 'array',
            fields: [
              {
                type: 'row',
                fields: [
                  { name: 'accountName', type: 'text', admin: { width: '50%' } },
                  { name: 'bankName', type: 'text', admin: { width: '50%' } },
                ],
              },
              {
                type: 'row',
                fields: [
                  { name: 'iban', label: 'IBAN', type: 'text', admin: { width: '50%' } },
                  { name: 'bic', label: 'BIC / SWIFT', type: 'text', admin: { width: '50%' } },
                ],
              },
              {
                type: 'row',
                fields: [
                  { name: 'accountNumber', type: 'text', admin: { width: '50%' } },
                  { name: 'sortCode', label: 'Sort code / routing number', type: 'text', admin: { width: '50%' } },
                ],
              },
            ],
          },
        ]),
        gateway('cheque', 'Cheque', 'Check payments', 'Please send a cheque to our store address.', [
          { name: 'instructions', type: 'textarea' },
        ]),
        gateway('cod', 'Cash on delivery', 'Cash on delivery', 'Pay with cash on delivery.', [
          { name: 'instructions', type: 'textarea' },
          {
            name: 'enableForMethods',
            label: 'Only for these shipping methods',
            type: 'select',
            hasMany: true,
            options: strip(SHIPPING_METHODS),
            admin: { description: 'Leave empty to allow it with every method.' },
          },
          { name: 'acceptVirtual', label: 'Accept for virtual orders', type: 'checkbox', defaultValue: true },
        ]),
      ],
    },
    {
      name: 'checkout',
      label: 'Checkout & accounts',
      fields: [
        { name: 'guestCheckout', label: 'Allow customers to place orders without an account', type: 'checkbox', defaultValue: true },
        { name: 'loginReminder', label: 'Remind customers they can log in during checkout', type: 'checkbox', defaultValue: false },
        { name: 'signupAtCheckout', label: 'Allow account creation during checkout', type: 'checkbox', defaultValue: false },
        { name: 'signupOnAccountPage', label: 'Allow account creation on the “My account” page', type: 'checkbox', defaultValue: false },
        { name: 'sendPasswordLink', label: 'Send a password setup link instead of asking for a password', type: 'checkbox', defaultValue: true },
        {
          type: 'collapsible',
          label: 'Checkout fields',
          fields: [
            {
              type: 'row',
              fields: [
                { name: 'companyField', label: 'Company name', type: 'select', defaultValue: 'optional', options: FIELD_VISIBILITY, admin: { width: '33%' } },
                { name: 'address2Field', label: 'Address line 2', type: 'select', defaultValue: 'optional', options: FIELD_VISIBILITY, admin: { width: '33%' } },
                { name: 'phoneField', label: 'Phone', type: 'select', defaultValue: 'required', options: FIELD_VISIBILITY, admin: { width: '33%' } },
              ],
            },
          ],
        },
        {
          type: 'collapsible',
          label: 'Policies',
          fields: [
            {
              type: 'row',
              fields: [
                { name: 'termsUrl', label: 'Terms and conditions link', type: 'text', admin: { width: '50%' } },
                { name: 'privacyUrl', label: 'Privacy policy link', type: 'text', admin: { width: '50%' } },
              ],
            },
            {
              name: 'checkoutPrivacyText',
              type: 'textarea',
              defaultValue: 'Your personal data will be used to process your order, support your experience throughout this website, and for other purposes described in our [privacy_policy].',
            },
            {
              name: 'registrationPrivacyText',
              type: 'textarea',
              defaultValue: 'Your personal data will be used to support your experience throughout this website, to manage access to your account, and for other purposes described in our [privacy_policy].',
            },
          ],
        },
        {
          type: 'collapsible',
          label: 'Personal data',
          fields: [
            { name: 'eraseOrdersOnRequest', label: 'Remove personal data from orders on erasure request', type: 'checkbox', defaultValue: false },
            { name: 'eraseDownloadsOnRequest', label: 'Remove access to downloads on erasure request', type: 'checkbox', defaultValue: false },
            retention('inactiveAccounts', 'Delete inactive accounts after'),
            retention('pendingOrders', 'Trash pending orders after'),
            retention('failedOrders', 'Trash failed orders after'),
            retention('cancelledOrders', 'Trash cancelled orders after'),
            retention('completedOrders', 'Anonymise completed orders after'),
          ],
        },
      ],
    },
    {
      name: 'emails',
      label: 'Emails',
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'fromName', label: '“From” name', type: 'text', admin: { width: '50%' } },
            { name: 'fromAddress', label: '“From” address', type: 'email', admin: { width: '50%' } },
          ],
        },
        imageField('headerImage', 'Header image', opts.uploadsCollection),
        { name: 'footerText', type: 'textarea', defaultValue: '{site_title}' },
        {
          type: 'row',
          fields: [
            { name: 'baseColor', type: 'text', defaultValue: '#720eec', admin: { width: '25%' } },
            { name: 'backgroundColor', type: 'text', defaultValue: '#f7f7f7', admin: { width: '25%' } },
            { name: 'bodyColor', label: 'Body background', type: 'text', defaultValue: '#ffffff', admin: { width: '25%' } },
            { name: 'textColor', type: 'text', defaultValue: '#3c3c3c', admin: { width: '25%' } },
          ],
        },
        {
          name: 'notifications',
          type: 'group',
          fields: EMAIL_NOTIFICATIONS.map(
            (n): Field => ({
              name: n.key,
              label: n.label,
              type: 'group',
              admin: { description: n.description },
              fields: [
                {
                  type: 'row',
                  fields: [
                    { name: 'enabled', type: 'checkbox', defaultValue: true, admin: { width: '30%' } },
                    ...(n.to === 'admin'
                      ? [{ name: 'recipient', type: 'text', admin: { width: '70%', description: 'Comma-separated. Empty sends to the store admin.' } } as Field]
                      : []),
                  ],
                },
              ],
            }),
          ),
        },
      ],
    },
    {
      name: 'brand',
      label: 'Brand',
      fields: [
        imageField('logo', 'Logo', opts.uploadsCollection),
        { name: 'tagline', type: 'text' },
        { name: 'primaryColor', type: 'text', defaultValue: '#111827' },
        {
          name: 'storeNotice',
          type: 'group',
          fields: [
            { name: 'enabled', label: 'Show a store-wide notice', type: 'checkbox', defaultValue: false },
            { name: 'text', type: 'text', defaultValue: 'This is a demo store for testing purposes — no orders shall be fulfilled.' },
            { name: 'dismissible', type: 'checkbox', defaultValue: true },
          ],
        },
      ],
    },
    {
      name: 'marketing',
      label: 'Marketing',
      fields: [
        { name: 'couponsEnabled', label: 'Enable the use of coupon codes', type: 'checkbox', defaultValue: true },
        { name: 'sequentialDiscounts', label: 'Calculate coupon discounts sequentially', type: 'checkbox', defaultValue: false },
        { name: 'newsletterOptIn', label: 'Ask for marketing consent at checkout', type: 'checkbox', defaultValue: false },
        { name: 'newsletterLabel', type: 'text', defaultValue: 'Keep me up to date about new products and offers' },
      ],
    },
    {
      name: 'visibility',
      label: 'Visibility',
      fields: [
        { name: 'mode', type: 'radio', defaultValue: 'coming_soon', options: strip(VISIBILITY_MODES) },
        { name: 'scope', label: 'While coming soon, hide', type: 'radio', defaultValue: 'store', options: strip(COMING_SOON_SCOPES) },
        { name: 'message', label: 'Coming soon message', type: 'textarea', defaultValue: 'Great things are on the horizon. Something big is brewing! Our store is in the works and will be launching soon!' },
        { name: 'previewToken', type: 'text', admin: { readOnly: true, description: 'Visitors with ?store-preview=<token> see the store while it is coming soon.' } },
        { name: 'launchedAt', type: 'date', admin: { readOnly: true } },
      ],
    },
  ]

  return {
    slug: slugs.settings,
    label: 'Store Settings',
    admin: {
      group: opts.adminGroup ?? 'Store',
      description: 'Everything the setup wizards configure. Run them again any time from Store setup.',
    },
    access: {
      read: ({ req }) => (opts.access ? opts.access({ req }) : Boolean(req.user)),
      update: ({ req }) => (opts.access ? opts.access({ req }) : Boolean(req.user)),
    },
    fields: [
      { type: 'tabs', tabs },
      // Wizard bookkeeping: task status, hidden task list, first-run redirect. Not for editing.
      {
        name: 'setup',
        type: 'group',
        admin: { hidden: true },
        fields: [
          { name: 'tasks', type: 'json', defaultValue: {} },
          { name: 'taskListHidden', type: 'checkbox', defaultValue: false },
          { name: 'firstRunDone', type: 'checkbox', defaultValue: false },
        ],
      },
    ],
  }
}
