import { useState, useEffect, useRef } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useSession, signIn } from 'next-auth/react'
import { upload } from '@vercel/blob/client'
import AuthModal from '../components/AuthModal'
import Paywall from '../components/Paywall'
import styles from '../styles/Scan.module.css'

const LOADING_MESSAGES = [
  "Analyzing maker's marks...",
  'Checking historical records...',
  'Cross-referencing style periods...',
  'Estimating market value...',
  'Assessing authenticity signals...',
]

const CONFIDENCE_CONFIG = {
  high:     { label: 'Strong match',                    color: '#6BAF7A' },
  moderate: { label: 'Possible match',                  color: '#C8921F' },
  low:      { label: 'Uncertain — try a clearer photo', color: '#AF6464' },
}

const AUTH_CONFIG = {
  authentic:        { label: 'Authentic',         tone: 'good', icon: '✓' },
  likely_authentic: { label: 'Likely Authentic',  tone: 'good', icon: '✓' },
  likely_fake:     { label: 'Likely Fake',        tone: 'bad',  icon: '!' },
  uncertain:       { label: 'Uncertain',          tone: 'warn', icon: '?' },
}

const CATEGORY_TAGS = ['Pottery', 'Jewelry', 'Furniture', 'Silverware', 'Coins', 'Art', 'Watches', 'Glass']

