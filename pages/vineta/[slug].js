import Head from 'next/head'
import Link from 'next/link'
import { getComics, getComic } from '../../lib/notion'
import { Stars, Pill, SiteHeader, Newsletter, Footer } from '../../components/ui'

const comicTypes = { manga: 'Manga', manhwa: 'Manhwa', manhua: 'Manhua', comic: 'Comic' }
const statusColors = {
  'Ongoing':  { color: '#5a7a50', bg: '#e8ede3', border: '#b0c8a0' },
  'Complete': { color: '#3a6a7a', bg: '#e4f0f5', border: '#aacfda' },
}

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

// Affiliate stores get rel="sponsored", as Google asks for affiliate links
function linkRel(url) {
  return /amazon\.|amzn\.to/i.test(String(url || '')) ? 'sponsored noopener noreferrer' : 'noopener noreferrer'
}

export default function ComicDetail({ comic }) {
  if (!comic) return <div className="container"><p>Not found</p></div>
  const st = statusColors[comic.status] || statusColors['Ongoing']
  const tags = Array.isArray(comic.tags) ? comic.tags : (comic.tags || '').split(',').map(t => t.trim()).filter(Boolean)
  const kind = comicTypes[comic.comicType] || ''
  const seoTitle = `${comic.title}: ${kind ? `${kind.toLowerCase()} review` : 'review'} | Reading with Matcha`
  const seoDescription = (comic.synopsis || '').replace(/\s+/g, ' ').trim().slice(0, 160)

  return (
    <>
      <Head>
        <title>{seoTitle}</title>
        <meta name="description" content={seoDescription} />
        <meta property="og:type" content="article" />
        <meta property="og:title" content={seoTitle} />
        <meta property="og:description" content={seoDescription} />
        {comic.cover && <meta property="og:image" content={comic.cover} />}
        <meta name="twitter:card" content={comic.cover ? 'summary_large_image' : 'summary'} />
      </Head>
      <div className="container">
        <SiteHeader />
        <div style={{ maxWidth: 680, margin: '0 auto', padding: '1.5rem 0 4rem' }}>
          <Link href="/" style={{ display: 'inline-block', marginBottom: '1.5rem', color: 'var(--v-accent)', fontSize: 14, fontFamily: 'sans-serif' }}>← Back</Link>

          <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: 24, marginBottom: '2rem', alignItems: 'start' }}>
            {comic.cover && <img src={comic.cover} alt={comic.title} style={{ width: 140, height: 200, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--v-border)' }} />}
            <div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: '0.75rem' }}>
                <Pill bg="#fff" color="var(--v-accent)" border="var(--v-border)">{comicTypes[comic.comicType] || comic.comicType}</Pill>
                <Pill bg={st.bg} color={st.color} border={st.border}>{comic.status}</Pill>
              </div>
              <h1 style={{ fontSize: 26, fontWeight: 700, margin: '0 0 0.25rem', color: 'var(--text-dark)', lineHeight: 1.2 }}>{comic.title}</h1>
              <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: '0 0 4px', fontFamily: 'sans-serif' }}>{comic.author}</p>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '0 0 0.75rem', fontFamily: 'sans-serif' }}>{comic.genre} · {comic.platform}</p>
              <Stars n={comic.rating} size={18} />
              {tags.length > 0 && <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: '0.75rem' }}>{tags.map(t => <Pill key={t}>{t}</Pill>)}</div>}
            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--v-border)', paddingTop: '1.5rem', marginBottom: '1.5rem' }}>
            <p style={{ fontSize: 11, fontFamily: 'sans-serif', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', margin: '0 0 0.75rem' }}>Synopsis</p>
            <Paragraphs text={comic.synopsis} style={{ fontSize: 15, color: 'var(--text-body)', lineHeight: 1.8 }} />
          </div>

          <div style={{ background: 'var(--v-bg)', border: '1px solid var(--v-border)', borderRadius: 12, padding: '1.25rem 1.5rem', marginBottom: '1.5rem' }}>
            <p style={{ fontSize: 11, fontFamily: 'sans-serif', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', margin: '0 0 0.75rem' }}>My review</p>
            <Paragraphs text={comic.review} style={{ fontSize: 15, color: 'var(--text-body)', lineHeight: 1.85, fontStyle: 'italic' }} gap="1.1rem" />
          </div>

          {comic.buyLink && (
            <div style={{ marginBottom: '1.5rem' }}>
              <p style={{ fontSize: 11, fontFamily: 'sans-serif', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', margin: '0 0 0.75rem' }}>Where to read it?</p>
              <a href={comic.buyLink} target="_blank" rel={linkRel(comic.buyLink)} style={{ padding: '8px 16px', borderRadius: 8, background: '#e7f5ff', border: '1px solid #60a0d0', color: '#0060a0', fontSize: 13, fontFamily: 'sans-serif', textDecoration: 'none', fontWeight: 500 }}>View platform</a>
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
  const comics = await getComics()
  return { paths: comics.map(v => ({ params: { slug: v.slug } })), fallback: 'blocking' }
}

export async function getStaticProps({ params }) {
  const comic = await getComic(params.slug)
  if (!comic) return { notFound: true }
  return { props: { comic }, revalidate: 60 }
}
