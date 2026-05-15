import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../auth/[...nextauth]'
import {
  getOrCreateContractorProfile,
  getQcUsage,
  isQcActive,
} from '../../../../lib/quoteclear'

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions)
  if (!session) return res.status(401).json({ error: 'auth_required' })

  const profile = await getOrCreateContractorProfile(session.user.email)
  const active  = isQcActive(profile)
  const usage   = getQcUsage(profile)

  return res.status(200).json({
    hasSubscription: active,
    plan: usage.plan,
    used: usage.used,
    quota: usage.quota === Number.POSITIVE_INFINITY ? null : usage.quota,
    remaining: usage.remaining === Number.POSITIVE_INFINITY ? null : usage.remaining,
    company_name: profile.company_name,
    trade_type: profile.trade_type,
  })
}
