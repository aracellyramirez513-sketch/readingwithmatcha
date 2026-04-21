import Head from 'next/head'
import Link from 'next/link'
import { getOrders, getOrder } from '../../lib/notion'
import { Pill, SiteHeader, Newsletter, Footer } from '../../components/ui'

const orderTypeInfo = {
  'Strict order':               { color: '#712B13', bg: '#FAECE7', border: '#F0997B', desc: 'Read strictly in this order — the books connect directly.' },
  'Interconnected standalones': { color: '#0F6E56', bg: '#E1F5EE', border: '#5DCAA5', desc: 'Each book can be read on its own, but characters appear across stories.' },
  'Chronological':              { color: '#854F0B', bg: '#FAEEDA', border: '#EF9F27', desc: 'Order of events within the story, not publication order.' },
  'Publication order':          { color: '#0C447C', bg: '#E6F1FB', border: '#85B7EB', desc: 'In the order they were originally published.' },
}

const statusInfo = {
  'Complete':  { color: '#27500A', bg: '#EAF3DE', border: '#97C459' },
  'Ongoing':   { color: '#854F0B', bg: '#FAEEDA', border: '#EF9F27' },
  'Paused':    { color: '#444441', bg: '#F1EFE8', border: '#B4B2A9' },
  'Abandoned': { color: '#791F1F', bg: '#FCEBEB', border: '#F09595' },
}

export default function OrderDetail({ order }) {
  if (!order) return <div className="container"><p>Not found</p></div>

  const tropes = Array.isArray(order.tropes) ? order.tropes : []
  const seriesBooks = order.seriesBooks || []
  const typeInfo = orderTypeInfo[order.orderType] || null
  const stInfo = statusInfo[order.status] || null

  return (
    <>
      <Head>
        <title>{order.title} — Reading Order · Reading with Matcha</title>
        <meta name="description" content={`Reading order for ${order.title} by ${order.author}. ${order.description}`} />
        <meta property="og:title" content={`${order.title} — Reading Order`} />
        {order.sagaCover && <meta property="og:image" content={order.sagaCover} />}
      </Head>

      <div className="container">
        <SiteHeader />

        <div style={{ maxWidth: 700, margin: '0 auto', padding: '1.5rem 0 4rem' }}>
          <Link href="/" style={{ display: 'inline-block', marginBottom: '1.5rem', color: 'var(--text-accent)', fontSize: 14, fontFamily: 'sans-serif' }}>← Back</Link>

          {/* Universe badge — centered */}
          {order.universe && (
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <Link href={`/universe/${order.universe.slug}`} style={{ textDecoration: 'none' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#EEEDFE', color: '#3C3489', border: '1px solid #AFA9EC', padding: '6px 14px', borderRadius: 20, fontSize: 12, fontFamily: 'sans-serif', cursor: 'pointer', fontWeight: 500 }}>
                  <span style={{ fontSize: 14 }}>🌌</span>
                  <span>Part of the <strong style={{ fontWeight: 700 }}>{order.universe.name}</strong> universe</span>
                  <span>→</span>
                </div>
              </Link>
            </div>
          )}

          {/* Saga hero */}
          <div style={{ display: 'grid', gridTemplateColumns: order.sagaCover ? '140px 1fr' : '1fr', gap: 24, marginBottom: '2rem', alignItems: 'start' }}>
            {order.sagaCover && (
              <img src={order.sagaCover} alt={order.title}
                style={{ width: 140, height: 200, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--border-warm)' }} />
            )}
            <div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: '0.75rem' }}>
                {order.category && <Pill>{order.category}</Pill>}
                <Pill bg="#fff" color="var(--text-muted)" border="var(--border)">{seriesBooks.length || order.numBooks} books</Pill>
                {stInfo && <Pill bg={stInfo.bg} color={stInfo.color} border={stInfo.border}>{order.status}</Pill>}
              </div>
              <h1 style={{ fontSize: 26, fontWeight: 700, margin: '0 0 0.25rem', color: 'var(--text-dark)', lineHeight: 1.2 }}>{order.title}</h1>
              <p style={{ fontSize: 14, color: '#9b7b5e', margin: '0 0 0.25rem', fontFamily: 'sans-serif', fontStyle: 'italic' }}>{order.author}</p>
              {order.couple && (
                <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: '0 0 0.75rem', fontFamily: 'sans-serif' }}>💕 {order.couple}</p>
              )}
              {order.description && (
                <p style={{ fontSize: 15, color: 'var(--text-body)', lineHeight: 1.75, margin: '0 0 1rem' }}>{order.description}</p>
              )}
              {tropes.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                  {tropes.map(t => <Pill key={t}>{t}</Pill>)}
                </div>
              )}
            </div>
          </div>

          {/* Order type + editorial notes */}
          {(typeInfo || order.orderNotes) && (
            <div style={{ background: typeInfo ? typeInfo.bg : 'var(--bg-sidebar)', border: `1px solid ${typeInfo ? typeInfo.border : 'var(--border)'}`, borderLeft: `4px solid ${typeInfo ? typeInfo.color : 'var(--border)'}`, borderRadius: 12, padding: '1rem 1.25rem', marginBottom: '2rem' }}>
              {typeInfo && (
                <>
                  <p style={{ fontSize: 11, fontFamily: 'sans-serif', textTransform: 'uppercase', letterSpacing: '0.1em', color: typeInfo.color, margin: '0 0 4px', fontWeight: 600, opacity: 0.85 }}>
                    Reading style · {order.orderType}
                  </p>
                  <p style={{ fontSize: 13, color: 'var(--text-body)', margin: 0, lineHeight: 1.6 }}>
                    {typeInfo.desc}
                  </p>
                </>
              )}
              {order.orderNotes && (
                <p style={{ fontSize: 13, color: 'var(--text-body)', lineHeight: 1.7, margin: typeInfo ? '10px 0 0' : 0, paddingTop: typeInfo ? '10px' : 0, borderTop: typeInfo ? '1px dashed rgba(0,0,0,0.1)' : 'none' }}>
                  <span style={{ fontWeight: 600, color: typeInfo ? typeInfo.color : 'var(--text-dark)' }}>Editor's note: </span>
                  {order.orderNotes}
                </p>
              )}
            </div>
          )}

          {/* Book list in order */}
          {seriesBooks.length > 0 && (
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.5rem', marginBottom: '1.5rem' }}>
              <p style={{ fontSize: 11, fontFamily: 'sans-serif', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', margin: '0 0 1.25rem' }}>Reading order</p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {seriesBooks.map((book, i) => (
                  <BookCard key={book.id || i} book={book} index={i} />
                ))}
              </div>
            </div>
          )}

          {seriesBooks.length === 0 && (
            <div style={{ background: 'var(--bg-sidebar)', border: '1px solid var(--border)', borderRadius: 12, padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)', fontStyle: 'italic', fontSize: 13 }}>
              Books from this series are still being added.
            </div>
          )}
        </div>

        <Newsletter />
        <Footer />
      </div>
    </>
  )
}

