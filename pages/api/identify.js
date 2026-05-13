import OpenAI from 'openai'
import { getServerSession } from 'next-auth/next'
import { authOptions } from './auth/[...nextauth]'
import { getSupabaseAdmin } from '../../lib/supabase'
import { sendMetaEvent } from '../../lib/metaPixel'
import { quotaForPlan } from '../../lib/stripe'

export const config = {
  maxDuration: 60,
  api: { bodyParser: { sizeLimit: '40mb' } },
}

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000

function parseAIJson(raw) {
  try { return JSON.parse(raw) } catch {}
  const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()
  try { return JSON.parse(cleaned) } catch {}
  const m = raw.match(/\{[\s\S]*\}/)
  if (!m) return null
  try { return JSON.parse(m[0]) } catch { return null }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const session = await getServerSession(req, res, authOptions)
  if (!session) return res.status(401).json({ error: 'auth_required' })

  const { imageUrl, imageUrls } = req.body
  const images = imageUrls?.length ? imageUrls : imageUrl ? [imageUrl] : []
  if (!images.length) return res.status(400).json({ error: 'imageUrl required' })

  const sb = getSupabaseAdmin()
  const { data: user } = await sb
    .from('users')
    .select('subscription_status, subscription_plan, scan_period_start, monthly_scans_used, topup_scans')
    .eq('email', session.user.email)
    .single()

  let monthlyUsed = user?.monthly_scans_used || 0
  let periodStartMs = user?.scan_period_start ? new Date(user.scan_period_start).getTime() : 0
  const now = Date.now()
  if (now - periodStartMs >= THIRTY_DAYS_MS) {
    monthlyUsed = 0
    periodStartMs = now
  }

  const hasActiveSub =
    user?.subscription_status === 'active' || user?.subscription_status === 'trialing'
  const monthlyQuota = quotaForPlan(user?.subscription_plan)
  const subQuotaLeft = hasActiveSub ? Math.max(0, monthlyQuota - monthlyUsed) : 0
  const topupLeft = user?.topup_scans || 0

  if (subQuotaLeft + topupLeft <= 0) {
    return res.status(402).json({
      error: 'paywall',
      hasSubscription: hasActiveSub,
      monthlyUsed,
      monthlyQuota,
      topupScans: topupLeft,
    })
  }

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 1500,
      messages: [
        {
          role: 'system',
          content: `You are an expert antique appraiser, historian, and authenticator with decades of experience identifying antiques, collectibles, vintage items, jewelry, silverware, furniture, ceramics, glass, coins, watches, and art from around the world. You assess maker's marks, patterns, periods, origins, materials, construction methods, patina, and condition with precision. You provide realistic USD market value ranges based on comparable sold listings and current collector demand. You assess authenticity by looking for signs of reproduction, modern manufacturing, anachronistic features, or fakery. If an image is unclear, set confidence to "low" and authenticity to "uncertain". Return ONLY valid JSON — no markdown, no fences, no commentary.`,
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Identify this antique from the ${images.length > 1 ? `${images.length} photos provided (different angles / details)` : 'photo provided'} and return ONLY this exact JSON structure:
{
  "itemName": "specific name e.g. Roseville Pottery Pinecone Vase #632-6",
  "category": "one of: Pottery, Jewelry, Furniture, Silverware, Coins, Art, Watches, Glass, Toys, Books, Other",
  "era": "e.g. 1930s–1940s",
  "origin": "e.g. Zanesville, Ohio, USA",
  "confidence": "high" or "moderate" or "low",
  "historicalContext": "2–3 sentences about this type of piece, its maker, and historical significance",
  "makersMarkDescription": "describe any visible marks, signatures, hallmarks, stamps — or null",
  "materials": "e.g. glazed earthenware, sterling silver, oak with brass fittings",
  "condition": "Mint" or "Near Mint" or "Excellent" or "Very Fine" or "Fine" or "Very Good" or "Good" or "Fair" or "Poor",
  "estimatedValueLow": <integer USD>,
  "estimatedValueHigh": <integer USD>,
  "valueNotes": "1 sentence on what drives the range (rarity, demand, condition)",
  "authenticity": "authentic" or "likely_authentic" or "likely_fake" or "uncertain",
  "authenticitySignals": ["1-4 short observations like 'Genuine maker mark visible' or 'Modern Phillips screws inconsistent with period'"],
  "searchQuery": "best eBay search query for comparable sold listings"
}`,
            },
            ...images.map(url => ({ type: 'image_url', image_url: { url, detail: 'high' } })),
          ],
        },
      ],
    })

    const raw = completion.choices[0].message.content.trim()
    const result = parseAIJson(raw)
    if (!result) {
      console.error('[identify] unparseable:', raw.slice(0, 300))
      return res.status(500).json({ error: 'Could not parse AI response. Try again.' })
    }

    // Deduct: subscription quota first, then top-up
    const updates = {}
    if (subQuotaLeft > 0) {
      updates.monthly_scans_used = monthlyUsed + 1
      updates.scan_period_start = new Date(periodStartMs).toISOString()
    } else {
      updates.topup_scans = topupLeft - 1
    }
    await sb.from('users').update(updates).eq('email', session.user.email)

    await sendMetaEvent({
      eventName: 'AntiqueScan',
      userEmail: session.user.email,
      eventData: {
        category: result.category,
        confidence: result.confidence,
        authenticity: result.authenticity,
      },
    })

    return res.status(200).json({
      itemName: result.itemName || 'Unknown Item',
      category: result.category || 'Other',
      era: result.era || 'Unknown era',
      origin: result.origin || 'Unknown origin',
      confidence: result.confidence || 'low',
      historicalContext: result.historicalContext || '',
      makersMarkDescription: result.makersMarkDescription || null,
      materials: result.materials || null,
      condition: result.condition || null,
      estimatedValueLow: typeof result.estimatedValueLow === 'number' ? result.estimatedValueLow : null,
      estimatedValueHigh: typeof result.estimatedValueHigh === 'number' ? result.estimatedValueHigh : null,
      valueNotes: result.valueNotes || null,
      authenticity: result.authenticity || 'uncertain',
      authenticitySignals: Array.isArray(result.authenticitySignals) ? result.authenticitySignals : [],
      searchQuery: result.searchQuery || result.itemName || '',
    })
  } catch (err) {
    console.error('[OpenAI]', err.message)
    return res.status(500).json({
      error: 'Identification failed. Please try again with a clearer photo.',
    })
  }
}
