import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../auth/[...nextauth]'
import { getOrCreateContractorProfile } from '../../../../lib/quoteclear'

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end()

  const session = await getServerSession(req, res, authOptions)
  if (!session) return res.status(401).json({ error: 'auth_required' })

  try {
    const profile = await getOrCreateContractorProfile(session.user.email)
    return res.status(200).json({ profile })
  } catch (err) {
    console.error('[qc profile get]', err.message)
    return res.status(500).json({ error: 'load_failed' })
  }
}