export default function Scan() {
  const { data: session, status: sessionStatus } = useSession()

  const [selectedFiles,     setSelectedFiles]     = useState([])   // array of File
  const [previewUrls,       setPreviewUrls]       = useState([])   // array of object/data URLs
  const [restoredPhotoUrls, setRestoredPhotoUrls] = useState([])   // base64 data URLs from sessionStorage
  const [isLoading,         setIsLoading]         = useState(false)
  const [loadingMsg,        setLoadingMsg]        = useState(LOADING_MESSAGES[0])
  const [result,            setResult]            = useState(null)
  const [error,             setError]             = useState(null)
  const [showAuth,          setShowAuth]          = useState(false)
  const [showPaywall,       setShowPaywall]       = useState(false)
  const [paywallMode,       setPaywallMode]       = useState('subscribe')
  const [paywallData,       setPaywallData]       = useState({})
  const [saveStatus,        setSaveStatus]        = useState('idle')
  const [billing,           setBilling]           = useState(null)
  const [pendingScan,       setPendingScan]       = useState(false)

  const MAX_PHOTOS = 4

  const loadingIntervalRef = useRef(null)

  useEffect(() => {
    if (!session) return
    fetch('/api/billing/status').then(r => r.ok ? r.json() : null).then(setBilling)
  }, [session])

  // Restore photos saved before an auth redirect or Stripe checkout
  useEffect(() => {
    if (typeof window === 'undefined') return
    const stored = sessionStorage.getItem('tivoro_pending_photos')
    if (!stored) return
    try {
      const urls = JSON.parse(stored)
      if (Array.isArray(urls) && urls.length) {
        setRestoredPhotoUrls(urls)
        setPreviewUrls(urls)
        if (sessionStorage.getItem('tivoro_pending_scan') === '1') {
          setPendingScan(true)
        }
      }
    } catch {}
    sessionStorage.removeItem('tivoro_pending_photos')
    sessionStorage.removeItem('tivoro_pending_scan')
  }, [])

  // Auto-trigger scan once user signs in (after attempting to scan unauthenticated)
  useEffect(() => {
    if (pendingScan && session && (selectedFiles.length || restoredPhotoUrls.length)) {
      setPendingScan(false)
      setShowAuth(false)
      handleScan()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, pendingScan, restoredPhotoUrls.length])

  useEffect(() => {
    if (isLoading) {
      let i = 0
      loadingIntervalRef.current = setInterval(() => {
        i = (i + 1) % LOADING_MESSAGES.length
        setLoadingMsg(LOADING_MESSAGES[i])
      }, 2200)
    } else {
      clearInterval(loadingIntervalRef.current)
    }
    return () => clearInterval(loadingIntervalRef.current)
  }, [isLoading])

  function addFiles(incoming) {
    const valid = Array.from(incoming).filter(f => f.type.startsWith('image/'))
    if (!valid.length) return
    setRestoredPhotoUrls([])
    setSelectedFiles(prev => {
      const combined = [...prev, ...valid].slice(0, MAX_PHOTOS)
      setPreviewUrls(combined.map(f => URL.createObjectURL(f)))
      return combined
    })
    setResult(null)
    setError(null)
    setSaveStatus('idle')
  }

  function handleFileSelect(e) {
    if (e.target.files?.length) addFiles(e.target.files)
    e.target.value = ''   // reset so same file can be re-added after remove
  }

  function handleDrop(e) {
    e.preventDefault()
    const files = e.dataTransfer.files
    if (!files?.length) return
    const hasNonImage = Array.from(files).some(f => !f.type.startsWith('image/'))
    if (hasNonImage) { setError('Please drop image files only.'); return }
    addFiles(files)
  }

  function removePhoto(idx) {
    if (restoredPhotoUrls.length > 0) {
      const next = restoredPhotoUrls.filter((_, i) => i !== idx)
      setRestoredPhotoUrls(next)
      setPreviewUrls(next)
    } else {
      setSelectedFiles(prev => {
        const next = prev.filter((_, i) => i !== idx)
        setPreviewUrls(next.map(f => URL.createObjectURL(f)))
        return next
      })
    }
  }

  function reset() {
    setSelectedFiles([])
    setPreviewUrls([])
    setRestoredPhotoUrls([])
    setResult(null)
    setError(null)
    setSaveStatus('idle')
  }

  async function handleScan() {
    const hasPhotos = selectedFiles.length > 0 || restoredPhotoUrls.length > 0
    if (!hasPhotos) return

    const readFile = file => new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = e => resolve(e.target.result)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })

    // Step 1: must be signed in
    if (!session) {
      setPendingScan(true)
      // Persist photos so they survive the OAuth redirect
      if (selectedFiles.length) {
        const base64s = await Promise.all(selectedFiles.map(readFile))
        sessionStorage.setItem('tivoro_pending_photos', JSON.stringify(base64s))
      }
      sessionStorage.setItem('tivoro_pending_scan', '1')
      setShowAuth(true)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // Use restored base64 URLs if files were loaded from sessionStorage
      const imageUrls = restoredPhotoUrls.length > 0
        ? restoredPhotoUrls
        : await Promise.all(selectedFiles.map(readFile))

      if (restoredPhotoUrls.length > 0) setRestoredPhotoUrls([])

      const res = await fetch('/api/identify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrls }),
      })

      const data = await res.json()

      if (res.status === 401) {
        setIsLoading(false)
        sessionStorage.setItem('tivoro_pending_photos', JSON.stringify(imageUrls))
        sessionStorage.setItem('tivoro_pending_scan', '1')
        setPendingScan(true)
        setShowAuth(true)
        return
      }

      if (res.status === 402) {
        setIsLoading(false)
        // Persist photos so they survive the Stripe checkout redirect
        sessionStorage.setItem('tivoro_pending_photos', JSON.stringify(imageUrls))
        sessionStorage.setItem('tivoro_pending_scan', '1')
        setPaywallMode(data.hasSubscription ? 'topup' : 'subscribe')
        setPaywallData({
          monthlyUsed: data.monthlyUsed,
          monthlyQuota: data.monthlyQuota,
          topupScans: data.topupScans,
        })
        setShowPaywall(true)
        return
      }

      if (!res.ok) {
        setError(data.error || 'Something went wrong. Please try again.')
        setIsLoading(false)
        return
      }

      setResult(data)
      // Refresh billing
      fetch('/api/billing/status').then(r => r.ok ? r.json() : null).then(setBilling)

      if (typeof window !== 'undefined' && window.fbq) {
        window.fbq('trackCustom', 'AntiqueScan', {
          category: data.category,
          confidence: data.confidence,
          authenticity: data.authenticity,
        })
      }
    } catch (err) {
      setError('Something went wrong. Please check your connection and try again.')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  async function handleSave() {
    if (!session) {
      setShowAuth(true)
      return
    }
    if (!result || !selectedFiles.length) return

    setSaveStatus('saving')
    try {
      const primaryFile = selectedFiles[0]
      const blob = await upload(primaryFile.name, primaryFile, {
        access: 'public',
        handleUploadUrl: '/api/upload-token',
      })
      const res = await fetch('/api/save-scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl: blob.url, result }),
      })
      setSaveStatus(res.ok ? 'saved' : 'error')
    } catch {
      setSaveStatus('error')
    }
  }

  function handleShare() {
    const text = `I just identified a ${result?.itemName} using Tivoro! ${result?.era} · ${result?.origin}. Estimated value: $${result?.estimatedValueLow}–$${result?.estimatedValueHigh}.`
    if (navigator.share) {
      navigator.share({ text })
    } else {
      navigator.clipboard.writeText(text)
    }
  }

  const conf = CONFIDENCE_CONFIG[result?.confidence] || CONFIDENCE_CONFIG.low
  const auth = AUTH_CONFIG[result?.authenticity] || AUTH_CONFIG.uncertain
  const valueRange = result?.estimatedValueLow != null && result?.estimatedValueHigh != null
    ? `$${result.estimatedValueLow.toLocaleString()} – $${result.estimatedValueHigh.toLocaleString()}`
    : null
  const effectivePhotoCount = selectedFiles.length || restoredPhotoUrls.length
  const hasFiles = effectivePhotoCount > 0
  const canAddMore = selectedFiles.length < MAX_PHOTOS && restoredPhotoUrls.length === 0

  return (
    <>
      <Head>
        <title>Scan an Antique — Tivoro</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </Head>

      <div className={styles.page}>

        <AuthModal
          isOpen={showAuth}
          onClose={() => { setShowAuth(false); setPendingScan(false) }}
          reason="scan"
        />
        <Paywall
          isOpen={showPaywall}
          onClose={() => setShowPaywall(false)}
          mode={paywallMode}
        />

        {isLoading && (
          <div className={styles.loadingOverlay}>
            <div className={styles.loadingPulse} />
            <p className={styles.loadingTitle}>Researching your piece</p>
            <p className={styles.loadingMsg}>{loadingMsg}</p>
          </div>
        )}

        <header className={styles.header}>
          <Link href="/" className={styles.logo}>Tivoro</Link>
          <div className={styles.headerRight}>
            {session && billing && (
              <span className={styles.scanCounter}>
                {billing.totalScansLeft} scans left
              </span>
            )}
            {session && (
              <Link href="/my-scans" className={styles.headerLink}>
                Collection
              </Link>
            )}
            {!session && sessionStatus !== 'loading' && (
              <button className={styles.signInBtn} onClick={() => signIn('google', { callbackUrl: '/scan' })}>
                Sign in
              </button>
            )}
          </div>
        </header>

        <main className={styles.main}>

          {!result && (
            <div className={styles.hero}>
              <h1 className={styles.heroTitle}>Scan & Identify</h1>
              <p className={styles.heroSub}>
                Snap any antique, collectible, or vintage piece. Get the maker, era, market value, and authenticity assessment in seconds.
              </p>
            </div>
          )}

          {!result && !isLoading && (
            <div className={styles.scanZone}>
              {!hasFiles && (
                <div
                  className={styles.dropzone}
                  onDrop={handleDrop}
                  onDragOver={e => e.preventDefault()}
                >
                  <div className={styles.scanBtnWrap}>
                    <div className={styles.scanBtn}>
                      <svg width="28" height="28" viewBox="0 0 24 24"
                        fill="none" stroke="#1A1610" strokeWidth="2">
                        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                        <circle cx="12" cy="13" r="4"/>
                      </svg>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleFileSelect}
                        className={styles.fileInput}
                        aria-label="Upload photos"
                      />
                    </div>
                    <p className={styles.scanBtnLabel}>Tap to add photos</p>
                  </div>
                  <p className={styles.multiHint}>
                    Add up to 4 photos for a more accurate result —<br />
                    try the item, the base, and any maker&apos;s marks
                  </p>
                  <div className={styles.orDivider}><span>or drag &amp; drop</span></div>
                  <p className={styles.dropzoneHint}>JPG, PNG, WEBP · Up to 4 photos</p>
                </div>
              )}

              {hasFiles && (
                <div className={styles.previewZone}>
                  <div className={styles.thumbGrid}>
                    {previewUrls.map((url, idx) => (
                      <div key={idx} className={styles.thumbWrap}>
                        <img src={url} alt={`Photo ${idx + 1}`} className={styles.thumbImg} />
                        <button
                          className={styles.thumbRemove}
                          onClick={() => removePhoto(idx)}
                          aria-label={`Remove photo ${idx + 1}`}
                        >×</button>
                        {idx === 0 && <span className={styles.thumbPrimary}>Main</span>}
                      </div>
                    ))}
                    {canAddMore && (
                      <label className={styles.thumbAdd}>
                        <svg width="22" height="22" viewBox="0 0 24 24"
                          fill="none" stroke="#5A4F3F" strokeWidth="2">
                          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                          <circle cx="12" cy="13" r="4"/>
                        </svg>
                        <span>Add photo</span>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleFileSelect}
                          className={styles.fileInput}
                        />
                      </label>
                    )}
                  </div>

                  <p className={styles.photoCount}>
                    {effectivePhotoCount} of {MAX_PHOTOS} photos · more angles = better accuracy
                  </p>

                  <button className={styles.identifyBtn} onClick={handleScan}>
                    Identify from {effectivePhotoCount} {effectivePhotoCount === 1 ? 'photo' : 'photos'} →
                  </button>
                  <button className={styles.resetLink} onClick={reset}>
                    Start over
                  </button>
                </div>
              )}

              {!hasFiles && (
                <div className={styles.categories}>
                  {CATEGORY_TAGS.map(c => (
                    <span key={c} className={styles.catChip}>{c}</span>
                  ))}
                </div>
              )}
            </div>
          )}

          {error && <div className={styles.errorBox}>{error}</div>}

          {result && (
            <div className={styles.results}>

              <div className={styles.resultHeader}>
                {previewUrls[0] && (
                  <div className={styles.resultThumbWrap}>
                    <img
                      src={previewUrls[0]}
                      alt={result.itemName}
                      className={styles.resultThumb}
                    />
                    {valueRange && (
                      <div className={styles.valueStarburst}>
                        <span className={styles.valueLabel}>VALUE</span>
                        <span className={styles.valueAmount}>{valueRange}</span>
                      </div>
                    )}
                  </div>
                )}
                <div className={styles.resultMeta}>
                  <span className={styles.catBadge}>{result.category}</span>
                  <h2 className={styles.itemName}>{result.itemName}</h2>
                  <div className={styles.confidence} style={{ color: conf.color }}>
                    <span className={styles.confDot} style={{ background: conf.color }} />
                    {conf.label}
                  </div>
                </div>
              </div>

              <div className={`${styles.authCard} ${styles['authCard_' + auth.tone]}`}>
                <div className={styles.authHeader}>
                  <span className={styles.authIcon}>{auth.icon}</span>
                  <div>
                    <div className={styles.authLabel}>Authenticity</div>
                    <div className={styles.authVerdict}>{auth.label}</div>
                  </div>
                </div>
                {result.authenticitySignals?.length > 0 && (
                  <ul className={styles.authSignals}>
                    {result.authenticitySignals.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                )}
              </div>

              <div className={styles.detailsCard}>
                {[
                  { label: 'Era',           value: result.era },
                  { label: 'Origin',        value: result.origin },
                  { label: 'Materials',     value: result.materials },
                  { label: 'Condition',     value: result.condition },
                  { label: "Maker's mark",  value: result.makersMarkDescription || 'Not detected' },
                ].filter(r => r.value).map(({ label, value }) => (
                  <div key={label} className={styles.detailRow}>
                    <span className={styles.detailLabel}>{label}</span>
                    <span className={styles.detailValue}>{value}</span>
                  </div>
                ))}
              </div>

              {valueRange && (
                <div className={styles.valueCard}>
                  <div className={styles.cardLabel}>Market Value Range</div>
                  <div className={styles.valueBig}>{valueRange}</div>
                  {result.valueNotes && <p className={styles.valueNotes}>{result.valueNotes}</p>}
                  <div className={styles.compareRow}>
                    <a
                      className={styles.compareLink}
                      target="_blank" rel="noopener noreferrer"
                      href={`https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(result.searchQuery)}&LH_Sold=1&LH_Complete=1`}
                    >eBay sold</a>
                    <a
                      className={styles.compareLink}
                      target="_blank" rel="noopener noreferrer"
                      href={`https://www.amazon.com/s?k=${encodeURIComponent(result.searchQuery)}`}
                    >Amazon</a>
                    <a
                      className={styles.compareLink}
                      target="_blank" rel="noopener noreferrer"
                      href={`https://www.google.com/search?tbm=shop&q=${encodeURIComponent(result.searchQuery)}`}
                    >Google Shopping</a>
                  </div>
                </div>
              )}

              <div className={styles.historyCard}>
                <div className={styles.cardLabel}>Historical Context</div>
                <p className={styles.historyText}>{result.historicalContext}</p>
              </div>

              <div className={styles.disclaimer}>
                Research starting point only. Actual value varies by condition,
                provenance, restoration, and current market. Consult a certified
                appraiser before making significant financial decisions.
              </div>

              <div className={styles.actions}>
                <button
                  className={styles.saveBtn}
                  onClick={handleSave}
                  disabled={saveStatus === 'saved'}
                >
                  {saveStatus === 'idle'   && '+ Add to Collection'}
                  {saveStatus === 'saving' && 'Saving...'}
                  {saveStatus === 'saved'  && '✓ Saved'}
                  {saveStatus === 'error'  && 'Try Again'}
                </button>
                <button className={styles.scanAgainBtn} onClick={reset}>
                  Scan Another
                </button>
                <button
                  className={styles.shareBtn}
                  onClick={handleShare}
                  aria-label="Share result"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24"
                    fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="18" cy="5" r="3"/>
                    <circle cx="6" cy="12" r="3"/>
                    <circle cx="18" cy="19" r="3"/>
                    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
                    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                  </svg>
                </button>
              </div>
            </div>
          )}

          {!result && !hasFiles && !isLoading && (
            <div className={styles.featureGrid} style={{ marginTop: 16 }}>
              <Link href="/helper" className={styles.featureTile}>
                <div className={styles.featureIcon}>💬</div>
                <div className={styles.featureTitle}>AI Helper</div>
                <div className={styles.featureBody}>Ask anything about your piece.</div>
              </Link>
              <Link href="/learn" className={styles.featureTile}>
                <div className={styles.featureIcon}>📖</div>
                <div className={styles.featureTitle}>Learn &amp; Discover</div>
                <div className={styles.featureBody}>Guides for collectors.</div>
              </Link>
            </div>
          )}

          <p className={styles.trustLine}>
            Research tool only · Not a certified appraisal service
          </p>

        </main>
      </div>
    </>
  )
}
