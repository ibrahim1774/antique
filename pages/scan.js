import { useState, useEffect, useRef } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { upload } from '@vercel/blob/client'
import AuthModal from '../components/AuthModal'
import UpgradeModal from '../components/UpgradeModal'
import styles from '../styles/Scan.module.css'
import {
  getLocalScanCount,
  incrementLocalScanCount,
  isOverLocalLimit,
  FREE_SCAN_LIMIT
} from '../lib/scanLimit'

const LOADING_MESSAGES = [
  "Analyzing maker's marks...",
  'Checking historical records...',
  'Cross-referencing style periods...',
  'Researching comparable pieces...',
]

const CONFIDENCE_CONFIG = {
  high:     { label: 'Strong match',                        color: '#6BAF7A' },
  moderate: { label: 'Possible match',                      color: '#C8921F' },
  low:      { label: 'Uncertain — try a clearer photo',     color: '#AF6464' },
}

export default function Scan() {
  const { data: session } = useSession()

  const [selectedFile, setSelectedFile]   = useState(null)
  const [previewUrl,   setPreviewUrl]     = useState(null)
  const [isLoading,    setIsLoading]      = useState(false)
  const [loadingMsg,   setLoadingMsg]     = useState(LOADING_MESSAGES[0])
  const [result,       setResult]         = useState(null)
  const [error,        setError]          = useState(null)
  const [showAuth,     setShowAuth]       = useState(false)
  const [showUpgrade,  setShowUpgrade]    = useState(false)
  const [saveStatus,   setSaveStatus]     = useState('idle')
  const [scansUsed,    setScansUsed]      = useState(0)

  const loadingIntervalRef = useRef(null)

  useEffect(() => {
    setScansUsed(getLocalScanCount())
  }, [])

  useEffect(() => {
    if (isLoading) {
      let i = 0
      loadingIntervalRef.current = setInterval(() => {
        i = (i + 1) % LOADING_MESSAGES.length
        setLoadingMsg(LOADING_MESSAGES[i])
      }, 2500)
    } else {
      clearInterval(loadingIntervalRef.current)
    }
    return () => clearInterval(loadingIntervalRef.current)
  }, [isLoading])

  function handleFileSelect(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setSelectedFile(file)
    setPreviewUrl(URL.createObjectURL(file))
    setResult(null)
    setError(null)
    setSaveStatus('idle')
  }

  function handleDrop(e) {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setError('Please drop an image file.')
      return
    }
    setSelectedFile(file)
    setPreviewUrl(URL.createObjectURL(file))
    setResult(null)
    setError(null)
  }

  function reset() {
    setSelectedFile(null)
    setPreviewUrl(null)
    setResult(null)
    setError(null)
    setSaveStatus('idle')
  }

  async function handleScan() {
    if (!selectedFile) return

    if (!session && isOverLocalLimit()) {
      setShowUpgrade(true)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // Convert image to base64 and send directly — no Blob upload needed for identification
      const imageData = await new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = e => resolve(e.target.result)
        reader.onerror = reject
        reader.readAsDataURL(selectedFile)
      })

      const res = await fetch('/api/identify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl: imageData })
      })

      const data = await res.json()

      if (res.status === 402) {
        setShowUpgrade(true)
        setIsLoading(false)
        return
      }

      if (!res.ok) {
        setError(data.error || 'Something went wrong. Please try again.')
        setIsLoading(false)
        return
      }

      setResult(data)

      if (!session) {
        incrementLocalScanCount()
        setScansUsed(getLocalScanCount())
      }

      if (typeof window !== 'undefined' && window.fbq) {
        window.fbq('trackCustom', 'AntiqueScan', {
          category: data.category,
          confidence: data.confidence
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
    if (!result || !selectedFile) return

    setSaveStatus('saving')
    try {
      // Upload to Blob now that user wants to save
      const blob = await upload(selectedFile.name, selectedFile, {
        access: 'public',
        handleUploadUrl: '/api/upload-token',
      })

      const res = await fetch('/api/save-scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl: blob.url, result })
      })
      setSaveStatus(res.ok ? 'saved' : 'error')
    } catch {
      setSaveStatus('error')
    }
  }

  function handleShare() {
    const text = `I just identified a ${result?.itemName} using Tivoro! ${result?.era} · ${result?.origin}. Research starting point only.`
    if (navigator.share) {
      navigator.share({ text })
    } else {
      navigator.clipboard.writeText(text)
    }
  }

  const conf = CONFIDENCE_CONFIG[result?.confidence] || CONFIDENCE_CONFIG.low

  return (
    <>
      <Head>
        <title>Scan an Antique — Tivoro</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className={styles.page}>

        <AuthModal
          isOpen={showAuth}
          onClose={() => setShowAuth(false)}
          reason="save"
        />
        <UpgradeModal
          isOpen={showUpgrade}
          onClose={() => setShowUpgrade(false)}
        />

        {isLoading && (
          <div className={styles.loadingOverlay}>
            <div className={styles.loadingPulse} />
            <p className={styles.loadingTitle}>Researching your piece...</p>
            <p className={styles.loadingMsg}>{loadingMsg}</p>
          </div>
        )}

        <header className={styles.header}>
          <Link href="/" className={styles.logo}>Tivoro</Link>
          <div className={styles.headerRight}>
            {!session && scansUsed < FREE_SCAN_LIMIT && (
              <span className={styles.scanCounter}>
                {FREE_SCAN_LIMIT - scansUsed} free scan
                {FREE_SCAN_LIMIT - scansUsed !== 1 ? 's' : ''} left
              </span>
            )}
            {session && (
              <Link href="/my-scans" className={styles.headerLink}>
                My Scans
              </Link>
            )}
          </div>
        </header>

        <main className={styles.main}>

          {!result && (
            <div className={styles.hero}>
              <h1 className={styles.heroTitle}>Identify any antique</h1>
              <p className={styles.heroSub}>
                Take a photo or upload an image to get started
              </p>
            </div>
          )}

          {/* Idle: no file selected */}
          {!result && !isLoading && !selectedFile && (
            <div className={styles.scanZone}>
              <div
                className={styles.dropzone}
                onDrop={handleDrop}
                onDragOver={e => e.preventDefault()}
              >
                <div className={styles.scanBtnWrap}>
                  <div className={styles.scanBtn}>
                    <svg width="32" height="32" viewBox="0 0 24 24"
                      fill="none" stroke="#1A1610" strokeWidth="2">
                      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                      <circle cx="12" cy="13" r="4"/>
                    </svg>
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handleFileSelect}
                      className={styles.fileInput}
                      aria-label="Take a photo or upload an image"
                    />
                  </div>
                  <p className={styles.scanBtnLabel}>Tap to take photo</p>
                </div>

                <div className={styles.orDivider}>
                  <span>or drag &amp; drop</span>
                </div>

                <p className={styles.dropzoneHint}>JPG, PNG, WEBP · Max 10MB</p>
              </div>

              <div className={styles.categories}>
                {['Pottery', 'Jewelry', 'Furniture', 'Coins', 'Art', 'Watches', 'Glass']
                  .map(c => (
                    <span key={c} className={styles.catChip}>{c}</span>
                  ))}
              </div>
            </div>
          )}

          {/* Preview + confirm */}
          {selectedFile && !result && !isLoading && (
            <div className={styles.previewZone}>
              <img
                src={previewUrl}
                alt="Selected antique"
                className={styles.previewImg}
              />
              <p className={styles.previewName}>{selectedFile.name}</p>
              <button className={styles.identifyBtn} onClick={handleScan}>
                Identify this antique
              </button>
              <button className={styles.resetLink} onClick={reset}>
                Choose a different photo
              </button>
            </div>
          )}

          {error && <div className={styles.errorBox}>{error}</div>}

          {/* Results */}
          {result && (
            <div className={styles.results}>

              <div className={styles.resultHeader}>
                {previewUrl && (
                  <img
                    src={previewUrl}
                    alt={result.itemName}
                    className={styles.resultThumb}
                  />
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

              <div className={styles.detailsCard}>
                {[
                  { label: 'Era',           value: result.era },
                  { label: 'Origin',        value: result.origin },
                  { label: "Maker's mark",  value: result.makersMarkDescription || 'Not detected' },
                ].map(({ label, value }) => (
                  <div key={label} className={styles.detailRow}>
                    <span className={styles.detailLabel}>{label}</span>
                    <span className={styles.detailValue}>{value}</span>
                  </div>
                ))}
              </div>

              <div className={styles.historyCard}>
                <div className={styles.cardLabel}>Historical Context</div>
                <p className={styles.historyText}>{result.historicalContext}</p>
              </div>

              <div className={styles.researchCard}>
                <div className={styles.cardLabel}>Research Further</div>
                <p className={styles.researchNote}>
                  This is a starting point only — not an appraisal.
                  Search comparable sold listings to inform your research.
                </p>
                <a
                  href={`https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(result.searchQuery)}&LH_Sold=1&LH_Complete=1`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.ebayLink}
                >
                  Search eBay sold listings →
                </a>
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
                  {saveStatus === 'idle'   && 'Save to Collection'}
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

          {/* How it works — only on idle */}
          {!result && !selectedFile && !isLoading && (
            <div className={styles.howSection}>
              <p className={styles.howLabel}>How it works</p>
              <div className={styles.howSteps}>
                {[
                  { n: '1', t: 'Take a photo',      b: 'The piece, the mark on the bottom, or both.' },
                  { n: '2', t: 'AI researches it',  b: 'Identifies period, origin, and maker.' },
                  { n: '3', t: 'Get a head start',  b: "Know if it's worth a closer look — before you spend a dollar." },
                ].map(s => (
                  <div key={s.n} className={styles.howStep}>
                    <div className={styles.howNum}>{s.n}</div>
                    <div>
                      <div className={styles.howTitle}>{s.t}</div>
                      <div className={styles.howBody}>{s.b}</div>
                    </div>
                  </div>
                ))}
              </div>
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
