import Head from 'next/head'
import Link from 'next/link'
import { getServerSession } from 'next-auth/next'
import { authOptions } from './api/auth/[...nextauth]'
import { getSupabaseAdmin } from '../lib/supabase'
import styles from '../styles/MyScans.module.css'

const CATEGORY_DISPLAY_ORDER = ['Pottery', 'Jewelry', 'Furniture', 'Silverware', 'Coins', 'Art', 'Watches', 'Glass', 'Toys', 'Books', 'Other']

export default function MyScans({ scans, totals }) {
  const totalLow  = totals.low.toLocaleString()
  const totalHigh = totals.high.toLocaleString()
  const valuedCount = totals.count

  return (
    <>
      <Head>
        <title>My Collection — Tivoro</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </Head>

      <div className={styles.page}>
        <header className={styles.header}>
          <Link href="/" className={styles.logo}>Tivoro</Link>
          <div className={styles.headerRight}>
            <Link href="/helper" className={styles.headerLink}>Helper</Link>
            <Link href="/scan" className={styles.scanCta}>Scan Now</Link>
          </div>
        </header>

        <main className={styles.main}>
          {scans.length === 0 ? (
            <div className={styles.empty}>
              <div className={styles.emptyIcon}>🏺</div>
              <h2 className={styles.emptyTitle}>No items yet</h2>
              <p className={styles.emptyBody}>
                Start by scanning your first antique. Saved scans appear here with their value, category, and authenticity signals.
              </p>
              <Link href="/scan" className={styles.emptyBtn}>
                Scan Your First Piece →
              </Link>
            </div>
          ) : (
            <>
              <section className={styles.summary}>
                <div className={styles.summaryRow}>
                  <div className={styles.summaryBlock}>
                    <div className={styles.summaryLabel}>Collection Value (USD)</div>
                    <div className={styles.summaryValue}>
                      ${totalLow}
                      {totalLow !== totalHigh && <span className={styles.summaryHigh}> – ${totalHigh}</span>}
                    </div>
                    <div className={styles.summarySub}>
                      Estimated range across {valuedCount} valued item{valuedCount !== 1 ? 's' : ''}
                    </div>
                  </div>
                </div>

                <div className={styles.summaryStats}>
                  <div className={styles.statBlock}>
                    <div className={styles.statValue}>{scans.length}</div>
                    <div className={styles.statLabel}>Items</div>
                  </div>
                  <div className={styles.statBlock}>
                    <div className={styles.statValue}>{totals.categoryCount}</div>
                    <div className={styles.statLabel}>Categories</div>
                  </div>
                  <div className={styles.statBlock}>
                    <div className={styles.statValue}>{totals.authenticCount}</div>
                    <div className={styles.statLabel}>Authentic</div>
                  </div>
                </div>
              </section>

              <div className={styles.collectionHeader}>
                <h1 className={styles.collectionTitle}>Your Collection</h1>
              </div>

              <div className={styles.grid}>
                {scans.map(scan => {
                  const valueRange = scan.estimated_value_low && scan.estimated_value_high
                    ? `$${scan.estimated_value_low.toLocaleString()} – $${scan.estimated_value_high.toLocaleString()}`
                    : null
                  const isFake = scan.authenticity === 'likely_fake'
                  return (
                    <div key={scan.id} className={styles.card}>
                      <div className={styles.cardThumbWrap}>
                        <img
                          src={scan.image_url}
                          alt={scan.item_name || 'Antique'}
                          className={styles.cardThumb}
                        />
                        {isFake && <span className={styles.fakeBadge}>! Possible reproduction</span>}
                        {valueRange && !isFake && (
                          <span className={styles.priceBadge}>{valueRange}</span>
                        )}
                      </div>
                      <div className={styles.cardBody}>
                        {scan.category && <span className={styles.catBadge}>{scan.category}</span>}
                        <h3 className={styles.cardTitle}>
                          {scan.item_name || 'Unknown Item'}
                        </h3>
                        {(scan.era || scan.origin) && (
                          <p className={styles.cardMeta}>
                            {[scan.era, scan.origin].filter(Boolean).join(' · ')}
                          </p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </main>
      </div>
    </>
  )
}

export async function getServerSideProps(context) {
  const session = await getServerSession(context.req, context.res, authOptions)
  if (!session) {
    return { redirect: { destination: '/scan', permanent: false } }
  }

  const { data: user } = await getSupabaseAdmin()
    .from('users')
    .select('id')
    .eq('email', session.user.email)
    .single()

  if (!user) {
    return { props: { scans: [], totals: { low: 0, high: 0, count: 0, categoryCount: 0, authenticCount: 0 } } }
  }

  const { data: scans } = await getSupabaseAdmin()
    .from('scans')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(100)

  const list = scans || []
  let low = 0, high = 0, count = 0, authenticCount = 0
  const cats = new Set()
  for (const s of list) {
    if (s.category) cats.add(s.category)
    if (s.authenticity === 'authentic' || s.authenticity === 'likely_authentic') authenticCount++
    if (typeof s.estimated_value_low === 'number' && typeof s.estimated_value_high === 'number') {
      low  += s.estimated_value_low
      high += s.estimated_value_high
      count++
    }
  }

  return {
    props: {
      scans: list,
      totals: { low, high, count, categoryCount: cats.size, authenticCount },
    },
  }
}
