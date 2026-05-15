import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useSession, signIn } from 'next-auth/react'
import { upload } from '@vercel/blob/client'
import Layout from '../../components/contractor-quotes/Layout'
import qc from '../../styles/QuoteClear.module.css'
import app from '../../styles/QuoteClearApp.module.css'

const TRADES = [
  { v: '',            label: 'Choose a trade…' },
  { v: 'roofer',      label: 'Roofing' },
  { v: 'hvac',        label: 'HVAC' },
  { v: 'plumber',     label: 'Plumbing' },
  { v: 'electrician', label: 'Electrical' },
  { v: 'painter',     label: 'Painting' },
  { v: 'gc',          label: 'General Contracting' },
  { v: 'other',       label: 'Other' },
]

export default function Settings() {
  const { data: session, status } = useSession()
  const fileRef = useRef(null)

  const [companyName, setCompanyName]     = useState('')
  const [tradeType, setTradeType]         = useState('')
  const [phone, setPhone]                 = useState('')
  const [address, setAddress]             = useState('')
  const [license, setLicense]             = useState('')
  const [brandColor, setBrandColor]       = useState('#D4A574')
  const [logoUrl, setLogoUrl]             = useState('')
  const [loading, setLoading]             = useState(true)
  const [saving, setSaving]               = useState(false)
  const [uploading, setUploading]         = useState(false)
  const [savedAt, setSavedAt]             = useState(null)
  const [error, setError]                 = useState(null)

  useEffect(() => {
    if (status === 'unauthenticated') {
      signIn('google', { callbackUrl: '/contractor-quotes/settings' })
    }
  }, [status])

  useEffect(() => {
    if (status !== 'authenticated') return
    fetch('/api/contractor-quotes/billing/status')
      .then(r => r.ok ? r.json() : null)
      .then(b => {
        // Pull the full profile from a dedicated endpoint? Reuse billing/status fields we surfaced.
        if (b) {
          setCompanyName(b.company_name || '')
          setTradeType(b.trade_type || '')
        }
        return fetch('/api/contractor-quotes/profile/get')
      })
      .then(r => r && r.ok ? r.json() : null)
      .then(p => {
        if (p?.profile) {
          setCompanyName(p.profile.company_name || '')
          setTradeType(p.profile.trade_type || '')
          setPhone(p.profile.phone || '')
          setAddress(p.profile.address || '')
          setLicense(p.profile.license_number || '')
          setBrandColor(p.profile.brand_color || '#D4A574')
          setLogoUrl(p.profile.logo_url || '')
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [status])

  async function handleLogo(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setError(null)
    try {
      const blob = await upload(`qc-logos/${Date.now()}-${file.name}`, file, {
        access: 'public',
        handleUploadUrl: '/api/contractor-quotes/brand/upload-token',
      })
      setLogoUrl(blob.url)
      // Persist immediately so refresh keeps it
      await fetch('/api/contractor-quotes/profile/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ logo_url: blob.url }),
      })
    } catch (err) {
      setError(err.message || 'Logo upload failed.')
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  async function save() {
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/contractor-quotes/profile/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_name: companyName || null,
          trade_type:   tradeType || null,
          phone:        phone || null,
          address:      address || null,
          license_number: license || null,
          brand_color:  brandColor || '#D4A574',
          logo_url:     logoUrl || null,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) setError(data.error || 'Save failed.')
      else setSavedAt(new Date())
    } catch (err) {
      setError('Network error.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Layout title="Settings — QuoteClear">
      <div className={qc.container}>
        <section className={app.appShell}>
          <div className={app.crumb}>
            <Link href="/contractor-quotes/dashboard">Dashboard</Link> · Settings
          </div>
          <h1 className={app.pageTitle}>Brand kit</h1>
          <p className={app.pageLede}>
            Your logo, color, and contact info appear at the top of every proposal you send.
          </p>

          {loading ? (
            <div className={app.emptyState}><div className={app.emptyBody}>Loading…</div></div>
          ) : (
            <div className={app.formCard}>
              <div className={`${app.fieldRow} ${app.cols2}`}>
                <div className={app.field}>
                  <label className={app.label}>Company name</label>
                  <input className={app.input} value={companyName} onChange={e => setCompanyName(e.target.value)} />
                </div>
                <div className={app.field}>
                  <label className={app.label}>Trade</label>
                  <select
                    className={app.input}
                    value={tradeType}
                    onChange={e => setTradeType(e.target.value)}
                  >
                    {TRADES.map(t => <option key={t.v} value={t.v}>{t.label}</option>)}
                  </select>
                </div>
              </div>

              <div className={`${app.fieldRow} ${app.cols2}`}>
                <div className={app.field}>
                  <label className={app.label}>Phone</label>
                  <input className={app.input} value={phone} onChange={e => setPhone(e.target.value)} />
                </div>
                <div className={app.field}>
                  <label className={app.label}>License #</label>
                  <input className={app.input} value={license} onChange={e => setLicense(e.target.value)} />
                </div>
              </div>

              <div className={app.fieldRow}>
                <div className={app.field}>
                  <label className={app.label}>Business address</label>
                  <input className={app.input} value={address} onChange={e => setAddress(e.target.value)} />
                </div>
              </div>

              <div className={`${app.fieldRow} ${app.cols2}`}>
                <div className={app.field}>
                  <label className={app.label}>Brand accent color</label>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <input
                      type="color"
                      value={brandColor}
                      onChange={e => setBrandColor(e.target.value)}
                      style={{ width: 56, height: 40, border: '1px solid var(--qc-divider)', borderRadius: 8, background: 'transparent' }}
                    />
                    <input
                      className={app.input}
                      value={brandColor}
                      onChange={e => setBrandColor(e.target.value)}
                      style={{ flex: 1 }}
                    />
                  </div>
                </div>
                <div className={app.field}>
                  <label className={app.label}>Logo</label>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    {logoUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={logoUrl} alt="Logo" style={{ width: 48, height: 48, objectFit: 'contain', background: 'var(--qc-bg)', borderRadius: 8, border: '1px solid var(--qc-divider)' }} />
                    )}
                    <input
                      ref={fileRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/svg+xml"
                      onChange={handleLogo}
                      disabled={uploading}
                      style={{ flex: 1, fontSize: 13, color: 'var(--qc-text-muted)' }}
                    />
                  </div>
                  {uploading && <div style={{ marginTop: 6, fontSize: 12, color: 'var(--qc-text-muted)' }}>Uploading…</div>}
                </div>
              </div>

              <div className={app.formActions}>
                <button className={qc.btnPrimary} onClick={save} disabled={saving}>
                  {saving ? 'Saving…' : 'Save settings'}
                </button>
                {savedAt && !saving && (
                  <span className={app.savedNote}>Saved {savedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                )}
              </div>

              {error && <div className={app.errorBox}>{error}</div>}
            </div>
          )}
        </section>
      </div>
    </Layout>
  )
}
