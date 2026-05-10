import Head from 'next/head'
import Link from 'next/link'
import { getServerSession } from 'next-auth/next'
import { authOptions } from './api/auth/[...nextauth]'
import { getSupabaseAdmin } from '../lib/supabase'
import styles from '../styles/MyScans.module.css'

export default function MyScans({ scans }) {
  return (
    <>
      <Head>
        <title>My Scans — Tivoro</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className={styles.page}>
        <header className={styles.header}>
          <Link href="/" className={styles.logo}>Tivoro</Link>
          <Link href="/scan" className={styles.scanCta}>Scan Now</Link>
        </header>

        <main className={styles.main}>
          {scans.length === 0 ? (
            <div className={styles.empty}>
              <div className={styles.emptyIcon}>
                <svg width="40" height="40" viewBox="0 0 24 24"
                  fill="none" stroke="#C8921F" strokeWidth="1.5">
                  <circle cx="11" cy="11" r="8"/>
                  <path d="m21 21-4.35-4.35"/>
                </svg>
              </div>
              <h2 className={styles.emptyTitle}>No scans yet</h2>
              <p className={styles.emptyBody}>
                Start by scanning your first antique
              </p>
              <Link href="/scan" className={styles.emptyBtn}>
                Scan Now
              </Link>
            </div>
          ) : (
            <>
              <div className={styles.collectionHeader}>
                <h1 className={styles.collectionTitle}>Your Collection</h1>
                <p className={styles.collectionCount}>{scans.length} item{scans.length !== 1 ? 's' : ''} scanned</p>
              </div>

              <div className={styles.grid}>
                {scans.map(scan => (
                  <div key={scan.id} className={styles.card}>
                    <img
                      src={scan.image_url}
                      alt={scan.item_name || 'Antique'}
                      className={styles.cardThumb}
                    />
                    <div className={styles.cardBody}>
                      {scan.category && (
                        <span className={styles.catBadge}>{scan.category}</span>
                      )}
                      <h3 className={styles.cardTitle}>
                        {scan.item_name || 'Unknown Item'}
                      </h3>
                      {(scan.era || scan.origin) && (
                        <p className={styles.cardMeta}>
                          {[scan.era, scan.origin].filter(Boolean).join(' · ')}
                        </p>
                      )}
                      <p className={styles.cardDate}>
                        {new Date(scan.created_at).toLocaleDateString('en-US', {
                          month: 'short', day: 'numeric', year: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                ))}
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

  // Look up user id
  const { data: user } = await getSupabaseAdmin()
    .from('users')
    .select('id')
    .eq('email', session.user.email)
    .single()

  if (!user) {
    return { props: { scans: [] } }
  }

  const { data: scans } = await getSupabaseAdmin()
    .from('scans')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50)

  return { props: { scans: scans || [] } }
}
