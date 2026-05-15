import OpenAI from 'openai'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]'
import { getSupabaseAdmin } from '../../../lib/supabase'
import {
  getOrCreateContractorProfile,
  getQcUsage,
  isQcActive,
  bumpProposalsUsed,
  logUsageEvent,
} from '../../../lib/quoteclear'

export const config = {
  maxDuration: 60,
  api: { bodyParser: { sizeLimit: '256kb' } },
}

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

const SYSTEM_PROMPT = `You are a senior estimator writing a customer-facing proposal for a small contracting business. Rewrite the contractor's rough estimate into a clear, friendly, plain-English proposal a homeowner can understand.

Rules:
1. NEVER invent or change prices — only reorganize, restate, and clarify what the contractor provided. If a quantity or unit is missing, leave it null, do not guess.
2. Always include an "exclusions" array protecting the contractor (permits, hidden conditions, code upgrades unless quoted, etc.).
3. Customer-friendly language, no trade jargon unless explained.
4. Confident, warm, plainspoken — trusted local pro, not corporate.
5. Return ONLY valid JSON matching the schema. No markdown, no code fences, no preamble.`

const USER_SCHEMA = `Return ONLY this exact JSON shape:
{
  "title": "short job title, e.g. 'Full Roof Replacement — 123 Main St'",
  "summary": "2–3 sentence overview",
  "scope_of_work": ["bullet", "bullet"],
  "line_items": [
    {"description": "...", "quantity": 1, "unit": "ea | sq | hr | day | ...", "unit_price": 1200, "total": 1200, "category": "labor | materials | other"}
  ],
  "assumptions": ["what's included by default"],
  "exclusions": ["what's NOT included — protect the contractor"],
  "timeline": {"start": "e.g. within 2 weeks", "duration_days": 3},
  "payment_terms": "e.g. 50% deposit, 50% on completion",
  "why_this_price": "optional plain-English rationale, max 2 sentences",
  "total_amount": 12345
}`

function parseJsonLoose(raw) {
  try { return JSON.parse(raw) } catch {}
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

  const { estimate, customer_name, customer_email, customer_address } = req.body || {}
  if (!estimate || typeof estimate !== 'string' || estimate.trim().length < 20) {
    return res.status(400).json({ error: 'Please paste an estimate of at least 20 characters.' })
  }
  if (estimate.length > 16000) {
    return res.status(400).json({ error: 'Estimate is too long. Trim it under ~16k characters.' })
  }

  const email = session.user.email
  const profile = await getOrCreateContractorProfile(email)
  const active = isQcActive(profile)
  const usage = getQcUsage(profile)

  // Subscription + quota gate. Milestone 4 wires Stripe; until then any
  // signed-in user has 0 quota and will be paywalled here.
  if (!active || usage.remaining <= 0) {
    return res.status(402).json({
      error: 'paywall',
      hasSubscription: active,
      plan: usage.plan,
      used: usage.used,
      quota: usage.quota === Number.POSITIVE_INFINITY ? null : usage.quota,
    })
  }

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      temperature: 0.3,
      max_tokens: 2200,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: `${USER_SCHEMA}\n\nContractor trade: ${profile.trade_type || 'unknown'}\nCompany: ${profile.company_name || '(not set yet)'}\n\nRough estimate:\n${estimate}`,
        },
      ],
    })

    const raw = completion.choices[0]?.message?.content?.trim() || ''
    const parsed = parseJsonLoose(raw)
    if (!parsed) {
      console.error('[qc generate] unparseable:', raw.slice(0, 300))
      return res.status(500).json({ error: 'AI response could not be parsed. Try again.' })
    }

    // Persist as a draft proposal
    const sb = getSupabaseAdmin()
    const { data: proposal, error: pErr } = await sb
      .from('qc_proposals')
      .insert({
        user_email: email,
        title: parsed.title || 'Untitled Proposal',
        customer_name: customer_name || null,
        customer_email: customer_email || null,
        customer_address: customer_address || null,
        trade_type: profile.trade_type || null,
        raw_input: estimate,
        ai_output_json: parsed,
        total_amount: typeof parsed.total_amount === 'number' ? parsed.total_amount : null,
        status: 'draft',
      })
      .select('*')
      .single()
    if (pErr) {
      console.error('[qc generate] insert proposal:', pErr.message)
      return res.status(500).json({ error: 'Could not save proposal.' })
    }

    // Persist line items if present
    if (Array.isArray(parsed.line_items) && parsed.line_items.length) {
      const rows = parsed.line_items.map((li, idx) => ({
        proposal_id: proposal.id,
        description: li.description || null,
        quantity: typeof li.quantity === 'number' ? li.quantity : null,
        unit_price: typeof li.unit_price === 'number' ? li.unit_price : null,
        total: typeof li.total === 'number' ? li.total : null,
        category: li.category || 'other',
        sort_order: idx,
      }))
      await sb.from('qc_proposal_line_items').insert(rows)
    }

    await bumpProposalsUsed(email)
    await logUsageEvent(email, 'proposal_generated', { proposal_id: proposal.id })

    return res.status(200).json({ id: proposal.id })
  } catch (err) {
    console.error('[qc generate openai]', err.message)
    return res.status(500).json({ error: 'Generation failed. Please try again.' })
  }
}
