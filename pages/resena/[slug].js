import Head from 'next/head'
import Link from 'next/link'
import { getBooks, getBook } from '../../lib/notion'
import { Stars, Pill, SiteHeader, Newsletter, Footer } from '../../components/ui'

export default function BookDetail({ book }) {
  if (!book) return <div className="container"><p>Not found</p></div>

  const tags = Array.isArray(book.tags) ? book.tags : (book.tags || '').split(',').map(t => t.trim()).filter(Boolean)
  const tropes = Array.isArray(book.tropes) ? book.tropes : []
  const protagonists = [1, 2, 3].filter(n => book[`protagonist${n}Name`]).map(n => ({
    name: book[`protagonist${n}Name`],
    role: book[`protagonist${n}Role`],
    desc: book[`protagonist${n}Desc`],
    tags: (book[`protagonist${n}Tags`] || '').split(',').map(t => t.trim()).filter(Boolean),
  }))

  return (
    <>
      <Head>
        <title>{book.title} — Reading with Matcha</title>
        <meta name="description" content={book.synopsis?.slice(0, 160)} />
        <meta property="og:title" content={`${book.title} — Reading with Matcha`} />
        {book.cover && <meta property="og:image" content={book.cover} />}
      </Head>

      <div className="container">
        <SiteHeader />
        <div style={{ maxWidth: 680, margin: '0 auto', padding: '1.5rem 0 4rem' }}>
          <Link href="/" style={{ display: 'inline-block', marginBottom: '1.5rem', color: 'var(--text-accent)', fontSize: 14, fontFamily: 'sans-serif' }}>← Back</Link>

          <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: 24, marginBottom: '2rem', alignItems: 'start' }}>
            {book.cover && <img src={book.cover} alt={book.title} style={{ width: 140, height: 200, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--border-warm)' }} />}
            <div>
              <Pill>{book.category}</Pill>
              <h1 style={{ fontSize: 26, fontWeight: 700, margin: '0.5rem 0 0.25rem', color: 'var(--text-dark)', lineHeight: 1.2 }}>{book.title}</h1>
              {book.series && <p style={{ fontSize: 13, color: '#9b7b5e', margin: '0 0 0.25rem', fontFamily: 'sans-serif', fontStyle: 'italic' }}>{book.series}{book.seriesNumber ? ` · Book ${book.seriesNumber}` : ''}</p>}
              <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: '0 0 0.75rem', fontFamily: 'sans-serif' }}>{book.author}</p>
              <Stars n={book.rating} size={18} />
              {tropes.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: '0.75rem' }}>
                  {tropes.map(t => <Pill key={t}>{t}</Pill>)}
                </div>
              )}
              {tags.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: '0.5rem' }}>
                  {tags.map(t => <Pill key={t} bg="var(--bg-tag-dark)">{t}</Pill>)}
                </div>
              )}
            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.5rem', marginBottom: '1.5rem' }}>
            <p style={{ fontSize: 11, fontFamily: 'sans-serif', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', margin: '0 0 0.75rem' }}>Synopsis</p>
            <p style={{ fontSize: 15, color: 'var(--text-body)', lineHeight: 1.8 }}>{book.synopsis}</p>
          </div>

          {protagonists.length > 0 && (
            <div style={{ marginBottom: '1.5rem' }}>
              <p style={{ fontSize: 11, fontFamily: 'sans-serif', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', margin: '0 0 0.75rem' }}>The protagonists</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 12 }}>
                {protagonists.map((p, i) => (
                  <div key={i} style={{ background: '#f5ede4', border: '1px solid #d4bfaa', borderLeft: '4px solid #9b7b5e', borderRadius: 10, padding: '1rem' }}>
                    <div style={{ fontSize: 32, fontWeight: 700, color: '#9b7b5e', marginBottom: '0.5rem', lineHeight: 1 }}>{p.name.charAt(0).toUpperCase()}</div>
                    <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-dark)', margin: '0 0 2px', fontFamily: 'sans-serif', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{p.name}</p>
                    {p.role && <p style={{ fontSize: 11, color: '#9b7b5e', margin: '0 0 0.75rem', fontFamily: 'sans-serif', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{p.role}</p>}
                    {p.desc && <p style={{ fontSize: 13, color: 'var(--text-body)', lineHeight: 1.65, margin: '0 0 0.75rem' }}>{p.desc}</p>}
                    {p.tags.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                        {p.tags.map(t => <span key={t} style={{ fontSize: 11, padding: '2px 9px', borderRadius: 4, fontFamily: 'sans-serif', background: '#efe3d8', color: '#7a5c45', border: '1px solid #d4bfaa', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t}</span>)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: '1.25rem 1.5rem', marginBottom: '1.5rem' }}>
            <p style={{ fontSize: 11, fontFamily: 'sans-serif', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', margin: '0 0 0.75rem' }}>My review</p>
            <p style={{ fontSize: 15, color: 'var(--text-body)', lineHeight: 1.85, fontStyle: 'italic' }}>{book.review}</p>
          </div>

          {book.forWhom && (
            <div style={{ background: '#edf4e8', border: '1px solid var(--border)', borderRadius: 12, padding: '1.25rem 1.5rem', marginBottom: '1.5rem' }}>
              <p style={{ fontSize: 11, fontFamily: 'sans-serif', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', margin: '0 0 0.75rem' }}>Who is this for?</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {book.forWhom.split('|').map(p => p.trim()).filter(Boolean).map((point, i) => (
                  <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <span style={{ color: 'var(--text-accent)', fontSize: 16, lineHeight: 1.5, flexShrink: 0 }}>✦</span>
                    <p style={{ fontSize: 15, color: 'var(--text-body)', lineHeight: 1.75, margin: 0 }}>{point}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {book.amazonLink && (
            <div style={{ marginBottom: '1.5rem' }}>
              <p style={{ fontSize: 11, fontFamily: 'sans-serif', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', margin: '0 0 0.75rem' }}>Where to buy it?</p>
              <a href={book.amazonLink} target="_blank" rel="noopener noreferrer"
                style={{ padding: '8px 16px', borderRadius: 8, background: '#fff8e7', border: '1px solid #f0c060', color: '#b07800', fontSize: 13, fontFamily: 'sans-serif', textDecoration: 'none', fontWeight: 500 }}>
                Amazon
              </a>
            </div>
          )}
        </div>

        <Newsletter />
        <Footer />
      </div>
    </>
  )
}

export async function getStaticPaths() {
  const books = await getBooks()
  return { paths: books.map(b => ({ params: { slug: b.slug } })), fallback: 'blocking' }
}

export async function getStaticProps({ params }) {
  const book = await getBook(params.slug)
  if (!book) return { notFound: true }
  return { props: { book }, revalidate: 60 }
}
