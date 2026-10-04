import Head from 'next/head'
import Link from 'next/link'
import { getCorner, getPost } from '../../lib/notion'
import { Pill, SiteHeader, Newsletter, Footer } from '../../components/ui'

const entryTypes = {
  reflection:     { label: 'Reflection',    color: '#7a6a50', bg: '#f5ede4', border: '#d4bfaa' },
  'literary news':{ label: 'Literary news', color: '#3a6a7a', bg: '#e4f0f5', border: '#aacfda' },
  list:           { label: 'List',          color: '#5a7a50', bg: '#e8ede3', border: '#b0c8a0' },
  quote:          { label: 'Quote',         color: '#7a5080', bg: '#f0e8f5', border: '#c8aad4' },
}

const SITE = 'Reading with Matcha'

// ─── Text and link helpers ───────────────────────────────────────────────────

function plainText(segs) {
  return (segs || []).map(s => s.text).join('')
}

// Separators that can sit between two links without the line stopping
// being "links only". E.g. "Amazon · Kobo" or "Amazon | Kobo".
const ONLY_SEPARATOR = /^[\s·|/,\-–]*$/

function isLinksOnly(segs) {
  const useful = (segs || []).filter(s => !ONLY_SEPARATOR.test(s.text))
  return useful.length > 0 && useful.every(s => s.link)
}

function isInternal(url) {
  const u = String(url || '')
  return u.startsWith('/') || u.includes('readingwithmatcha.com')
}

function isAffiliate(url) {
  const u = String(url || '').toLowerCase()
  return u.includes('amazon.') || u.includes('amzn.')
}

// External links open in a new tab. Store links carry rel="sponsored",
// which is what Google asks for on affiliate links.
function linkProps(url) {
  if (isInternal(url)) return {}
  return {
    target: '_blank',
    rel: isAffiliate(url) ? 'sponsored noopener noreferrer' : 'noopener noreferrer',
  }
}

function storeLabel(url) {
  const u = String(url || '').toLowerCase()
  if (isInternal(url)) return 'Read my review'
  if (u.includes('amazon.') || u.includes('amzn.')) return 'See on Amazon'
  if (u.includes('books.apple.com')) return 'Apple Books'
  if (u.includes('play.google.com')) return 'Google Play'
  if (u.includes('kobo.com')) return 'Kobo'
  if (u.includes('goodreads')) return 'Goodreads'
  try { return new URL(url).hostname.replace(/^www\./, '') } catch (e) { return 'See link' }
}

