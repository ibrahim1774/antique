import OpenAI from 'openai'
import { getServerSession } from 'next-auth/next'
import { authOptions } from './auth/[...nextauth]'
import { getSupabaseAdmin } from '../../lib/supabase'
import { sendMetaEvent } from '../../lib/metaPixel'

export const config = { maxDuration: 60 }

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { imageUrl } = req.body
  if (!imageUrl) {
    return res.status(400).json({ error: 'imageUrl required' })
  }

  const session = await getServerSession(req, res, authOptions)

  // Check scan limit for authenticated users
  if (session) {
    const { data: user } = await getSupabaseAdmin()
      .from('users')
      .select('scan_count')
      .eq('email', session.user.email)
      .single()

    if (user && user.scan_count >= 2) {
      return res.status(402).json({ error: 'scan_limit_reached' })
    }
  }

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 1000,
      messages: [
        {
          role: 'system',
          content: `You are an expert antique appraiser and historian with decades of experience identifying antiques, collectibles, and vintage items from around the world. When shown a photo, identify the piece with maximum specificity. Be precise about maker's marks, patterns, periods, origins, and style characteristics when visible. If the image is too unclear to identify with confidence, be honest and set confidence to "low". Return ONLY valid JSON — no markdown, no code fences, no explanation text outside the JSON object.`
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Identify this antique and return ONLY this exact JSON structure:
{
  "itemName": "specific name e.g. Roseville Pottery Pinecone Vase #632-6",
  "category": "e.g. Art Pottery",
  "era": "e.g. 1930s–1940s",
  "origin": "e.g. Zanesville, Ohio, USA",
  "confidence": "high" or "moderate" or "low",
  "historicalContext": "2–3 sentences about this type of piece, its maker, and historical significance to collectors",
  "makersMarkDescription": "describe any visible marks, signatures, hallmarks, stamps, or labels — or null if none visible",
  "searchQuery": "best eBay search query to find comparable sold listings e.g. Roseville Pinecone vase"
}`
            },
            {
              type: 'image_url',
              image_url: { url: imageUrl, detail: 'high' }
            }
          ]
        }
      ]
    })

    const raw = completion.choices[0].message.content.trim()
    const cleaned = raw
      .replace(/^```json\n?/, '')
      .replace(/^```\n?/, '')
      .replace(/\n?```$/, '')
      .trim()

    let result
    try {
      result = JSON.parse(cleaned)
    } catch {
      return res.status(500).json({ error: 'Could not parse AI response. Try again.' })
    }

    // Increment scan count for authenticated users
    if (session) {
      const { data: currentUser } = await getSupabaseAdmin()
        .from('users')
        .select('scan_count')
        .eq('email', session.user.email)
        .single()

      await getSupabaseAdmin()
        .from('users')
        .update({ scan_count: (currentUser?.scan_count || 0) + 1 })
        .eq('email', session.user.email)

      await sendMetaEvent({
        eventName: 'AntiqueScan',
        userEmail: session.user.email,
        eventData: {
          category: result.category,
          confidence: result.confidence
        }
      })
    }

    return res.status(200).json({
      itemName: result.itemName || 'Unknown Item',
      category: result.category || 'Antique',
      era: result.era || 'Unknown era',
      origin: result.origin || 'Unknown origin',
      confidence: result.confidence || 'low',
      historicalContext: result.historicalContext || '',
      makersMarkDescription: result.makersMarkDescription || null,
      searchQuery: result.searchQuery || result.itemName || ''
    })

  } catch (err) {
    console.error('[OpenAI]', err.message)
    return res.status(500).json({
      error: 'Identification failed. Please try again with a clearer photo.'
    })
  }
}
