import Head from 'next/head'
import Link from 'next/link'
import { useState, useMemo, useEffect } from 'react'
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

// 🌌 Lavender palette for reading orders (visually connects with universes)
const orderColors = {
  bg:         '#F0EDF5',
  border:     '#C4BBD0',
  accent:     '#6B5B8C',
  accentDark: '#4A3F6B',
  pillBg:     '#fff',
  tagBg:      '#E8E2F0',
}

// 🎨 Category pill configuration with emoji + custom colors
const catConfig = [
  { key: 'all',     label: 'All',            emoji: '✨', bg: '#e8ede3', border: '#b0c8a0', color: '#5a7a50', activeBg: '#5a7a50' },
  { key: 'review',  label: 'Reviews',        emoji: '📖', bg: '#e8ede3', border: '#b0c8a0', color: '#5a7a50', activeBg: '#5a7a50' },
  { key: 'comic',   label: 'Graphic Reads',  emoji: '🎨', bg: '#e4f0f5', border: '#aacfda', color: '#3a6a7a', activeBg: '#3a6a7a' },
  { key: 'corner',  label: 'The Corner',     emoji: '🌿', bg: '#f5ede4', border: '#d4bfaa', color: '#7a6a50', activeBg: '#7a6a50' },
  { key: 'order',   label: 'Reading Order',  emoji: '📚', bg: '#F0EDF5', border: '#C4BBD0', color: '#6B5B8C', activeBg: '#6B5B8C' },
]

// 🏷️ Subgenre colors for the category filter row
// (same tones as the category pills on the cards)
const catFilterColors = {
  'dark romance':         { bg: '#e7d0d6', color: '#67323f' },
  'romantasy':            { bg: '#e0d0e7', color: '#573267' },
  'mafia romance':        { bg: '#e7d9d0', color: '#674832' },
  'mafia':                { bg: '#e7d9d0', color: '#674832' },
  'contemporary romance': { bg: '#d0e7d3', color: '#326739' },
  'alien romance':        { bg: '#d0e2e7', color: '#325b67' },
  'monsters':             { bg: '#d0e2e7', color: '#325b67' },
  'alien / sci-fi romance': { bg: '#d0e2e7', color: '#325b67' },
  'alien/sci-fi romance': { bg: '#d0e2e7', color: '#325b67' },
}
const catFilterFallback = { bg: '#eae4d8', color: '#6b5b45' }

// 📖 Side line on book cards, like the ones on comics and The Corner
const bookAccent = '#7A9E7E'

// 🎨 Colors per comic type, in the section's blue family
const comicFilterColors = {
  'manga':  { bg: '#d8e8f0', color: '#2f5a70' },
  'manhwa': { bg: '#dfe1f0', color: '#3a4070' },
  'manhua': { bg: '#f0dde8', color: '#70365a' },
  'comic':  { bg: '#f0e4d6', color: '#70563a' },
}
const comicFilterFallback = { bg: '#e4f0f5', color: '#3a6a7a' }

// 🌿 Colors per comic status and per Corner entry type
const statusFilterColors = {
  'ongoing':  { bg: '#e8ede3', color: '#5a7a50' },
  'complete': { bg: '#e4f0f5', color: '#3a6a7a' },
}
const statusFilterFallback = { bg: '#eae4d8', color: '#6b5b45' }

const cornerFilterColors = {
  'reflection':    { bg: '#f5ede4', color: '#7a6a50' },
  'literary news': { bg: '#e4f0f5', color: '#3a6a7a' },
  'list':          { bg: '#e8ede3', color: '#5a7a50' },
  'quote':         { bg: '#f0e8f5', color: '#7a5080' },
}
const cornerFilterFallback = { bg: '#f5ede4', color: '#7a6a50' }

// 🔎 Which field feeds the second filter row on each tab.
// "all" is left out on purpose: mixing romance categories with
// manhwa types does not filter anything useful.
const subFilters = {
  review: { field: 'category',  all: 'All', colors: catFilterColors,    fallback: catFilterFallback,    label: v => v },
  order:  { field: 'category',  all: 'All', colors: catFilterColors,    fallback: catFilterFallback,    label: v => v },
  comic:  { field: 'comicType', all: 'All', colors: comicFilterColors,  fallback: comicFilterFallback,  label: v => comicTypes[String(v).toLowerCase()] || v },
  corner: { field: 'entryType', all: 'All', colors: cornerFilterColors, fallback: cornerFilterFallback, label: v => (entryTypes[String(v).toLowerCase()] || {}).label || v },
}

