import Head from 'next/head'
import Link from 'next/link'
import { getUniverses, getOrders } from '../lib/notion'
import { SiteHeader, Newsletter, Footer } from '../components/ui'

export default function LiteraryUniverses({ universes }) {
  return (
    <>
      <Head>
        <title>Literary Universes · Reading with Matcha</title>
        <meta name="description" content="Explore the literary universes where books connect, with shared characters, recurring tropes, and expanded worlds." />
        <meta property="og:title" content="Literary Universes — Reading with Matcha" />
      </Head>

      <div className="container">
        <SiteHeader />

        <div style={{ maxWidth: 900, margin: '0 auto', padding: '1.5rem 0 4rem' }}>
          <Link href="/" style={{ display: 'inline-block', marginBottom: '1.5rem', color: 'var(--text-accent)', fontSize: 14, fontFamily: 'sans-serif' }}>← Back</Link>

          {/* Header hero */}
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: '0.75rem' }}>
              <span style={{ fontSize: 20 }}>🌌</span>
              <span style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#3C3489', fontFamily: 'sans-serif', fontWeight: 600 }}>Connected worlds</span>
            </div>
            <h1 style={{ fontSize: 34, fontWeight: 700, margin: '0 0 0.75rem', color: 'var(--text-dark)', lineHeight: 1.15 }}>
              Literary Universes
            </h1>
            <p style={{ fontSize: 15, color: 'var(--text-body)', lineHeight: 1.7, margin: '0 auto', maxWidth: 560 }}>
              Series that share a world, characters who appear in each other's books, and tropes that repeat across sagas. Explore the connections that make every read richer.
            </p>
          </div>

          {/* Universe grid */}
          {universes.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
              {universes.map(u => <UniverseCard key={u.id} universe={u} />)}
            </div>
          ) : (
            <div style={{ background: 'var(--bg-sidebar)', border: '1px solid var(--border)', borderRadius: 12, padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontStyle: 'italic', fontSize: 14 }}>
              No universes published yet. Come back soon!
            </div>
          )}
        </div>

        <Newsletter />
        <Footer />
      </div>
    </>
  )
}

function UniverseCard({ universe }) {
  const tropes = Array.isArray(universe.mainTropes) ? universe.mainTropes : []
  const numSeries = universe.numSeries || 0

  return (
    <Link href={`/universe/${universe.slug}`} style={{ textDecoration: 'none' }}>
      <div style={{ background: '#EEEDFE', border: '1px solid #AFA9EC', borderRadius: 16, padding: '1.25rem', cursor: 'pointer', transition: 'transform 0.15s, box-shadow 0.15s', height: '100%', display: 'flex', flexDirection: 'column' }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 18px rgba(60, 52, 137, 0.15)' }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '0.75rem' }}>
          {universe.authorImage ? (
            <img src={universe.authorImage} alt={universe.author}
              style={{ width: 56, height: 56, objectFit: 'cover', borderRadius: '50%', border: '2px solid #AFA9EC', flexShrink: 0 }}
              onError={e => { e.target.style.display = 'none' }} />
          ) : (
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#fff', border: '2px solid #AFA9EC', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>
              🌌
            </div>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 2px', color: '#26215C', lineHeight: 1.2 }}>
              {universe.name}
            </h3>
            {universe.author && (
              <p style={{ fontSize: 13, color: '#3C3489', margin: 0, fontFamily: 'sans-serif', fontStyle: 'italic' }}>
                {universe.author}
              </p>
            )}
          </div>
        </div>

        {universe.description && (
          <p style={{ fontSize: 13, color: '#26215C', lineHeight: 1.6, margin: '0 0 0.75rem', flex: 1, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {universe.description}
          </p>
        )}

        {tropes.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: '0.75rem' }}>
            {tropes.slice(0, 4).map(t => (
              <span key={t} style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, fontFamily: 'sans-serif', background: '#fff', color: '#3C3489', border: '1px solid #CECBF6' }}>
                {t}
              </span>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.75rem', borderTop: '1px dashed rgba(60, 52, 137, 0.2)' }}>
          <span style={{ fontSize: 11, color: '#534AB7', fontFamily: 'sans-serif', opacity: 0.85 }}>
            {numSeries > 0 ? `${numSeries} ${numSeries === 1 ? 'connected series' : 'connected series'}` : 'Coming soon'}
          </span>
          <span style={{ fontSize: 11, color: '#3C3489', fontFamily: 'sans-serif', fontWeight: 600 }}>
            Explore →
          </span>
        </div>
      </div>
    </Link>
  )
}

export async function getStaticProps() {
  const [universes, orders] = await Promise.all([
    getUniverses(),
    getOrders(),
  ])

  // Enrich each universe with the number of connected series
  const universesEnriched = universes.map(u => {
    const seriesInUniverse = orders.filter(o => o.universeIds && o.universeIds.includes(u.id))
    return { ...u, numSeries: seriesInUniverse.length }
  })

  return { props: { universes: universesEnriched }, revalidate: 60 }
}
