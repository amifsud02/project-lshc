'use client'

import { currencyDecimals, currencySymbol, DIMENSION_UNITS, WEIGHT_UNITS, type Option } from '../../../reference'
import type { WizardProductInput } from '../../../types'
import { Callout, ChoiceCards, Field, MoneyInput, NumberInput, Row, Select, TextArea, TextInput, Toggle } from '../controls'
import type { StepContext, WizardDef } from '../engine'

const METHODS: Option[] = [
  { value: 'template', label: 'Start with a template', description: 'A ready-made product to edit: physical, digital or with variations.' },
  { value: 'manual', label: 'Add manually', description: 'Type in your first product from scratch.' },
  { value: 'import', label: 'Import products', description: 'Paste or upload a CSV exported from another platform or a spreadsheet.' },
  { value: 'sample', label: 'Load sample products', description: 'Example products, saved as drafts, to see how the store looks.' },
]

const TEMPLATES: Record<string, WizardProductInput & { label: string; description: string }> = {
  physical: {
    label: 'Physical product',
    description: 'A tangible item that gets delivered to customers.',
    name: 'Cotton tote bag',
    type: 'simple',
    status: 'draft',
    regularPrice: 1800,
    manageStock: true,
    stockQuantity: 25,
    weight: 0.2,
    dimensions: { length: 40, width: 35, height: 1 },
    shortDescription: 'Heavyweight natural cotton with a printed logo.',
  },
  digital: {
    label: 'Digital product',
    description: 'A file customers download after paying.',
    name: 'Training plan (PDF)',
    type: 'simple',
    status: 'draft',
    regularPrice: 900,
    virtual: true,
    downloadable: true,
    shortDescription: 'A 12-week plan, delivered as a PDF download.',
  },
  variable: {
    label: 'Product with variations',
    description: 'One product in several sizes or colours.',
    name: 'Classic T-shirt',
    type: 'variable',
    status: 'draft',
    regularPrice: 2200,
    manageStock: true,
    stockQuantity: 60,
    weight: 0.25,
    attributes: [
      { name: 'Size', values: ['S', 'M', 'L', 'XL'] },
      { name: 'Colour', values: ['Black', 'White'] },
    ],
    shortDescription: 'Soft ring-spun cotton, regular fit.',
  },
}

const SAMPLES: WizardProductInput[] = [
  { name: 'Hoodie', type: 'variable', status: 'draft', regularPrice: 4500, salePrice: 4000, sku: 'SAMPLE-HOODIE', manageStock: true, stockQuantity: 30, weight: 0.6, attributes: [{ name: 'Size', values: ['S', 'M', 'L'] }], shortDescription: 'Brushed fleece hoodie.' },
  { name: 'Beanie', type: 'simple', status: 'draft', regularPrice: 1800, sku: 'SAMPLE-BEANIE', manageStock: true, stockQuantity: 50, weight: 0.1, shortDescription: 'Ribbed knit beanie.' },
  { name: 'Water bottle', type: 'simple', status: 'draft', regularPrice: 1500, sku: 'SAMPLE-BOTTLE', manageStock: true, stockQuantity: 40, weight: 0.3, shortDescription: '750 ml insulated steel bottle.' },
  { name: 'Gift card', type: 'simple', status: 'draft', regularPrice: 2500, sku: 'SAMPLE-GIFT', virtual: true, shortDescription: 'Emailed instantly.' },
  { name: 'Album download', type: 'simple', status: 'draft', regularPrice: 900, sku: 'SAMPLE-ALBUM', virtual: true, downloadable: true, shortDescription: 'MP3 and FLAC.' },
  { name: 'Partner store link', type: 'external', status: 'draft', regularPrice: 3000, externalUrl: 'https://example.com', buttonText: 'Buy at partner', shortDescription: 'Sold by a partner store.' },
]

