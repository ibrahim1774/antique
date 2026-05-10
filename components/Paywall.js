import { useState } from 'react'
import styles from '../styles/Paywall.module.css'

export default function Paywall({ isOpen, onClose, mode = 'subscribe', monthlyUsed, monthlyQuota, topupScans }) {
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
            : 'Unlock unlimited identification'}
        </h2>

        <p className={styles.subtitle}>
          {mode === 'topup'
            ? `You've used all your scans this period. Top up or upgrade to keep researching.`
            : 'Identify any antique. Get market value. Spot fakes. Build your collection.'}
        </p>

        {(monthlyUsed != null && monthlyQuota) && (
          <div className={styles.usageStrip}>
            {monthlyUsed} / {monthlyQuota} monthly scans used
            {topupScans > 0 && <> · {topupScans} top-up left</>}
          </div>
        )}

        {showSub && (
          <div className={styles.plansGrid}>
            <button
              className={`${styles.planCard} ${styles.planYearly}`}
              onClick={() => startCheckout('/api/checkout/subscribe', { plan: 'yearly' })}
              disabled={loading !== null}
            >
              <div className={styles.bestValueBadge}>Best Value · Save 35%</div>
              <div className={styles.planLabel}>Yearly</div>
              <div className={styles.planPriceRow}>
                <span className={styles.planPrice}>$39</span>
                <span className={styles.planCadence}>/year</span>
              </div>
              <div className={styles.planSub}>$3.25/mo · 30 scans/month</div>
              <div className={styles.planCta}>
                {loading === 'yearly' ? 'Loading…' : 'Choose Yearly'}
              </div>
            </button>

            <button
              className={styles.planCard}
              onClick={() => startCheckout('/api/checkout/subscribe', { plan: 'monthly' })}
              disabled={loading !== null}
            >
              <div className={styles.planLabel}>Monthly</div>
              <div className={styles.planPriceRow}>
                <span className={styles.planPrice}>$5</span>
                <span className={styles.planCadence}>/month</span>
              </div>
              <div className={styles.planSub}>30 scans/month</div>
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
              <span className={styles.topupDetail}>· 50 additional scans</span>
            </div>
            <div className={styles.topupCta}>
              {loading === '/api/checkout/topup' ? 'Loading…' : 'Buy 50 scans'}
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
