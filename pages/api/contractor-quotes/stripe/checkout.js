import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../auth/[...nextauth]'
import { getStripe, getOrCreatePrice } from '../../../../lib/stripe'
import { getOrCreateContractorProfile } from '../../../../lib/quoteclear'

const PLAN_KEY_BY_NAME = {
  starter: 'qc_starter',
  pro:     'qc_pro',
  scale:   'qc_scale',
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const session = await getServerSession(req, res, authOptions)
  if (!session) return res.status(401).json({ error: 'unauthorized' })

  const { plan } = req.body || {}
  const priceKey = PLAN_KEY_BY_NAME[plan]
  if (!priceKey) return res.status(400).json({ error: 'invalid_plan' })

  const stripe = getStripe()
  const priceId = await getOrCreatePrice(priceKey)
  const profile = await getOrCreateContractorProfile(session.user.email)

  const customerFields = profile.qc_stripe_customer_id
    ? { customer: profile.qc_stripe_customer_id }
    : { customer_email: session.user.email }

  const origin = req.headers.origin || `https://${req.headers.host}`
  const checkout = await stripe.checkout.sessions.create({
    mode: 'subscription',
    ...customerFields,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${origin}/contractor-quotes/billing?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/contractor-quotes/billing?cancelled=1`,
    allow_promotion_codes: true,
    metadata: { email: session.user.email, plan, product: 'quoteclear' },
    subscription_data: {
      metadata: { email: session.user.email, plan, product: 'quoteclear' },
    },
  })

  return res.status(200).json({ url: checkout.url })
}
