import { signIn } from 'next-auth/react'
import styles from '../styles/UpgradeModal.module.css'

export default function UpgradeModal({ isOpen, onClose }) {
  if (!isOpen) return null

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <button className={styles.closeBtn} onClick={onClose}>×</button>

        <div className={styles.icon}>
          <svg width="28" height="28" viewBox="0 0 24 24"
            fill="none" stroke="#C8921F" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/>
            <path d="m21 21-4.35-4.35"/>
          </svg>
        </div>

        <h2 className={styles.title}>
          You&apos;ve used your 2 free scans
        </h2>
        <p className={styles.body}>
          Unlimited scanning is coming soon.
          Sign in now to be first on the list
          and get notified when it launches.
        </p>

        <button
          className={styles.primaryBtn}
          onClick={() => signIn('google')}
        >
          Notify me when unlimited launches
        </button>

        <button className={styles.secondaryBtn} onClick={onClose}>
          Maybe later
        </button>
      </div>
    </div>
  )
}
