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

// Price definitions — baked into code, no env vars needed.
// Products/prices are auto-created in Stripe on first checkout call.
const PRICE_DEFS = {
  monthly: {
    lookupKey:   'tivoro_monthly_v1',
    productName: 'Tivoro Monthly',
    amount:      500,   // $5.00 USD
    currency:    'usd',
    type:        'recurring',
    interval:    'month',
  },
  monthly_plus: {
    lookupKey:   'tivoro_monthly_plus_v1',
    productName: 'Tivoro Monthly Plus',
    amount:      900,   // $9.00 USD
    currency:    'usd',
    type:        'recurring',
    interval:    'month',
  },
  yearly: {
    lookupKey:   'tivoro_yearly_v2',
    productName: 'Tivoro Yearly',
    amount:      2900,  // $29.00 USD
    currency:    'usd',
    type:        'recurring',
    interval:    'year',
  },
  topup: {
    lookupKey:   'tivoro_topup_v1',
    productName: 'Tivoro 50-Scan Top-up',
    amount:      500,   // $5.00 USD
    currency:    'usd',
    type:        'one_time',
  },
}

// Module-level cache — survives within a warm serverless instance.
const _priceCache = {}

export async function getOrCreatePrice(plan) {
  if (_priceCache[plan]) return _priceCache[plan]

  const def = PRICE_DEFS[plan]
  if (!def) throw new Error(`Unknown plan: ${plan}`)

  const stripe = getStripe()

  // Try to find existing price by lookup key
  const existing = await stripe.prices.list({ lookup_keys: [def.lookupKey], limit: 1 })
  if (existing.data.length > 0) {
    _priceCache[plan] = existing.data[0].id
    return _priceCache[plan]
  }

  // Create product then price
  const product = await stripe.products.create({ name: def.productName })
  const priceParams = {
    product:     product.id,
    unit_amount: def.amount,
    currency:    def.currency,
    lookup_key:  def.lookupKey,
    transfer_lookup_key: false,
  }
  if (def.type === 'recurring') {
    priceParams.recurring = { interval: def.interval }
  }
  const price = await stripe.prices.create(priceParams)

  _priceCache[plan] = price.id
  return price.id
}

export const PLAN_DISPLAY = {
  monthly:      { label: 'Monthly',      price: '$5',  cadence: '/mo', scans: 30 },
  monthly_plus: { label: 'Monthly Plus', price: '$9',  cadence: '/mo', scans: 90, note: '+300 bonus credits' },
  yearly:       { label: 'Yearly',       price: '$29', cadence: '/yr', scans: 30, note: 'Save 50% · 30 scans/month' },
}

export const MONTHLY_SCAN_QUOTA = 30
export const TOPUP_SCANS_PER_PURCHASE = 50

export const PLAN_QUOTAS = {
  monthly:      30,
  monthly_plus: 90,
  yearly:       30,
}

export function quotaForPlan(plan) {
  return PLAN_QUOTAS[plan] ?? MONTHLY_SCAN_QUOTA
}
