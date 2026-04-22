import Head from 'next/head'
import Link from 'next/link'
import { getUniverses, getUniverse, getOrders } from '../../lib/notion'
import { Pill, SiteHeader, Newsletter, Footer } from '../../components/ui'

export default function UniverseDetail({ universe, seriesInUniverse }) {
  if (!universe) return <div className="container"><p>Universe not found</p></div>

  const tropes = Array.isArray(universe.mainTropes) ? universe.mainTropes : []

  return (
    <>
      <Head>
        <title>{universe.name} — Universe · Reading with Matcha</title>
        <meta name="description" content={`Literary universe by ${universe.author}. ${universe.description}`} />
        <meta property="og:title" content={`${universe.name} — Literary Universe`} />
        {universe.authorImage && <meta property="og:image" content={universe.authorImage} />}
      </Head>

      <div className="container">
        <SiteHeader />

        <div style={{ maxWidth: 760, margin: '0 auto', padding: '1.5rem 0 4rem' }}>
          <Link href="/" style={{ display: 'inline-block', marginBottom: '1.5rem', color: 'var(--text-accent)', fontSize: 14, fontFamily: 'sans-serif' }}>← Back</Link>

          {/* Universe hero */}
          <div style={{ background: '#EEEDFE', border: '1px solid #AFA9EC', borderRadius: 16, padding: '1.75rem', marginBottom: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '0.75rem' }}>
              <span style={{ fontSize: 18 }}>🌌</span>
              <span style={{ fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#3C3489', fontFamily: 'sans-serif', fontWeight: 600 }}>Literary universe</span>
            </div>

            <h1 style={{ fontSize: 32, fontWeight: 700, margin: '0 0 0.5rem', color: '#26215C', lineHeight: 1.15 }}>
              {universe.name}
            </h1>

            <div style={{ display: 'grid', gridTemplateColumns: universe.authorImage ? '80px 1fr' : '1fr', gap: 16, alignItems: 'center', marginTop: '1rem' }}>
              {universe.authorImage && (
                <img src={universe.authorImage} alt={universe.author}
                  style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: '50%', border: '2px solid #AFA9EC' }}
                  onError={e => { e.target.style.display = 'none' }} />
              )}
              <div>
                {universe.author && (
                  <p style={{ fontSize: 15, color: '#3C3489', margin: 0, fontFamily: 'sans-serif', fontWeight: 500 }}>
                    By <span style={{ fontStyle: 'italic' }}>{universe.author}</span>
                  </p>
                )}
                {seriesInUniverse.length > 0 && (
                  <p style={{ fontSize: 13, color: '#534AB7', margin: '2px 0 0', fontFamily: 'sans-serif', opacity: 0.85 }}>
                    {seriesInUniverse.length} {seriesInUniverse.length === 1 ? 'connected series' : 'connected series'}
                  </p>
                )}
              </div>
            </div>

            {universe.description && (
              <p style={{ fontSize: 15, color: '#26215C', lineHeight: 1.75, margin: '1.25rem 0 0' }}>
                {universe.description}
              </p>
            )}

            {tropes.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: '1rem' }}>
                {tropes.map(t => (
                  <span key={t} style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, fontFamily: 'sans-serif', background: '#fff', color: '#3C3489', border: '1px solid #CECBF6' }}>
                    {t}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Series in this universe */}
          {seriesInUniverse.length > 0 ? (
            <div>
              <p style={{ fontSize: 11, fontFamily: 'sans-serif', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', margin: '0 0 1.25rem' }}>
                Series in this universe
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {seriesInUniverse.map(series => (
                  <SeriesCard key={series.id} series={series} />
                ))}
              </div>
            </div>
          ) : (
            <div style={{ background: 'var(--bg-sidebar)', border: '1px solid var(--border)', borderRadius: 12, padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)', fontStyle: 'italic', fontSize: 13 }}>
              Series from this universe are still being added.
            </div>
          )}
        </div>

        <Newsletter />
        <Footer />
      </div>
    </>
  )
}

function SeriesCard({ series }) {
  const tropes = Array.isArray(series.tropes) ? series.tropes : []
  const numBooks = series.numBooks || 0

  return (
    <Link href={`/reading-order/${series.slug}`} style={{ textDecoration: 'none' }}>
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: '1rem', display: 'grid', gridTemplateColumns: series.sagaCover ? '90px 1fr' : '1fr', gap: 16, cursor: 'pointer', transition: 'opacity 0.15s' }}
        onMouseEnter={e => e.currentTarget.style.opacity = '0.88'}
        onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
        {series.sagaCover && (
          <img src={series.sagaCover} alt={series.title}
            style={{ width: 90, height: 130, objectFit: 'cover', borderRadius: 6, border: '1px solid var(--border-warm)' }}
            onError={e => { e.target.style.background = 'var(--bg-tag)'; e.target.src = '' }} />
        )}
        <div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 6 }}>
            {series.category && <Pill>{series.category}</Pill>}
            <Pill bg="#fff" color="var(--text-muted)" border="var(--border)">{numBooks} books</Pill>
            {series.status && <Pill>{series.status}</Pill>}
          </div>
          <h3 style={{ fontSize: 17, fontWeight: 700, margin: '0 0 4px', color: 'var(--text-dark)' }}>{series.title}</h3>
          {series.couple && (
            <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '0 0 6px', fontFamily: 'sans-serif' }}>
              💕 {series.couple}
            </p>
          )}
          {series.description && (
            <p style={{ fontSize: 13, color: 'var(--text-body)', lineHeight: 1.6, margin: '0 0 8px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
              {series.description}
            </p>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {tropes.slice(0, 3).map(t => <Pill key={t}>{t}</Pill>)}
            </div>
            <span style={{ fontSize: 12, color: 'var(--text-accent)', fontFamily: 'sans-serif', whiteSpace: 'nowrap' }}>View order →</span>
          </div>
        </div>
      </div>
    </Link>
  )
}

export async function getStaticPaths() {
  const universes = await getUniverses()
  return {
    paths: universes.map(u => ({ params: { slug: u.slug } })),
    fallback: 'blocking',
  }
}

export async function getStaticProps({ params }) {
  const [universe, orders] = await Promise.all([
    getUniverse(params.slug),
    getOrders(),
  ])
  if (!universe) return { notFound: true }

  const seriesInUniverse = orders.filter(o => o.universeIds && o.universeIds.includes(universe.id))

  return { props: { universe, seriesInUniverse }, revalidate: 60 }
}
