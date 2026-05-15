import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useSession, signIn } from 'next-auth/react'
import Layout from '../../components/contractor-quotes/Layout'
import qc from '../../styles/QuoteClear.module.css'
import app from '../../styles/QuoteClearApp.module.css'

// Every card shows every feature, with the differentiators highlighted
// so contractors can see exactly what they get and what's extra.
const PLANS = [
  {
    key: 'starter',
    label: 'Starter',
    price: '$5',
    unit: '/mo',
    tagline: 'For solo operators sending a handful of quotes a month.',
    features: [
      { label: '10 proposals per month',          included: true, highlight: true },
      { label: 'AI proposal rewriting (GPT-4o)',  included: true },
      { label: 'Customer share links',            included: true },
      { label: 'View tracking & status updates',  included: true },
      { label: 'Print / save-as-PDF',             included: true },
      { label: 'Basic templates',                 included: true },
      { label: '1 user',                          included: true },
      { label: 'Custom branding (logo + color)',  included: false },
      { label: 'Trade-specific templates',        included: false },
      { label: 'Change orders',                   included: false },
      { label: 'Priority support',                included: false },
    ],
  },
  {
    key: 'pro',
    label: 'Pro',
    price: '$9',
    unit: '/mo',
    tagline: 'For active contractors who quote weekly.',
    features: [
      { label: '30 proposals per month',          included: true, highlight: true },
      { label: 'AI proposal rewriting (GPT-4o)',  included: true },
      { label: 'Customer share links',            included: true },
      { label: 'View tracking & status updates',  included: true },
      { label: 'Print / save-as-PDF',             included: true },
      { label: 'Basic templates',                 included: true },
      { label: '1 user',                          included: true },
      { label: 'Custom branding (logo + color)',  included: true, highlight: true },
      { label: 'Trade-specific templates',        included: true, highlight: true },
      { label: 'Change orders',                   included: true, highlight: true },
      { label: 'Priority support',                included: true, highlight: true },
    ],
    featured: true,
    badge: 'Most Popular',
  },
  {
    key: 'scale',
    label: 'Scale',
    price: '$29',
    unit: '/mo',
    tagline: 'For crews running multiple jobs at once.',
    features: [
      { label: 'Unlimited proposals',             included: true, highlight: true },
      { label: 'AI proposal rewriting (GPT-4o)',  included: true },
      { label: 'Customer share links',            included: true },
      { label: 'View tracking & status updates',  included: true },
      { label: 'Print / save-as-PDF',             included: true },
      { label: 'Basic templates',                 included: true },
      { label: 'Custom branding (logo + color)',  included: true },
      { label: 'Trade-specific templates',        included: true },
      { label: 'Change orders',                   included: true },
      { label: 'Priority support',                included: true },
      { label: 'Up to 5 users',                   included: true, highlight: true },
      { label: 'Shared team templates',           included: true, highlight: true },
      { label: 'Approval workflow',               included: true, highlight: true },
    ],
  },
]

