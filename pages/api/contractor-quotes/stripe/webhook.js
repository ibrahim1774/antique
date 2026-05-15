import { getStripe } from '../../../../lib/stripe'
import { getSupabaseAdmin } from '../../../../lib/supabase'
import { sendMetaEvent } from '../../../../lib/metaPixel'

export const config = { api: { bodyParser: false } }

async function getRawBody(req) {
  const chunks = []
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk)
  }
  return Buffer.concat(chunks)
}

const PLAN_BY_AMOUNT = {
  500:  'starter',
  900:  'pro',
  2900: 'scale',
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const stripe = getStripe()
  const secret = process.env.STRIPE_QC_WEBHOOK_SECRET
  if (!secret) {
    console.error('[qc webhook] STRIPE_QC_WEBHOOK_SECRET not set')
    return res.status(500).json({ error: 'webhook_secret_missing' })
  }

  let event
  try {
    const sig = req.headers['stripe-signature']
    const raw = await getRawBody(req)
    event = stripe.webhooks.constructEvent(raw, sig, secret)
  } catch (err) {
    console.error('[qc webhook] signature failed:', err.message)
    return res.status(400).json({ error: `webhook_error: ${err.message}` })
  }

  const sb = getSupabaseAdmin()

  // Only handle events that originated from QuoteClear checkouts.
  // Metadata is set on both Checkout Session AND the Subscription itself.
  function isQc(obj) {
    return obj?.metadata?.product === 'quoteclear'
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const sess = event.data.object
        if (!isQc(sess)) break

        const email = sess.metadata?.email
        if (!email) {
          console.warn('[qc webhook] checkout.completed missing email')
          break
        }

        if (sess.mode === 'subscription' && sess.subscription) {
          const sub = await stripe.subscriptions.retrieve(sess.subscription)
          await sb.from('contractor_profiles').upsert({
            email,
            qc_stripe_customer_id: sess.customer,
            qc_stripe_subscription_id: sub.id,
            qc_subscription_status: sub.status,
            qc_plan: sess.metadata.plan || null,
            qc_billing_cycle_start: new Date().toISOString(),
            qc_proposals_used_this_month: 0,
          }, { onConflict: 'email' })

          await sendMetaEvent({
            eventName: 'Subscribe',
            userEmail: email,
            eventData: {
              currency: 'USD',
              value: sess.amount_total ? sess.amount_total / 100 : null,
              plan: sess.metadata.plan,
              product: 'quoteclear',
            },
          })
        }
        break
      }

      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const sub = event.data.object
        if (!isQc(sub)) break
        const email = sub.metadata?.email
        if (!email) break

        // Detect plan from the active price amount
        const amount = sub.items?.data?.[0]?.price?.unit_amount
        const plan = PLAN_BY_AMOUNT[amount] || null

        // Reset cycle on renewal (period_start changes when Stripe rolls over).
        const update = {
          qc_subscription_status: sub.status,
          qc_plan: plan,
        }
        if (event.type === 'customer.subscription.updated' && sub.current_period_start) {
          update.qc_billing_cycle_start = new Date(sub.current_period_start * 1000).toISOString()
          update.qc_proposals_used_this_month = 0
        }
        await sb.from('contractor_profiles').update(update).eq('email', email)
        break
      }

      default:
        // Ignore other events
        break
    }
  } catch (err) {
    console.error('[qc webhook] handler error:', err.message)
    return res.status(500).json({ error: 'handler_failed' })
  }

  return res.status(200).json({ received: true })
}
