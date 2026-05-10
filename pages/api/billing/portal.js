import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]'
import { getStripe } from '../../../lib/stripe'
import { getSupabaseAdmin } from '../../../lib/supabase'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const session = await getServerSession(req, res, authOptions)
  if (!session) return res.status(401).json({ error: 'unauthorized' })

  const sb = getSupabaseAdmin()
  const { data: user } = await sb
    .from('users')
    .select('stripe_customer_id')
    .eq('email', session.user.email)
    .single()

  if (!user?.stripe_customer_id) {
    return res.status(400).json({ error: 'no_customer' })
  }

  const origin = req.headers.origin || `https://${req.headers.host}`
  const portal = await getStripe().billingPortal.sessions.create({
    customer: user.stripe_customer_id,
    return_url: `${origin}/scan`,
  })

  return res.status(200).json({ url: portal.url })
}