export default function Billing() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [billing, setBilling] = useState(null)
  const [loadingPlan, setLoadingPlan] = useState(null)
  const [portalLoading, setPortalLoading] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      signIn('google', { callbackUrl: '/contractor-quotes/billing' })
    }
  }, [status])

  useEffect(() => {
    if (status !== 'authenticated') return
    fetch('/api/contractor-quotes/billing/status')
      .then(r => r.ok ? r.json() : null)
      .then(setBilling)
  }, [status, router.query.session_id])

  async function startCheckout(planKey) {
    setLoadingPlan(planKey)
    try {
      const res = await fetch('/api/contractor-quotes/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: planKey }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        alert(data.error || 'Checkout unavailable.')
        setLoadingPlan(null)
      }
    } catch {
      alert('Network error.')
      setLoadingPlan(null)
    }
  }

  async function openPortal() {
    setPortalLoading(true)
    try {
      const res = await fetch('/api/contractor-quotes/stripe/portal', { method: 'POST' })
      const data = await res.json()
      if (data.url) window.location.href = data.url
      else { alert(data.error || 'Portal unavailable.'); setPortalLoading(false) }
    } catch {
      alert('Network error.')
      setPortalLoading(false)
    }
  }

  const justPaid = !!router.query.session_id
  const cancelled = !!router.query.cancelled
  const welcome = !!router.query.welcome
  const active = billing?.hasSubscription

  return (
    <Layout title="Billing — QuoteClear">
      <div className={qc.container}>
        <section className={app.appShell}>
          <div className={app.crumb}>
            <Link href="/contractor-quotes/dashboard">Dashboard</Link> · Billing
          </div>
          <h1 className={app.pageTitle}>
            {welcome && !active ? 'Pick a plan to get started' : 'Billing'}
          </h1>
          <p className={app.pageLede}>
            {welcome && !active
              ? 'Welcome to QuoteClear. Pick a plan to start sending proposals — every plan includes the full AI rewrite engine and shareable customer links.'
              : 'Pick the plan that fits how often you quote. Change or cancel anytime.'}
          </p>

          {justPaid && (
            <div className={app.paywallBox} style={{ color: '#7CC88C', borderColor: 'rgba(124,200,140,0.4)', background: 'rgba(124,200,140,0.10)' }}>
              <strong>Thanks!</strong> Your subscription is being activated. Refresh in a few seconds if your plan doesn&apos;t show below yet.
            </div>
          )}
          {cancelled && (
            <div className={app.paywallBox}>
              Checkout cancelled. Pick a plan when you&apos;re ready.
            </div>
          )}

          {active && billing?.plan && (
            <div className={app.dashStats} style={{ marginBottom: 28 }}>
              <div className={app.dashStat}>
                <div className={app.dashStatLabel}>Current plan</div>
                <div className={app.dashStatValue}>{billing.plan[0].toUpperCase() + billing.plan.slice(1)}</div>
              </div>
              <div className={app.dashStat}>
                <div className={app.dashStatLabel}>Usage this month</div>
                <div className={app.dashStatValue}>
                  {billing.used} / {billing.quota ?? '∞'}
                </div>
                <div className={app.dashStatSub}>
                  {billing.quota
                    ? `${Math.max(0, billing.quota - billing.used)} proposals left`
                    : 'No monthly cap'}
                </div>
              </div>
              <div className={app.dashStat}>
                <div className={app.dashStatLabel}>Manage</div>
                <button
                  type="button"
                  className={qc.btnGhost}
                  onClick={openPortal}
                  disabled={portalLoading}
                  style={{ marginTop: 4 }}
                >
                  {portalLoading ? 'Loading…' : 'Open Stripe portal →'}
                </button>
              </div>
            </div>
          )}

          <div className={qc.pricingGrid}>
            {PLANS.map(p => {
              const isCurrent = active && billing.plan === p.key
              return (
                <div
                  key={p.key}
                  className={`${qc.priceCard} ${p.featured ? qc.priceFeatured : ''}`}
                >
                  {p.badge && !isCurrent && <span className={qc.priceBadge}>{p.badge}</span>}
                  {isCurrent && <span className={qc.priceBadge}>Current plan</span>}
                  <div className={qc.priceLabel}>{p.label}</div>
                  <div className={qc.priceAmount}>
                    <span className={qc.priceNum}>{p.price}</span>
                    <span className={qc.priceUnit}>{p.unit}</span>
                  </div>
                  <p className={qc.priceTagline}>{p.tagline}</p>
                  <ul className={qc.priceList}>
                    {p.features.map(f => (
                      <li
                        key={f.label}
                        className={f.highlight ? qc.priceFeatureHighlight : (f.included ? '' : qc.priceFeatureOff)}
                      >
                        <span className={f.included ? qc.priceCheck : qc.priceCheckOff}>
                          {f.included ? '✓' : '—'}
                        </span>
                        {f.label}
                      </li>
                    ))}
                  </ul>
                  {isCurrent ? (
                    <button
                      type="button"
                      className={qc.priceCta}
                      onClick={openPortal}
                      disabled={portalLoading}
                    >
                      {portalLoading ? 'Loading…' : 'Manage in Stripe'}
                    </button>
                  ) : (
                    <button
                      type="button"
                      className={`${qc.priceCta} ${p.featured ? qc.priceCtaFeatured : ''}`}
                      onClick={() => startCheckout(p.key)}
                      disabled={loadingPlan !== null}
                    >
                      {loadingPlan === p.key
                        ? 'Loading…'
                        : active ? `Switch to ${p.label}` : `Choose ${p.label}`}
                    </button>
                  )}
                </div>
              )
            })}
          </div>

          <p style={{ marginTop: 28, fontSize: 12.5, color: 'var(--qc-text-dim)', textAlign: 'center' }}>
            Cancel anytime · Secure Stripe checkout · Plans are monthly, prorated when you switch.
          </p>
        </section>
      </div>
    </Layout>
  )
}
