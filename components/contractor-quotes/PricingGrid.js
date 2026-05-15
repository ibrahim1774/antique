import Link from 'next/link'
import styles from '../../styles/QuoteClear.module.css'

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
    cta: 'Start with Starter',
    featured: false,
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
    cta: 'Get Pro',
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
      'Everything in Pro',
    ],
    cta: 'Go to Scale',
    featured: false,
  },
]

export default function PricingGrid() {
  return (
    <section id="pricing" className={styles.section}>
      <div className={styles.container}>
        <div className={styles.sectionHead}>
          <div className={styles.sectionEyebrow}>Pricing</div>
          <h2 className={styles.sectionTitle}>Pick a plan. Cancel anytime.</h2>
          <p className={styles.sectionLede}>
            Every plan is built around the proposals you actually send — not seats, not features you&apos;ll never use.
          </p>
        </div>

        <div className={styles.pricingGrid}>
          {PLANS.map(p => (
            <div
              key={p.key}
              className={`${styles.priceCard} ${p.featured ? styles.priceFeatured : ''}`}
            >
              {p.badge && <span className={styles.priceBadge}>{p.badge}</span>}
              <div className={styles.priceLabel}>{p.label}</div>
              <div className={styles.priceAmount}>
                <span className={styles.priceNum}>{p.price}</span>
                <span className={styles.priceUnit}>{p.unit}</span>
              </div>
              <p className={styles.priceTagline}>{p.tagline}</p>
              <ul className={styles.priceList}>
                {p.features.map(f => (
                  <li key={f}>
                    <span className={styles.priceCheck}>✓</span>
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/contractor-quotes/login"
                className={`${styles.priceCta} ${p.featured ? styles.priceCtaFeatured : ''}`}
              >
                {p.cta}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
