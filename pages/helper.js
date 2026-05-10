import { useState, useEffect, useRef } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useSession, signIn } from 'next-auth/react'
import Paywall from '../components/Paywall'
import styles from '../styles/Helper.module.css'

const SUGGESTIONS = [
  'How do I tell if my silver is real sterling?',
  'What does a "925" mark mean on jewelry?',
  'How can I date Victorian-era furniture?',
  "What's the difference between Roseville and Rookwood pottery?",
  'How do I research a maker\'s mark I can\'t identify?',
]

export default function Helper() {
  const { data: session, status } = useSession()
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPaywall, setShowPaywall] = useState(false)
  const scrollRef = useRef(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, loading])

  async function send(text) {
    const content = (text ?? input).trim()
    if (!content || loading) return

    if (!session) { signIn('google'); return }

    const next = [...messages, { role: 'user', content }]
    setMessages(next)
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/helper', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: next }),
      })
      const data = await res.json()
      if (res.status === 402) {
        setShowPaywall(true)
        setLoading(false)
        return
      }
      if (!res.ok) {
        setMessages([...next, { role: 'assistant', content: 'Sorry, something went wrong. Please try again.' }])
      } else {
        setMessages([...next, { role: 'assistant', content: data.reply }])
      }
    } catch {
      setMessages([...next, { role: 'assistant', content: 'Network error. Please try again.' }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Head>
        <title>AI Antique Helper — Tivoro</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </Head>

      <div className={styles.page}>
        <Paywall isOpen={showPaywall} onClose={() => setShowPaywall(false)} mode="subscribe" />

        <header className={styles.header}>
          <Link href="/scan" className={styles.back}>← Scan</Link>
          <div className={styles.title}>AI Antique Helper</div>
          <Link href="/my-scans" className={styles.headerLink}>Collection</Link>
        </header>

        <main className={styles.main} ref={scrollRef}>
          {messages.length === 0 && (
            <div className={styles.intro}>
              <div className={styles.introIcon}>💬</div>
              <h1 className={styles.introTitle}>Ask me anything about antiques</h1>
              <p className={styles.introSub}>
                Identification, materials, hallmarks, authenticity, value drivers,
                research strategies — drawn from decades of appraiser knowledge.
              </p>

              <div className={styles.suggestionList}>
                {SUGGESTIONS.map(s => (
                  <button
                    key={s}
                    className={styles.suggestion}
                    onClick={() => send(s)}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m, i) => (
            <div key={i} className={`${styles.msg} ${m.role === 'user' ? styles.user : styles.assistant}`}>
              <div className={styles.bubble}>{m.content}</div>
            </div>
          ))}

          {loading && (
            <div className={`${styles.msg} ${styles.assistant}`}>
              <div className={`${styles.bubble} ${styles.typing}`}>
                <span></span><span></span><span></span>
              </div>
            </div>
          )}
        </main>

        <form
          className={styles.composer}
          onSubmit={e => { e.preventDefault(); send() }}
        >
          <input
            type="text"
            className={styles.input}
            placeholder="Ask me anything..."
            value={input}
            onChange={e => setInput(e.target.value)}
            disabled={status === 'loading' || loading}
          />
          <button type="submit" className={styles.sendBtn} disabled={!input.trim() || loading}>
            ↑
          </button>
        </form>
      </div>
    </>
  )
}
