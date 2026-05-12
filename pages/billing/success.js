import { useEffect, useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'

export default function BillingSuccess() {
  const router = useRouter()
  const [status, setStatus] = useState(null)
  const [countdown, setCountdown] = useState(3)

  useEffect(() => {
    let cancelled = false
    async function poll() {
      // Webhook may take a few seconds; poll status briefly
      for (let i = 0; i < 8; i++) {
        if (cancelled) return
        const r = await fetch('/api/billing/status')
        if (r.ok) {
          const d = await r.json()
          if (d.hasSubscription || d.topupScans > 0) {
            setStatus(d)
            return
          }
        }
        await new Promise(r => setTimeout(r, 1500))
      }
      setStatus({ pending: true })
    }
    poll()
    return () => { cancelled = true }
  }, [])

  // Auto-redirect to scan page once subscription is confirmed
  useEffect(() => {
    if (!status || status.pending) return
    const interval = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) {
          clearInterval(interval)
          router.push('/scan')
          return 0
        }
        return c - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [status, router])

  const isTopup = router.query.type === 'topup'

  return (
    <>
      <Head>
        <title>Welcome to Tivoro</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 20px',
        background: '#FBF6EC',
        fontFamily: 'system-ui, sans-serif',
        color: '#1A1610',
        textAlign: 'center',
      }}>
        <div style={{
          fontFamily: 'Fraunces, Georgia, serif',
          fontSize: 32,
          marginBottom: 8,
          letterSpacing: '-0.02em',
        }}>
          {status?.pending ? 'Almost there…' : isTopup ? 'Top-up added' : 'You\'re all set'}
        </div>
        <p style={{ color: '#5A4F3F', maxWidth: 380, lineHeight: 1.5 }}>
          {status?.pending
            ? 'Your payment was received. We\'re activating your account — refresh in a moment.'
            : isTopup
              ? `${status?.topupScans || 50} additional scans are ready to use.`
              : 'Your subscription is active. 30 scans every month, plus full access to the Tivoro tools.'}
        </p>
        <Link href="/scan" style={{
          marginTop: 24,
          background: '#1A1610',
          color: '#FBF6EC',
          padding: '12px 28px',
          borderRadius: 999,
          textDecoration: 'none',
          fontWeight: 500,
        }}>
          {status && !status.pending ? `Start scanning → (${countdown})` : 'Start scanning →'}
        </Link>
      </div>
    </>
  )
}
