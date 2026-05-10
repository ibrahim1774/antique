import Stripe from 'stripe'

let _stripe = null

export function getStripe() {
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2024-11-20.acacia',
    })
  }
  return _stripe
}

export const PRICE_IDS = {
  monthly: process.env.STRIPE_PRICE_MONTHLY,
  yearly:  process.env.STRIPE_PRICE_YEARLY,
  topup:   process.env.STRIPE_PRICE_TOPUP,
}

export const PLAN_DISPLAY = {
  monthly: { label: 'Monthly', price: '$5',  cadence: '/mo',  scans: 30 },
  yearly:  { label: 'Yearly',  price: '$39', cadence: '/yr',  scans: 30, note: 'Save 35% · 30 scans/month' },
}

export const MONTHLY_SCAN_QUOTA = 30
export const TOPUP_SCANS_PER_PURCHASE = 50
export const TOPUP_PRICE = '$5'
