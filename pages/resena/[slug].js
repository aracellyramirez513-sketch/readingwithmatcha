import Head from 'next/head'
import Link from 'next/link'
import { getBooks, getBook, getSeriesContext } from '../../lib/notion'
import { Stars, Pill, SiteHeader, Newsletter, Footer } from '../../components/ui'

// Turns the plain text coming from Notion into real paragraphs.
// Notion stores line breaks as \n and HTML collapses them, so they are split by hand.
function Paragraphs({ text, style, gap = '1rem' }) {
  const parts = String(text || '')
    .replace(/<br\s*\/?>/gi, '\n')
    .split(/\n+/)
    .map(p => p.trim())
    .filter(Boolean)

  if (parts.length === 0) return null

  return (
    <>
      {parts.map((p, i) => (
        <p key={i} style={{ ...style, margin: i === parts.length - 1 ? 0 : `0 0 ${gap}` }}>{p}</p>
      ))}
    </>
  )
}

// Thumbnail of a book in the series strip.
// With a review it is a link, without one it is dimmed, and the current one is marked.
function MiniBook({ book }) {
  const frame = book.current
    ? '2px solid var(--btn-bg)'
    : book.slug
      ? '1px solid var(--border-warm)'
      : '1px dashed #c4b49c'

  const content = (
    <div style={{ position: 'relative', width: 56 }}>
      <div style={{ width: 56, height: 84, borderRadius: 6, border: frame, overflow: 'hidden', background: 'var(--bg-tag)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {book.cover
          ? <img src={book.cover} alt={book.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          : <span style={{ fontSize: 18, color: 'var(--text-muted)', fontFamily: 'sans-serif' }}>{book.number || '?'}</span>}
      </div>
      {book.number && (
        <span style={{ position: 'absolute', top: 4, left: 4, background: book.current ? 'var(--btn-bg)' : '#9b7b5e', color: '#fff', fontSize: 10, fontFamily: 'sans-serif', fontWeight: 700, borderRadius: 3, padding: '1px 5px' }}>{book.number}</span>
      )}
    </div>
  )

  if (book.slug && !book.current) {
    return (
      <Link href={`/resena/${book.slug}`} title={book.title} style={{ textDecoration: 'none' }}>
        {content}
      </Link>
    )
  }

  return (
    <div title={book.current ? `${book.title} (you are here)` : `${book.title}, review coming soon`}
      style={{ opacity: book.slug ? 1 : 0.45, cursor: 'default' }}>
      {content}
    </div>
  )
}

// Previous / next card
function NeighborCard({ book, direction }) {
  const isNext = direction === 'next'

  return (
    <Link href={`/resena/${book.slug}`}
      style={{ display: 'flex', gap: 12, alignItems: 'center', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: 12, textDecoration: 'none', flexDirection: isNext ? 'row-reverse' : 'row' }}>
      {book.cover
        ? <img src={book.cover} alt="" style={{ width: 38, height: 56, objectFit: 'cover', borderRadius: 4, border: '1px solid var(--border-warm)', flexShrink: 0 }} />
        : <div style={{ width: 38, height: 56, borderRadius: 4, background: 'var(--bg-tag)', flexShrink: 0 }} />}
      <div style={{ minWidth: 0, textAlign: isNext ? 'right' : 'left', flex: 1 }}>
        <p style={{ margin: 0, fontSize: 11, fontFamily: 'sans-serif', color: '#9b7b5e', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          {isNext ? 'Next' : 'Previous'}{book.number ? ` · Book ${book.number}` : ''}
        </p>
        <p style={{ margin: '3px 0 0', fontSize: 14, color: 'var(--text-dark)', lineHeight: 1.35 }}>{book.title}</p>
      </div>
    </Link>
  )
}

function SeriesNav({ context }) {
  if (!context || !Array.isArray(context.books) || context.books.length === 0) return null

  const { order, books, previous, next, position, total } = context
  const hasNeighbors = Boolean(previous || next)
  const hasStrip = books.length > 1

  if (!order && !hasNeighbors && !hasStrip) return null

  return (
    <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.5rem', marginBottom: '1.5rem' }}>
      <p style={{ fontSize: 11, fontFamily: 'sans-serif', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', margin: '0 0 0.75rem' }}>Keep reading the series</p>

      {order && (
        <Link href={`/orden/${order.slug}`}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: '12px 16px', marginBottom: hasNeighbors || hasStrip ? '1rem' : 0, textDecoration: 'none' }}>
          <div style={{ minWidth: 0 }}>
            {position && total ? (
              <p style={{ margin: 0, fontSize: 12, fontFamily: 'sans-serif', color: '#9b7b5e' }}>Book {position} of {total}</p>
            ) : null}
            <p style={{ margin: '2px 0 0', fontSize: 15, color: 'var(--text-dark)' }}>{order.title}</p>
          </div>
          <span style={{ fontSize: 13, fontFamily: 'sans-serif', color: 'var(--text-accent)', whiteSpace: 'nowrap' }}>See the full reading order →</span>
        </Link>
      )}

      {hasNeighbors && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 12, marginBottom: hasStrip ? '1.25rem' : 0 }}>
          {previous && <NeighborCard book={previous} direction="previous" />}
          {next && <NeighborCard book={next} direction="next" />}
        </div>
      )}

      {hasStrip && (
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {books.map((b, i) => <MiniBook key={b.slug || `no-review-${i}`} book={b} />)}
        </div>
      )}
    </div>
  )
}

export default function BookDetail({ book, context }) {
  if (!book) return <div className="container"><p>Not found</p></div>

  const tags = Array.isArray(book.tags) ? book.tags : (book.tags || '').split(',').map(t => t.trim()).filter(Boolean)
  const tropes = Array.isArray(book.tropes) ? book.tropes : []
  const protagonists = [1, 2, 3].filter(n => book[`protagonist${n}Name`]).map(n => ({
    name: book[`protagonist${n}Name`],
    role: book[`protagonist${n}Role`],
    desc: book[`protagonist${n}Desc`],
    tags: (book[`protagonist${n}Tags`] || '').split(',').map(t => t.trim()).filter(Boolean),
  }))

  const seoTitle = `${book.title}${book.author ? ` by ${book.author}` : ''}: review | Reading with Matcha`
  const seoDescription = (book.synopsis || '').replace(/\s+/g, ' ').trim().slice(0, 160)

  const seriesOrder = context && context.order ? context.order : null
  const seriesLine = book.series
    ? `${book.series}${book.seriesNumber ? ` · Book ${book.seriesNumber}` : ''}`
    : ''

  return (
    <>
      <Head>
        <title>{seoTitle}</title>
        <meta name="description" content={seoDescription} />
        <meta property="og:type" content="article" />
        <meta property="og:title" content={seoTitle} />
        <meta property="og:description" content={seoDescription} />
        {book.cover && <meta property="og:image" content={book.cover} />}
        <meta name="twitter:card" content={book.cover ? 'summary_large_image' : 'summary'} />
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
              {seriesLine && (
                seriesOrder ? (
                  <p style={{ fontSize: 13, margin: '0 0 0.25rem', fontFamily: 'sans-serif', fontStyle: 'italic' }}>
                    <Link href={`/orden/${seriesOrder.slug}`} style={{ color: 'var(--text-accent)', textDecoration: 'none' }}>{seriesLine}</Link>
                  </p>
                ) : (
                  <p style={{ fontSize: 13, color: '#9b7b5e', margin: '0 0 0.25rem', fontFamily: 'sans-serif', fontStyle: 'italic' }}>{seriesLine}</p>
                )
              )}
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
            <Paragraphs text={book.synopsis} style={{ fontSize: 15, color: 'var(--text-body)', lineHeight: 1.8 }} />
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
                    {p.desc && (
                      <div style={{ margin: '0 0 0.75rem' }}>
                        <Paragraphs text={p.desc} style={{ fontSize: 13, color: 'var(--text-body)', lineHeight: 1.65 }} gap="0.6rem" />
                      </div>
                    )}
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
            <Paragraphs text={book.review} style={{ fontSize: 15, color: 'var(--text-body)', lineHeight: 1.85, fontStyle: 'italic' }} gap="1.1rem" />
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
              <a href={book.amazonLink} target="_blank" rel="sponsored noopener noreferrer"
                style={{ padding: '8px 16px', borderRadius: 8, background: '#fff8e7', border: '1px solid #f0c060', color: '#b07800', fontSize: 13, fontFamily: 'sans-serif', textDecoration: 'none', fontWeight: 500 }}>
                Amazon
              </a>
            </div>
          )}

          {/* Series navigation */}
          <SeriesNav context={context} />
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

  let context = null
  try {
    context = await getSeriesContext(book)
  } catch (e) {
    context = null
  }

  return { props: { book, context }, revalidate: 60 }
}