const PRODUCT_TYPE_OPTIONS: Option[] = [
  { value: 'simple', label: 'Simple product' },
  { value: 'variable', label: 'Variable product' },
  { value: 'grouped', label: 'Grouped product' },
  { value: 'external', label: 'External / affiliate product' },
]

// CSV import.

const parseCsv = (text: string): string[][] => {
  const rows: string[][] = []
  let row: string[] = []
  let cell = ''
  let quoted = false
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') (cell += '"'), i++
      else if (ch === '"') quoted = false
      else cell += ch
    } else if (ch === '"') quoted = true
    else if (ch === ',' || ch === ';' || ch === '\t') row.push(cell), (cell = '')
    else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++
      row.push(cell), rows.push(row), (row = []), (cell = '')
    } else cell += ch
  }
  if (cell || row.length) row.push(cell), rows.push(row)
  return rows.filter((r) => r.some((c) => c.trim()))
}

/** Header names from WooCommerce, Shopify and plain spreadsheets, mapped to wizard fields. */
const COLUMN_ALIASES: Record<string, string[]> = {
  name: ['name', 'title', 'product name', 'product'],
  type: ['type', 'product type'],
  regularPrice: ['regular price', 'price', 'variant price'],
  salePrice: ['sale price', 'compare at price'],
  sku: ['sku', 'variant sku'],
  stockQuantity: ['stock', 'stock quantity', 'quantity', 'inventory', 'variant inventory qty'],
  status: ['published', 'status'],
  shortDescription: ['short description', 'description', 'body (html)'],
  weight: ['weight', 'weight (kg)', 'variant grams'],
}

const toProducts = (rows: string[][], digits: number): { products: WizardProductInput[]; errors: string[]; columns: string[] } => {
  const [header = [], ...body] = rows
  const norm = header.map((h) => h.trim().toLowerCase())
  const col = (key: string) => norm.findIndex((h) => COLUMN_ALIASES[key].includes(h))
  const idx = Object.fromEntries(Object.keys(COLUMN_ALIASES).map((k) => [k, col(k)]))
  const errors: string[] = []
  if (idx.name < 0) errors.push('No “Name” column found.')
  if (idx.regularPrice < 0) errors.push('No “Regular price” column found.')
  const money = (v?: string) => {
    const n = Number(String(v ?? '').replace(/[^0-9.,-]/g, '').replace(',', '.'))
    return v && !Number.isNaN(n) ? Math.round(n * 10 ** digits) : null
  }
  const products = errors.length
    ? []
    : body.map((r, i) => {
        const get = (k: string) => (idx[k] >= 0 ? r[idx[k]]?.trim() : undefined)
        const type = (get('type') ?? 'simple').toLowerCase().split(',')[0].trim()
        const stock = get('stockQuantity')
        const status = (get('status') ?? '1').toLowerCase()
        const product: WizardProductInput = {
          name: get('name') ?? '',
          type: (['simple', 'variable', 'grouped', 'external'].includes(type) ? type : 'simple') as WizardProductInput['type'],
          status: ['1', 'true', 'yes', 'publish', 'published', 'active'].includes(status) ? 'published' : 'draft',
          regularPrice: money(get('regularPrice')) ?? 0,
          salePrice: money(get('salePrice')),
          sku: get('sku'),
          manageStock: Boolean(stock),
          stockQuantity: stock ? Number(stock) : null,
          weight: get('weight') ? Number(get('weight')) : null,
          shortDescription: get('shortDescription')?.replace(/<[^>]+>/g, ''),
        }
        if (!product.name) errors.push(`Row ${i + 2}: missing name.`)
        return product
      })
  return { products, errors, columns: header }
}

