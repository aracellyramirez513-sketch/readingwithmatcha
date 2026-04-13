import Head from 'next/head'
import Link from 'next/link'
import { getCorner, getPost } from '../../lib/notion'
import { Pill, SiteHeader, Newsletter, Footer } from '../../components/ui'

const entryTypes = {
  reflection:    { label: 'Reflection',    color: '#7a6a50', bg: '#f5ede4', border: '#d4bfaa' },
  'literary news':{ label: 'Literary news',color: '#3a6a7a', bg: '#e4f0f5', border: '#aacfda' },
  list:          { label: 'List',          color: '#5a7a50', bg: '#e8ede3', border: '#b0c8a0' },
  quote:         { label: 'Quote',         color: '#7a5080', bg: '#f0e8f5', border: '#c8aad4' },
}

export default function CornerDetail({ post }) {
  if (!post) return <div className="container"><p>Not found</p></div>
  const et = entryTypes[post.entryType] || entryTypes.reflection
  const images = post.image ? post.image.split('|').filter(Boolean) : []
  const tags = Array.isArray(post.tags) ? post.tags : (post.tags || '').split(',').map(t => t.trim()).filter(Boolean)

  return (
    <>
      <Head>
        <title>{post.title} — Reading with Matcha</title>
        <meta name="description" content={post.preview?.slice(0, 160)} />
      </Head>
      <div className="container">
        <SiteHeader />
        <div style={{ maxWidth: 680, margin: '0 auto', padding: '1.5rem 0 4rem' }}>
          <Link href="/" style={{ display: 'inline-block', marginBottom: '1.5rem', color: et.color, fontSize: 14, fontFamily: 'sans-serif' }}>← Back</Link>

          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: '0.75rem' }}>
              <Pill bg="#fff" color={et.color} border={et.border}>{et.label}</Pill>
              <span style={{ fontSize: 11, color: et.color, fontFamily: 'sans-serif', opacity: 0.8 }}>From my corner</span>
              <span style={{ fontSize: 12, color: et.color, fontFamily: 'sans-serif', opacity: 0.7, marginLeft: 'auto' }}>{post.date}</span>
            </div>
            <h1 style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-dark)', lineHeight: 1.25, margin: '0 0 1rem' }}>{post.title}</h1>
            {tags.length > 0 && <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>{tags.map(t => <Pill key={t}>{t}</Pill>)}</div>}
          </div>

          {images.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(images.length, 3)},1fr)`, gap: 8, marginBottom: '1.5rem' }}>
              {images.map((img, i) => (
                <img key={i} src={img} alt={`Image ${i + 1}`} style={{ width: '100%', borderRadius: 8, border: `1px solid ${et.border}`, objectFit: 'cover', maxHeight: 300 }} />
              ))}
            </div>
          )}

          <div style={{ background: et.bg, border: `1px solid ${et.border}`, borderLeft: `4px solid ${et.color}`, borderRadius: 12, padding: '1.5rem' }}>
            <p style={{ fontSize: 16, color: 'var(--text-body)', lineHeight: 1.85, fontStyle: post.entryType === 'quote' ? 'italic' : 'normal', whiteSpace: 'pre-wrap' }}>
              {post.content || post.preview}
            </p>
          </div>
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
