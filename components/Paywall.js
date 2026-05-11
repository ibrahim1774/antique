import { useState } from 'react'
import styles from '../styles/Paywall.module.css'

const SHARED_BENEFITS = [
  { icon: '🔍', text: '30 scans per month to get started' },
  { icon: '➕', text: 'Need more? Top up anytime — 50 scans for $5' },
  { icon: '🏺', text: 'AI identification from any photo or angle' },
  { icon: '✓',  text: 'Real vs Fake authenticity detection' },
  { icon: '💰', text: 'Market value range with comparable listings' },
  { icon: '📁', text: 'Save & organize your full collection' },
  { icon: '💬', text: 'AI antique expert chat, any question' },
]

const YEARLY_EXTRA = { icon: '💛', text: 'Save 35% vs monthly — best value for collectors' }

const CARD_DISCLAIMER = '* AI-powered analysis — a helpful starting point, not a certified appraisal.'

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
                <li key={YEARLY_EXTRA.text}>
                  <span className={styles.bulletIcon}>{YEARLY_EXTRA.icon}</span>{YEARLY_EXTRA.text}
                </li>
                {SHARED_BENEFITS.map(b => (
                  <li key={b.text}>
                    <span className={styles.bulletIcon}>{b.icon}</span>{b.text}
                  </li>
                ))}
              </ul>
              <div className={styles.planCta}>
                {loading === 'yearly' ? 'Loading…' : 'Choose Yearly'}
              </div>
              <p className={styles.cardDisclaimer}>{CARD_DISCLAIMER}</p>
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
                {SHARED_BENEFITS.map(b => (
                  <li key={b.text}>
                    <span className={styles.bulletIcon}>{b.icon}</span>{b.text}
                  </li>
                ))}
              </ul>
              <div className={styles.planCta}>
                {loading === 'monthly' ? 'Loading…' : 'Choose Monthly'}
              </div>
              <p className={styles.cardDisclaimer}>{CARD_DISCLAIMER}</p>
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