function ProductForm({ ctx }: { ctx: StepContext }) {
  const p: WizardProductInput = ctx.local.product
  const set = (patch: Partial<WizardProductInput>) => ctx.setLocal('product', { ...p, ...patch })
  const code = ctx.get('currency.code') ?? 'EUR'
  const money = { symbol: currencySymbol(code), digits: currencyDecimals(code) }
  return (
    <>
      <Row>
        <Field label="Product name">
          <TextInput value={p.name} onChange={(name) => set({ name })} />
        </Field>
        <Field label="Product type">
          <Select options={PRODUCT_TYPE_OPTIONS} value={p.type} onChange={(type) => set({ type: type as WizardProductInput['type'] })} />
        </Field>
      </Row>
      <Row>
        <Field label="Regular price">
          <MoneyInput {...money} value={p.regularPrice} onChange={(v) => set({ regularPrice: v ?? 0 })} />
        </Field>
        <Field label="Sale price" help="Optional.">
          <MoneyInput {...money} value={p.salePrice} onChange={(v) => set({ salePrice: v })} />
        </Field>
        <Field label="SKU">
          <TextInput value={p.sku} onChange={(sku) => set({ sku })} />
        </Field>
      </Row>
      <Row>
        <Toggle label="Virtual" help="Not shipped." checked={p.virtual} onChange={(virtual) => set({ virtual })} />
        <Toggle label="Downloadable" help="Gives access to a file." checked={p.downloadable} onChange={(downloadable) => set({ downloadable })} />
        <Toggle label="Track stock" checked={p.manageStock} onChange={(manageStock) => set({ manageStock })} />
      </Row>
      {p.manageStock && (
        <Field label="Stock quantity">
          <NumberInput value={p.stockQuantity} min={0} onChange={(stockQuantity) => set({ stockQuantity })} />
        </Field>
      )}
      {!p.virtual && (
        <Row>
          <Field label="Weight">
            <NumberInput value={p.weight} min={0} step={0.01} suffix={ctx.get('products.weightUnit') ?? 'kg'} onChange={(weight) => set({ weight })} />
          </Field>
          {(['length', 'width', 'height'] as const).map((k) => (
            <Field key={k} label={k[0].toUpperCase() + k.slice(1)}>
              <NumberInput
                value={p.dimensions?.[k]}
                min={0}
                suffix={ctx.get('products.dimensionUnit') ?? 'cm'}
                onChange={(v) => set({ dimensions: { ...p.dimensions, [k]: v } })}
              />
            </Field>
          ))}
        </Row>
      )}
      {p.type === 'variable' && (
        <Field label="Attributes" help="One per line: Name: value | value | value">
          <TextArea
            rows={3}
            value={(p.attributes ?? []).map((a) => `${a.name}: ${a.values.join(' | ')}`).join('\n')}
            onChange={(text) =>
              set({
                attributes: text
                  .split('\n')
                  .map((line) => line.split(':'))
                  .filter(([n, v]) => n?.trim() && v?.trim())
                  .map(([n, v]) => ({ name: n.trim(), values: v.split('|').map((s) => s.trim()).filter(Boolean) })),
              })
            }
          />
        </Field>
      )}
      {p.type === 'external' && (
        <Row>
          <Field label="Product URL">
            <TextInput type="url" value={p.externalUrl} onChange={(externalUrl) => set({ externalUrl })} />
          </Field>
          <Field label="Button text">
            <TextInput value={p.buttonText ?? 'Buy product'} onChange={(buttonText) => set({ buttonText })} />
          </Field>
        </Row>
      )}
      <Field label="Short description">
        <TextArea value={p.shortDescription} onChange={(shortDescription) => set({ shortDescription })} />
      </Field>
      <Toggle label="Publish now" help="Leave off to save as a draft and finish it in the product editor." checked={p.status === 'published'} onChange={(on) => set({ status: on ? 'published' : 'draft' })} />
    </>
  )
}

