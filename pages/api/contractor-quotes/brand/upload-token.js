import { handleUpload } from '@vercel/blob/client'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../auth/[...nextauth]'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const session = await getServerSession(req, res, authOptions)
  if (!session) return res.status(401).json({ error: 'auth_required' })

  try {
    const jsonResponse = await handleUpload({
      body: req.body,
      request: req,
      onBeforeGenerateToken: async () => ({
        allowedContentTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'],
        maximumSizeInBytes: 2 * 1024 * 1024,
        tokenPayload: JSON.stringify({ email: session.user.email }),
      }),
      onUploadCompleted: async () => {
        // No-op — the client immediately PATCHes the profile with the URL.
      },
    })
    return res.status(200).json(jsonResponse)
  } catch (err) {
    console.error('[qc brand upload]', err.message)
    return res.status(500).json({ error: err.message })
  }
}
