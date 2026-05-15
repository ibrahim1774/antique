import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../auth/[...nextauth]'
import { getStripe } from '../../../../lib/stripe'
import { getOrCreateContractorProfile } from '../../../../lib/quoteclear'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const session = await getServerSession(req, res, authOptions)
  if (!session) return res.status(401).json({ error: 'unauthorized' })

  const profile = await getOrCreateContractorProfile(session.user.email)
  if (!profile.qc_stripe_customer_id) {
    return res.status(400).json({ error: 'no_subscription' })
  }

  const stripe = getStripe()
  const origin = req.headers.origin || `https://${req.headers.host}`
  const portal = await stripe.billingPortal.sessions.create({
    customer: profile.qc_stripe_customer_id,
    return_url: `${origin}/contractor-quotes/billing`,
  })
  return res.status(200).json({ url: portal.url })
}
