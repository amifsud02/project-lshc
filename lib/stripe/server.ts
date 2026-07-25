import Stripe from 'stripe'

const secret = process.env.STRIPE_SECRET_KEY

let _stripe: Stripe | null = null

export function getStripe(): Stripe {
  if (!secret) {
    throw new Error('STRIPE_SECRET_KEY is not set')
  }
  if (!_stripe) {
    _stripe = new Stripe(secret)
  }
  return _stripe
}
