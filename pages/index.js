import Head from 'next/head'
import Link from 'next/link'
import { useSession, signIn } from 'next-auth/react'
import styles from '../styles/Home.module.css'

export default function Home() {
  const { data: session } = useSession()

  return (
    <>
      <Head>
        <title>Tivoro — Identify Antiques · Market Value · Authenticity Signals</title>
        <meta name="description" content="AI-powered antique identifier. Snap any piece — pottery, silver, jewelry, furniture — and get a research starting point: identification, market value range, authenticity signals, and historical context. From $5/month." />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta property="og:title" content="Tivoro — AI Antique Identifier" />
        <meta property="og:description" content="Identify any antique. Research market value and possible fakes. Build your collection." />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className={styles.page}>

        <nav className={styles.nav}>
          <div className={styles.logo}>Tivoro</div>
          <div className={styles.navRight}>
            {session ? (
              <>
                <Link href="/my-scans" className={styles.navLink}>Collection</Link>
                <Link href="/scan" className={styles.navCta}>Scan Now</Link>
              </>
            ) : (
              <button className={styles.navCta} onClick={() => signIn('google')}>
                Sign in
              </button>
            )}
          </div>
        </nav>

        <section className={styles.hero}>
          <div className={styles.heroBadge}>AI Antique Identifier</div>
          <h1 className={styles.heroTitle}>
            Identify any antique<br />in seconds
          </h1>
          <p className={styles.heroSub}>
            Snap a photo. Get the maker, era, origin, materials, a market value range,
            and authenticity signals to research — a starting point from an expert-trained AI.
          </p>
          <Link href="/scan" className={styles.heroBtn}>
            Scan an antique →
          </Link>
          <p className={styles.heroCap}>
            $5/mo · 30 scans · or $39/yr · Cancel anytime
          </p>
        </section>

        <section className={styles.featureRow}>
          {[
            { title: 'Scan & Identify',    body: 'Maker, era, origin, materials — in seconds.' },
            { title: 'Market Value',       body: 'Realistic USD price range with comparable sold listings.' },
            { title: 'Authenticity Signals', body: 'A starting point to research possible fakes or reproductions.' },
            { title: 'Manage Collection',  body: 'Save every scan. Track total estimated value.' },
            { title: 'AI Antique Helper',  body: 'Ask anything about any piece in your collection.' },
            { title: 'Learn & Discover',   body: 'Beginner guides and category deep-dives.' },
          ].map(f => (
            <div key={f.title} className={styles.featureCard}>
              <h3 className={styles.featureTitle}>{f.title}</h3>
              <p className={styles.featureBody}>{f.body}</p>
            </div>
          ))}
        </section>

        <section className={styles.coverage}>
          <p className={styles.coverageLabel}>Identifies across every category</p>
          <div className={styles.coverageGrid}>
            {[
              'Pottery & Ceramics', 'Jewelry & Silver', 'Furniture',
              'Coins & Currency', 'Art & Prints', 'Watches & Clocks',
              'Glassware', 'Toys & Dolls', 'Books & Maps', 'Militaria'
            ].map(cat => (
              <span key={cat} className={styles.coveragePill}>{cat}</span>
            ))}
          </div>
        </section>

        <section className={styles.how}>
          <h2 className={styles.sectionTitle}>How Tivoro works</h2>
          <div className={styles.steps}>
            {[
              { num: '1', title: 'Snap a photo',         body: 'The piece, its maker mark, or both. Camera or upload.' },
              { num: '2', title: 'AI identifies it',     body: 'Maker, period, origin, materials, condition — in seconds.' },
              { num: '3', title: 'Get the full picture', body: 'Market value range, authenticity signals, comparable listings.' },
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

        <section className={styles.pricing}>
          <h2 className={styles.sectionTitle}>Simple pricing</h2>
          <div className={styles.priceGrid}>
            <div className={`${styles.priceCard} ${styles.priceFeatured}`}>
              <div className={styles.priceBadge}>Best Value · Save 50%</div>
              <div className={styles.priceLabel}>Yearly</div>
              <div className={styles.priceMain}>
                <span className={styles.priceAmt}>$29</span>
                <span className={styles.priceUnit}>/year</span>
              </div>
              <div className={styles.priceSub}>$2.42/mo · 30 scans/month</div>
              <Link href="/scan" className={styles.priceBtn}>Get Yearly</Link>
            </div>
            <div className={styles.priceCard}>
              <div className={styles.priceLabel}>Monthly</div>
              <div className={styles.priceMain}>
                <span className={styles.priceAmt}>$5</span>
                <span className={styles.priceUnit}>/month</span>
              </div>
              <div className={styles.priceSub}>30 scans/month</div>
              <Link href="/scan" className={styles.priceBtn}>Get Monthly</Link>
            </div>
            <div className={styles.priceCard}>
              <div className={styles.priceLabel}>Top-up</div>
              <div className={styles.priceMain}>
                <span className={styles.priceAmt}>$5</span>
                <span className={styles.priceUnit}>one-time</span>
              </div>
              <div className={styles.priceSub}>50 additional scans</div>
              <Link href="/scan" className={styles.priceBtn}>Add Scans</Link>
            </div>
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
            Scan your first antique →
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
