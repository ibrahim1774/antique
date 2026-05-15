import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../auth/[...nextauth]'
import { getSupabaseAdmin } from '../../../../lib/supabase'

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end()

  const session = await getServerSession(req, res, authOptions)
  if (!session) return res.status(401).json({ error: 'auth_required' })

  const { id } = req.query
  if (!id) return res.status(400).json({ error: 'id_required' })

  const sb = getSupabaseAdmin()
  const { data: proposal, error: pErr } = await sb
    .from('qc_proposals')
    .select('*')
    .eq('id', id)
    .eq('user_email', session.user.email)
    .maybeSingle()

  if (pErr) {
    console.error('[qc get]', pErr.message)
    return res.status(500).json({ error: 'Could not load proposal.' })
  }
  if (!proposal) return res.status(404).json({ error: 'not_found' })

  const { data: items } = await sb
    .from('qc_proposal_line_items')
    .select('*')
    .eq('proposal_id', id)
    .order('sort_order', { ascending: true })

  return res.status(200).json({ proposal, items: items || [] })
}
