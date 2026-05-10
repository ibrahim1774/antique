import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]'
import { getSupabaseAdmin } from '../../../lib/supabase'
import { MONTHLY_SCAN_QUOTA } from '../../../lib/stripe'

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions)
  if (!session) return res.status(401).json({ error: 'unauthorized' })

  const sb = getSupabaseAdmin()
  const { data: user } = await sb
    .from('users')
    .select('subscription_status, subscription_plan, subscription_current_period_end, scan_period_start, monthly_scans_used, topup_scans')
    .eq('email', session.user.email)
    .single()

  const hasActiveSub =
    user?.subscription_status === 'active' || user?.subscription_status === 'trialing'

  let monthlyUsed = user?.monthly_scans_used || 0
  const periodStart = user?.scan_period_start ? new Date(user.scan_period_start).getTime() : 0
  if (Date.now() - periodStart >= THIRTY_DAYS_MS) {
    monthlyUsed = 0
  }

  const subQuotaLeft = hasActiveSub ? Math.max(0, MONTHLY_SCAN_QUOTA - monthlyUsed) : 0
  const topupLeft = user?.topup_scans || 0

  return res.status(200).json({
    hasSubscription: hasActiveSub,
    plan: user?.subscription_plan || null,
    currentPeriodEnd: user?.subscription_current_period_end || null,
    monthlyQuota: MONTHLY_SCAN_QUOTA,
    monthlyUsed,
    monthlyRemaining: subQuotaLeft,
    topupScans: topupLeft,
    totalScansLeft: subQuotaLeft + topupLeft,
  })
}
