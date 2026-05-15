import styles from '../../styles/QuoteClear.module.css'

const ICON_PROPS = { width: 22, height: 22, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round', strokeLinejoin: 'round' }

const STEPS = [
  {
    title: 'Paste your estimate',
    body: 'Drop in your rough numbers exactly as you wrote them — line items, scope notes, whatever you sent before.',
    icon: (
      <svg {...ICON_PROPS}>
        <rect x="4" y="3" width="16" height="18" rx="2" />
        <path d="M8 8h8M8 12h8M8 16h5" />
      </svg>
    ),
  },
  {
    title: 'AI rewrites it',
    body: 'It becomes a branded, plain-English proposal with scope, exclusions, timeline, and clean line items. Your numbers, never invented.',
    icon: (
      <svg {...ICON_PROPS}>
        <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    ),
  },
  {
    title: 'Send a link',
    body: 'Share a clean URL. Get notified when the customer views, accepts, or asks for changes — right from your dashboard.',
    icon: (
      <svg {...ICON_PROPS}>
        <path d="M10 14a4 4 0 0 0 5.66 0l3-3a4 4 0 0 0-5.66-5.66l-1.5 1.5" />
        <path d="M14 10a4 4 0 0 0-5.66 0l-3 3a4 4 0 0 0 5.66 5.66l1.5-1.5" />
      </svg>
    ),
  },
]

export default function StepRow() {
  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <div className={styles.sectionHead}>
          <div className={styles.sectionEyebrow}>How it works</div>
          <h2 className={styles.sectionTitle}>From notes to &ldquo;signed&rdquo; in three steps.</h2>
        </div>
        <div className={styles.stepGrid}>
          {STEPS.map(step => (
            <div key={step.title} className={styles.step}>
              <div className={styles.stepIcon}>{step.icon}</div>
              <h3 className={styles.stepTitle}>{step.title}</h3>
              <p className={styles.stepBody}>{step.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
