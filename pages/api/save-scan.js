import { getServerSession } from 'next-auth/next'
import { authOptions } from './auth/[...nextauth]'
import { getSupabaseAdmin } from '../../lib/supabase'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const session = await getServerSession(req, res, authOptions)
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const { imageUrl, result } = req.body
  if (!imageUrl || !result) {
    return res.status(400).json({ error: 'Missing data' })
  }

  const { data: user, error: userErr } = await getSupabaseAdmin()
    .from('users')
    .select('id')
    .eq('email', session.user.email)
    .single()

  if (userErr || !user) {
    return res.status(404).json({ error: 'User not found' })
  }

  const { data: scan, error } = await getSupabaseAdmin()
    .from('scans')
    .insert({
      user_id: user.id,
      image_url: imageUrl,
      item_name: result.itemName,
      category: result.category,
      era: result.era,
      origin: result.origin,
      confidence: result.confidence,
      historical_context: result.historicalContext,
      makers_mark: result.makersMarkDescription,
      search_query: result.searchQuery
    })
    .select()
    .single()

  if (error) {
    return res.status(500).json({ error: 'Failed to save scan' })
  }

  return res.status(200).json({ success: true, scanId: scan.id })
}
