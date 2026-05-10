import { getStripe } from '../../../lib/stripe'
import { getSupabaseAdmin } from '../../../lib/supabase'
import { TOPUP_SCANS_PER_PURCHASE } from '../../../lib/stripe'
import { sendMetaEvent } from '../../../lib/metaPixel'

export const config = { api: { bodyParser: false } }

async function getRawBody(req) {
  const chunks = []
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk)
  }
  return Buffer.concat(chunks)
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const stripe = getStripe()
  const sig = req.headers['stripe-signature']
  let event

  try {
    const buf = await getRawBody(req)
    event = stripe.webhooks.constructEvent(buf, sig, process.env.STRIPE_WEBHOOK_SECRET)
  } catch (err) {
    console.error('[stripe webhook signature]', err.message)
    return res.status(400).send(`Webhook Error: ${err.message}`)
  }

  const sb = getSupabaseAdmin()

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const sess = event.data.object
        const email = sess.metadata?.email
        if (!email) break

        if (sess.mode === 'subscription') {
          const sub = await stripe.subscriptions.retrieve(sess.subscription)
          await sb.from('users').update({
            stripe_customer_id: sess.customer,
            subscription_status: sub.status,
            subscription_plan: sess.metadata.plan,
            subscription_current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
            scan_period_start: new Date().toISOString(),
            monthly_scans_used: 0,
          }).eq('email', email)

          await sendMetaEvent({
            eventName: 'Subscribe',
            userEmail: email,
            eventData: {
              currency: 'USD',
              value: sess.amount_total ? sess.amount_total / 100 : null,
              plan: sess.metadata.plan,
            },
          })
        } else if (sess.mode === 'payment' && sess.metadata.type === 'topup') {
          const { data: u } = await sb
            .from('users')
            .select('topup_scans')
            .eq('email', email)
            .single()
          await sb.from('users').update({
            topup_scans: (u?.topup_scans || 0) + TOPUP_SCANS_PER_PURCHASE,
          }).eq('email', email)

          await sendMetaEvent({
            eventName: 'Purchase',
            userEmail: email,
            eventData: {
              currency: 'USD',
              value: sess.amount_total ? sess.amount_total / 100 : null,
              type: 'topup',
            },
          })
        }
        break
      }

      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const sub = event.data.object
        await sb.from('users').update({
          subscription_status: sub.status,
          subscription_current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
        }).eq('stripe_customer_id', sub.customer)
        break
      }

      case 'invoice.payment_succeeded': {
        const inv = event.data.object
        if (inv.billing_reason === 'subscription_cycle') {
          await sb.from('users').update({
            scan_period_start: new Date().toISOString(),
            monthly_scans_used: 0,
          }).eq('stripe_customer_id', inv.customer)
        }
        break
      }
    }
  } catch (err) {
    console.error('[stripe webhook handler]', err)
    return res.status(500).json({ error: 'handler_failed' })
  }

  return res.status(200).json({ received: true })
}
