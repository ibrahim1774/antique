import OpenAI from 'openai'
import { checkDemoRateLimit, getClientIp, hashIp, recordDemoUsage } from '../../../lib/quoteclear'

export const config = {
  maxDuration: 60,
  api: { bodyParser: { sizeLimit: '128kb' } },
}

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

const SYSTEM_PROMPT = `You are a senior estimator writing a customer-facing proposal for a small contracting business. Rewrite the contractor's rough estimate into a clear, friendly, plain-English proposal a homeowner can understand.

Rules:
1. NEVER invent or change prices — only reorganize, restate, and clarify what the contractor provided. If a quantity or unit is missing, leave it blank, do not guess.
2. Always include an "exclusions" section protecting the contractor (permits, hidden conditions, code upgrades unless quoted, etc.).
3. Customer-friendly language, no trade jargon unless explained.
4. Confident, warm, plainspoken — trusted local pro, not corporate.
5. Use clear markdown-style section headers. No code fences, no JSON, no preamble.

Structure your output as:

## Project Summary
2–3 sentence overview.

## Scope of Work
Bulleted list of what the contractor will do.

## Line Items
Markdown table: Description | Qty | Unit Price | Total

## Included
What's part of this proposal.

## Excluded
What's NOT part of this proposal — protect the contractor here.

## Timeline
Estimated start window and duration.

## Payment Terms
Deposit and balance terms.`

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { estimate } = req.body || {}
  if (!estimate || typeof estimate !== 'string' || estimate.trim().length < 20) {
    return res.status(400).json({ error: 'Please paste an estimate of at least 20 characters.' })
  }
  if (estimate.length > 8000) {
    return res.status(400).json({ error: 'Estimate is too long for the demo. Sign in to process the full version.' })
  }

  const ip = getClientIp(req)
  const ipHash = hashIp(ip)

  try {
    const rate = await checkDemoRateLimit(ipHash)
    if (!rate.ok) {
      const msg = rate.reason === 'global_cap'
        ? 'The demo has hit its daily limit. Sign in to keep going — your plan never runs out like this.'
        : 'You\'ve used the free demo today. Sign in to generate unlimited proposals on a paid plan.'
      return res.status(429).json({ error: msg })
    }
    await recordDemoUsage(ipHash)
  } catch (err) {
    console.error('[qc demo rate-limit]', err.message)
    // Fail open — don't block users if the rate-limit table is temporarily unreachable.
  }

  res.setHeader('Content-Type', 'text/plain; charset=utf-8')
  res.setHeader('Cache-Control', 'no-cache, no-transform')
  res.setHeader('X-Accel-Buffering', 'no')

  try {
    const stream = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      stream: true,
      temperature: 0.4,
      max_tokens: 1200,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: `Here is the contractor's rough estimate. Rewrite it as a customer-ready proposal following the structure above.\n\n${estimate}` },
      ],
    })

    for await (const chunk of stream) {
      const delta = chunk.choices?.[0]?.delta?.content
      if (delta) res.write(delta)
    }
    res.end()
  } catch (err) {
    console.error('[qc demo openai]', err.message)
    if (!res.headersSent) {
      return res.status(500).json({ error: 'The demo is temporarily unavailable. Please try again.' })
    }
    res.write('\n\n[Stream interrupted — please try again.]')
    res.end()
  }
}
