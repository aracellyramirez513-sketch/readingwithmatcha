import Head from 'next/head'
import Link from 'next/link'
import { useState, useMemo } from 'react'
import { getAll } from '../lib/notion'
import { Stars, Pill, SiteHeader, Profile, Sidebar, Newsletter, Footer } from '../components/ui'

const entryTypes = {
  reflection:    { label: 'Reflection',      color: '#7a6a50', bg: '#f5ede4', border: '#d4bfaa' },
  'literary news':{ label: 'Literary news',  color: '#3a6a7a', bg: '#e4f0f5', border: '#aacfda' },
  list:          { label: 'List',             color: '#5a7a50', bg: '#e8ede3', border: '#b0c8a0' },
  quote:         { label: 'Quote',            color: '#7a5080', bg: '#f0e8f5', border: '#c8aad4' },
}
const comicTypes = { manga: 'Manga', manhwa: 'Manhwa', manhua: 'Manhua', comic: 'Comic' }
const statusColors = {
  'Ongoing':  { color: '#5a7a50', bg: '#e8ede3', border: '#b0c8a0' },
  'Complete': { color: '#3a6a7a', bg: '#e4f0f5', border: '#aacfda' },
}

const catKeys = ['all', 'review', 'comic', 'corner', 'order']
const categories = ['All', 'Reviews', 'Graphic Reads', 'The Corner', 'Reading Order']

export default function Home({ books, comics, corner, reading, orders }) {
  const [activeCat, setActiveCat] = useState('all')
  const [activeTag, setActiveTag] = useState(null)
  const [search, setSearch] = useState('')

  const featuredBook = useMemo(() => books.find(b => b.featured) || null, [books])
  const favoriteBooks = useMemo(() => books.filter(b => b.favorite).slice(0, 5), [books])

  const allItems = useMemo(() => {
    const items = [...books, ...comics, ...corner, ...orders]
    return items.sort((a, b) => (b.date || '').localeCompare(a.date || ''))
  }, [books, comics, corner, orders])

  const allTags = useMemo(() => {
    const set = new Set()
    allItems.forEach(item => {
      const tags = Array.isArray(item.tags) ? item.tags : (item.tags || '').split(',').map(t => t.trim()).filter(Boolean)
      tags.forEach(t => set.add(t))
    })
    return Array.from(set).sort()
  }, [allItems])

  const filtered = useMemo(() => {
    let items = activeCat === 'all' ? allItems : allItems.filter(i => i.type === activeCat)
    if (activeTag) items = items.filter(i => {
      const tags = Array.isArray(i.tags) ? i.tags : (i.tags || '').split(',').map(t => t.trim())
      return tags.includes(activeTag)
    })
    if (search) {
      const q = search.toLowerCase()
      items = items.filter(i =>
        (i.title || '').toLowerCase().includes(q) ||
        (i.author || '').toLowerCase().includes(q) ||
        (Array.isArray(i.tags) ? i.tags.join(' ') : (i.tags || '')).toLowerCase().includes(q)
      )
    }
    return items
  }, [allItems, activeCat, activeTag, search])

  const isFiltered = activeCat !== 'all' || activeTag || search

  function handleTag(tag) { setActiveTag(prev => prev === tag ? null : tag) }

  return (
    <>
      <Head>
        <title>Reading with Matcha</title>
        <meta name="description" content="Honest book reviews on romance, dark romance, romantasy and more. Always with a matcha nearby." />
        <meta property="og:title" content="Reading with Matcha" />
        <meta property="og:description" content="Honest book reviews on romance, dark romance, romantasy and more." />
      </Head>

      <div className="container">
        <SiteHeader />
        <Profile />

        {!isFiltered && featuredBook && (
          <FeaturedCard book={featuredBook} />
        )}

        {!isFiltered && favoriteBooks.length > 0 && (
          <FavoritesRow books={favoriteBooks} />
        )}

        <div style={{ padding: '1.5rem 0 1rem' }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: '1.5rem' }}>
            {categories.map((cat, i) => (
              <button key={cat} className={`btn btn-pill ${activeCat === catKeys[i] ? 'active' : ''}`}
                onClick={() => setActiveCat(catKeys[i])}>
                {cat}
              </button>
            ))}
          </div>

          <div className="grid-sidebar">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {filtered.length === 0
                ? <p style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: 14 }}>No entries with that filter yet.</p>
                : filtered.map((item, idx) => <ItemCard key={item.id || idx} item={item} activeTag={activeTag} handleTag={handleTag} />)
              }
            </div>
            <Sidebar reading={reading} search={search} setSearch={setSearch}
              activeTag={activeTag} allTags={allTags} handleTag={handleTag} />
          </div>
        </div>

        <div className="afiliados-banner">
          <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '0 0 4px', fontFamily: 'sans-serif', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Affiliates</p>
          <p style={{ fontSize: 14, color: 'var(--text-body)', margin: 0, fontStyle: 'italic' }}>Buy the books I recommend on Amazon</p>
        </div>

        <Newsletter />
        <Footer />
      </div>
    </>
  )
}

