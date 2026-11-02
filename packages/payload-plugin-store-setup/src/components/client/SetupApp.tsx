'use client'

import { useRouter } from 'next/navigation'
import { useCallback, useMemo, useState } from 'react'
import type { SetupClientState } from '../../types'
import type { WizardId } from '../../wizards'
import { createApi, SetupContext, type WizardDef } from './engine'
import { Hub } from './Hub'
import { WizardRunner } from './WizardRunner'
import { brandWizard } from './wizards/brand'
import { checkoutWizard } from './wizards/checkout'
import { emailsWizard } from './wizards/emails'
import { inventoryWizard } from './wizards/inventory'
import { launchWizard } from './wizards/launch'
import { locationWizard } from './wizards/location'
import { marketingWizard } from './wizards/marketing'
import { paymentsWizard } from './wizards/payments'
import { productsWizard } from './wizards/products'
import { profileWizard } from './wizards/profile'
import { shippingWizard } from './wizards/shipping'
import { taxWizard } from './wizards/tax'
import '../setup.css'

const DEFS: Record<WizardId, WizardDef> = {
  'store-profile': profileWizard,
  'location-currency': locationWizard,
  products: productsWizard,
  payments: paymentsWizard,
  tax: taxWizard,
  shipping: shippingWizard,
  launch: launchWizard,
  inventory: inventoryWizard,
  checkout: checkoutWizard,
  emails: emailsWizard,
  brand: brandWizard,
  marketing: marketingWizard,
}

export function SetupApp({ initialState, wizard }: { initialState: SetupClientState; wizard?: string }) {
  const router = useRouter()
  const [state, setState] = useState(initialState)
  const api = useMemo(() => createApi(initialState.apiRoute), [initialState.apiRoute])
  const base = `${initialState.adminRoute}/store-setup`
  const navigate = useCallback(
    (id?: string) => {
      router.push(id ? `${base}/${id}` : base)
      router.refresh()
    },
    [router, base],
  )
  const def = wizard ? DEFS[wizard as WizardId] : undefined
  return (
    <SetupContext.Provider value={{ state, setState, api, navigate }}>
      <div className="ss-root">{def ? <WizardRunner key={def.id} def={def} /> : <Hub />}</div>
    </SetupContext.Provider>
  )
}