function BookCard({ book, index }) {
  const tropes = Array.isArray(book.tropes) ? book.tropes : []

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '70px 1fr', gap: 16, alignItems: 'start', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: '1rem' }}>
      <div style={{ position: 'relative', flexShrink: 0 }}>
        {book.cover
          ? <img src={book.cover} alt={book.title}
              style={{ width: 70, height: 102, objectFit: 'cover', borderRadius: 6, border: '1px solid var(--border-warm)', display: 'block' }}
              onError={e => { e.target.style.background = 'var(--bg-tag)'; e.target.src = '' }} />
          : <div style={{ width: 70, height: 102, borderRadius: 6, background: 'var(--bg-tag)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>📖</div>
        }
        <span style={{ position: 'absolute', top: -8, left: -8, minWidth: 24, height: 24, padding: '0 6px', background: 'var(--btn-bg)', color: '#fff', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontFamily: 'sans-serif', fontWeight: 700, border: '2px solid var(--bg)' }}>
          {book.number != null && book.number !== '' ? `#${book.number}` : index + 1}
        </span>
      </div>

      <div>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-dark)', margin: '0 0 2px', lineHeight: 1.3 }}>{book.title}</h3>
        {book.author && <p style={{ fontSize: 12, color: '#9b7b5e', margin: '0 0 4px', fontFamily: 'sans-serif', fontStyle: 'italic' }}>{book.author}</p>}

        {book.rating ? (
          <p style={{ fontSize: 13, color: 'var(--text-accent)', fontFamily: 'sans-serif', margin: '0 0 6px', letterSpacing: '0.05em' }}>
            {'★'.repeat(Math.floor(Number(book.rating)))}
            <span style={{ color: 'var(--text-muted)', marginLeft: 6, fontSize: 11 }}>{book.rating}/5</span>
          </p>
        ) : null}

        {book.protagonists && (
          <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '0 0 6px', fontFamily: 'sans-serif' }}>
            💕 {book.protagonists}
          </p>
        )}

        {book.synopsis && (
          <p style={{ fontSize: 13, color: 'var(--text-body)', lineHeight: 1.6, margin: '0 0 10px' }}>
            {book.synopsis}
          </p>
        )}

        {tropes.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 10 }}>
            {tropes.map(t => <Pill key={t}>{t}</Pill>)}
          </div>
        )}

        {book.standalone && (
          <p style={{ fontSize: 11, color: '#0F6E56', fontFamily: 'sans-serif', margin: '0 0 8px', fontWeight: 500 }}>
            ✓ Can be read as a standalone
          </p>
        )}

        {book.warnings && (
          <details style={{ fontSize: 12, margin: '0 0 10px' }}>
            <summary style={{ cursor: 'pointer', color: '#791F1F', fontFamily: 'sans-serif', fontWeight: 500 }}>
              ⚠ Content warnings
            </summary>
            <p style={{ fontSize: 12, color: 'var(--text-body)', margin: '6px 0 0', padding: '6px 10px', background: '#FCEBEB', borderRadius: 6, border: '1px solid #F7C1C1', lineHeight: 1.5 }}>
              {book.warnings}
            </p>
          </details>
        )}

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          {book.reviewSlug && (
            <Link href={`/review/${book.reviewSlug}`} style={{ padding: '6px 14px', borderRadius: 6, background: 'var(--btn-bg)', color: '#fff', fontSize: 12, fontFamily: 'sans-serif', textDecoration: 'none', fontWeight: 500 }}>
              Read full review →
            </Link>
          )}
          {book.amazonLink && (
            <a href={book.amazonLink} target="_blank" rel="noopener noreferrer" style={{ padding: '5px 12px', borderRadius: 6, background: '#fff8e7', border: '1px solid #f0c060', color: '#b07800', fontSize: 12, fontFamily: 'sans-serif', textDecoration: 'none', fontWeight: 500 }}>
              Amazon
            </a>
          )}
        </div>
      </div>
    </div>
  )
}

export async function getStaticPaths() {
  const orders = await getOrders()
  return {
    paths: orders.map(o => ({ params: { slug: o.slug } })),
    fallback: 'blocking',
  }
}

export async function getStaticProps({ params }) {
  const order = await getOrder(params.slug)
  if (!order) return { notFound: true }
  return { props: { order }, revalidate: 60 }
}
