import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { useSession, signIn } from 'next-auth/react'
import Layout from '../../components/contractor-quotes/Layout'
import styles from '../../styles/QuoteClear.module.css'

export default function QuoteClearLogin() {
  const router = useRouter()
  const { data: session, status } = useSession()

  useEffect(() => {
    if (status === 'authenticated' && session) {
      router.replace('/contractor-quotes/dashboard')
    }
  }, [status, session, router])

  return (
    <Layout title="Sign in — QuoteClear">
      <section className={styles.section} style={{ borderTop: 'none' }}>
        <div className={styles.container}>
          <div style={{ maxWidth: 420, margin: '40px auto', textAlign: 'center' }}>
            <div className={styles.sectionEyebrow}>QuoteClear</div>
            <h1 className={styles.sectionTitle} style={{ marginBottom: 14 }}>
              Sign in to send proposals.
            </h1>
            <p className={styles.sectionLede} style={{ marginBottom: 32 }}>
              One account for your dashboard, your brand kit, and every proposal you&apos;ve sent.
            </p>
            <button
              type="button"
              className={styles.btnPrimary}
              style={{ minWidth: 240, justifyContent: 'center' }}
              onClick={() => signIn('google', { callbackUrl: '/contractor-quotes/dashboard' })}
              disabled={status === 'loading'}
            >
              {status === 'loading' ? 'Loading…' : 'Continue with Google →'}
            </button>
            <p style={{ marginTop: 28, fontSize: 12.5, color: 'var(--qc-text-dim)' }}>
              By signing in you agree to our terms. Cancel anytime.
            </p>
          </div>
        </div>
      </section>
    </Layout>
  )
}
