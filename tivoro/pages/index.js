import Head from 'next/head'
import Link from 'next/link'
import { useSession, signIn } from 'next-auth/react'
import styles from '../styles/Home.module.css'

export default function Home() {
  const { data: session } = useSession()

  return (
    <>
      <Head>
        <title>Tivoro — Research Any Antique in Seconds</title>
        <meta name="description" content="Point your camera at any antique and get instant AI-powered research — identification, era, origin, and comparable sales. Free to start." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta property="og:title" content="Tivoro — Antique Research Tool" />
        <meta property="og:description" content="Identify any antique in seconds. Research starting point for pickers, collectors, and estate sale shoppers." />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className={styles.page}>

        <nav className={styles.nav}>
          <div className={styles.logo}>Tivoro</div>
          <div className={styles.navRight}>
            {session ? (
              <>
                <Link href="/my-scans" className={styles.navLink}>
                  My Scans
                </Link>
                <Link href="/scan" className={styles.navCta}>
                  Scan Now
                </Link>
              </>
            ) : (
              <button
                className={styles.navCta}
                onClick={() => signIn('google')}
              >
                Sign in
              </button>
            )}
          </div>
        </nav>

        <section className={styles.hero}>
          <div className={styles.heroBadge}>AI-Powered Research Tool</div>
          <h1 className={styles.heroTitle}>
            Research any antique<br />in seconds
          </h1>
          <p className={styles.heroSub}>
            Point your camera at pottery, jewelry, furniture,
            coins, art, or watches — and get instant identification,
            historical context, and comparable sales data.
          </p>
          <Link href="/scan" className={styles.heroBtn}>
            Start scanning free
          </Link>
          <p className={styles.heroCap}>
            2 free scans · No credit card · Research starting point only
          </p>
        </section>

        <section className={styles.coverage}>
          <p className={styles.coverageLabel}>Identifies across all categories</p>
          <div className={styles.coverageGrid}>
            {[
              'Pottery & Ceramics', 'Jewelry & Silver', 'Furniture',
              'Coins & Currency', 'Art & Prints', 'Watches & Clocks',
              'Glassware', 'Militaria'
            ].map(cat => (
              <span key={cat} className={styles.coveragePill}>{cat}</span>
            ))}
          </div>
        </section>

        <section className={styles.how}>
          <h2 className={styles.sectionTitle}>How Tivoro works</h2>
          <div className={styles.steps}>
            {[
              {
                num: '1',
                title: 'Take a photo',
                body: "Point your camera at any antique — the piece itself, the maker's mark, or both."
              },
              {
                num: '2',
                title: 'AI researches it',
                body: "Our AI identifies the piece, period, origin, and maker's marks in seconds."
              },
              {
                num: '3',
                title: 'Get a starting point',
                body: "See what it is and what similar pieces have sold for — so you know if it's worth a closer look."
              }
            ].map(step => (
              <div key={step.num} className={styles.step}>
                <div className={styles.stepNum}>{step.num}</div>
                <div>
                  <div className={styles.stepTitle}>{step.title}</div>
                  <div className={styles.stepBody}>{step.body}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className={styles.disclaimer}>
          <p>
            Tivoro is a research tool, not a certified appraisal service. Results
            provide a starting point for further research. Always consult a
            certified appraiser before making significant purchase or sale decisions.
          </p>
        </section>

        <section className={styles.cta}>
          <h2 className={styles.ctaTitle}>Ready to find out what you&apos;ve got?</h2>
          <Link href="/scan" className={styles.heroBtn}>
            Scan your first antique
          </Link>
        </section>

        <footer className={styles.footer}>
          <span className={styles.footerLogo}>Tivoro</span>
          <span className={styles.footerText}>
            © {new Date().getFullYear()} · Research purposes only
          </span>
        </footer>

      </div>
    </>
  )
}
