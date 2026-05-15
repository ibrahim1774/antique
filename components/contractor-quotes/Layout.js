import Link from 'next/link'
import Head from 'next/head'
import styles from '../../styles/QuoteClear.module.css'

export default function Layout({ children, title, description }) {
  return (
    <div className={styles.qcRoot}>
      <Head>
        <title>{title || 'QuoteClear — Customer-ready contractor proposals in 60 seconds'}</title>
        <meta name="description" content={description || 'Paste your rough estimate. Get a branded, plain-English proposal customers actually understand. Built for roofers, HVAC, plumbers, electricians, painters, and GCs.'} />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="theme-color" content="#0A0A0B" />
        <meta property="og:title" content={title || 'QuoteClear — Customer-ready contractor proposals'} />
        <meta property="og:description" content={description || 'Stop losing jobs to confusing quotes. Paste your estimate, get a customer-ready proposal in 60 seconds.'} />
      </Head>

      <nav className={styles.nav}>
        <div className={styles.navInner}>
          <Link href="/contractor-quotes" className={styles.navLogo}>
            Quote<span>Clear</span>
          </Link>
          <div className={styles.navLinks}>
            <a href="#demo" className={styles.navLink}>Demo</a>
            <a href="#faq" className={styles.navLink}>FAQ</a>
            <Link href="/contractor-quotes/login" className={styles.navCta}>Sign up</Link>
          </div>
        </div>
      </nav>

      <main>{children}</main>

      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <div>© {new Date().getFullYear()} QuoteClear · Built for contractors who close.</div>
          <div className={styles.footerLinks}>
            <a href="#demo">Demo</a>
            <a href="#faq">FAQ</a>
            <Link href="/contractor-quotes/login">Sign up</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
