import { expect, test, type Page } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'

/**
 * End-to-end check of selling a membership through MEMBRS, against locally running apps:
 *   club site (CLUB_URL, default http://localhost:3001) and MEMBRS (MEMBRS_API_URL, default http://localhost:8000),
 * with MEMBRS using Stripe test keys and `stripe listen --forward-to <MEMBRS_API_URL>/webhooks/stripe` running.
 *
 * Buys a couple membership with T-shirts on the club site, pays on Stripe Checkout with Stripe's
 * test card, then checks the order came back paid and a member can open their MEMBRS account.
 * A screenshot of every step is written to SCREENSHOT_DIR.
 */

const CLUB_URL = process.env.CLUB_URL ?? 'http://localhost:3001'
const MEMBRS_API_URL = process.env.MEMBRS_API_URL ?? 'http://localhost:8000'
const MEMBRS_LOG = process.env.MEMBRS_LOG // MEMBRS laravel.log, where MAIL_MAILER=log writes emails
const PRODUCT_SLUG = process.env.PRODUCT_SLUG ?? 'couple-membership-with-merchandise-2026-2027'
const SCREENSHOT_DIR = process.env.SCREENSHOT_DIR ?? path.join(__dirname, '..', 'test-results', 'membrs-flow')

const run = Date.now().toString(36)
const members = [
  { firstName: 'Maria', lastName: 'Borg', mobile: '+356 7912 3456', email: `maria.${run}@example.com`, size: 'M' },
  { firstName: 'Joe', lastName: 'Borg', mobile: '+356 7998 7654', email: `joe.${run}@example.com`, size: 'L' },
]

let step = 0
async function shot(page: Page, name: string) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true })
  step += 1
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, `${String(step).padStart(2, '0')}-${name}.png`), fullPage: true })
}

test.describe.configure({ mode: 'serial' })
test.use({ viewport: { width: 1280, height: 900 } })

