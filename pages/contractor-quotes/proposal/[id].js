import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useSession, signIn } from 'next-auth/react'
import Layout from '../../../components/contractor-quotes/Layout'
import ProposalEditor from '../../../components/contractor-quotes/ProposalEditor'
import qc from '../../../styles/QuoteClear.module.css'
import app from '../../../styles/QuoteClearApp.module.css'

export default function ProposalPage() {
  const router = useRouter()
  const { id } = router.query
  const { data: session, status } = useSession()

  const [proposal, setProposal] = useState(null)
  const [items, setItems]       = useState([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState(null)
  const [shareCopied, setShareCopied] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      signIn('google', { callbackUrl: typeof window !== 'undefined' ? window.location.pathname : '/contractor-quotes' })
    }
  }, [status])

  async function load() {
    if (!id || status !== 'authenticated') return
    setLoading(true)
    try {
      const res = await fetch(`/api/contractor-quotes/proposal/get?id=${id}`)
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.error || `Failed to load (HTTP ${res.status})`)
      } else {
        setProposal(data.proposal)
        setItems(data.items || [])
      }
    } catch (err) {
      setError('Network error.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() /* eslint-disable-next-line */ }, [id, status])

  async function copyShareLink() {
    if (!proposal?.share_token) return
    const url = `${window.location.origin}/contractor-quotes/view/${proposal.share_token}`
    try {
      await navigator.clipboard.writeText(url)
      setShareCopied(true)
      setTimeout(() => setShareCopied(false), 2000)
    } catch {}
  }

  return (
    <Layout title={proposal?.title ? `${proposal.title} — QuoteClear` : 'Proposal — QuoteClear'}>
      <div className={qc.container}>
        <section className={app.appShell}>
          <div className={app.crumb}>
            <Link href="/contractor-quotes/dashboard">Dashboard</Link> ·{' '}
            {proposal?.title || 'Proposal'}
          </div>

          {loading && <div className={app.emptyState}><div className={app.emptyBody}>Loading…</div></div>}

          {error && !loading && (
            <div className={app.errorBox}>{error}</div>
          )}

          {!loading && proposal && (
            <>
              <div className={app.dashHead}>
                <div>
                  <h1 className={app.pageTitle}>{proposal.title || 'Untitled proposal'}</h1>
                  <p className={app.pageLede}>
                    Tweak any field. Save changes. Send the share link when it&apos;s ready.
                  </p>
                </div>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <button className={qc.btnGhost} onClick={copyShareLink}>
                    {shareCopied ? 'Link copied ✓' : 'Copy share link'}
                  </button>
                  <Link href={`/contractor-quotes/proposal/${proposal.id}/print`} className={qc.btnGhost}>
                    Print / PDF
                  </Link>
                </div>
              </div>

              <ProposalEditor
                proposal={proposal}
                items={items}
                onSaved={load}
              />
            </>
          )}
        </section>
      </div>
    </Layout>
  )
}
