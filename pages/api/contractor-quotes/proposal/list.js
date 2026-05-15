import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../auth/[...nextauth]'
import { getSupabaseAdmin } from '../../../../lib/supabase'

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end()

  const session = await getServerSession(req, res, authOptions)
  if (!session) return res.status(401).json({ error: 'auth_required' })

  const sb = getSupabaseAdmin()
  const { data, error } = await sb
    .from('qc_proposals')
    .select('id, title, customer_name, status, total_amount, share_token, viewed_at, accepted_at, created_at, updated_at')
    .eq('user_email', session.user.email)
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) {
    console.error('[qc list]', error.message)
    return res.status(500).json({ error: 'Could not load proposals.' })
  }
  return res.status(200).json({ proposals: data || [] })
}