// A filter row only shows up when it has at least this many options.
// With a single option it filters nothing, so the minimum is 2.
// Change it to 1 if you want the row to always show.
const MIN_FILTER_OPTIONS = 2

// 📄 How many entries are shown per page
const PER_PAGE = 10

// Collects the distinct values of a field, keeping how they are written
function optionsOf(items, field) {
  const map = new Map()
  items.forEach(item => {
    const v = String(item[field] ?? '').trim()
    if (v) {
      const key = v.toLowerCase()
      if (!map.has(key)) map.set(key, v)
    }
  })
  return Array.from(map.entries())
    .map(([key, label]) => ({ key, label }))
    .sort((a, b) => a.label.localeCompare(b.label))
}

function tagList(item) {
  return Array.isArray(item.tags) ? item.tags : (item.tags || '').split(',').map(t => t.trim()).filter(Boolean)
}

export default function Home({ books, comics, corner, reading, orders, amazonFavorites = [] }) {
  const [activeCat, setActiveCat] = useState('all')
  const [activeSub, setActiveSub] = useState(null)
  const [activeStatus, setActiveStatus] = useState(null)
  const [activeTag, setActiveTag] = useState(null)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  const featuredBook = useMemo(() => books.find(b => b.featured) || null, [books])
  const favoriteBooks = useMemo(() => books.filter(b => b.favorite).slice(0, 20), [books])

  const allItems = useMemo(() => {
    const items = [...books, ...comics, ...corner, ...orders]
    return items.sort((a, b) => (b.date || '').localeCompare(a.date || ''))
  }, [books, comics, corner, orders])

  const allTags = useMemo(() => {
    const set = new Set()
    allItems.forEach(item => tagList(item).forEach(t => set.add(t)))
    return Array.from(set).sort()
  }, [allItems])

  const activeConfig = useMemo(() => catConfig.find(c => c.key === activeCat) || catConfig[0], [activeCat])

  // Entries in the active tab, before the subfilter, tag or search
  const itemsInTab = useMemo(
    () => activeCat === 'all' ? allItems : allItems.filter(i => i.type === activeCat),
    [allItems, activeCat]
  )

  const sub = subFilters[activeCat] || null

  // 🏷️ Second-row options, built from the entries that exist
  const subOptions = useMemo(
    () => sub ? optionsOf(itemsInTab, sub.field) : [],
    [itemsInTab, sub]
  )

  // 🎨 Graphic Reads only: extra row by publication status
  const statusOptions = useMemo(
    () => activeCat === 'comic' ? optionsOf(itemsInTab, 'status') : [],
    [itemsInTab, activeCat]
  )

  const showSub = subOptions.length >= MIN_FILTER_OPTIONS
  const showStatus = statusOptions.length >= MIN_FILTER_OPTIONS

  const filtered = useMemo(() => {
    let items = itemsInTab
    if (sub && activeSub) {
      items = items.filter(i => String(i[sub.field] ?? '').trim().toLowerCase() === activeSub)
    }
    if (activeCat === 'comic' && activeStatus) {
      items = items.filter(i => String(i.status ?? '').trim().toLowerCase() === activeStatus)
    }
    if (activeTag) items = items.filter(i => tagList(i).includes(activeTag))
    if (search) {
      const q = search.toLowerCase()
      items = items.filter(i =>
        (i.title || '').toLowerCase().includes(q) ||
        (i.author || '').toLowerCase().includes(q) ||
        tagList(i).join(' ').toLowerCase().includes(q)
      )
    }
    return items
  }, [itemsInTab, sub, activeCat, activeSub, activeStatus, activeTag, search])

  const isFiltered = activeCat !== 'all' || activeSub || activeStatus || activeTag || search

  // 📄 Pagination
  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE))

  // Changing tabs clears the subfilters, because the fields are different
  useEffect(() => { setActiveSub(null); setActiveStatus(null) }, [activeCat])
  // Reset to page 1 whenever filters change
  useEffect(() => { setPage(1) }, [activeCat, activeSub, activeStatus, activeTag, search])
  // Fix the page if it ends up out of range
  useEffect(() => { if (page > totalPages) setPage(1) }, [page, totalPages])

  const pageItems = useMemo(
    () => filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE),
    [filtered, page]
  )

  function goToPage(p) {
    const next = Math.min(Math.max(1, p), totalPages)
    setPage(next)
    if (typeof window !== 'undefined') {
      const anchor = document.getElementById('listing')
      if (anchor) anchor.scrollIntoView({ behavior: 'smooth', block: 'start' })
      else window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

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
          <div className="mobile-only">
            <FeaturedCard book={featuredBook} />
          </div>
        )}

        {!isFiltered && favoriteBooks.length > 0 && (
          <FavoritesRow books={favoriteBooks} />
        )}

        <div style={{ padding: '1.5rem 0 1rem' }}>
          {/* Category filter pills with emoji + color */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: '0.75rem' }}>
            {catConfig.map(cat => {
              const isActive = activeCat === cat.key
              return (
                <button key={cat.key}
                  onClick={() => setActiveCat(cat.key)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '6px 14px',
                    borderRadius: 20,
                    fontSize: 13,
                    fontFamily: 'sans-serif',
                    fontWeight: 500,
                    border: `1px solid ${cat.border}`,
                    background: isActive ? cat.activeBg : cat.bg,
                    color: isActive ? '#fff' : cat.color,
                    cursor: 'pointer',
                    transition: 'all 0.15s'
                  }}>
                  <span style={{ fontSize: 14 }}>{cat.emoji}</span>
                  <span>{cat.label}</span>
                </button>
              )
            })}
          </div>

          {/* 🏷️ Filters for the active tab (they add up with the ones above) */}
          {(showSub || showStatus) && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: '0.75rem' }}>
              {showSub && (
                <FilterRow
                  options={subOptions}
                  value={activeSub}
                  setValue={setActiveSub}
                  colors={sub.colors}
                  fallback={sub.fallback}
                  label={sub.label}
                  allLabel={sub.all}
                  accent={activeConfig.activeBg}
                  border={activeConfig.border}
                />
              )}
              {showStatus && (
                <FilterRow
                  options={statusOptions}
                  value={activeStatus}
                  setValue={setActiveStatus}
                  colors={statusFilterColors}
                  fallback={statusFilterFallback}
                  label={v => v}
                  allLabel="All"
                  accent={activeConfig.activeBg}
                  border={activeConfig.border}
                />
              )}
            </div>
          )}

          <div style={{ marginBottom: '0.75rem' }} />

          <div className="grid-sidebar" id="listing">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {filtered.length === 0
                ? <p style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: 14 }}>No entries with that filter yet.</p>
                : pageItems.map((item, idx) => <ItemCard key={item.id || idx} item={item} activeTag={activeTag} handleTag={handleTag} />)
              }

              {/* 📄 Pagination */}
              {totalPages > 1 && (
                <Pagination page={page} totalPages={totalPages} total={filtered.length} goToPage={goToPage} />
              )}
            </div>

            {/* Sidebar, with the featured book on top on desktop */}
            <div className="sidebar-sticky">
              {!isFiltered && featuredBook && (
                <div className="desktop-only" style={{ marginBottom: 12 }}>
                  <FeaturedMini book={featuredBook} />
                </div>
              )}
              <Sidebar reading={reading} search={search} setSearch={setSearch}
                activeTag={activeTag} allTags={allTags} handleTag={handleTag} />
            </div>
          </div>
        </div>

        {/* Affiliates: what I read with + my Amazon favorites */}
        <WhatIReadWith />
        <AmazonFavorites books={amazonFavorites} />

        <Newsletter />
        <Footer />
      </div>
    </>
  )
}

