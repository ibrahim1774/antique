import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]'
import { getStripe, getOrCreatePrice } from '../../../lib/stripe'
import { getSupabaseAdmin } from '../../../lib/supabase'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const session = await getServerSession(req, res, authOptions)
  if (!session) return res.status(401).json({ error: 'unauthorized' })

  const { plan } = req.body || {}
  if (!['monthly', 'monthly_plus', 'yearly'].includes(plan)) {
    return res.status(400).json({ error: 'invalid_plan' })
  }

  const stripe = getStripe()
  const priceId = await getOrCreatePrice(plan)
  const sb = getSupabaseAdmin()

  const { data: user } = await sb
    .from('users')
    .select('stripe_customer_id')
    .eq('email', session.user.email)
    .single()

  // Reuse existing customer if present; otherwise let Stripe create one
  // ONLY if/when the user actually completes payment (via customer_email).
  // For subscription mode, Stripe only materializes the Customer when the
  // checkout completes successfully — abandoned sessions don't create one.
  const customerFields = user?.stripe_customer_id
    ? { customer: user.stripe_customer_id }
    : { customer_email: session.user.email }

  const origin = req.headers.origin || `https://${req.headers.host}`
  const checkout = await stripe.checkout.sessions.create({
    mode: 'subscription',
    ...customerFields,
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
