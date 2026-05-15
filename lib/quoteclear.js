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