// 🏷️ One row of filter pills. The "All" button takes the active tab's
// color so the row feels part of the section.
function FilterRow({ options, value, setValue, colors, fallback, label, allLabel, accent, border }) {
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      <button
        onClick={() => setValue(null)}
        style={{
          padding: '6px 14px',
          borderRadius: 20,
          fontSize: 13,
          fontFamily: 'sans-serif',
          fontWeight: 500,
          border: `1px solid ${value === null ? accent : border}`,
          background: value === null ? accent : '#f0ece3',
          color: value === null ? '#fff' : '#7a6a50',
          cursor: 'pointer',
          transition: 'all 0.15s'
        }}>
        {allLabel}
      </button>
      {options.map(o => {
        const col = colors[o.key] || fallback
        const isActive = value === o.key
        return (
          <button key={o.key}
            onClick={() => setValue(prev => prev === o.key ? null : o.key)}
            style={{
              padding: '6px 14px',
              borderRadius: 20,
              fontSize: 13,
              fontFamily: 'sans-serif',
              fontWeight: 500,
              border: `1px solid ${isActive ? col.color : 'transparent'}`,
              background: isActive ? col.color : col.bg,
              color: isActive ? '#fff' : col.color,
              cursor: 'pointer',
              transition: 'all 0.15s'
            }}>
            {label(o.label)}
          </button>
        )
      })}
    </div>
  )
}

