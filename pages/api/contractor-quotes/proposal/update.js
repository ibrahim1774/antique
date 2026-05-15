import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../auth/[...nextauth]'
import { getSupabaseAdmin } from '../../../../lib/supabase'

const ALLOWED_FIELDS = [
  'title', 'customer_name', 'customer_email', 'customer_address',
  'trade_type', 'final_content', 'total_amount', 'status',
]

export default async function handler(req, res) {
  if (req.method !== 'POST' && req.method !== 'PATCH') return res.status(405).end()

  const session = await getServerSession(req, res, authOptions)
  if (!session) return res.status(401).json({ error: 'auth_required' })

  const { id, updates, items } = req.body || {}
  if (!id) return res.status(400).json({ error: 'id_required' })

  const sb = getSupabaseAdmin()

  // Ensure ownership
  const { data: existing, error: ownErr } = await sb
    .from('qc_proposals')
    .select('id')
    .eq('id', id)
    .eq('user_email', session.user.email)
    .maybeSingle()
  if (ownErr || !existing) return res.status(404).json({ error: 'not_found' })

  if (updates && typeof updates === 'object') {
    const safe = {}
    for (const k of ALLOWED_FIELDS) {
      if (k in updates) safe[k] = updates[k]
    }
    safe.updated_at = new Date().toISOString()
    const { error: uErr } = await sb.from('qc_proposals').update(safe).eq('id', id)
    if (uErr) {
      console.error('[qc update proposal]', uErr.message)
      return res.status(500).json({ error: 'update_failed' })
    }
  }

  if (Array.isArray(items)) {
    // Replace strategy — delete then insert. Simple and correct for small N.
    await sb.from('qc_proposal_line_items').delete().eq('proposal_id', id)
    const rows = items
      .filter(li => li && (li.description || li.total != null))
      .map((li, idx) => ({
        proposal_id: id,
        description: li.description || null,
        quantity: typeof li.quantity === 'number' ? li.quantity : null,
        unit_price: typeof li.unit_price === 'number' ? li.unit_price : null,
        total: typeof li.total === 'number' ? li.total : null,
        category: li.category || 'other',
        is_optional: !!li.is_optional,
        sort_order: idx,
      }))
    if (rows.length) {
      const { error: iErr } = await sb.from('qc_proposal_line_items').insert(rows)
      if (iErr) {
        console.error('[qc update items]', iErr.message)
        return res.status(500).json({ error: 'items_update_failed' })
      }
    }
  }

  return res.status(200).json({ ok: true })
}
