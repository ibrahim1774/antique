import styles from '../../styles/QuoteClear.module.css'

const FEATURES = [
  { title: 'Your brand, every time',     body: 'Logo, color, license number, and contact info baked into every proposal automatically.' },
  { title: 'Trade-specific templates',   body: 'Roofing, HVAC, plumbing, electrical, paint, GC. Pre-loaded with the language and exclusions that fit your trade.' },
  { title: 'Exclusions that protect you', body: 'Every proposal ships with smart exclusions so you\'re never on the hook for permits or hidden conditions you didn\'t quote.' },
  { title: 'Shareable view-tracked links', body: 'Send one URL. Get notified when the customer opens it, requests changes, or signs.' },
  { title: 'Change orders without rework', body: 'Add a change order to an accepted proposal without rewriting the whole thing. Customers sign just the change.' },
  { title: 'Print-ready, mobile-friendly', body: 'Customers can sign on their phone or print to PDF from any browser. No app to install.' },
]

export default function FeatureGrid() {
  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <div className={styles.sectionHead}>
          <div className={styles.sectionEyebrow}>Features</div>
          <h2 className={styles.sectionTitle}>Designed around how contractors actually quote.</h2>
        </div>
        <div className={styles.featureGrid}>
          {FEATURES.map(f => (
            <div key={f.title} className={styles.featureCard}>
              <h3 className={styles.featureTitle}>{f.title}</h3>
              <p className={styles.featureBody}>{f.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
