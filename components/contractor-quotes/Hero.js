import Link from 'next/link'
import styles from '../../styles/QuoteClear.module.css'

const SAMPLE_BEFORE = `roof tear off & dispose - $1,200
30 yr arch shingles 28sq @ $135 - $3,780
underlayment + ice/water - $640
ridge vent 40' - $280
new pipe boots x3 - $90
flashing repair around chimney - $420
labor 4 days 3 guys - $5,400
materials del. + dump - $280

total roughly 12k
deposit 50% start
balance on completion`

export default function Hero() {
  return (
    <section className={styles.hero}>
      <div className={styles.container}>
        <div className={styles.heroGrid}>
          <div>
            <div className={styles.heroEyebrow}>For contractors who close</div>
            <h1 className={styles.heroTitle}>
              Stop losing jobs to <em>confusing quotes.</em>
            </h1>
            <p className={styles.heroSub}>
              Paste your rough estimate. Get a customer-ready proposal in 60 seconds.
              Built for contractors who&apos;d rather be on the job than at a desk.
            </p>
            <div className={styles.heroCtas}>
              <a href="#demo" className={styles.btnPrimary}>See it in action →</a>
              <Link href="/contractor-quotes/login" className={styles.btnGhost}>Sign in</Link>
            </div>
            <p className={styles.heroTrades}>
              Built for roofers, HVAC, plumbers, electricians, painters, and GCs
            </p>
          </div>

          <div className={styles.heroVisual} aria-hidden="true">
            <div className={styles.browserChrome}>
              <span className={styles.browserDot} />
              <span className={styles.browserDot} />
              <span className={styles.browserDot} />
            </div>
            <div className={styles.heroCompare}>
              <div className={styles.heroCompareCol}>
                <div className={styles.heroCompareLabel}>Your rough notes</div>
                {SAMPLE_BEFORE}
              </div>
              <div className={`${styles.heroCompareCol} ${styles.heroCompareAfter}`}>
                <div className={`${styles.heroCompareLabel} ${styles.heroCompareLabelAfter}`}>
                  Customer-ready proposal
                </div>
                <strong>Project Summary</strong>{'\n'}
                Full roof replacement with 30-year architectural shingles, including tear-off, new underlayment, ridge ventilation, and flashing repair around the chimney.{'\n\n'}
                <strong>Investment</strong>{'\n'}
                $12,090 total · 50% deposit · balance on completion{'\n\n'}
                <strong>Timeline</strong>{'\n'}
                4 working days, crew of 3
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export { SAMPLE_BEFORE }
