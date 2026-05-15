import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useSession, signIn } from 'next-auth/react'
import Layout from '../../components/contractor-quotes/Layout'
import qc from '../../styles/QuoteClear.module.css'
import app from '../../styles/QuoteClearApp.module.css'

const STATUS_LABEL = {
  draft:    'Draft',
  sent:     'Sent',
  viewed:   'Viewed',
  accepted: 'Accepted',
  declined: 'Declined',
}
const STATUS_CLASS = {
  draft:    app.statusDraft,
  sent:     app.statusSent,
  viewed:   app.statusViewed,
  accepted: app.statusAccepted,
  declined: app.statusDeclined,
}

function fmtMoney(n) {
  if (n == null) return '—'
  return `$${Number(n).toLocaleString()}`
}
function fmtDate(s) {
  if (!s) return ''
  const d = new Date(s)
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

export default function Dashboard() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [proposals, setProposals] = useState(null)
  const [billing, setBilling]     = useState(null)

  useEffect(() => {
    if (status === 'unauthenticated') {
      signIn('google', { callbackUrl: '/contractor-quotes/dashboard' })
    }
  }, [status])

  useEffect(() => {
    if (status !== 'authenticated') return
    fetch('/api/contractor-quotes/proposal/list')
      .then(r => r.ok ? r.json() : { proposals: [] })
      .then(d => setProposals(d.proposals || []))
    fetch('/api/contractor-quotes/billing/status')
      .then(r => r.ok ? r.json() : null)
      .then(setBilling)
      .catch(() => setBilling(null))
  }, [status])

  const accepted = proposals?.filter(p => p.status === 'accepted') || []
  const totalAccepted = accepted.reduce((s, p) => s + (Number(p.total_amount) || 0), 0)

  return (
    <Layout title="Dashboard — QuoteClear">
      <div className={qc.container}>
        <section className={app.appShell}>
          <div className={app.crumb}>
            <Link href="/contractor-quotes">QuoteClear</Link> · Dashboard
          </div>

          <div className={app.dashHead}>
            <div>
              <h1 className={app.pageTitle}>Your proposals</h1>
              <p className={app.pageLede}>
                Generate a new proposal from any rough estimate. Send a link, get notified when the customer opens it.
              </p>
            </div>
            <Link href="/contractor-quotes/new" className={qc.btnPrimary}>
              + New proposal
            </Link>
          </div>

          <div className={app.dashStats}>
            <div className={app.dashStat}>
              <div className={app.dashStatLabel}>Total proposals</div>
              <div className={app.dashStatValue}>{proposals?.length ?? '—'}</div>
            </div>
            <div className={app.dashStat}>
              <div className={app.dashStatLabel}>Accepted value</div>
              <div className={app.dashStatValue}>{fmtMoney(totalAccepted)}</div>
              <div className={app.dashStatSub}>{accepted.length} accepted</div>
            </div>
            <div className={app.dashStat}>
              <div className={app.dashStatLabel}>Plan</div>
              <div className={app.dashStatValue}>
                {billing?.plan ? billing.plan[0].toUpperCase() + billing.plan.slice(1) : 'No plan'}
              </div>
              <div className={app.dashStatSub}>
                {billing?.hasSubscription
                  ? `${billing.used}/${billing.quota === null ? '∞' : billing.quota} used this month`
                  : 'Subscribe to start sending'}
              </div>
            </div>
          </div>

          {proposals === null ? (
            <div className={app.emptyState}>
              <div className={app.emptyBody}>Loading your proposals…</div>
            </div>
          ) : proposals.length === 0 ? (
            <div className={app.emptyState}>
              <div className={app.emptyIcon}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                  <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/>
                  <path d="M14 3v6h6M9 14h6M9 17h4"/>
                </svg>
              </div>
              <h2 className={app.emptyTitle}>No proposals yet</h2>
              <p className={app.emptyBody}>
                Paste a rough estimate and have it back to your customer in 60 seconds.
              </p>
              <Link href="/contractor-quotes/new" className={qc.btnPrimary}>
                Generate your first proposal →
              </Link>
            </div>
          ) : (
            <div className={app.proposalList}>
              {proposals.map(p => (
                <Link
                  key={p.id}
                  href={`/contractor-quotes/proposal/${p.id}`}
                  className={app.proposalRow}
                >
                  <div>
                    <div className={app.proposalTitle}>{p.title || 'Untitled'}</div>
                    <div className={app.proposalSub}>Updated {fmtDate(p.updated_at || p.created_at)}</div>
                  </div>
                  <div className={app.proposalCust}>
                    {p.customer_name || <span style={{ color: 'var(--qc-text-dim)' }}>No customer yet</span>}
                  </div>
                  <div className={app.proposalAmount}>{fmtMoney(p.total_amount)}</div>
                  <div>
                    <span className={`${app.statusBadge} ${STATUS_CLASS[p.status] || app.statusDraft}`}>
                      {STATUS_LABEL[p.status] || p.status}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </Layout>
  )
}
