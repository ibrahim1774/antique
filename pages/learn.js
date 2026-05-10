import Head from 'next/head'
import Link from 'next/link'
import styles from '../styles/Learn.module.css'

const ARTICLES = [
  {
    slug: 'starting-collection',
    category: 'Antique Basics',
    title: 'Starting Your Antique Adventure',
    excerpt: 'Antique collecting is not only a fascinating hobby — it\'s a way to hold a piece of history in your hands. Learn how to spot quality, build your eye, and avoid beginner mistakes.',
    body: [
      "The first piece in any collection is rarely the best — it's the one that taught you how to look. Whether you inherited a box of grandma's silver or you're walking your first estate sale, the same instincts apply: examine the object, ask what it's made of, look for marks, and trust the small details over the dramatic ones.",
      "Start with a category you can love. The best collectors specialize. Pottery rewards patience, jewelry rewards a loupe, furniture rewards muscle memory for joinery and patina. Pick one. Read about it for a week before you buy anything.",
      "Build a research habit before a buying habit. Use sold listings — not asking prices — to calibrate value. Cross-reference maker's marks against multiple databases. When something looks too cheap to be real, it usually is.",
      "Condition trumps almost everything in resale value. A pristine common piece outsells a damaged rare one nine times out of ten. Learn the difference between honest wear (good) and harsh restoration (bad).",
    ],
  },
  {
    slug: 'beginner-valuation',
    category: 'Antique Basics',
    title: "Beginner's Guide to Antique Valuation",
    excerpt: 'Starting an antique collection is exciting — but figuring out what something is actually worth takes practice. This guide walks through the four levers that drive every valuation.',
    body: [
      "Value in antiques comes from four levers, in roughly this order: rarity, demand, condition, provenance.",
      "Rarity is supply. How many of these were made? How many survived? A piece from a small foundry that closed in 1882 is rarer than one from a factory that ran until 1960. Marks like edition numbers, regional stamps, and specific pattern numbers help establish this.",
      "Demand is who wants it right now. Markets shift. Mid-century modern furniture exploded in the 2010s; brown furniture (Victorian/Edwardian dining sets) collapsed in the same period. Watch auction results — they're real-time demand data.",
      "Condition is what reduces value. Cracks, repairs, replaced parts, regilding, refinishing — all subtract. A repaired plate is worth roughly 30–50% of an undamaged twin.",
      "Provenance is the story. Documented ownership history, exhibition labels, original receipts, or a famous prior owner can multiply value 2–10x. Save every paper that comes with a piece.",
    ],
  },
  {
    slug: 'spot-fakes',
    category: 'Authentication',
    title: 'How to Spot a Fake or Reproduction',
    excerpt: 'The flea market is full of "antique" pieces made in 2008. Here are the tells that give them away — wrong screws, wrong glaze, wrong wood, wrong wear.',
    body: [
      "Reproductions usually fail at one of four checkpoints: construction, materials, marks, or wear.",
      "Construction. Period furniture used hand-cut dovetails, square-cut nails, and hide glue. Modern reproductions use uniform machine dovetails, Phillips-head screws (invented 1933), and yellow PVA glue. Flip the piece. The bottom tells the truth.",
      "Materials. Real silver tarnishes a specific way and feels heavier than plate. Real ivory has Schreger lines visible under magnification. Genuine bakelite smells like formaldehyde when rubbed warm. Plastic that's pretending to be older feels too light.",
      "Marks. Fake maker marks are too crisp, too centered, and too perfect. Real period marks are slightly off-register, sometimes double-struck, and sit inside genuine wear, not on top of it.",
      "Wear. Fake wear is uniform — every edge softened the same way. Real wear concentrates where hands and surfaces actually touched: drawer pulls, foot rests, the bottom of a vase that lived on a shelf for 80 years. Mismatched wear patterns are the loudest red flag.",
    ],
  },
  {
    slug: 'makers-marks',
    category: 'Identification',
    title: "Reading Maker's Marks Like a Pro",
    excerpt: 'A small symbol on the underside of a piece can multiply its value tenfold — or reveal it as a knockoff. Here\'s how appraisers decode them.',
    body: [
      "A maker's mark is a fingerprint. Learn how to lift it.",
      "Start with a strong raking light. Hold a flashlight nearly parallel to the surface — marks too faint to see straight-on come alive in side-light.",
      "Document before you Google. Photograph the mark with a coin or ruler for scale. Note its location (base, rim, inside drawer, hinge plate). Many makers used the same symbol but in different positions across their product lines.",
      "Decode the structure. Most marks contain three pieces of information: who made it, where, and when. A British silver mark, for example, includes the maker's initials, a city assay mark, and a date letter. Once you know the system, every mark tells a date.",
      "Cross-reference at least two sources. Marks4silver, Kovels, and category-specific reference books (Cushion's Pottery & Porcelain Marks, Tardy's Hallmarks) catch each other's mistakes.",
    ],
  },
  {
    slug: 'storage-care',
    category: 'Care',
    title: 'Storing and Caring for Your Collection',
    excerpt: 'The wrong shelf can age a piece a decade in a year. Here\'s how to protect what you\'ve found.',
    body: [
      "Light, humidity, and contact are the three killers of antique value.",
      "Light fades. Direct sunlight bleaches paper, oxidizes oil paintings, and yellows ivory. Display textiles, prints, and photos under UV-filtering glass and never in direct sun.",
      "Humidity warps and cracks. Wood, leather, and bone want 45–55% relative humidity. Below 35%, wood splits. Above 65%, mold blooms. A small hygrometer in your display area is the single best $15 you can spend.",
      "Contact corrodes. Silver tarnishes against rubber, felt with sulfur, or untreated wood. Store silver in anti-tarnish bags or with anti-tarnish strips. Keep coins in mylar or inert plastic flips, never PVC.",
      "Handle with clean dry hands or cotton gloves for porous items (ivory, paper, unglazed ceramics). Skin oils etch over time.",
    ],
  },
  {
    slug: 'where-to-research',
    category: 'Research',
    title: 'The Best Free Resources for Antique Research',
    excerpt: 'You don\'t need a subscription database to research like a pro. These free tools cover 90% of what most collectors need.',
    body: [
      "eBay sold listings (filter Sold + Completed). The closest thing to a real-time price index in antiques. Search the specific maker, pattern, or model number — not the category.",
      "WorthPoint's price guide previews. Limited free results, but enough to triangulate auction-house realized prices.",
      "Live Auctioneers and Invaluable. Both let you search past auction results without an account.",
      "Maker-specific reference sites. Roseville: Roseville Pottery Identification. Wedgwood: Wedgwood Museum. Mid-century furniture: 1stDibs (look at sold, not listed). Coins: NGC and PCGS price guides.",
      "Local appraisal nights. Many auction houses offer free walk-in appraisal events. They want consignments — you get a real expert's eyes for free.",
    ],
  },
]

