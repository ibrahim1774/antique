import { useState } from 'react'
import styles from '../styles/Paywall.module.css'

const PLAN_BENEFITS = [
  'Full access to the AI antique scanner',
  'Monthly scan credits included to get you started',
  'Real vs Fake authenticity detection',
  'Market value estimates with eBay & Amazon comparisons',
  'Save your scans to a private collection',
  'AI antique helper chat for any question',
]

export default function Paywall({ isOpen, onClose, mode = 'subscribe' }) {
  const [loading, setLoading] = useState(null)

  if (!isOpen) return null

  async function startCheckout(endpoint, body) {
    setLoading(body?.plan || endpoint)
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body || {}),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        setLoading(null)
        alert(data.error || 'Checkout unavailable. Please try again.')
      }
    } catch {
      setLoading(null)
      alert('Network error. Please try again.')
    }
  }

  const showTopup = mode === 'topup' || mode === 'both'
  const showSub   = mode === 'subscribe' || mode === 'both'

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <button className={styles.closeBtn} onClick={onClose} aria-label="Close">×</button>

        <div className={styles.brandRow}>
          <div className={styles.logo}>Tivoro</div>
        </div>

        <h2 className={styles.title}>
          {mode === 'topup'
            ? 'Out of scans'
            : 'Choose your plan'}
        </h2>

        <p className={styles.subtitle}>
          {mode === 'topup'
            ? 'Top up your scans or upgrade to keep researching your pieces.'
            : 'Identify any antique. Get market value. Spot fakes. Build your collection.'}
        </p>

        {showSub && (
          <div className={styles.plansGrid}>
            <button
              className={`${styles.planCard} ${styles.planYearly}`}
              onClick={() => startCheckout('/api/checkout/subscribe', { plan: 'yearly' })}
              disabled={loading !== null}
            >
              <div className={styles.discountBadge}>SAVE 35%</div>
              <div className={styles.planHeader}>
                <div className={styles.planLabel}>Yearly</div>
                <div className={styles.bestPick}>Best value</div>
              </div>
              <div className={styles.planPriceRow}>
                <span className={styles.planPrice}>$39</span>
                <span className={styles.planCadence}>/year</span>
                <span className={styles.planEquiv}>≈ $3.25/mo</span>
              </div>
              <ul className={styles.benefitList}>
                {PLAN_BENEFITS.slice(0, 5).map(b => (
                  <li key={b}><span className={styles.check}>✓</span>{b}</li>
                ))}
                <li><span className={styles.check}>✓</span>Need more? Top up anytime for $5</li>
              </ul>
              <div className={styles.planCta}>
                {loading === 'yearly' ? 'Loading…' : 'Choose Yearly'}
              </div>
            </button>

            <button
              className={styles.planCard}
              onClick={() => startCheckout('/api/checkout/subscribe', { plan: 'monthly' })}
              disabled={loading !== null}
            >
              <div className={styles.planHeader}>
                <div className={styles.planLabel}>Monthly</div>
              </div>
              <div className={styles.planPriceRow}>
                <span className={styles.planPrice}>$5</span>
                <span className={styles.planCadence}>/month</span>
              </div>
              <ul className={styles.benefitList}>
                {PLAN_BENEFITS.slice(0, 5).map(b => (
                  <li key={b}><span className={styles.check}>✓</span>{b}</li>
                ))}
                <li><span className={styles.check}>✓</span>Need more? Top up anytime for $5</li>
              </ul>
              <div className={styles.planCta}>
                {loading === 'monthly' ? 'Loading…' : 'Choose Monthly'}
              </div>
            </button>
          </div>
        )}

        {showTopup && (
          <button
            className={styles.topupCard}
            onClick={() => startCheckout('/api/checkout/topup', {})}
            disabled={loading !== null}
          >
            <div className={styles.topupLabel}>One-time top-up</div>
            <div className={styles.topupRow}>
              <span className={styles.topupPrice}>$5</span>
              <span className={styles.topupDetail}>· Extra scans, no subscription</span>
            </div>
            <div className={styles.topupCta}>
              {loading === '/api/checkout/topup' ? 'Loading…' : 'Buy top-up'}
            </div>
          </button>
        )}

        <p className={styles.legal}>
          Cancel anytime. Secure checkout via Stripe. Tivoro provides research starting points — not formal appraisals.
        </p>
      </div>
    </div>
  )
}