// If the link text is the pasted URL itself, it is replaced with a readable name
function buttonLabel(text, url) {
  const t = String(text || '').trim()
  if (!t || /^https?:\/\//i.test(t)) return storeLabel(url)
  return t
}

function splitImages(str) {
  return String(str || '').split('|').map(s => s.trim()).filter(Boolean)
}

function trimText(str, max = 160) {
  const t = String(str || '').replace(/\s+/g, ' ').trim()
  if (t.length <= max) return t
  const cut = t.slice(0, max - 1)
  const space = cut.lastIndexOf(' ')
  return (space > 80 ? cut.slice(0, space) : cut) + '…'
}

// ─── Building the list ───────────────────────────────────────────────────────
// Each Heading 2 or 3 in Notion opens a book card.
// What comes before the first heading is the introduction.
// A divider (---) closes the current card: what comes after is the closing.

function buildList(blocks) {
  const intro = []
  const books = []
  const closing = []
  let current = null

  for (const b of blocks) {
    if (b.type === 'heading_2' || b.type === 'heading_3') {
      current = { id: b.id, title: b.text, blocks: [] }
      books.push(current)
      continue
    }
    if (b.type === 'divider' && current) {
      current = null
      continue
    }
    if (current) current.blocks.push(b)
    else if (books.length === 0) intro.push(b)
    else closing.push(b)
  }

  return { intro, books, closing }
}

// Inside a card:
// the first image is the cover, the first short line is the author,
// lines that are only links become buttons, the rest is the synopsis.
function buildCard(book) {
  let cover = null
  let author = null
  const body = []
  const buttons = []

  for (const b of book.blocks) {
    if (b.type === 'image' && !cover) { cover = b; continue }

    if (b.type === 'bookmark') {
      buttons.push({ url: b.url, text: buttonLabel(plainText(b.caption), b.url) })
      continue
    }

    if (b.type === 'paragraph') {
      const plain = plainText(b.text).trim()
      if (!plain) continue

      if (isLinksOnly(b.text)) {
        b.text.filter(s => s.link).forEach(s => buttons.push({ url: s.link, text: buttonLabel(s.text, s.link) }))
        continue
      }

      if (!author && body.length === 0 && plain.length <= 80 && !b.text.some(s => s.link)) {
        author = plain
        continue
      }
    }

    body.push(b)
  }

  return { cover, author, body, buttons }
}

// ─── Content components ──────────────────────────────────────────────────────

function Text({ segs, et }) {
  return (
    <>
      {(segs || []).map((s, i) => {
        const style = {}
        if (s.bold) style.fontWeight = 700
        if (s.italic) style.fontStyle = 'italic'
        const deco = []
        if (s.underline) deco.push('underline')
        if (s.strike) deco.push('line-through')
        if (deco.length) style.textDecoration = deco.join(' ')
        if (s.code) {
          style.fontFamily = 'monospace'
          style.background = '#fff'
          style.padding = '0 4px'
          style.borderRadius = 4
        }
        if (s.link) {
          return (
            <a key={i} href={s.link} {...linkProps(s.link)}
              style={{ ...style, color: et.color, textDecoration: 'underline', textUnderlineOffset: 3 }}>
              {s.text}
            </a>
          )
        }
        return <span key={i} style={style}>{s.text}</span>
      })}
    </>
  )
}

function Buttons({ links, et }) {
  if (!links.length) return null
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', margin: '10px 0 4px' }}>
      {links.map((l, i) => {
        const primary = i === 0
        return (
          <a key={i} href={l.url} {...linkProps(l.url)}
            style={{
              display: 'inline-block',
              padding: '7px 14px',
              borderRadius: 8,
              fontSize: 13,
              fontFamily: 'sans-serif',
              fontWeight: 500,
              textDecoration: 'none',
              border: `1px solid ${primary ? et.color : et.border}`,
              background: primary ? et.color : '#fff',
              color: primary ? '#fff' : et.color,
            }}>
            {l.text} {isInternal(l.url) ? '→' : '↗'}
          </a>
        )
      })}
    </div>
  )
}

const paragraphStyle = { fontSize: 16, color: 'var(--text-body)', lineHeight: 1.85, margin: '0 0 1rem', whiteSpace: 'pre-wrap' }

const compactParagraphStyle = { fontSize: 14, color: 'var(--text-body)', lineHeight: 1.7, margin: '0 0 8px', whiteSpace: 'pre-wrap' }

function Block({ b, et, alt, italic, compact }) {
  switch (b.type) {
    case 'paragraph': {
      if (!plainText(b.text).trim()) return <div style={{ height: 8 }} />
      if (isLinksOnly(b.text)) {
        return <Buttons et={et} links={b.text.filter(s => s.link).map(s => ({ url: s.link, text: buttonLabel(s.text, s.link) }))} />
      }
      const base = compact ? compactParagraphStyle : paragraphStyle
      return <p style={{ ...base, fontStyle: italic ? 'italic' : 'normal' }}><Text segs={b.text} et={et} /></p>
    }
    case 'heading_1':
    case 'heading_2':
      return <h2 style={{ fontSize: 21, fontWeight: 700, color: 'var(--text-dark)', lineHeight: 1.3, margin: '1.75rem 0 0.75rem' }}><Text segs={b.text} et={et} /></h2>
    case 'heading_3':
      return <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-dark)', lineHeight: 1.3, margin: '1.5rem 0 0.5rem' }}><Text segs={b.text} et={et} /></h3>
    case 'image': {
      const caption = plainText(b.caption)
      return (
        <figure style={{ margin: '1.25rem 0' }}>
          <img src={b.url} alt={caption || alt || ''} loading="lazy"
            style={{ width: '100%', borderRadius: 8, border: `1px solid ${et.border}`, display: 'block' }} />
          {caption && (
            <figcaption style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'sans-serif', marginTop: 6, textAlign: 'center' }}>
              <Text segs={b.caption} et={et} />
            </figcaption>
          )}
        </figure>
      )
    }
    case 'quote':
      return (
        <blockquote style={{ borderLeft: `3px solid ${et.color}`, margin: '1.25rem 0', padding: '0.25rem 0 0.25rem 1rem', fontStyle: 'italic', fontSize: 17, color: 'var(--text-body)', lineHeight: 1.75, whiteSpace: 'pre-wrap' }}>
          <Text segs={b.text} et={et} />
        </blockquote>
      )
    case 'callout':
      return (
        <div style={{ display: 'flex', gap: 10, background: '#fff', border: `1px solid ${et.border}`, borderRadius: 10, padding: '0.85rem 1rem', margin: '1rem 0', fontSize: 15, color: 'var(--text-body)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
          {b.icon && <span style={{ fontSize: 18, lineHeight: 1.4 }}>{b.icon}</span>}
          <div><Text segs={b.text} et={et} /></div>
        </div>
      )
    case 'divider':
      return <hr style={{ border: 'none', borderTop: `1px solid ${et.border}`, margin: '1.5rem 0' }} />
    case 'bookmark':
      return <Buttons et={et} links={[{ url: b.url, text: buttonLabel(plainText(b.caption), b.url) }]} />
    default:
      return null
  }
}

