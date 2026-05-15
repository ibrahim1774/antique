import crypto from 'crypto'
import { getSupabaseAdmin } from './supabase'

const DEMO_SALT = 'qc_demo_2026_salt_v1'
const DEMO_WINDOW_MS = 24 * 60 * 60 * 1000
const DEMO_PER_IP_LIMIT = 1
const DEMO_GLOBAL_DAILY_LIMIT = 250

export function hashIp(ip) {
  return crypto.createHash('sha256').update(`${ip}:${DEMO_SALT}`).digest('hex')
}

export function getClientIp(req) {
  const fwd = req.headers['x-forwarded-for']
  if (fwd) return String(fwd).split(',')[0].trim()
  return req.socket?.remoteAddress || '0.0.0.0'
}

export async function checkDemoRateLimit(ipHash) {
  const sb = getSupabaseAdmin()
  const since = new Date(Date.now() - DEMO_WINDOW_MS).toISOString()

  const { count: perIpCount, error: perIpErr } = await sb
    .from('qc_demo_usage')
    .select('id', { count: 'exact', head: true })
    .eq('ip_hash', ipHash)
    .gte('created_at', since)

  if (perIpErr) throw perIpErr
  if ((perIpCount || 0) >= DEMO_PER_IP_LIMIT) {
    return { ok: false, reason: 'per_ip', retryAfterHours: 24 }
  }

  const { count: globalCount, error: globalErr } = await sb
    .from('qc_demo_usage')
    .select('id', { count: 'exact', head: true })
    .gte('created_at', since)

  if (globalErr) throw globalErr
  if ((globalCount || 0) >= DEMO_GLOBAL_DAILY_LIMIT) {
    return { ok: false, reason: 'global_cap', retryAfterHours: 24 }
  }

  return { ok: true }
}

export async function recordDemoUsage(ipHash) {
  const sb = getSupabaseAdmin()
  const { error } = await sb.from('qc_demo_usage').insert({ ip_hash: ipHash })
  if (error) throw error
}

// ============================================================
// Contractor profile + proposal helpers (Milestone 2+)
// ============================================================

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000

export const QC_PLAN_QUOTAS = {
  starter: 10,
  pro:     30,
  scale:   Number.POSITIVE_INFINITY,
}

export function quotaForQcPlan(plan) {
  if (!plan) return 0
  return QC_PLAN_QUOTAS[plan] ?? 0
}

export async function getOrCreateContractorProfile(email) {
  const sb = getSupabaseAdmin()
  const { data: existing, error: selErr } = await sb
    .from('contractor_profiles')
    .select('*')
    .eq('email', email)
    .maybeSingle()
  if (selErr) throw selErr
  if (existing) return existing

  const { data: created, error: insErr } = await sb
    .from('contractor_profiles')
    .insert({ email })
    .select('*')
    .single()
  if (insErr) throw insErr
  return created
}

export function isQcActive(profile) {
  return profile?.qc_subscription_status === 'active' ||
         profile?.qc_subscription_status === 'trialing'
}

export function getQcUsage(profile) {
  const plan  = profile?.qc_plan || null
  const quota = quotaForQcPlan(plan)
  const used  = profile?.qc_proposals_used_this_month || 0
  const cycleStart = profile?.qc_billing_cycle_start
    ? new Date(profile.qc_billing_cycle_start).getTime()
    : 0
  // Soft auto-reset: if more than 30 days since cycle_start, treat as fresh
  // (webhook also resets this on subscription period rollover; this is a safety net).
  const expired = cycleStart && (Date.now() - cycleStart >= THIRTY_DAYS_MS)
  const effectiveUsed = expired ? 0 : used
  const remaining = quota === Number.POSITIVE_INFINITY
    ? Number.POSITIVE_INFINITY
    : Math.max(0, quota - effectiveUsed)
  return { plan, quota, used: effectiveUsed, remaining }
}

export async function bumpProposalsUsed(email) {
  const sb = getSupabaseAdmin()
  const { data: profile } = await sb
    .from('contractor_profiles')
    .select('qc_proposals_used_this_month, qc_billing_cycle_start')
    .eq('email', email)
    .single()
  const cycleStart = profile?.qc_billing_cycle_start
    ? new Date(profile.qc_billing_cycle_start).getTime()
    : 0
  const expired = cycleStart && (Date.now() - cycleStart >= THIRTY_DAYS_MS)
  const used = expired ? 0 : (profile?.qc_proposals_used_this_month || 0)
  const updates = { qc_proposals_used_this_month: used + 1 }
  if (expired || !cycleStart) updates.qc_billing_cycle_start = new Date().toISOString()
  await sb.from('contractor_profiles').update(updates).eq('email', email)
}

export async function logUsageEvent(email, eventType, metadata = {}) {
  const sb = getSupabaseAdmin()
  await sb.from('qc_usage_events').insert({
    user_email: email,
    event_type: eventType,
    metadata_json: metadata,
  })
}