function Importer({ ctx }: { ctx: StepContext }) {
  const code = ctx.get('currency.code') ?? 'EUR'
  const text: string = ctx.local.csv ?? ''
  const parsed = text ? toProducts(parseCsv(text), currencyDecimals(code)) : null
  return (
    <>
      <Field label="Upload a CSV file">
        <input
          type="file"
          accept=".csv,text/csv"
          className="ss-file"
          onChange={async (e) => {
            const file = e.target.files?.[0]
            if (file) ctx.setLocal('csv', await file.text())
          }}
        />
      </Field>
      <Field label="…or paste it here" help="First row must be headers. Recognised: Name, Type, Regular price, Sale price, SKU, Stock, Published, Short description, Weight.">
        <TextArea rows={6} value={text} onChange={(v) => ctx.setLocal('csv', v)} placeholder={'Name,Regular price,SKU,Stock\nTote bag,18.00,TOTE-1,25'} />
      </Field>
      {parsed?.errors.length ? (
        <Callout tone="warning">
          {parsed.errors.slice(0, 5).map((e) => (
            <div key={e}>{e}</div>
          ))}
        </Callout>
      ) : null}
      {parsed && parsed.products.length > 0 && (
        <div className="ss-table-wrap">
          <table className="ss-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Type</th>
                <th>Price</th>
                <th>SKU</th>
                <th>Stock</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {parsed.products.slice(0, 50).map((p, i) => (
                <tr key={i}>
                  <td>{p.name}</td>
                  <td>{p.type}</td>
                  <td>{(p.regularPrice / 10 ** currencyDecimals(code)).toFixed(currencyDecimals(code))}</td>
                  <td>{p.sku}</td>
                  <td>{p.stockQuantity ?? '—'}</td>
                  <td>{p.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="ss-muted">{parsed.products.length} products ready to import.</p>
        </div>
      )}
    </>
  )
}

const productsToCreate = (ctx: StepContext): WizardProductInput[] => {
  switch (ctx.local.method) {
    case 'template':
    case 'manual':
      return [ctx.local.product]
    case 'import':
      return toProducts(parseCsv(ctx.local.csv ?? ''), currencyDecimals(ctx.get('currency.code') ?? 'EUR')).products
    case 'sample':
      return SAMPLES.filter((s) => (ctx.local.samples ?? SAMPLES.map((x) => x.name)).includes(s.name))
    default:
      return []
  }
}

const blank: WizardProductInput = { name: '', type: 'simple', status: 'draft', regularPrice: 0 }

export const productsWizard: WizardDef = {
  id: 'products',
  sections: ['products'],
  steps: [
    {
      id: 'method',
      title: 'How would you like to add products?',
      render: (ctx) => (
        <>
          {ctx.state.counts.products > 0 && (
            <Callout tone="success">
              You already have {ctx.state.counts.products} product{ctx.state.counts.products === 1 ? '' : 's'}, so this task is done. Add more here, or skip ahead to product settings.
            </Callout>
          )}
          <ChoiceCards
            columns={2}
            options={ctx.state.counts.products > 0 ? [...METHODS, { value: 'none', label: 'Just product settings', description: 'Units and reviews.' }] : METHODS}
            value={ctx.local.method}
            onChange={(method) => {
              ctx.setLocal('method', method)
              if (method === 'manual') ctx.setLocal('product', { ...blank })
              if (method === 'template') {
                const types: string[] = ctx.get('profile.productTypes') ?? []
                const key = types.includes('downloads') && !types.includes('physical') ? 'digital' : 'physical'
                ctx.setLocal('template', key)
                ctx.setLocal('product', { ...TEMPLATES[key] })
              }
            }}
          />
        </>
      ),
      validate: (ctx) => (!ctx.local.method ? 'Choose how to add products.' : null),
    },
    {
      id: 'add',
      title: 'Add your products',
      when: (ctx) => ctx.local.method && ctx.local.method !== 'none',
      render: (ctx) => {
        if (ctx.local.created)
          return (
            <Callout tone="success">
              Created {ctx.local.created} product{ctx.local.created === 1 ? '' : 's'}. Continue to product settings, or{' '}
              <a href={`${ctx.state.adminRoute}/collections/${ctx.state.productsCollection}`}>open the product list</a> to add photos and descriptions.
            </Callout>
          )
        switch (ctx.local.method) {
          case 'template':
            return (
              <>
                <ChoiceCards
                  columns={3}
                  options={Object.entries(TEMPLATES).map(([value, t]) => ({ value, label: t.label, description: t.description }))}
                  value={ctx.local.template}
                  onChange={(key) => {
                    ctx.setLocal('template', key)
                    ctx.setLocal('product', { ...TEMPLATES[key] })
                  }}
                />
                <ProductForm ctx={ctx} />
              </>
            )
          case 'manual':
            return <ProductForm ctx={ctx} />
          case 'import':
            return <Importer ctx={ctx} />
          case 'sample':
            return (
              <ChoiceCards
                multiple
                columns={2}
                options={SAMPLES.map((s) => ({ value: s.name, label: s.name, description: `${s.type} · ${s.shortDescription}` }))}
                value={ctx.local.samples ?? SAMPLES.map((s) => s.name)}
                onChange={(v) => ctx.setLocal('samples', v)}
              />
            )
        }
      },
      validate: (ctx) => {
        if (ctx.local.created) return null
        const list = productsToCreate(ctx)
        if (!list.length) return 'Nothing to add yet.'
        if (list.some((p) => !p.name)) return 'Every product needs a name.'
        return null
      },
      onContinue: async (ctx) => {
        if (ctx.local.created) return
        const res = await ctx.api.post('/records', { kind: 'products', docs: productsToCreate(ctx) })
        ctx.setState(res)
        ctx.setLocal('created', res.created.length)
      },
      cta: 'Add products',
    },
    {
      id: 'settings',
      title: 'Product settings',
      description: 'Units used on product pages, and how reviews work.',
      render: (ctx) => (
        <>
          {ctx.local.created > 0 && (
            <Callout tone="success">
              Added {ctx.local.created} product{ctx.local.created === 1 ? '' : 's'}. Add photos and descriptions later in the{' '}
              <a href={`${ctx.state.adminRoute}/collections/${ctx.state.productsCollection}`}>product list</a>.
            </Callout>
          )}
          <Row>
            <Field label="Weight unit">
              <Select options={WEIGHT_UNITS} value={ctx.get('products.weightUnit') ?? 'kg'} onChange={(v) => ctx.set('products.weightUnit', v)} />
            </Field>
            <Field label="Dimensions unit">
              <Select options={DIMENSION_UNITS} value={ctx.get('products.dimensionUnit') ?? 'cm'} onChange={(v) => ctx.set('products.dimensionUnit', v)} />
            </Field>
          </Row>
          <Toggle label="Go to the cart after adding a product" checked={ctx.get('products.redirectToCart')} onChange={(v) => ctx.set('products.redirectToCart', v)} />
          <Toggle label="Enable product reviews" checked={ctx.get('products.enableReviews')} onChange={(v) => ctx.set('products.enableReviews', v)} />
          {ctx.get('products.enableReviews') && (
            <div className="ss-indent">
              <Toggle label="Show “verified owner” on reviews by buyers" checked={ctx.get('products.verifiedOwnerLabel')} onChange={(v) => ctx.set('products.verifiedOwnerLabel', v)} />
              <Toggle label="Only buyers can leave reviews" checked={ctx.get('products.verifiedOnly')} onChange={(v) => ctx.set('products.verifiedOnly', v)} />
              <Toggle label="Enable star ratings" checked={ctx.get('products.enableRatings')} onChange={(v) => ctx.set('products.enableRatings', v)} />
              {ctx.get('products.enableRatings') && (
                <Toggle label="Star rating is required" checked={ctx.get('products.ratingsRequired')} onChange={(v) => ctx.set('products.ratingsRequired', v)} />
              )}
            </div>
          )}
        </>
      ),
    },
  ],
  doneMessage: (ctx) => (
    <>
      Next, add photos and full descriptions in the{' '}
      <a href={`${ctx.state.adminRoute}/collections/${ctx.state.productsCollection}`}>product editor</a>.
    </>
  ),
}
