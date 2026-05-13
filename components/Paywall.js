import { useState } from 'react'
import styles from '../styles/Paywall.module.css'

const MONTHLY_BENEFITS = [
  { icon: '🔍', text: '300 credits/month — refreshes monthly' },
  { icon: '🪙', text: 'Each scan = 10 credits (~30 scans/mo)' },
  { icon: '➕', text: 'Top up anytime — 50 scans for $5' },
  { icon: '🏺', text: 'AI identification + market value' },
  { icon: '💬', text: 'AI antique expert chat + collection' },
]

const PLUS_BENEFITS = [
  { icon: '🎁', text: '600 credits + 300 BONUS = 900 credits/month', highlight: true },
  { icon: '🪙', text: 'Each scan = 10 credits (~90 scans/mo)' },
  { icon: '➕', text: 'Top up anytime — 50 scans for $5' },
  { icon: '🏺', text: 'AI identification + market value' },
  { icon: '💬', text: 'AI antique expert chat + collection' },
]

const YEARLY_BENEFITS = [
  { icon: '💛', text: 'Save 50% vs monthly — best value' },
  { icon: '🔍', text: '3,600 credits/year (300/month)' },
  { icon: '🪙', text: 'Each scan = 10 credits (~360 scans/yr)' },
  { icon: '➕', text: 'Top up anytime — 50 scans for $5' },
  { icon: '🏺', text: 'AI identification + market value' },
  { icon: '💬', text: 'AI antique expert chat + collection' },
]

const CARD_DISCLAIMER = '* AI-powered — a research starting point, not a certified appraisal.'

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

  function renderBenefits(items) {
    return (
      <ul className={styles.benefitList}>
        {items.map(b => (
          <li key={b.text} className={b.highlight ? styles.benefitHighlight : undefined}>
            <span className={styles.bulletIcon}>{b.icon}</span>{b.text}
          </li>
        ))}
      </ul>
    )
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <button className={styles.closeBtn} onClick={onClose} aria-label="Close">×</button>

        <div className={styles.brandRow}>
          <div className={styles.logo}>Tivoro</div>
        </div>

        <h2 className={styles.title}>
          {mode === 'topup' ? 'Out of scans' : 'Choose your plan'}
        </h2>

        <p className={styles.subtitle}>
          {mode === 'topup'
            ? 'Top up your scans or upgrade to keep researching your pieces.'
            : 'Identify any antique. Get market value. Spot fakes.'}
        </p>

        {showSub && (
          <div className={styles.plansGrid}>
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
              {renderBenefits(MONTHLY_BENEFITS)}
              <div className={styles.planCta}>
                {loading === 'monthly' ? 'Loading…' : 'Choose Monthly'}
              </div>
            </button>

            <button
              className={`${styles.planCard} ${styles.planPlus}`}
              onClick={() => startCheckout('/api/checkout/subscribe', { plan: 'monthly_plus' })}
              disabled={loading !== null}
            >
              <div className={styles.bonusBadge}>+300 BONUS CREDITS</div>
              <div className={styles.planHeader}>
                <div className={styles.planLabel}>Monthly Plus</div>
                <div className={styles.bestPick}>Most credits</div>
              </div>
              <div className={styles.planPriceRow}>
                <span className={styles.planPrice}>$9</span>
                <span className={styles.planCadence}>/month</span>
                <span className={styles.planEquiv}>~$0.10/scan</span>
              </div>
              {renderBenefits(PLUS_BENEFITS)}
              <div className={styles.planCta}>
                {loading === 'monthly_plus' ? 'Loading…' : 'Choose Monthly Plus'}
              </div>
            </button>

            <button
              className={`${styles.planCard} ${styles.planYearly}`}
              onClick={() => startCheckout('/api/checkout/subscribe', { plan: 'yearly' })}
              disabled={loading !== null}
            >
              <div className={styles.discountBadge}>SAVE 50%</div>
              <div className={styles.planHeader}>
                <div className={styles.planLabel}>Yearly</div>
                <div className={styles.bestPick}>Best value</div>
              </div>
              <div className={styles.planPriceRow}>
                <span className={styles.planPrice}>$29</span>
                <span className={styles.planCadence}>/year</span>
                <span className={styles.planEquiv}>≈ $2.42/mo</span>
              </div>
              {renderBenefits(YEARLY_BENEFITS)}
              <div className={styles.planCta}>
                {loading === 'yearly' ? 'Loading…' : 'Choose Yearly'}
              </div>
            </button>

            <p className={styles.cardDisclaimer}>{CARD_DISCLAIMER}</p>
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
          Cancel anytime · Secure Stripe checkout · Research tool, not formal appraisals.
        </p>
      </div>
    </div>
  )
}