// Draws a sequence of blocks, grouping consecutive list items
function Blocks({ blocks, et, alt, italic, compact }) {
  const out = []
  let i = 0
  while (i < blocks.length) {
    const b = blocks[i]
    if (b.type === 'bulleted_list_item' || b.type === 'numbered_list_item') {
      const type = b.type
      const items = []
      while (i < blocks.length && blocks[i].type === type) { items.push(blocks[i]); i++ }
      const Tag = type === 'numbered_list_item' ? 'ol' : 'ul'
      out.push(
        <Tag key={items[0].id} style={{ fontSize: compact ? 14 : 16, color: 'var(--text-body)', lineHeight: compact ? 1.7 : 1.8, margin: compact ? '0 0 8px' : '0 0 1rem', paddingLeft: '1.4rem' }}>
          {items.map(it => <li key={it.id} style={{ marginBottom: 4 }}><Text segs={it.text} et={et} /></li>)}
        </Tag>
      )
      continue
    }
    out.push(<Block key={b.id} b={b} et={et} alt={alt} italic={italic} compact={compact} />)
    i++
  }
  return <>{out}</>
}

function BookCard({ book, number, et }) {
  const { cover, author, body, buttons } = buildCard(book)
  const title = plainText(book.title)
  return (
    <article style={{
      display: 'grid',
      gridTemplateColumns: cover ? '90px minmax(0,1fr)' : 'minmax(0,1fr)',
      gap: 16,
      background: '#fff',
      border: `1px solid ${et.border}`,
      borderRadius: 12,
      padding: '1rem',
    }}>
      {cover && (
        <img src={cover.url} alt={`Cover of ${title}`} loading="lazy"
          style={{ width: 90, height: 135, objectFit: 'cover', borderRadius: 6, border: `1px solid ${et.border}` }}
          onError={e => { e.target.style.background = et.bg; e.target.src = '' }} />
      )}
      <div>
        <p style={{ fontSize: 12, color: et.color, fontFamily: 'sans-serif', fontWeight: 500, margin: '0 0 2px' }}>
          {String(number).padStart(2, '0')}
        </p>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-dark)', lineHeight: 1.3, margin: '0 0 2px' }}>
          <Text segs={book.title} et={et} />
        </h2>
        {author && (
          <p style={{ fontSize: 13, color: 'var(--text-muted)', fontFamily: 'sans-serif', margin: '0 0 8px' }}>{author}</p>
        )}
        <Blocks blocks={body} et={et} alt={title} compact />
        <Buttons links={buttons} et={et} />
      </div>
    </article>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function CornerDetail({ post }) {
  if (!post) return <div className="container"><p>Not found</p></div>

  const et = entryTypes[post.entryType] || entryTypes.reflection
  const isQuote = post.entryType === 'quote'
  const blocks = Array.isArray(post.blocks) ? post.blocks : []
  const hasBody = blocks.length > 0
  const images = Array.isArray(post.images) ? post.images : splitImages(post.image)
  const tags = Array.isArray(post.tags) ? post.tags : (post.tags || '').split(',').map(t => t.trim()).filter(Boolean)

  // A list is only built as cards if the body has at least one book heading
  const list = post.entryType === 'list' && hasBody ? buildList(blocks) : null
  const withCards = !!(list && list.books.length > 0)
  const numBooks = withCards ? list.books.length : 0

  // The image grid on top only shows if the images are not already in the body
  const bodyHasImages = blocks.some(b => b.type === 'image')
  const showGrid = images.length > 0 && !withCards && !bodyHasImages

  const pillLabel = withCards ? `${et.label} · ${numBooks} ${numBooks === 1 ? 'book' : 'books'}` : et.label

  // ── SEO ──
  const firstParagraph = plainText(
    (blocks.find(b => b.type === 'paragraph' && plainText(b.text).trim() && !isLinksOnly(b.text)) || {}).text
  )
  const seoTitle = `${post.title} | ${SITE}`
  const seoDescription = trimText(post.preview || firstParagraph || post.content || post.title)
  const seoImage = images[0] || (blocks.find(b => b.type === 'image' && !b.uploaded) || {}).url || ''

  return (
    <>
      <Head>
        <title>{seoTitle}</title>
        <meta name="description" content={seoDescription} />
        <meta property="og:type" content="article" />
        <meta property="og:site_name" content={SITE} />
        <meta property="og:title" content={seoTitle} />
        <meta property="og:description" content={seoDescription} />
        {seoImage && <meta property="og:image" content={seoImage} />}
        <meta name="twitter:card" content={seoImage ? 'summary_large_image' : 'summary'} />
      </Head>
      <div className="container">
        <SiteHeader />
        <div style={{ maxWidth: 680, margin: '0 auto', padding: '1.5rem 0 4rem' }}>
          <Link href="/" style={{ display: 'inline-block', marginBottom: '1.5rem', color: et.color, fontSize: 14, fontFamily: 'sans-serif' }}>← Back</Link>

          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: '0.75rem' }}>
              <Pill bg="#fff" color={et.color} border={et.border}>{pillLabel}</Pill>
              <span style={{ fontSize: 12, color: et.color, fontFamily: 'sans-serif', opacity: 0.8 }}>From my corner</span>
            </div>
            <h1 style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-dark)', lineHeight: 1.25, margin: '0 0 1rem' }}>{post.title}</h1>
            {tags.length > 0 && <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>{tags.map(t => <Pill key={t}>{t}</Pill>)}</div>}
          </div>

          {/* Images from the Image URL property */}
          {showGrid && (
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(images.length, 3)},1fr)`, gap: 8, marginBottom: '1.5rem' }}>
              {images.map((img, i) => (
                <img key={i} src={img} alt={images.length === 1 ? post.title : `${post.title}, image ${i + 1}`}
                  style={{ width: '100%', borderRadius: 8, border: `1px solid ${et.border}`, objectFit: 'cover', maxHeight: 300 }} />
              ))}
            </div>
          )}

          {/* Content */}
          {withCards ? (
            <div>
              {list.intro.length > 0 && <Blocks blocks={list.intro} et={et} alt={post.title} />}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14, margin: '1.5rem 0' }}>
                {list.books.map((book, i) => <BookCard key={book.id} book={book} number={i + 1} et={et} />)}
              </div>
              {list.closing.length > 0 && <Blocks blocks={list.closing} et={et} alt={post.title} />}
            </div>
          ) : hasBody ? (
            <div style={{ background: et.bg, border: `1px solid ${et.border}`, borderLeft: `4px solid ${et.color}`, borderRadius: 12, padding: '1.5rem' }}>
              <Blocks blocks={blocks} et={et} alt={post.title} italic={isQuote} />
            </div>
          ) : (
            <div style={{ background: et.bg, border: `1px solid ${et.border}`, borderLeft: `4px solid ${et.color}`, borderRadius: 12, padding: '1.5rem' }}>
              <p style={{ fontSize: 16, color: 'var(--text-body)', lineHeight: 1.85, fontStyle: isQuote ? 'italic' : 'normal', whiteSpace: 'pre-wrap', margin: 0 }}>
                {post.content || post.preview}
              </p>
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
  const posts = await getCorner()
  return { paths: posts.map(p => ({ params: { slug: p.slug } })), fallback: 'blocking' }
}

export async function getStaticProps({ params }) {
  const post = await getPost(params.slug)
  if (!post) return { notFound: true }
  return { props: { post }, revalidate: 60 }
}
