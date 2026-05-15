import { useEffect, useState } from 'react'
import qc from '../../styles/QuoteClear.module.css'
import app from '../../styles/QuoteClearApp.module.css'

const CAT_OPTIONS = ['labor', 'materials', 'other']

function recomputeTotal(items, override) {
  if (typeof override === 'number') return override
  return items.reduce((s, li) => s + (Number(li.total) || 0), 0)
}

export default function ProposalEditor({ proposal, items, onSaved }) {
  const ai = proposal?.ai_output_json || {}
  const final = proposal?.final_content || {}

  // Merge AI defaults with any saved overrides in final_content
  const [title, setTitle]                   = useState(proposal?.title || ai.title || 'Untitled')
  const [customerName, setCustomerName]     = useState(proposal?.customer_name || '')
  const [customerEmail, setCustomerEmail]   = useState(proposal?.customer_email || '')
  const [customerAddress, setCustomerAddress] = useState(proposal?.customer_address || '')
  const [summary, setSummary]               = useState(final.summary ?? ai.summary ?? '')
  const [scope, setScope]                   = useState(final.scope_of_work ?? ai.scope_of_work ?? [])
  const [assumptions, setAssumptions]       = useState(final.assumptions ?? ai.assumptions ?? [])
  const [exclusions, setExclusions]         = useState(final.exclusions ?? ai.exclusions ?? [])
  const [timeline, setTimeline]             = useState(final.timeline ?? ai.timeline ?? { start: '', duration_days: null })
  const [paymentTerms, setPaymentTerms]     = useState(final.payment_terms ?? ai.payment_terms ?? '')
  const [whyPrice, setWhyPrice]             = useState(final.why_this_price ?? ai.why_this_price ?? '')
  const [lineItems, setLineItems]           = useState(items?.length ? items : (ai.line_items || []))

  const [saving, setSaving] = useState(false)
  const [savedAt, setSavedAt] = useState(null)
  const [error, setError] = useState(null)

  function updateLineItem(idx, field, value) {
    setLineItems(prev => {
      const next = [...prev]
      const li = { ...next[idx], [field]: value }
      // Auto-recompute total when qty or unit_price change
      if (field === 'quantity' || field === 'unit_price') {
        const q = Number(field === 'quantity' ? value : li.quantity) || 0
        const u = Number(field === 'unit_price' ? value : li.unit_price) || 0
        if (q && u) li.total = +(q * u).toFixed(2)
      }
      next[idx] = li
      return next
    })
  }
  function removeLineItem(idx) {
    setLineItems(prev => prev.filter((_, i) => i !== idx))
  }
  function addLineItem() {
    setLineItems(prev => [...prev, { description: '', quantity: 1, unit_price: 0, total: 0, category: 'labor' }])
  }

  function updateListAt(setter, idx, value) {
    setter(prev => prev.map((x, i) => i === idx ? value : x))
  }
  function addToList(setter)    { setter(prev => [...prev, '']) }
  function removeFromList(setter, idx) { setter(prev => prev.filter((_, i) => i !== idx)) }

  async function handleSave() {
    setSaving(true)
    setError(null)
    try {
      const total = recomputeTotal(lineItems)
      const final_content = {
        summary,
        scope_of_work: scope.filter(Boolean),
        assumptions: assumptions.filter(Boolean),
        exclusions: exclusions.filter(Boolean),
        timeline,
        payment_terms: paymentTerms,
        why_this_price: whyPrice,
      }
      const res = await fetch('/api/contractor-quotes/proposal/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: proposal.id,
          updates: {
            title,
            customer_name: customerName || null,
            customer_email: customerEmail || null,
            customer_address: customerAddress || null,
            final_content,
            total_amount: total,
          },
          items: lineItems,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.error || `Save failed (HTTP ${res.status})`)
      } else {
        setSavedAt(new Date())
        onSaved?.()
      }
    } catch (err) {
      setError('Network error.')
    } finally {
      setSaving(false)
    }
  }

  const total = recomputeTotal(lineItems)

  return (
    <div className={app.editorGrid}>
      {/* LEFT — fields */}
      <div className={app.editorPane}>
        <div className={app.editorPaneHeader}>
          <h2 className={app.editorPaneTitle}>Proposal details</h2>
          <div style={{ fontSize: 12.5, color: 'var(--qc-text-dim)' }}>
            Total: <strong style={{ color: 'var(--qc-gold)' }}>${total.toLocaleString()}</strong>
          </div>
        </div>

        <div className={app.fieldRow}>
          <div className={app.field}>
            <label className={app.label}>Title</label>
            <input className={app.input} value={title} onChange={e => setTitle(e.target.value)} />
          </div>
        </div>

        <div className={`${app.fieldRow} ${app.cols2}`}>
          <div className={app.field}>
            <label className={app.label}>Customer name</label>
            <input className={app.input} value={customerName} onChange={e => setCustomerName(e.target.value)} />
          </div>
          <div className={app.field}>
            <label className={app.label}>Customer email</label>
            <input className={app.input} type="email" value={customerEmail} onChange={e => setCustomerEmail(e.target.value)} />
          </div>
        </div>
        <div className={app.fieldRow}>
          <div className={app.field}>
            <label className={app.label}>Job address</label>
            <input className={app.input} value={customerAddress} onChange={e => setCustomerAddress(e.target.value)} />
          </div>
        </div>

        <div className={app.sectionH}>Summary</div>
        <textarea
          className={app.textarea}
          style={{ minHeight: 90, fontFamily: 'inherit', fontSize: 14 }}
          value={summary}
          onChange={e => setSummary(e.target.value)}
        />

        <div className={app.sectionH}>Scope of work</div>
        <ul className={app.bulletList}>
          {scope.map((s, i) => (
            <li key={i}>
              <input
                className={app.bulletEdit}
                value={s}
                onChange={(e) => updateListAt(setScope, i, e.target.value)}
              />
              <button className={app.removeBtn} onClick={() => removeFromList(setScope, i)} aria-label="Remove">×</button>
            </li>
          ))}
        </ul>
        <button className={app.addLineBtn} onClick={() => addToList(setScope)}>+ Add scope item</button>

        <div className={app.sectionH}>Line items</div>
        <div className={app.lineItemTable}>
          <div className={app.lineItem}>
            <div className={app.lineItemHead}>Description</div>
            <div className={app.lineItemHead}>Qty</div>
            <div className={app.lineItemHead}>Unit price</div>
            <div className={app.lineItemHead}>Total</div>
            <div />
          </div>
          {lineItems.map((li, idx) => (
            <div key={idx} className={app.lineItem}>
              <input
                value={li.description || ''}
                onChange={(e) => updateLineItem(idx, 'description', e.target.value)}
                placeholder="Item description"
              />
              <input
                type="number"
                value={li.quantity ?? ''}
                onChange={(e) => updateLineItem(idx, 'quantity', e.target.value === '' ? null : Number(e.target.value))}
              />
              <input
                type="number"
                value={li.unit_price ?? ''}
                onChange={(e) => updateLineItem(idx, 'unit_price', e.target.value === '' ? null : Number(e.target.value))}
              />
              <input
                type="number"
                value={li.total ?? ''}
                onChange={(e) => updateLineItem(idx, 'total', e.target.value === '' ? null : Number(e.target.value))}
              />
              <button className={app.removeBtn} onClick={() => removeLineItem(idx)} aria-label="Remove">×</button>
            </div>
          ))}
          <button className={app.addLineBtn} onClick={addLineItem}>+ Add line item</button>
        </div>

        <div className={app.sectionH}>What&apos;s included</div>
        <ul className={app.bulletList}>
          {assumptions.map((s, i) => (
            <li key={i}>
              <input
                className={app.bulletEdit}
                value={s}
                onChange={(e) => updateListAt(setAssumptions, i, e.target.value)}
              />
              <button className={app.removeBtn} onClick={() => removeFromList(setAssumptions, i)}>×</button>
            </li>
          ))}
        </ul>
        <button className={app.addLineBtn} onClick={() => addToList(setAssumptions)}>+ Add included item</button>

        <div className={app.sectionH}>What&apos;s excluded (protects you)</div>
        <ul className={app.bulletList}>
          {exclusions.map((s, i) => (
            <li key={i}>
              <input
                className={app.bulletEdit}
                value={s}
                onChange={(e) => updateListAt(setExclusions, i, e.target.value)}
              />
              <button className={app.removeBtn} onClick={() => removeFromList(setExclusions, i)}>×</button>
            </li>
          ))}
        </ul>
        <button className={app.addLineBtn} onClick={() => addToList(setExclusions)}>+ Add exclusion</button>

        <div className={`${app.fieldRow} ${app.cols2}`} style={{ marginTop: 18 }}>
          <div className={app.field}>
            <label className={app.label}>Timeline · start</label>
            <input
              className={app.input}
              value={timeline?.start || ''}
              onChange={(e) => setTimeline({ ...(timeline || {}), start: e.target.value })}
            />
          </div>
          <div className={app.field}>
            <label className={app.label}>Duration (days)</label>
            <input
              className={app.input}
              type="number"
              value={timeline?.duration_days ?? ''}
              onChange={(e) => setTimeline({ ...(timeline || {}), duration_days: e.target.value === '' ? null : Number(e.target.value) })}
            />
          </div>
        </div>
        <div className={app.fieldRow}>
          <div className={app.field}>
            <label className={app.label}>Payment terms</label>
            <input
              className={app.input}
              value={paymentTerms}
              onChange={e => setPaymentTerms(e.target.value)}
            />
          </div>
        </div>

        <div className={app.editorActions}>
          <button className={qc.btnPrimary} onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : 'Save changes'}
          </button>
          {savedAt && !saving && (
            <span className={app.savedNote}>Saved {savedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          )}
          {error && <span style={{ color: '#E89A8A', fontSize: 13 }}>{error}</span>}
        </div>
      </div>

      {/* RIGHT — preview */}
      <div className={app.editorPane}>
        <div className={app.editorPaneHeader}>
          <h2 className={app.editorPaneTitle}>Customer preview</h2>
          <div style={{ fontSize: 12.5, color: 'var(--qc-text-dim)' }}>
            What the customer sees
          </div>
        </div>

        <div style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: 22, marginBottom: 6 }}>{title}</div>
        {(customerName || customerAddress) && (
          <div style={{ color: 'var(--qc-text-muted)', fontSize: 13.5, marginBottom: 14 }}>
            {customerName}{customerAddress && ` · ${customerAddress}`}
          </div>
        )}
        {summary && (
          <p style={{ color: 'var(--qc-text-muted)', lineHeight: 1.55, fontSize: 14, marginBottom: 18 }}>{summary}</p>
        )}

        {scope.length > 0 && (
          <>
            <div className={app.sectionH}>Scope of work</div>
            <ul className={app.bulletList}>
              {scope.filter(Boolean).map((s, i) => <li key={i}><span>{s}</span></li>)}
            </ul>
          </>
        )}

        {lineItems.length > 0 && (
          <>
            <div className={app.sectionH}>Investment</div>
            <table style={{ width: '100%', fontSize: 13.5, borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ color: 'var(--qc-text-dim)', textAlign: 'left', fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  <th style={{ padding: '6px 4px' }}>Item</th>
                  <th style={{ padding: '6px 4px', textAlign: 'right' }}>Qty</th>
                  <th style={{ padding: '6px 4px', textAlign: 'right' }}>Unit</th>
                  <th style={{ padding: '6px 4px', textAlign: 'right' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {lineItems.map((li, i) => (
                  <tr key={i} style={{ borderTop: '1px solid var(--qc-divider)' }}>
                    <td style={{ padding: '8px 4px' }}>{li.description || '—'}</td>
                    <td style={{ padding: '8px 4px', textAlign: 'right' }}>{li.quantity ?? '—'}</td>
                    <td style={{ padding: '8px 4px', textAlign: 'right' }}>{li.unit_price != null ? `$${Number(li.unit_price).toLocaleString()}` : '—'}</td>
                    <td style={{ padding: '8px 4px', textAlign: 'right' }}>{li.total != null ? `$${Number(li.total).toLocaleString()}` : '—'}</td>
                  </tr>
                ))}
                <tr style={{ borderTop: '2px solid var(--qc-gold-border)' }}>
                  <td colSpan={3} style={{ padding: '12px 4px', textAlign: 'right', fontWeight: 600 }}>Total</td>
                  <td style={{ padding: '12px 4px', textAlign: 'right', fontWeight: 600, color: 'var(--qc-gold)' }}>${total.toLocaleString()}</td>
                </tr>
              </tbody>
            </table>
          </>
        )}

        {assumptions.length > 0 && (
          <>
            <div className={app.sectionH}>What&apos;s included</div>
            <ul className={app.bulletList}>
              {assumptions.filter(Boolean).map((s, i) => <li key={i}><span>{s}</span></li>)}
            </ul>
          </>
        )}
        {exclusions.length > 0 && (
          <>
            <div className={app.sectionH}>What&apos;s not included</div>
            <ul className={app.bulletList}>
              {exclusions.filter(Boolean).map((s, i) => <li key={i}><span>{s}</span></li>)}
            </ul>
          </>
        )}

        {(timeline?.start || timeline?.duration_days) && (
          <>
            <div className={app.sectionH}>Timeline</div>
            <div style={{ fontSize: 14, color: 'var(--qc-text-muted)' }}>
              {timeline.start}{timeline.duration_days ? ` · about ${timeline.duration_days} working days` : ''}
            </div>
          </>
        )}
        {paymentTerms && (
          <>
            <div className={app.sectionH}>Payment terms</div>
            <div style={{ fontSize: 14, color: 'var(--qc-text-muted)' }}>{paymentTerms}</div>
          </>
        )}
      </div>
    </div>
  )
}
