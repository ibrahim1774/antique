import { getSupabaseAdmin } from '../../../../lib/supabase'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { share_token, action, signature } = req.body || {}
  if (!share_token || !['accept', 'decline'].includes(action)) {
    return res.status(400).json({ error: 'bad_request' })
  }
  if (action === 'accept' && (!signature || typeof signature !== 'string' || signature.trim().length < 2)) {
    return res.status(400).json({ error: 'signature_required' })
  }

  const sb = getSupabaseAdmin()
  const { data: proposal, error: pErr } = await sb
    .from('qc_proposals')
    .select('id, user_email, status')
    .eq('share_token', share_token)
    .maybeSingle()
  if (pErr || !proposal) return res.status(404).json({ error: 'not_found' })

  if (proposal.status === 'accepted' || proposal.status === 'declined') {
    return res.status(409).json({ error: 'already_finalized' })
  }

  const newStatus = action === 'accept' ? 'accepted' : 'declined'
  const updates = { status: newStatus }
  if (action === 'accept') updates.accepted_at = new Date().toISOString()

  const { error: uErr } = await sb.from('qc_proposals').update(updates).eq('id', proposal.id)
  if (uErr) {
    console.error('[qc accept]', uErr.message)
    return res.status(500).json({ error: 'update_failed' })
  }

  await sb.from('qc_usage_events').insert({
    user_email: proposal.user_email,
    event_type: action === 'accept' ? 'proposal_accepted' : 'proposal_declined',
    metadata_json: action === 'accept'
      ? { proposal_id: proposal.id, signature: signature.trim() }
      : { proposal_id: proposal.id },
  })

  return res.status(200).json({ ok: true, status: newStatus })
}
