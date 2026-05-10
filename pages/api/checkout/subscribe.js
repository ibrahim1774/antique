import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]'
import { getStripe, PRICE_IDS } from '../../../lib/stripe'
import { getSupabaseAdmin } from '../../../lib/supabase'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const session = await getServerSession(req, res, authOptions)
  if (!session) return res.status(401).json({ error: 'unauthorized' })

  const { plan } = req.body || {}
  if (!['monthly', 'yearly'].includes(plan)) {
    return res.status(400).json({ error: 'invalid_plan' })
  }

  const priceId = PRICE_IDS[plan]
  if (!priceId) return res.status(500).json({ error: 'price_not_configured' })

  const stripe = getStripe()
  const sb = getSupabaseAdmin()

  const { data: user } = await sb
    .from('users')
    .select('stripe_customer_id')
    .eq('email', session.user.email)
    .single()

  let customerId = user?.stripe_customer_id
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: session.user.email,
      metadata: { email: session.user.email },
    })
    customerId = customer.id
    await sb.from('users').update({ stripe_customer_id: customerId }).eq('email', session.user.email)
  }

  const origin = req.headers.origin || `https://${req.headers.host}`
  const checkout = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${origin}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/scan`,
    allow_promotion_codes: true,
    metadata: { email: session.user.email, plan },
    subscription_data: {
      metadata: { email: session.user.email, plan },
    },
  })

  return res.status(200).json({ url: checkout.url })
}