function FeaturedCard({ book }) {
  return (
    <Link href={`/resena/${book.slug}`} style={{ textDecoration: 'none' }}>
      <div style={{ margin: '2rem 0 1rem', background: 'var(--bg-sidebar)', border: '1px solid var(--border)', borderRadius: 16, padding: '1.5rem', display: 'grid', gridTemplateColumns: '140px 1fr', gap: 20, cursor: 'pointer', transition: 'opacity 0.15s' }}
        onMouseEnter={e => e.currentTarget.style.opacity = '0.92'}
        onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
        <img src={book.cover} alt={book.title}
          style={{ width: 140, height: 200, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--border-warm)' }}
          onError={e => { e.target.style.background = 'var(--bg-tag)'; e.target.src = '' }} />
        <div>
          <span style={{ display: 'inline-block', background: 'var(--btn-bg)', color: '#fff', fontSize: 10, padding: '4px 12px', borderRadius: 20, fontFamily: 'sans-serif', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>★ Featured</span>
          <h2 style={{ fontSize: 26, fontWeight: 700, margin: '0 0 4px', color: 'var(--text-dark)', lineHeight: 1.2 }}>{book.title}</h2>
          {book.series && <p style={{ fontSize: 13, color: '#9b7b5e', margin: '0 0 4px', fontFamily: 'sans-serif', fontStyle: 'italic' }}>{book.series}{book.seriesNumber ? ` · Book ${book.seriesNumber}` : ''}</p>}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: 0, fontFamily: 'sans-serif' }}>{book.author}</p>
            <Pill>{book.category}</Pill>
          </div>
          <Stars n={book.rating} size={16} />
          <p style={{ fontSize: 14, color: 'var(--text-body)', lineHeight: 1.65, margin: '10px 0 12px', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{book.synopsis}</p>
          <span style={{ fontSize: 13, color: 'var(--text-accent)', fontFamily: 'sans-serif', fontWeight: 500 }}>Read the full review →</span>
        </div>
      </div>
    </Link>
  )
}

function FavoritesRow({ books }) {
  return (
    <div style={{ margin: '1.5rem 0' }}>
      <p style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-muted)', margin: '0 0 12px', fontFamily: 'sans-serif' }}>★ My favorites</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10 }}>
        {books.map(book => (
          <Link key={book.id} href={`/resena/${book.slug}`} style={{ textDecoration: 'none' }}>
            <div style={{ cursor: 'pointer', transition: 'transform 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
              <img src={book.cover} alt={book.title}
                style={{ width: '100%', aspectRatio: '2/3', objectFit: 'cover', borderRadius: 6, border: '1px solid var(--border-warm)', marginBottom: 6 }}
                onError={e => { e.target.style.background = 'var(--bg-tag)'; e.target.src = '' }} />
              <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-dark)', margin: '0 0 2px', lineHeight: 1.25, fontFamily: 'Georgia,serif', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{book.title}</p>
              <p style={{ fontSize: 10, color: 'var(--text-accent)', margin: 0, fontFamily: 'sans-serif' }}>{'★'.repeat(Math.floor(Number(book.rating) || 0))}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

function ItemCard({ item, activeTag, handleTag }) {
  if (item.type === 'review') {
    const tags = Array.isArray(item.tags) ? item.tags : (item.tags || '').split(',').map(t => t.trim()).filter(Boolean)
    return (
      <Link href={`/resena/${item.slug}`} style={{ textDecoration: 'none' }}>
        <div className="card" style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: 14 }}>
          <img src={item.cover} alt={item.title}
            style={{ width: 80, height: 115, objectFit: 'cover', borderRadius: 6, border: '1px solid var(--border-warm)' }}
            onError={e => { e.target.style.background = 'var(--bg-tag)'; e.target.src = '' }} />
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 2px', color: 'var(--text-dark)' }}>{item.title}</h3>
            {item.series && <p style={{ fontSize: 11, color: '#9b7b5e', margin: '0 0 2px', fontFamily: 'sans-serif', fontStyle: 'italic' }}>{item.series}{item.seriesNumber ? ` · Book ${item.seriesNumber}` : ''}</p>}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0, fontFamily: 'sans-serif' }}>{item.author}</p>
              <Pill>{item.category}</Pill>
            </div>
            <Stars n={item.rating} />
            <p style={{ fontSize: 13, color: 'var(--text-body)', lineHeight: 1.6, margin: '7px 0 10px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{item.synopsis}</p>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 5 }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                {tags.map(tag => (
                  <span key={tag} onClick={e => { e.preventDefault(); handleTag(tag) }}
                    style={{ fontSize: 11, padding: '2px 9px', borderRadius: 20, fontFamily: 'sans-serif', cursor: 'pointer',
                      border: '1px solid var(--border)', background: activeTag === tag ? 'var(--btn-bg)' : 'var(--bg-tag)',
                      color: activeTag === tag ? '#fff' : 'var(--text-accent)' }}>
                    {tag}
                  </span>
                ))}
              </div>
              <span style={{ fontSize: 12, color: 'var(--text-accent)', fontFamily: 'sans-serif', whiteSpace: 'nowrap' }}>Read more →</span>
            </div>
          </div>
        </div>
      </Link>
    )
  }

  if (item.type === 'comic') {
    const st = statusColors[item.status] || statusColors['Ongoing']
    const tags = Array.isArray(item.tags) ? item.tags : (item.tags || '').split(',').map(t => t.trim()).filter(Boolean)
    return (
      <Link href={`/vineta/${item.slug}`} style={{ textDecoration: 'none' }}>
        <div className="card-comic" style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: 14 }}>
          <img src={item.cover} alt={item.title}
            style={{ width: 80, height: 115, objectFit: 'cover', borderRadius: 6, border: '1px solid var(--v-border)' }}
            onError={e => { e.target.style.background = 'var(--bg-tag)'; e.target.src = '' }} />
          <div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 6 }}>
              <Pill bg="#fff" color="var(--v-accent)" border="var(--v-border)">{comicTypes[item.comicType] || item.comicType}</Pill>
              <Pill bg={st.bg} color={st.color} border={st.border}>{item.status}</Pill>
            </div>
            <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 2px', color: 'var(--text-dark)' }}>{item.title}</h3>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '0 0 5px', fontFamily: 'sans-serif' }}>{item.genre} · {item.platform}</p>
            <Stars n={item.rating} />
            <p style={{ fontSize: 13, color: 'var(--text-body)', lineHeight: 1.6, margin: '7px 0 10px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{item.synopsis}</p>
            <span style={{ fontSize: 12, color: 'var(--v-accent)', fontFamily: 'sans-serif' }}>Read more →</span>
          </div>
        </div>
      </Link>
    )
  }

  if (item.type === 'corner') {
    const et = entryTypes[item.entryType] || entryTypes.reflection
    const image = item.image ? item.image.split('|').filter(Boolean)[0] : null
    const tags = Array.isArray(item.tags) ? item.tags : (item.tags || '').split(',').map(t => t.trim()).filter(Boolean)
    return (
      <Link href={`/rincon/${item.slug}`} style={{ textDecoration: 'none' }}>
        <div style={{ background: et.bg, border: `1px solid ${et.border}`, borderLeft: `4px solid ${et.color}`, borderRadius: 12, padding: '1rem', cursor: 'pointer',
          display: 'grid', gridTemplateColumns: image ? '80px 1fr' : '1fr', gap: 14 }}
          onMouseEnter={e => e.currentTarget.style.opacity = '0.85'} onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
          {image && <img src={image} alt={item.title} style={{ width: 80, height: 115, objectFit: 'cover', borderRadius: 6, border: `1px solid ${et.border}` }} />}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <Pill bg="#fff" color={et.color} border={et.border}>{et.label}</Pill>
                <span style={{ fontSize: 11, color: et.color, fontFamily: 'sans-serif', opacity: 0.8 }}>The Corner</span>
              </div>
              <span style={{ fontSize: 11, color: et.color, fontFamily: 'sans-serif', opacity: 0.7 }}>{item.date}</span>
            </div>
            <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 6px', color: 'var(--text-dark)' }}>{item.title}</h3>
            <p style={{ fontSize: 13, color: 'var(--text-body)', lineHeight: 1.65, margin: '0 0 10px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', fontStyle: item.entryType === 'quote' ? 'italic' : 'normal' }}>{item.preview}</p>
            <span style={{ fontSize: 12, color: et.color, fontFamily: 'sans-serif' }}>Read more →</span>
          </div>
        </div>
      </Link>
    )
  }

  if (item.type === 'order') {
    const tropes = Array.isArray(item.tropes) ? item.tropes : []
    return (
      <Link href={`/orden/${item.slug}`} style={{ textDecoration: 'none' }}>
        <div className="card-order">
          <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: 14, padding: '1rem' }}>
            {item.sagaCover
              ? <img src={item.sagaCover} alt={item.title} style={{ width: 80, height: 115, objectFit: 'cover', borderRadius: 6, border: '1px solid var(--border-warm)' }}
                  onError={e => { e.target.style.background = 'var(--bg-tag)'; e.target.src = '' }} />
              : <div style={{ width: 80, height: 115, borderRadius: 6, background: 'var(--bg-tag)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>📚</div>
            }
            <div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 6 }}>
                <Pill>{item.category}</Pill>
                <Pill bg="#fff" color="var(--text-muted)" border="var(--border)">{item.numBooks} books</Pill>
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 2px', color: 'var(--text-dark)' }}>{item.title}</h3>
              <p style={{ fontSize: 12, color: '#9b7b5e', margin: '0 0 4px', fontFamily: 'sans-serif', fontStyle: 'italic' }}>{item.author}</p>
              {item.couple && <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '0 0 6px', fontFamily: 'sans-serif' }}>💕 {item.couple}</p>}
              <p style={{ fontSize: 13, color: 'var(--text-body)', lineHeight: 1.6, margin: '0 0 8px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{item.description}</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {tropes.slice(0, 3).map(t => <Pill key={t}>{t}</Pill>)}
                </div>
                <span style={{ fontSize: 12, color: 'var(--text-accent)', fontFamily: 'sans-serif', whiteSpace: 'nowrap' }}>See order →</span>
              </div>
            </div>
          </div>
          {item.bookImages?.length > 0 && (
            <div style={{ display: 'flex', gap: 6, padding: '0 1rem 1rem', overflowX: 'auto' }}>
              {item.bookImages.slice(0, 8).map((img, i) => (
                <div key={i} style={{ flexShrink: 0, position: 'relative' }}>
                  <img src={img} alt={item.bookTitles?.[i] || `Book ${i + 1}`}
                    style={{ width: 44, height: 64, objectFit: 'cover', borderRadius: 4, border: '1px solid var(--border-warm)' }}
                    onError={e => { e.target.style.background = 'var(--bg-tag)'; e.target.src = '' }} />
                  <span style={{ position: 'absolute', top: 2, left: 2, background: 'var(--btn-bg)', color: '#fff', fontSize: 9, fontFamily: 'sans-serif', borderRadius: 3, padding: '1px 4px', fontWeight: 700 }}>{i + 1}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </Link>
    )
  }

  return null
}

export async function getServerSideProps() {
  const { books, comics, corner, reading, orders } = await getAll()
  return {
    props: { books, comics, corner, reading, orders },
  }
}
