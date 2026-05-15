import { useState } from 'react'
import Head from 'next/head'
import { getSupabaseAdmin } from '../../../lib/supabase'
import ProposalView from '../../../components/contractor-quotes/ProposalView'
import doc from '../../../styles/QuoteClearProposal.module.css'

export default function CustomerView({ proposal, items, profile, error }) {
  const [status, setStatus]   = useState(proposal?.status || 'sent')
  const [signature, setSignature] = useState('')
  const [agree, setAgree]     = useState(false)
  const [busy, setBusy]       = useState(false)
  const [errMsg, setErrMsg]   = useState(null)

  if (error || !proposal) {
    return (
      <div className={doc.viewRoot}>
        <article className={doc.doc} style={{ textAlign: 'center', padding: 64 }}>
          <h1 className={doc.docTitle}>Proposal not found</h1>
          <p style={{ fontFamily: 'system-ui, sans-serif', color: '#5A4F3F' }}>
            This link may have expired or been revoked. Ask the contractor to send a fresh one.
          </p>
        </article>
      </div>
    )
  }

  async function send(action) {
    setBusy(true)
    setErrMsg(null)
    try {
      const res = await fetch('/api/contractor-quotes/proposal/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          share_token: proposal.share_token,
          action,
          signature: action === 'accept' ? signature : null,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setErrMsg(data.error || `Request failed (HTTP ${res.status})`)
      } else {
        setStatus(action === 'accept' ? 'accepted' : 'declined')
      }
    } catch (err) {
      setErrMsg('Network error.')
    } finally {
      setBusy(false)
    }
  }

  const isAccepted = status === 'accepted'
  const isDeclined = status === 'declined'
  const isFinal    = isAccepted || isDeclined

  return (
    <>
      <Head>
        <title>{proposal.title} — Proposal</title>
        <meta name="robots" content="noindex" />
      </Head>
      <ProposalView proposal={proposal} items={items} profile={profile}>
        {!isFinal && (
          <section className={doc.docSection}>
            <div className={doc.docSectionLabel}>Sign &amp; accept</div>
            <div className={doc.sigBlock}>
              <label className={doc.docMetaLabel}>Type your full name to sign</label>
              <input
                className={doc.sigInput}
                value={signature}
                onChange={(e) => setSignature(e.target.value)}
                placeholder="Your full name"
              />
              <label className={doc.sigCheck}>
                <input
                  type="checkbox"
                  checked={agree}
                  onChange={(e) => setAgree(e.target.checked)}
                />
                I agree to the scope, pricing, and terms above.
              </label>
              <div className={doc.docActions} style={{ marginTop: 0, paddingTop: 0, border: 'none' }}>
                <button
                  type="button"
                  className={doc.actionPrimary}
                  onClick={() => send('accept')}
                  disabled={busy || !signature.trim() || !agree}
                >
                  {busy ? 'Submitting…' : 'Accept proposal →'}
                </button>
                <button
                  type="button"
                  className={doc.actionDecline}
                  onClick={() => send('decline')}
                  disabled={busy}
                >
                  Decline
                </button>
              </div>
              {errMsg && <div style={{ marginTop: 12, color: '#944747', fontSize: 13 }}>{errMsg}</div>}
            </div>
          </section>
        )}

        {isAccepted && (
          <div className={doc.docStatus}>
            <strong>Accepted.</strong> Thank you — {profile?.company_name || 'the contractor'} has been notified
            and will be in touch to schedule the work.
          </div>
        )}
        {isDeclined && (
          <div className={`${doc.docStatus} ${doc.declined}`}>
            <strong>Declined.</strong> No further action needed. Reach out to the contractor if you have questions.
          </div>
        )}
      </ProposalView>
    </>
  )
}

export async function getServerSideProps(ctx) {
  const { token } = ctx.params
  if (!token) return { notFound: true }

  const sb = getSupabaseAdmin()
  const { data: proposal, error } = await sb
    .from('qc_proposals')
    .select('*')
    .eq('share_token', token)
    .maybeSingle()
  if (error || !proposal) return { props: { error: 'not_found' } }

  const { data: items } = await sb
    .from('qc_proposal_line_items')
    .select('*')
    .eq('proposal_id', proposal.id)
    .order('sort_order', { ascending: true })

  const { data: profile } = await sb
    .from('contractor_profiles')
    .select('email, company_name, trade_type, phone, logo_url, brand_color, address, license_number')
    .eq('email', proposal.user_email)
    .maybeSingle()

  // Mark as viewed (first time only) and log the event
  if (!proposal.viewed_at) {
    await sb.from('qc_proposals').update({
      viewed_at: new Date().toISOString(),
      status: proposal.status === 'draft' || proposal.status === 'sent' ? 'viewed' : proposal.status,
    }).eq('id', proposal.id)
    await sb.from('qc_usage_events').insert({
      user_email: proposal.user_email,
      event_type: 'proposal_viewed',
      metadata_json: { proposal_id: proposal.id },
    })
    proposal.viewed_at = new Date().toISOString()
    if (proposal.status === 'draft' || proposal.status === 'sent') proposal.status = 'viewed'
  }

  return {
    props: {
      proposal: JSON.parse(JSON.stringify(proposal)),
      items: items ? JSON.parse(JSON.stringify(items)) : [],
      profile: profile ? JSON.parse(JSON.stringify(profile)) : null,
    },
  }
}
