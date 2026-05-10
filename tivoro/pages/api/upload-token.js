import { handleUpload } from '@vercel/blob/client'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).end()
  }
  try {
    const jsonResponse = await handleUpload({
      body: req.body,
      request: req,
      onBeforeGenerateToken: async () => ({
        allowedContentTypes: [
          'image/jpeg',
          'image/jpg',
          'image/png',
          'image/webp',
          'image/heic'
        ],
        maximumSizeInBytes: 10 * 1024 * 1024
      }),
      onUploadCompleted: async ({ blob }) => {
        console.log('[Blob upload]', blob.url)
      }
    })
    return res.status(200).json(jsonResponse)
  } catch (err) {
    return res.status(400).json({ error: err.message })
  }
}
