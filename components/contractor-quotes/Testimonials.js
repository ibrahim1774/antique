import styles from '../../styles/QuoteClear.module.css'

const QUOTES = [
  {
    quote: 'My first proposal through QuoteClear closed in 90 minutes. The customer said it was the clearest quote they\'d ever gotten.',
    name: 'Marcus T.',
    detail: 'Roofing · 14 years in trade',
  },
  {
    quote: 'I used to spend Saturdays rewriting estimates. Now I send them from the truck before I pull out of the driveway.',
    name: 'Dana R.',
    detail: 'HVAC · Two-person shop',
  },
]

export default function Testimonials() {
  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <div className={styles.sectionHead}>
          <div className={styles.sectionEyebrow}>What contractors say</div>
          <h2 className={styles.sectionTitle}>The quotes that close, in their own words.</h2>
        </div>
        <div className={styles.testGrid}>
          {QUOTES.map(q => (
            <figure key={q.name} className={styles.testCard}>
              <blockquote className={styles.testQuote}>{q.quote}</blockquote>
              <figcaption className={styles.testAttr}>
                <strong>{q.name}</strong> · {q.detail}
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  )
}
