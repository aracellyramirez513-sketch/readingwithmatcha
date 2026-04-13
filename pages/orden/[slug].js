import Head from 'next/head'
import Link from 'next/link'
import { getOrders, getOrder } from '../../lib/notion'
import { Pill, SiteHeader, Newsletter, Footer } from '../../components/ui'

export default function OrderDetail({ order }) {
  if (!order) return <div className="container"><p>Not found</p></div>

  const tropes = Array.isArray(order.tropes) ? order.tropes : []
  const books = order.bookTitles || []
  const images = order.bookImages || []
  const amazonLinks = order.amazonLinks || []

  return (
    <>
      <Head>
        <title>{order.title} — Reading Order · Reading with Matcha</title>
        <meta name="description" content={`Reading order for ${order.title} by ${order.author}. ${order.description}`} />
        {order.sagaCover && <meta property="og:image" content={order.sagaCover} />}
      </Head>

      <div className="container">
        <SiteHeader />
        <div style={{ maxWidth: 700, margin: '0 auto', padding: '1.5rem 0 4rem' }}>
          <Link href="/" style={{ display: 'inline-block', marginBottom: '1.5rem', color: 'var(--text-accent)', fontSize: 14, fontFamily: 'sans-serif' }}>← Back</Link>

          <div style={{ display: 'grid', gridTemplateColumns: order.sagaCover ? '140px 1fr' : '1fr', gap: 24, marginBottom: '2rem', alignItems: 'start' }}>
            {order.sagaCover && (
              <img src={order.sagaCover} alt={order.title} style={{ width: 140, height: 200, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--border-warm)' }} />
            )}
            <div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: '0.75rem' }}>
                <Pill>{order.category}</Pill>
                <Pill bg="#fff" color="var(--text-muted)" border="var(--border)">{books.length} books</Pill>
              </div>
              <h1 style={{ fontSize: 26, fontWeight: 700, margin: '0 0 0.25rem', color: 'var(--text-dark)', lineHeight: 1.2 }}>{order.title}</h1>
              <p style={{ fontSize: 14, color: '#9b7b5e', margin: '0 0 0.25rem', fontFamily: 'sans-serif', fontStyle: 'italic' }}>{order.author}</p>
              {order.couple && <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: '0 0 0.75rem', fontFamily: 'sans-serif' }}>💕 {order.couple}</p>}
              {order.description && <p style={{ fontSize: 15, color: 'var(--text-body)', lineHeight: 1.75, margin: '0 0 1rem' }}>{order.description}</p>}
              {tropes.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                  {tropes.map(t => <Pill key={t}>{t}</Pill>)}
                </div>
              )}
            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.5rem', marginBottom: '1.5rem' }}>
            <p style={{ fontSize: 11, fontFamily: 'sans-serif', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', margin: '0 0 1.25rem' }}>Reading order</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {books.map((title, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '60px 1fr', gap: 16, alignItems: 'start', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: '1rem' }}>
                  <div style={{ position: 'relative', flexShrink: 0 }}>
                    {images[i]
                      ? <img src={images[i]} alt={title} style={{ width: 60, height: 88, objectFit: 'cover', borderRadius: 6, border: '1px solid var(--border-warm)', display: 'block' }}
                          onError={e => { e.target.style.background = 'var(--bg-tag)'; e.target.src = '' }} />
                      : <div style={{ width: 60, height: 88, borderRadius: 6, background: 'var(--bg-tag)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>📖</div>
                    }
                    <span style={{ position: 'absolute', top: -8, left: -8, width: 24, height: 24, background: 'var(--btn-bg)', color: '#fff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontFamily: 'sans-serif', fontWeight: 700, border: '2px solid var(--bg)' }}>{i + 1}</span>
                  </div>
                  <div>
                    <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-dark)', margin: '0 0 0.5rem', lineHeight: 1.3 }}>{title}</h3>
                    <p style={{ fontSize: 12, color: '#9b7b5e', margin: '0 0 0.75rem', fontFamily: 'sans-serif', fontStyle: 'italic' }}>{order.author}</p>
                    {amazonLinks[i] && (
                      <a href={amazonLinks[i]} target="_blank" rel="noopener noreferrer" style={{ padding: '5px 12px', borderRadius: 6, background: '#fff8e7', border: '1px solid #f0c060', color: '#b07800', fontSize: 12, fontFamily: 'sans-serif', textDecoration: 'none', fontWeight: 500 }}>Amazon</a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <Newsletter />
        <Footer />
      </div>
    </>
  )
}

export async function getStaticPaths() {
  const orders = await getOrders()
  return { paths: orders.map(o => ({ params: { slug: o.slug } })), fallback: true }
}

export async function getStaticProps({ params }) {
  const order = await getOrder(params.slug)
  if (!order) return { notFound: true }
  return { props: { order }, revalidate: 60 }
}