export default function Learn() {
  return (
    <>
      <Head>
        <title>Learn & Discover — Tivoro</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </Head>

      <div className={styles.page}>
        <header className={styles.header}>
          <Link href="/scan" className={styles.back}>← Scan</Link>
          <div className={styles.title}>Learn &amp; Discover</div>
          <span style={{ width: 50 }} />
        </header>

        <main className={styles.main}>
          <h1 className={styles.heroTitle}>Antique Basics</h1>
          <p className={styles.heroSub}>
            Field-tested guides for new collectors. No fluff, just what works.
          </p>

          <div className={styles.articleList}>
            {ARTICLES.map(a => (
              <article key={a.slug} className={styles.article}>
                <div className={styles.articleCat}>{a.category}</div>
                <h2 className={styles.articleTitle}>{a.title}</h2>
                <p className={styles.articleExcerpt}>{a.excerpt}</p>
                <details className={styles.articleDetails}>
                  <summary className={styles.articleSummary}>Read more →</summary>
                  <div className={styles.articleBody}>
                    {a.body.map((p, i) => <p key={i}>{p}</p>)}
                  </div>
                </details>
              </article>
            ))}
          </div>

          <p className={styles.footnote}>
            More guides coming. Want to suggest a topic? Email hello@tivoro.shop
          </p>
        </main>
      </div>
    </>
  )
}
