import { useState } from 'react'
import Link from 'next/link'
import styles from '../../styles/QuoteClear.module.css'
import { SAMPLE_BEFORE } from './Hero'

const DEFAULT_SAMPLE = SAMPLE_BEFORE

export default function DemoWidget() {
  const [input, setInput] = useState(DEFAULT_SAMPLE)
  const [output, setOutput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [error, setError] = useState(null)
  const [done, setDone] = useState(false)

  async function runDemo() {
    setError(null)
    setOutput('')
    setDone(false)
    setStreaming(true)
    try {
      const res = await fetch('/api/contractor-quotes/demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estimate: input }),
      })

      if (!res.ok) {
        const ctype = res.headers.get('content-type') || ''
        const msg = ctype.includes('application/json')
          ? (await res.json()).error
          : `Demo unavailable (HTTP ${res.status}).`
        setError(msg || 'Demo unavailable. Please try again.')
        setStreaming(false)
        return
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buf = ''
      while (true) {
        const { value, done: streamDone } = await reader.read()
        if (streamDone) break
        buf += decoder.decode(value, { stream: true })
        setOutput(buf)
      }
      setStreaming(false)
      setDone(true)
    } catch (err) {
      console.error('[demo]', err)
      setError('Network error. Please try again.')
      setStreaming(false)
    }
  }

  return (
    <section id="demo" className={styles.section}>
      <div className={styles.container}>
        <div className={styles.sectionHead}>
          <div className={styles.sectionEyebrow}>Live demo</div>
          <h2 className={styles.sectionTitle}>Paste your estimate. Watch it become a proposal.</h2>
          <p className={styles.sectionLede}>
            This is the same engine your customers will see. Try the sample below or paste your own.
          </p>
        </div>

        <div className={styles.demoWrap}>
          <div className={styles.demoGrid}>
            <div className={styles.demoPanel}>
              <div className={styles.demoLabel}>
                Your estimate
                <span>{input.length} chars</span>
              </div>
              <textarea
                className={styles.demoInput}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={streaming}
                placeholder="Paste your rough estimate here…"
                spellCheck="false"
              />
            </div>
            <div className={styles.demoPanel}>
              <div className={styles.demoLabel}>
                Customer-ready proposal
                {streaming && <span>● streaming</span>}
              </div>
              <div className={styles.demoOutput}>
                {output ? output : (
                  <span className={styles.demoOutputEmpty}>
                    Your rewritten proposal will appear here. Click &ldquo;Rewrite this estimate&rdquo; to start.
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className={styles.demoActions}>
            <button
              type="button"
              className={styles.demoBtn}
              onClick={runDemo}
              disabled={streaming || !input.trim()}
            >
              {streaming ? 'Generating…' : 'Rewrite this estimate →'}
            </button>
            <span className={styles.demoNote}>
              One free run per visitor. Sign in for unlimited proposals.
            </span>
          </div>

          {error && <div className={styles.demoError}>{error}</div>}

          {done && !error && (
            <div className={styles.demoCta}>
              <p className={styles.demoCtaText}>
                Like what you see? Save it, brand it, and send it as a shareable link.
              </p>
              <Link href="/contractor-quotes/login" className={styles.btnPrimary}>
                Sign in to save →
              </Link>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
