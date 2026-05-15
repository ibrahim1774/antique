import doc from '../../styles/QuoteClearProposal.module.css'

function fmt(n) {
  if (n == null) return '—'
  return `$${Number(n).toLocaleString()}`
}

export default function ProposalView({ proposal, items, profile, children }) {
  const ai = proposal?.ai_output_json || {}
  const final = proposal?.final_content || {}

  const summary       = final.summary       ?? ai.summary
  const scope         = final.scope_of_work ?? ai.scope_of_work ?? []
  const assumptions   = final.assumptions   ?? ai.assumptions   ?? []
  const exclusions    = final.exclusions    ?? ai.exclusions    ?? []
  const timeline      = final.timeline      ?? ai.timeline
  const paymentTerms  = final.payment_terms ?? ai.payment_terms
  const lineItems     = items?.length ? items : (ai.line_items || [])
  const total         = proposal?.total_amount ??
                        lineItems.reduce((s, li) => s + (Number(li.total) || 0), 0)

  const brandColor = profile?.brand_color || '#D4A574'
  const brandName  = profile?.company_name || 'Your Company'
  const propNum    = proposal?.id ? proposal.id.slice(0, 8).toUpperCase() : ''

  return (
    <div className={doc.viewRoot} style={{ '--brand-color': brandColor }}>
      <article className={doc.doc}>
        {/* Branded header */}
        <header className={doc.brandHeader}>
          <div className={doc.brandLeft}>
            {profile?.logo_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profile.logo_url} alt={brandName} className={doc.brandLogo} />
            )}
            <div>
              <div className={doc.brandName}>{brandName}</div>
              <div className={doc.brandMeta}>
                {profile?.phone && <>{profile.phone}<br /></>}
                {profile?.address && <>{profile.address}<br /></>}
                {profile?.license_number && <>License #{profile.license_number}</>}
              </div>
            </div>
          </div>
          <div className={doc.brandRight}>
            Proposal
            {propNum && <span className={doc.brandPropNum}>#{propNum}</span>}
          </div>
        </header>

        <h1 className={doc.docTitle}>{proposal?.title || 'Proposal'}</h1>
        {(proposal?.customer_name || proposal?.customer_address) && (
          <div className={doc.docCustomer}>
            Prepared for {proposal.customer_name}
            {proposal.customer_address && ` · ${proposal.customer_address}`}
          </div>
        )}

        {summary && <p className={doc.docSummary}>{summary}</p>}

        {scope.length > 0 && (
          <section className={doc.docSection}>
            <div className={doc.docSectionLabel}>Scope of work</div>
            <ul className={doc.docBullets}>
              {scope.filter(Boolean).map((s, i) => <li key={i}><span>{s}</span></li>)}
            </ul>
          </section>
        )}

        {lineItems.length > 0 && (
          <section className={doc.docSection}>
            <div className={doc.docSectionLabel}>Investment</div>
            <table className={doc.docTable}>
              <thead>
                <tr>
                  <th>Description</th>
                  <th className={doc.num}>Qty</th>
                  <th className={doc.num}>Unit price</th>
                  <th className={doc.num}>Total</th>
                </tr>
              </thead>
              <tbody>
                {lineItems.map((li, i) => (
                  <tr key={i}>
                    <td>{li.description || '—'}</td>
                    <td className={doc.num}>{li.quantity ?? '—'}</td>
                    <td className={doc.num}>{fmt(li.unit_price)}</td>
                    <td className={doc.num}>{fmt(li.total)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={3} className={doc.num}>Total</td>
                  <td className={`${doc.num} ${doc.docTotalAmt}`}>{fmt(total)}</td>
                </tr>
              </tfoot>
            </table>
          </section>
        )}

        {(assumptions.length > 0 || exclusions.length > 0) && (
          <section className={doc.docSection}>
            {assumptions.length > 0 && (
              <>
                <div className={doc.docSectionLabel}>What&apos;s included</div>
                <ul className={doc.docBullets} style={{ marginBottom: 18 }}>
                  {assumptions.filter(Boolean).map((s, i) => <li key={i}><span>{s}</span></li>)}
                </ul>
              </>
            )}
            {exclusions.length > 0 && (
              <>
                <div className={doc.docSectionLabel}>What&apos;s not included</div>
                <ul className={doc.docBullets}>
                  {exclusions.filter(Boolean).map((s, i) => <li key={i}><span>{s}</span></li>)}
                </ul>
              </>
            )}
          </section>
        )}

        {(timeline || paymentTerms) && (
          <section className={doc.docSection}>
            <div className={doc.docMeta}>
              {timeline && (
                <div className={doc.docMetaCell}>
                  <div className={doc.docMetaLabel}>Timeline</div>
                  <div className={doc.docMetaValue}>
                    {timeline.start || 'TBD'}
                    {timeline.duration_days && ` · about ${timeline.duration_days} working days`}
                  </div>
                </div>
              )}
              {paymentTerms && (
                <div className={doc.docMetaCell}>
                  <div className={doc.docMetaLabel}>Payment terms</div>
                  <div className={doc.docMetaValue}>{paymentTerms}</div>
                </div>
              )}
            </div>
          </section>
        )}

        {children}

        <div className={doc.docFooter}>
          Prepared with QuoteClear · <a href="/contractor-quotes" target="_blank" rel="noreferrer">quoteclear</a>
        </div>
      </article>
    </div>
  )
}
