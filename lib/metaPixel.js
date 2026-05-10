import crypto from 'crypto'

export async function sendMetaEvent({ eventName, userEmail, eventData = {} }) {
  try {
    const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID
    const accessToken = process.env.META_ACCESS_TOKEN
    if (!pixelId || !accessToken) return

    const hashedEmail = crypto
      .createHash('sha256')
      .update(userEmail.toLowerCase().trim())
      .digest('hex')

    await fetch(
      `https://graph.facebook.com/v18.0/${pixelId}/events`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: [{
            event_name: eventName,
            event_time: Math.floor(Date.now() / 1000),
            action_source: 'website',
            user_data: { em: [hashedEmail] },
            custom_data: eventData
          }],
          access_token: accessToken
        })
      }
    )
  } catch (err) {
    console.error('[Meta Pixel]', err.message)
  }
}
