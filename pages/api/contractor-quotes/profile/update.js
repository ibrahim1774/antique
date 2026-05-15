import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../auth/[...nextauth]'
import { getSupabaseAdmin } from '../../../../lib/supabase'

const ALLOWED = [
  'company_name', 'trade_type', 'phone', 'logo_url',
  'brand_color', 'address', 'license_number',
]

export default async function handler(req, res) {
  if (req.method !== 'POST' && req.method !== 'PATCH') return res.status(405).end()

  const session = await getServerSession(req, res, authOptions)
  if (!session) return res.status(401).json({ error: 'auth_required' })

  const updates = req.body || {}
  const safe = {}
  for (const k of ALLOWED) {
    if (k in updates) safe[k] = updates[k]
  }
  if (Object.keys(safe).length === 0) return res.status(400).json({ error: 'no_fields' })

  const sb = getSupabaseAdmin()
  // Upsert ensures profile exists for first-time settings save
  const { error } = await sb
    .from('contractor_profiles')
    .upsert({ email: session.user.email, ...safe }, { onConflict: 'email' })

  if (error) {
    console.error('[qc profile update]', error.message)
    return res.status(500).json({ error: 'update_failed' })
  }
  return res.status(200).json({ ok: true })
}
