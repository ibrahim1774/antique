import styles from '../../styles/QuoteClear.module.css'

const FAQ = [
  {
    q: 'Do I need to be technical?',
    a: 'No. If you can paste text into a textbox, you can use QuoteClear. The whole flow is two clicks: paste your estimate, send the link to your customer.',
  },
  {
    q: 'Will it invent prices?',
    a: 'Never. The AI only reorganizes and rewrites what you give it. If a number is missing, it leaves the field blank rather than guess. Your numbers stay your numbers.',
  },
  {
    q: 'Can I edit before sending?',
    a: 'Yes — every field is editable. The AI gives you a structured draft; you change anything you want before generating the customer link.',
  },
  {
    q: 'What if I already have my own template?',
    a: 'Save it as a custom template under Settings. Future proposals will follow your layout while still pulling in the AI-rewritten content.',
  },
  {
    q: 'Does it work for my trade?',
    a: 'Built first for roofers, HVAC, plumbers, electricians, painters, and GCs. The AI adapts the language and exclusions to the trade automatically.',
  },
  {
    q: 'Can I cancel anytime?',
    a: 'Yes. Cancel from the billing portal with one click. No annual lock-in, no cancellation calls. Your proposals stay accessible after you cancel.',
  },
]

export default function FaqAccordion() {
  return (
    <section id="faq" className={styles.section}>
      <div className={styles.container}>
        <div className={styles.sectionHead}>
          <div className={styles.sectionEyebrow}>FAQ</div>
          <h2 className={styles.sectionTitle}>Questions, answered straight.</h2>
        </div>
        <div className={styles.faqList}>
          {FAQ.map(({ q, a }) => (
            <details key={q} className={styles.faqItem}>
              <summary>{q}</summary>
              <div className={styles.faqAnswer}>{a}</div>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}
