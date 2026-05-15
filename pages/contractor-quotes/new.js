import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useSession, signIn } from 'next-auth/react'
import Layout from '../../components/contractor-quotes/Layout'
import qc from '../../styles/QuoteClear.module.css'
import app from '../../styles/QuoteClearApp.module.css'
import { SAMPLE_BEFORE } from '../../components/contractor-quotes/Hero'

export default function NewProposal() {
  const router = useRouter()
  const { data: session, status } = useSession()

  const [estimate, setEstimate]                 = useState(SAMPLE_BEFORE)
  const [customerName, setCustomerName]         = useState('')
  const [customerEmail, setCustomerEmail]       = useState('')
  const [customerAddress, setCustomerAddress]   = useState('')
  const [loading, setLoading]                   = useState(false)
  const [error, setError]                       = useState(null)
  const [paywall, setPaywall]                   = useState(null)

  useEffect(() => {
    if (status === 'unauthenticated') {
      signIn('google', { callbackUrl: '/contractor-quotes/new' })
    }
  }, [status])

  async function handleGenerate() {
    setError(null)
    setPaywall(null)
    setLoading(true)
    try {
      const res = await fetch('/api/contractor-quotes/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          estimate,
          customer_name: customerName,
          customer_email: customerEmail,
          customer_address: customerAddress,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.status === 402) {
        setPaywall(data)
        setLoading(false)
        return
      }
      if (!res.ok) {
        setError(data.error || `Generate failed (HTTP ${res.status})`)
        setLoading(false)
        return
      }
      router.push(`/contractor-quotes/proposal/${data.id}`)
    } catch (err) {
      console.error('[qc new]', err)
      setError('Network error. Please try again.')
      setLoading(false)
    }
  }

  return (
    <Layout title="New proposal — QuoteClear">
      <div className={qc.container}>
        <section className={app.appShell}>
          <div className={app.crumb}>
            <Link href="/contractor-quotes/dashboard">Dashboard</Link> · New proposal
          </div>

          <h1 className={app.pageTitle}>New proposal</h1>
          <p className={app.pageLede}>
            Paste your rough estimate exactly as you wrote it. The AI keeps your numbers and rewrites the rest.
          </p>

          <div className={app.formCard}>
            <div className={`${app.fieldRow} ${app.cols2}`}>
              <div className={app.field}>
                <label className={app.label}>Customer name</label>
                <input
                  className={app.input}
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Jane Doe"
                />
              </div>
              <div className={app.field}>
                <label className={app.label}>Customer email</label>
                <input
                  className={app.input}
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="jane@example.com"
                />
              </div>
            </div>
            <div className={app.fieldRow}>
              <div className={app.field}>
                <label className={app.label}>Job address</label>
                <input
                  className={app.input}
                  value={customerAddress}
                  onChange={(e) => setCustomerAddress(e.target.value)}
                  placeholder="123 Main St, Springfield"
                />
              </div>
            </div>
            <div className={app.fieldRow}>
              <div className={app.field}>
                <label className={app.label}>Your rough estimate</label>
                <textarea
                  className={app.textarea}
                  value={estimate}
                  onChange={(e) => setEstimate(e.target.value)}
                  placeholder="Paste your line items, scope notes, and pricing here…"
                  spellCheck="false"
                />
              </div>
            </div>

            <div className={app.formActions}>
              <button
                type="button"
                className={qc.btnPrimary}
                onClick={handleGenerate}
                disabled={loading || !estimate.trim() || estimate.trim().length < 20}
              >
                {loading ? 'Generating…' : 'Generate proposal →'}
              </button>
              <span style={{ color: 'var(--qc-text-dim)', fontSize: 12.5 }}>
                {estimate.length} chars · prices are never invented
              </span>
            </div>

            {error && <div className={app.errorBox}>{error}</div>}

            {paywall && (
              <div className={app.paywallBox}>
                {paywall.hasSubscription
                  ? <>You&apos;ve used all <strong>{paywall.quota}</strong> proposals on the <strong>{paywall.plan}</strong> plan this month. <Link href="/contractor-quotes/billing">Upgrade →</Link></>
                  : <>You need an active plan to generate proposals. <Link href="/contractor-quotes/billing">Choose a plan →</Link></>
                }
              </div>
            )}
          </div>
        </section>
      </div>
    </Layout>
  )
}
