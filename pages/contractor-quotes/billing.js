import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useSession, signIn } from 'next-auth/react'
import Layout from '../../components/contractor-quotes/Layout'
import qc from '../../styles/QuoteClear.module.css'
import app from '../../styles/QuoteClearApp.module.css'

const PLANS = [
  {
    key: 'starter',
    label: 'Starter',
    price: '$5',
    unit: '/mo',
    tagline: 'For solo operators sending a handful of quotes a month.',
    features: [
      '10 proposals per month',
      '1 user',
      'Basic templates',
      'Print / save-as-PDF',
      'Customer share links',
    ],
  },
  {
    key: 'pro',
    label: 'Pro',
    price: '$9',
    unit: '/mo',
    tagline: 'For active contractors who quote weekly.',
    features: [
      '30 proposals per month',
      'Custom branding (logo + color)',
      'Trade-specific templates',
      'Change orders',
      'Shareable view-tracked links',
      'Priority support',
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
      'Unlimited proposals',
      'Up to 5 users',
      'Shared team templates',
      'Approval workflow',
      'Priority support',
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
  const active = billing?.hasSubscription

  return (
    <Layout title="Billing — QuoteClear">
      <div className={qc.container}>
        <section className={app.appShell}>
          <div className={app.crumb}>
            <Link href="/contractor-quotes/dashboard">Dashboard</Link> · Billing
          </div>
          <h1 className={app.pageTitle}>Billing</h1>
          <p className={app.pageLede}>
            Pick the plan that fits how often you quote. Change or cancel anytime.
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
                      <li key={f}>
                        <span className={qc.priceCheck}>✓</span>
                        {f}
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