test('a couple membership bought on the club site is paid through MEMBRS', async ({ page }) => {
  test.setTimeout(180_000)

  // 1. The club shop lists the membership.
  await page.goto(`${CLUB_URL}/shop`)
  await expect(page.getByText('Couple Membership with Merchandise 2026/2027').first()).toBeVisible()
  await shot(page, 'club-shop')

  // 2. Membership page: details for each member plus their T-shirt size, no cart.
  await page.goto(`${CLUB_URL}/shop/${PRODUCT_SLUG}`)
  const form = page.locator('form', { has: page.getByRole('button', { name: /Buy membership/ }) })
  await expect(form).toBeVisible()
  await shot(page, 'club-membership-page')

  const memberBlocks = form.locator('div.rounded-xl')
  for (const [i, m] of members.entries()) {
    const block = memberBlocks.nth(i)
    await block.getByLabel('First name').fill(m.firstName)
    await block.getByLabel('Last name').fill(m.lastName)
    await block.getByLabel('Mobile number').fill(m.mobile)
    await block.getByLabel('Email').fill(m.email)
    const pickup = block.getByLabel(/pick/i)
    if (await pickup.count()) await pickup.fill('Clubhouse')
  }
  for (const [i, m] of members.entries()) {
    await memberBlocks.nth(members.length + i).locator('select').selectOption(m.size)
  }
  await shot(page, 'club-membership-form-filled')

  // 3. Straight to Stripe Checkout, run by MEMBRS.
  await form.getByRole('button', { name: /Buy membership/ }).click()
  await page.waitForURL(/checkout\.stripe\.com/, { timeout: 30_000 })
  await expect(page.getByText('€50.00').first()).toBeVisible({ timeout: 30_000 })
  await expect(page.locator('#cardNumber')).toBeVisible({ timeout: 30_000 })
  // Stripe paints a loading skeleton over the form until its assets settle.
  await page.waitForLoadState('networkidle')
  await shot(page, 'stripe-checkout')

  // 4. Pay with Stripe's test card.
  const card = page.locator('#cardNumber')
  if (!(await card.isVisible().catch(() => false))) {
    await page.getByRole('button', { name: /card/i }).first().click().catch(() => {})
  }
  await card.fill('4242 4242 4242 4242')
  await page.locator('#cardExpiry').fill('12 / 34')
  await page.locator('#cardCvc').fill('123')
  await page.locator('#billingName').fill(`${members[0].firstName} ${members[0].lastName}`)
  const postal = page.locator('#billingPostalCode')
  if (await postal.isVisible().catch(() => false)) await postal.fill('SLM 1000')
  const saveInfo = page.locator('#enableStripePass')
  if (await saveInfo.isChecked().catch(() => false)) await saveInfo.uncheck()
  await shot(page, 'stripe-checkout-filled')
  await page.locator('button[type="submit"]').click()

  // 5. Back on the club site once paid.
  await page.waitForURL(new RegExp(`^${CLUB_URL}/checkout/success`), { timeout: 60_000 })
  const sessionId = new URL(page.url()).searchParams.get('session_id')
  expect(sessionId).toMatch(/^cs_test_/)
  await expect(page.getByText(/LSH-/).first()).toBeVisible()
  await shot(page, 'club-order-confirmed')

  // 6. MEMBRS → club webhook marks the order paid (the club's own hooks then fill its member register).
  await expect
    .poll(
      async () => {
        await page.reload()
        return (await page.locator('body').innerText()).includes('Paid')
      },
      { timeout: 60_000, intervals: [2_000] },
    )
    .toBe(true)

  // 7. The first member follows the emailed link to set up their MEMBRS account.
  test.skip(!MEMBRS_LOG, 'Set MEMBRS_LOG to follow the account setup email')
  let setupUrl: string | undefined
  await expect
    .poll(
      () => {
        const log = fs.readFileSync(MEMBRS_LOG!, 'utf8')
        const start = log.lastIndexOf(`To: ${members[0].email}`)
        if (start === -1) return false
        // The log mailer writes the raw message, quoted-printable encoded.
        const mail = log.slice(start).replace(/=\r?\n/g, '').replace(/=3D/g, '=')
        setupUrl = mail.match(/https?:\/\/[^\s"<>]+\/account\/setup\/[^\s"<>]+/)?.[0]?.replace(/&amp;/g, '&')
        return Boolean(setupUrl)
      },
      { timeout: 60_000, intervals: [2_000] },
    )
    .toBe(true)

  await page.goto(setupUrl!)
  await expect(page).toHaveURL(/reset-password/)
  await page.locator('#password').fill('Members-Test-2026')
  await page.locator('#password_confirmation').fill('Members-Test-2026')
  await shot(page, 'membrs-set-password')
  await page.getByRole('button', { name: /update password/i }).click()

  await page.locator('#email').fill(members[0].email)
  await page.locator('#password').fill('Members-Test-2026')
  await page.getByRole('button', { name: /sign in/i }).click()
  await page.waitForURL(new RegExp(`^${MEMBRS_API_URL}/customer`), { timeout: 30_000 })
  await expect(page.getByText(/Couple Membership with Merchandise/).first()).toBeVisible()
  await shot(page, 'membrs-member-dashboard')

  // 8. The club's admins see both members' sales in the MEMBRS organisation panel.
  const orgEmail = process.env.MEMBRS_ORG_EMAIL
  const orgPassword = process.env.MEMBRS_ORG_PASSWORD
  test.skip(!orgEmail || !orgPassword, 'Set MEMBRS_ORG_EMAIL / MEMBRS_ORG_PASSWORD to check the organisation panel')
  const admin = await page.context().browser()!.newPage({ viewport: { width: 1280, height: 900 } })
  await admin.goto(`${MEMBRS_API_URL}/login`)
  await admin.locator('#email').fill(orgEmail!)
  await admin.locator('#password').fill(orgPassword!)
  await admin.getByRole('button', { name: /sign in/i }).click()
  await admin.waitForURL(new RegExp(`^${MEMBRS_API_URL}/organisation`), { timeout: 30_000 })
  await admin.goto(`${MEMBRS_API_URL}/organisation/transactions`)
  const name = (m: (typeof members)[number]) => `${m.firstName} ${m.lastName}`
  await expect(admin.getByRole('row', { name: new RegExp(`${name(members[1])}.*completed`) }).first()).toBeVisible({ timeout: 30_000 })
  await shot(admin, 'membrs-organisation-sales')
  await admin.goto(`${MEMBRS_API_URL}/organisation/integrations`)
  await expect(admin.getByText('Club website (local)')).toBeVisible()
  await shot(admin, 'membrs-organisation-integrations')
  await admin.close()
})
