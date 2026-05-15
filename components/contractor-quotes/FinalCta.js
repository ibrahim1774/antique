import Link from 'next/link'
import styles from '../../styles/QuoteClear.module.css'

export default function FinalCta() {
  return (
    <section className={styles.finalCta}>
      <h2 className={styles.finalCtaTitle}>
        Your next quote could close itself.
      </h2>
      <Link href="/contractor-quotes/login" className={styles.btnPrimary}>
        Sign in to get started →
      </Link>
    </section>
  )
}
