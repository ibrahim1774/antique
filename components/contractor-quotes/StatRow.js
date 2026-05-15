import styles from '../../styles/QuoteClear.module.css'

const STATS = [
  { number: '57%', body: 'of construction firms cite unclear estimates as a top cause of lost bids.' },
  { number: '4+',  body: 'clarifying questions the average homeowner asks before signing a quote.' },
  { number: '3 hrs', body: 'a week the average contractor spends explaining quotes they already sent.' },
]

export default function StatRow() {
  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <div className={styles.sectionHead}>
          <div className={styles.sectionEyebrow}>The problem</div>
          <h2 className={styles.sectionTitle}>The numbers don&apos;t lie. The quote isn&apos;t doing its job.</h2>
        </div>
        <div className={styles.statGrid}>
          {STATS.map(s => (
            <div key={s.number} className={styles.statCell}>
              <div className={styles.statNumber}>{s.number}</div>
              <div className={styles.statBody}>{s.body}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