// ★ Featured book, compact version (mobile, above the favorites)
function FeaturedCard({ book }) {
  return (
    <Link href={`/resena/${book.slug}`} style={{ textDecoration: 'none' }}>
      <div className="featured-compact" style={{ margin: '1.5rem 0 1rem', background: 'var(--bg-sidebar)', border: '1px solid var(--border)', borderRadius: 12, padding: '1rem', display: 'grid', gridTemplateColumns: '90px 1fr', gap: 14, cursor: 'pointer', transition: 'opacity 0.15s' }}
        onMouseEnter={e => e.currentTarget.style.opacity = '0.92'}
        onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
        <img src={book.cover} alt={book.title}
          style={{ width: 90, height: 135, objectFit: 'cover', borderRadius: 6, border: '1px solid var(--border-warm)' }}
          onError={e => { e.target.style.background = 'var(--bg-tag)'; e.target.src = '' }} />
        <div>
          <span style={{ display: 'inline-block', background: 'var(--btn-bg)', color: '#fff', fontSize: 9, padding: '3px 10px', borderRadius: 20, fontFamily: 'sans-serif', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>★ Featured of the month</span>
          <h2 style={{ fontSize: 19, fontWeight: 700, margin: '0 0 3px', color: 'var(--text-dark)', lineHeight: 1.2 }}>{book.title}</h2>
          {book.series && <p style={{ fontSize: 12, color: '#9b7b5e', margin: '0 0 3px', fontFamily: 'sans-serif', fontStyle: 'italic' }}>{book.series}{book.seriesNumber ? ` · Book ${book.seriesNumber}` : ''}</p>}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0, fontFamily: 'sans-serif' }}>{book.author}</p>
            <Pill cat>{book.category}</Pill>
          </div>
          <Stars n={book.rating} size={14} />
          <p style={{ fontSize: 13, color: 'var(--text-body)', lineHeight: 1.6, margin: '8px 0 10px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{book.synopsis}</p>
          <span style={{ fontSize: 12, color: 'var(--text-accent)', fontFamily: 'sans-serif', fontWeight: 500 }}>Read the full review →</span>
        </div>
      </div>
    </Link>
  )
}

// ★ Featured book, mini version (desktop sidebar)
function FeaturedMini({ book }) {
  return (
    <Link href={`/resena/${book.slug}`} style={{ textDecoration: 'none' }}>
      <div style={{ background: 'var(--bg-sidebar)', border: '1px solid var(--border)', borderRadius: 12, padding: '0.9rem', cursor: 'pointer', transition: 'opacity 0.15s' }}
        onMouseEnter={e => e.currentTarget.style.opacity = '0.92'}
        onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
        <span style={{ display: 'inline-block', background: 'var(--btn-bg)', color: '#fff', fontSize: 9, padding: '3px 9px', borderRadius: 20, fontFamily: 'sans-serif', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>★ Featured of the month</span>
        <div style={{ display: 'flex', gap: 10 }}>
          <img src={book.cover} alt={book.title}
            style={{ width: 54, height: 81, objectFit: 'cover', borderRadius: 5, border: '1px solid var(--border-warm)', flexShrink: 0 }}
            onError={e => { e.target.style.background = 'var(--bg-tag)'; e.target.src = '' }} />
          <div style={{ minWidth: 0 }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-dark)', margin: '0 0 3px', lineHeight: 1.25, fontFamily: 'Georgia,serif', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{book.title}</p>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '0 0 4px', fontFamily: 'sans-serif' }}>{book.author}</p>
            <Stars n={book.rating} size={12} />
          </div>
        </div>
        <p style={{ fontSize: 11, color: 'var(--text-accent)', margin: '10px 0 0', fontFamily: 'sans-serif', fontWeight: 500 }}>Read the review →</p>
      </div>
    </Link>
  )
}

// ★ Favorites carousel: moves on its own on desktop, swipes on mobile
function FavoritesRow({ books }) {
  const Cover = ({ book, dup }) => (
    <Link href={`/resena/${book.slug}`} className="fav-cover" style={{ textDecoration: 'none' }} tabIndex={dup ? -1 : 0}>
      <img src={book.cover} alt={dup ? '' : book.title}
        style={{ width: '100%', aspectRatio: '2/3', objectFit: 'cover', borderRadius: 6, border: '1px solid var(--border-warm)', display: 'block' }}
        onError={e => { e.target.style.background = 'var(--bg-tag)'; e.target.src = '' }} />
      <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-dark)', margin: '6px 0 2px', lineHeight: 1.25, fontFamily: 'Georgia,serif', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{book.title}</p>
      <p style={{ fontSize: 10, color: 'var(--text-accent)', margin: 0, fontFamily: 'sans-serif' }}>{'★'.repeat(Math.floor(Number(book.rating) || 0))}</p>
    </Link>
  )
  return (
    <div style={{ margin: '1.5rem 0' }}>
      <p style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-muted)', margin: '0 0 12px', fontFamily: 'sans-serif' }}>★ My favorites</p>
      <div className="fav-marquee">
        <div className="fav-track">
          <div className="fav-group">
            {books.map(book => <Cover key={book.id} book={book} />)}
          </div>
          <div className="fav-group fav-dup" aria-hidden="true">
            {books.map(book => <Cover key={'dup-' + book.id} book={book} dup />)}
          </div>
        </div>
      </div>
    </div>
  )
}

function ItemCard({ item, activeTag, handleTag }) {
  if (item.type === 'review') {
    // The category already shows as a pill, so it is not repeated as a tag
    const cat = String(item.category || '').trim().toLowerCase()
    const tags = tagList(item).filter(t => t.trim().toLowerCase() !== cat)
    return (
      <Link href={`/resena/${item.slug}`} style={{ textDecoration: 'none' }}>
        <div className="card" style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: 14, borderLeft: `4px solid ${bookAccent}`, borderRadius: 12 }}>
          <img src={item.cover} alt={item.title}
            style={{ width: 80, height: 115, objectFit: 'cover', borderRadius: 6, border: '1px solid var(--border-warm)' }}
            onError={e => { e.target.style.background = 'var(--bg-tag)'; e.target.src = '' }} />
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 2px', color: 'var(--text-dark)' }}>{item.title}</h3>
            {item.series && <p style={{ fontSize: 11, color: '#9b7b5e', margin: '0 0 2px', fontFamily: 'sans-serif', fontStyle: 'italic' }}>{item.series}{item.seriesNumber ? ` · Book ${item.seriesNumber}` : ''}</p>}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0, fontFamily: 'sans-serif' }}>{item.author}</p>
              <Pill cat>{item.category}</Pill>
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
    const tags = tagList(item)
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 5 }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                {tags.map(tag => (
                  <span key={tag} onClick={e => { e.preventDefault(); handleTag(tag) }}
                    style={{ fontSize: 11, padding: '2px 9px', borderRadius: 20, fontFamily: 'sans-serif', cursor: 'pointer',
                      border: '1px solid var(--v-border)', background: activeTag === tag ? 'var(--btn-bg)' : '#fff',
                      color: activeTag === tag ? '#fff' : 'var(--v-accent)' }}>
                    {tag}
                  </span>
                ))}
              </div>
              <span style={{ fontSize: 12, color: 'var(--v-accent)', fontFamily: 'sans-serif', whiteSpace: 'nowrap' }}>Read more →</span>
            </div>
          </div>
        </div>
      </Link>
    )
  }

  if (item.type === 'corner') {
    const et = entryTypes[item.entryType] || entryTypes.reflection
    const images = Array.isArray(item.images)
      ? item.images
      : (item.image || '').split('|').map(s => s.trim()).filter(Boolean)
    // A List with 2 or more images in "Image URL" shows the row of small covers.
    // With 0 or 1 image it looks like any other Corner entry.
    const isList = item.entryType === 'list' && images.length >= 2
    const cornerImg = !isList && images.length > 0 ? images[0] : null
    const pillLabel = isList ? `${et.label} · ${images.length} books` : et.label
    const tags = tagList(item)
    return (
      <Link href={`/rincon/${item.slug}`} style={{ textDecoration: 'none' }}>
        <div style={{ background: et.bg, border: `1px solid ${et.border}`, borderLeft: `4px solid ${et.color}`, borderRadius: 12, padding: '1rem', cursor: 'pointer',
          display: 'grid', gridTemplateColumns: cornerImg ? '80px 1fr' : '1fr', gap: 14, transition: 'opacity 0.15s' }}
          onMouseEnter={e => e.currentTarget.style.opacity = '0.85'} onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
          {cornerImg && <img src={cornerImg} alt={item.title} style={{ width: 80, height: 115, objectFit: 'cover', borderRadius: 6, border: `1px solid ${et.border}` }} />}
          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
              <Pill bg="#fff" color={et.color} border={et.border}>{pillLabel}</Pill>
              <span style={{ fontSize: 11, color: et.color, fontFamily: 'sans-serif', opacity: 0.8 }}>The Corner</span>
            </div>
            <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 6px', color: 'var(--text-dark)' }}>{item.title}</h3>
            <p style={{ fontSize: 13, color: 'var(--text-body)', lineHeight: 1.65, margin: '0 0 10px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', fontStyle: item.entryType === 'quote' ? 'italic' : 'normal' }}>{item.preview}</p>

            {/* 📚 Row of small numbered covers */}
            {isList && (
              <div style={{ display: 'flex', gap: 6, margin: '0 0 12px', overflowX: 'auto' }}>
                {images.slice(0, 8).map((img, i) => (
                  <div key={i} style={{ flexShrink: 0, position: 'relative' }}>
                    <img src={img} alt={`${item.title}, book ${i + 1}`} loading="lazy"
                      style={{ width: 44, height: 64, objectFit: 'cover', borderRadius: 4, border: `1px solid ${et.border}`, display: 'block' }}
                      onError={e => { e.target.style.background = '#fff'; e.target.src = '' }} />
                    <span style={{ position: 'absolute', top: 2, left: 2, background: et.color, color: '#fff', fontSize: 9, fontFamily: 'sans-serif', borderRadius: 3, padding: '1px 4px', fontWeight: 700 }}>{i + 1}</span>
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 5 }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                {tags.map(tag => (
                  <span key={tag} onClick={e => { e.preventDefault(); handleTag(tag) }}
                    style={{ fontSize: 11, padding: '2px 9px', borderRadius: 20, fontFamily: 'sans-serif', cursor: 'pointer',
                      border: `1px solid ${et.border}`, background: activeTag === tag ? 'var(--btn-bg)' : '#fff',
                      color: activeTag === tag ? '#fff' : et.color }}>
                    {tag}
                  </span>
                ))}
              </div>
              <span style={{ fontSize: 12, color: et.color, fontFamily: 'sans-serif', whiteSpace: 'nowrap' }}>{isList ? 'See the list →' : 'Read more →'}</span>
            </div>
          </div>
        </div>
      </Link>
    )
  }

  // Reading order — 🌌 lavender style (connects with universes)
  if (item.type === 'order') {
    const tropes = Array.isArray(item.tropes) ? item.tropes : []
    return (
      <Link href={`/orden/${item.slug}`} style={{ textDecoration: 'none' }}>
        <div style={{
          background: orderColors.bg,
          border: `1px solid ${orderColors.border}`,
          borderLeft: `4px solid ${orderColors.accent}`,
          borderRadius: 12,
          cursor: 'pointer',
          transition: 'opacity 0.15s'
        }}
        onMouseEnter={e => e.currentTarget.style.opacity = '0.88'}
        onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
          <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: 14, padding: '1rem' }}>
            {item.sagaCover
              ? <img src={item.sagaCover} alt={item.title} style={{ width: 80, height: 115, objectFit: 'cover', borderRadius: 6, border: `1px solid ${orderColors.border}` }}
                  onError={e => { e.target.style.background = orderColors.tagBg; e.target.src = '' }} />
              : <div style={{ width: 80, height: 115, borderRadius: 6, background: orderColors.tagBg, border: `1px solid ${orderColors.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>📚</div>
            }
            <div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 6 }}>
                {item.category && (
                  <span style={{ fontSize: 11, padding: '2px 9px', borderRadius: 20, fontFamily: 'sans-serif', background: orderColors.pillBg, color: orderColors.accent, border: `1px solid ${orderColors.border}` }}>
                    {item.category}
                  </span>
                )}
                <span style={{ fontSize: 11, padding: '2px 9px', borderRadius: 20, fontFamily: 'sans-serif', background: orderColors.pillBg, color: orderColors.accent, border: `1px solid ${orderColors.border}` }}>
                  {item.numBooks} books
                </span>
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 2px', color: orderColors.accentDark }}>{item.title}</h3>
              <p style={{ fontSize: 12, color: orderColors.accent, margin: '0 0 4px', fontFamily: 'sans-serif', fontStyle: 'italic' }}>{item.author}</p>
              {item.couple && <p style={{ fontSize: 12, color: orderColors.accent, margin: '0 0 6px', fontFamily: 'sans-serif', opacity: 0.85 }}>💕 {item.couple}</p>}
              <p style={{ fontSize: 13, color: 'var(--text-body)', lineHeight: 1.6, margin: '0 0 8px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{item.description}</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {tropes.slice(0, 3).map(t => (
                    <span key={t} style={{ fontSize: 11, padding: '2px 9px', borderRadius: 20, fontFamily: 'sans-serif', background: orderColors.tagBg, color: orderColors.accent, border: `1px solid ${orderColors.border}` }}>
                      {t}
                    </span>
                  ))}
                </div>
                <span style={{ fontSize: 12, color: orderColors.accent, fontFamily: 'sans-serif', whiteSpace: 'nowrap', fontWeight: 500 }}>See order →</span>
              </div>
            </div>
          </div>
        </div>
      </Link>
    )
  }

  return null
}

// 📄 Pagination — ‹ 1 2 3 … › buttons
function Pagination({ page, totalPages, total, goToPage }) {
  const pages = useMemo(() => {
    const out = []
    const push = p => { if (!out.includes(p)) out.push(p) }
    push(1)
    for (let p = page - 1; p <= page + 1; p++) if (p > 1 && p < totalPages) push(p)
    push(totalPages)
    out.sort((a, b) => a - b)
    // Insert "…" where there are gaps
    const withGaps = []
    out.forEach((p, i) => {
      if (i > 0 && p - out[i - 1] > 1) withGaps.push('…')
      withGaps.push(p)
    })
    return withGaps
  }, [page, totalPages])

  const baseBtn = {
    minWidth: 34,
    height: 34,
    padding: '0 10px',
    borderRadius: 8,
    fontSize: 13,
    fontFamily: 'sans-serif',
    border: '1px solid var(--border)',
    background: 'transparent',
    color: 'var(--text-body)',
    cursor: 'pointer',
    transition: 'all 0.15s'
  }

  return (
    <div style={{ marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border)' }}>
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
        <button onClick={() => goToPage(page - 1)} disabled={page === 1}
          style={{ ...baseBtn, opacity: page === 1 ? 0.35 : 1, cursor: page === 1 ? 'default' : 'pointer' }}>
          ‹ Previous
        </button>

        {pages.map((p, i) =>
          p === '…'
            ? <span key={`gap-${i}`} style={{ color: 'var(--text-muted)', fontSize: 13, padding: '0 4px', fontFamily: 'sans-serif' }}>…</span>
            : (
              <button key={p} onClick={() => goToPage(p)}
                style={{
                  ...baseBtn,
                  fontWeight: p === page ? 700 : 400,
                  background: p === page ? 'var(--btn-bg)' : 'transparent',
                  color: p === page ? '#fff' : 'var(--text-body)',
                  borderColor: p === page ? 'var(--btn-bg)' : 'var(--border)'
                }}>
                {p}
              </button>
            )
        )}

        <button onClick={() => goToPage(page + 1)} disabled={page === totalPages}
          style={{ ...baseBtn, opacity: page === totalPages ? 0.35 : 1, cursor: page === totalPages ? 'default' : 'pointer' }}>
          Next ›
        </button>
      </div>

      <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-muted)', fontFamily: 'sans-serif', margin: '10px 0 0' }}>
        Page {page} of {totalPages} · {total} {total === 1 ? 'entry' : 'entries'} in total
      </p>
    </div>
  )
}

// ─── Affiliates ───────────────────────────────────────────────────────────────
// Products in "What I read with". These links don't come from Notion, so
// lib/notion.js doesn't tag them: the tag is added here.
// deal: true shows the "Black Friday deal" label. No price, per the Amazon
// Associates rules. When the deal ends, set it to false.
const AMAZON_TAG = 'entreletrasym-20'
const withTag = asin => `https://www.amazon.com/dp/${asin}?tag=${AMAZON_TAG}`

const READING_GEAR = [
  { name: 'Kindle Colorsoft', asin: 'B0CX8MT2M2', deal: true,
    line: 'Where I read every one of these stories, with the covers in color.' },
  { name: 'Clear case', asin: 'B0FHHJQ68J', deal: false,
    line: 'Protects it without hiding the pretty part, and shows off the stickers.' },
  { name: 'Stickers to decorate it', asin: 'B0FVL5DWLV', deal: false,
    line: 'So my Kindle looks like me.' },
]

const amazonBtn = {
  fontFamily: 'sans-serif', fontSize: 13, fontWeight: 500, textDecoration: 'none', textAlign: 'center',
  padding: '10px 14px', borderRadius: 8, background: '#fff8e7', border: '1px solid #f0c060', color: '#8a5a00',
}
const sectionLabel = { margin: 0, fontFamily: 'sans-serif', fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase' }

function WhatIReadWith() {
  return (
    <section aria-labelledby="gear-title" style={{ margin: '2rem 0 0', background: 'var(--bg-dark)', borderRadius: 14, padding: '26px 24px', display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <p style={{ ...sectionLabel, color: 'var(--text-lighter)' }}>Affiliates</p>
        <h2 id="gear-title" style={{ margin: 0, fontSize: 23, fontWeight: 'normal', color: 'var(--text-light)' }}>What I read with</h2>
        <p style={{ margin: 0, fontSize: 15, fontStyle: 'italic', color: '#c9d3c2' }}>My Kindle and what I added to make it mine.</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(240px, 100%), 1fr))', gap: 14 }}>
        {READING_GEAR.map(p => (
          <article key={p.asin} style={{ background: '#343b32', border: '1px solid #454e42', borderRadius: 12, padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {p.deal && (
              <span style={{ alignSelf: 'flex-start', fontFamily: 'sans-serif', fontSize: 10, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', padding: '4px 8px', borderRadius: 4, background: '#b3263a', color: '#fff' }}>
                Black Friday deal
              </span>
            )}
            <h3 style={{ margin: 0, fontSize: 17, fontWeight: 'normal', color: 'var(--text-light)' }}>{p.name}</h3>
            <p style={{ margin: 0, fontSize: 14, fontStyle: 'italic', lineHeight: 1.4, color: '#c9d3c2', flex: 1 }}>{p.line}</p>
            <a href={withTag(p.asin)} target="_blank" rel="sponsored noopener noreferrer" style={{ ...amazonBtn, alignSelf: 'flex-start', marginTop: 4 }}>
              See on Amazon
            </a>
          </article>
        ))}
      </div>
    </section>
  )
}

function AmazonFavorites({ books }) {
  if (!books || !books.length) return null
  return (
    <section aria-labelledby="amazon-favs-title" style={{ margin: '1.5rem 0 2rem', background: '#f7f6f3', border: '1px solid #e4e0d6', borderRadius: 14, padding: '26px 24px 20px', display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <p style={{ ...sectionLabel, color: 'var(--text-accent)' }}>Affiliates</p>
        <h2 id="amazon-favs-title" style={{ margin: 0, fontSize: 23, fontWeight: 'normal', color: 'var(--text-dark)' }}>My Amazon favorites</h2>
        <p style={{ margin: 0, fontSize: 15, fontStyle: 'italic', color: 'var(--text-body)' }}>My all-time five stars, ready to take home.</p>
      </div>
      {/* 4 books in one row on desktop; 2x2 on phones. */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, max(150px, 22%)), 1fr))', gap: 12 }}>
        {books.map(book => (
          <article key={book.id} style={{ background: 'var(--bg-card)', border: '1px solid #e4e0d6', borderRadius: 12, padding: 12, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, textAlign: 'center' }}>
            {book.cover && (
              <img src={book.cover} alt={book.title} loading="lazy"
                style={{ width: 96, height: 144, objectFit: 'cover', borderRadius: 6, marginBottom: 4, boxShadow: '0 2px 6px rgba(37,46,35,0.18)' }} />
            )}
            {book.category && <Pill cat>{book.category}</Pill>}
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 'normal', lineHeight: 1.25, color: 'var(--text-dark)' }}>{book.title}</h3>
            <p style={{ margin: 0, fontFamily: 'sans-serif', fontSize: 12, color: '#305435' }}>{book.author}</p>
            {book.rating ? <Stars n={book.rating} /> : null}
            <a href={book.amazonLink} target="_blank" rel="sponsored noopener noreferrer" style={{ ...amazonBtn, alignSelf: 'stretch', marginTop: 'auto', padding: '9px 10px' }}>
              See on Amazon
            </a>
            <Link href={`/resena/${book.slug}`} style={{ fontFamily: 'sans-serif', fontSize: 12, color: 'var(--text-body)', textDecoration: 'underline', textUnderlineOffset: 3, padding: '8px 4px 2px' }}>
              My review
            </Link>
          </article>
        ))}
      </div>
      <p style={{ margin: 0, textAlign: 'center', fontFamily: 'sans-serif', fontSize: 11, color: '#6b7d64' }}>
        Affiliate links: if you buy through them, I earn a small commission at no extra cost to you.
      </p>
    </section>
  )
}

export async function getStaticProps() {
  const { books, comics, corner, reading, orders } = await getAll()
  // 4 random favorites that have an Amazon link. Picked here (not in the
  // browser) so the server and the page show the same books. They change
  // every time the site regenerates.
  const candidates = books.filter(b => b.favorite && b.amazonLink)
  for (let i = candidates.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[candidates[i], candidates[j]] = [candidates[j], candidates[i]]
  }
  const amazonFavorites = candidates.slice(0, 4)
  return {
    props: { books, comics, corner, reading, orders, amazonFavorites },
    revalidate: 60,
  }
}
