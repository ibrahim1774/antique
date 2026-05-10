import OpenAI from 'openai'
import { getServerSession } from 'next-auth/next'
import { authOptions } from './auth/[...nextauth]'
import { getSupabaseAdmin } from '../../lib/supabase'

export const config = { maxDuration: 60 }

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

// AI helper is gated behind active subscription (no scan deduction — chat only)
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const session = await getServerSession(req, res, authOptions)
  if (!session) return res.status(401).json({ error: 'auth_required' })

  const sb = getSupabaseAdmin()
  const { data: user } = await sb
    .from('users')
    .select('subscription_status, topup_scans')
    .eq('email', session.user.email)
    .single()

  const hasActiveSub =
    user?.subscription_status === 'active' || user?.subscription_status === 'trialing'
  if (!hasActiveSub && (user?.topup_scans || 0) <= 0) {
    return res.status(402).json({ error: 'paywall' })
  }

  const { messages } = req.body
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'messages required' })
  }

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 800,
      messages: [
        {
          role: 'system',
          content: `You are an expert antique appraiser, historian, and authenticator. You help collectors, pickers, and curious owners research their pieces. Give precise, useful answers about identification, materials, periods, makers, hallmarks, authenticity signals, valuation factors, restoration impact, and where to research further. Be candid when something is hard to assess without seeing the piece. Always include the safety note that you provide research starting points only — not formal appraisals — when value or authenticity questions are asked. Keep responses focused and well-structured. Use short paragraphs and bullet points where helpful. Never invent maker marks or auction prices.`,
        },
        ...messages.slice(-10), // last 10 turns
      ],
    })

    return res.status(200).json({
      reply: completion.choices[0].message.content,
    })
  } catch (err) {
    console.error('[helper]', err.message)
    return res.status(500).json({ error: 'helper_failed' })
  }
}
