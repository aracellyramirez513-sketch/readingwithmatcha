import { Client } from '@notionhq/client'

const notion = new Client({ auth: process.env.NOTION_TOKEN })

function slugify(str) {
  return (str || '')
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function dedup(items) {
  const seen = new Set()
  return items.filter(item => {
    if (seen.has(item.id)) return false
    seen.add(item.id)
    return true
  })
}

function getProp(page, name) {
  const prop = page.properties[name]
  if (!prop) return ''
  switch (prop.type) {
    case 'title':        return prop.title.map(t => t.plain_text).join('')
    case 'rich_text':   return prop.rich_text.map(t => t.plain_text).join('')
    case 'number':      return prop.number ?? ''
    case 'select':      return prop.select?.name ?? ''
    case 'multi_select':return prop.multi_select.map(s => s.name)
    case 'checkbox':    return prop.checkbox
    case 'url':         return prop.url ?? ''
    case 'date':        return prop.date?.start ?? ''
    case 'relation':    return prop.relation.map(r => r.id)
    case 'created_time':return prop.created_time
    case 'last_edited_time': return prop.last_edited_time
    default:            return ''
  }
}

// ─── BOOKS ──────────────────────────────────────────────────────────────────

export async function getBooks() {
  try {
    const res = await notion.databases.query({
      database_id: process.env.NOTION_DB_BOOKS,
      filter: { property: 'Published', checkbox: { equals: true } },
      sorts: [{ property: 'Publication date', direction: 'descending' }],
    })
    return dedup(res.results.map(mapBook))
  } catch(e) { return [] }
}

export async function getBook(slug) {
  const books = await getBooks()
  return books.find(b => b.slug === slug) || null
}

function mapBook(page) {
  const title = getProp(page, 'Title')
  return {
    id: page.id,
    type: 'review',
    title,
    author:       getProp(page, 'Author'),
    category:     getProp(page, 'Category'),
    series:       getProp(page, 'Series'),
    seriesNumber: getProp(page, 'Series number'),
    rating:       getProp(page, 'Rating'),
    cover:        getProp(page, 'Cover URL'),
    synopsis:     getProp(page, 'Synopsis'),
    review:       getProp(page, 'Review'),
    tropes:       getProp(page, 'Tropes'),
    forWhom:      getProp(page, 'For whom'),
    tags:         getProp(page, 'Tags'),
    featured:     getProp(page, 'Featured'),
    favorite:     getProp(page, 'Favorite'),
    protagonist1Name: getProp(page, 'Protagonist 1 name'),
    protagonist1Role: getProp(page, 'Protagonist 1 role'),
    protagonist1Desc: getProp(page, 'Protagonist 1 description'),
    protagonist1Tags: getProp(page, 'Protagonist 1 tags'),
    protagonist2Name: getProp(page, 'Protagonist 2 name'),
    protagonist2Role: getProp(page, 'Protagonist 2 role'),
    protagonist2Desc: getProp(page, 'Protagonist 2 description'),
    protagonist2Tags: getProp(page, 'Protagonist 2 tags'),
    protagonist3Name: getProp(page, 'Protagonist 3 name'),
    protagonist3Role: getProp(page, 'Protagonist 3 role'),
    protagonist3Desc: getProp(page, 'Protagonist 3 description'),
    protagonist3Tags: getProp(page, 'Protagonist 3 tags'),
    amazonLink:   getProp(page, 'Amazon link'),
    date:         getProp(page, 'Publication date'),
    slug:         getProp(page, 'Slug') || slugify(title),
  }
}

// ─── COMICS ─────────────────────────────────────────────────────────────────

export async function getComics() {
  try {
    const res = await notion.databases.query({
      database_id: process.env.NOTION_DB_COMICS,
      filter: { property: 'Published', checkbox: { equals: true } },
      sorts: [{ property: 'Publication date', direction: 'descending' }],
    })
    return dedup(res.results.map(mapComic))
  } catch(e) { return [] }
}

export async function getComic(slug) {
  const items = await getComics()
  return items.find(v => v.slug === slug) || null
}

function mapComic(page) {
  const title = getProp(page, 'Title')
  return {
    id: page.id,
    type: 'comic',
    title,
    comicType:  getProp(page, 'Type')?.toLowerCase(),
    author:     getProp(page, 'Author'),
    genre:      getProp(page, 'Genre'),
    platform:   getProp(page, 'Platform'),
    status:     getProp(page, 'Status'),
    rating:     getProp(page, 'Rating'),
    cover:      getProp(page, 'Cover URL'),
    synopsis:   getProp(page, 'Synopsis'),
    review:     getProp(page, 'Review'),
    tags:       getProp(page, 'Tags'),
    buyLink:    getProp(page, 'Purchase link'),
    date:       getProp(page, 'Publication date'),
    slug:       getProp(page, 'Slug') || slugify(title),
  }
}

// ─── CORNER ─────────────────────────────────────────────────────────────────

export async function getCorner() {
  try {
    const res = await notion.databases.query({
      database_id: process.env.NOTION_DB_CORNER,
      filter: { property: 'Published', checkbox: { equals: true } },
      sorts: [{ property: 'Publication date', direction: 'descending' }],
    })
    return dedup(res.results.map(mapPost))
  } catch(e) { return [] }
}

export async function getPost(slug) {
  const items = await getCorner()
  return items.find(p => p.slug === slug) || null
}

function mapPost(page) {
  const title = getProp(page, 'Title')
  return {
    id: page.id,
    type: 'corner',
    title,
    entryType: getProp(page, 'Entry type')?.toLowerCase() || 'reflection',
    preview:   getProp(page, 'Preview'),
    content:   getProp(page, 'Full content'),
    image:     getProp(page, 'Image URL'),
    tags:      getProp(page, 'Tags'),
    date:      getProp(page, 'Publication date'),
    slug:      getProp(page, 'Slug') || slugify(title),
  }
}

// ─── CURRENTLY READING ───────────────────────────────────────────────────────

export async function getCurrentlyReading() {
  try {
    const res = await notion.databases.query({
      database_id: process.env.NOTION_DB_READING,
      filter: { property: 'Active', checkbox: { equals: true } },
    })
    return res.results.map(page => ({
      id: page.id,
      title:  getProp(page, 'Title'),
      author: getProp(page, 'Author'),
      cover:  getProp(page, 'Cover URL'),
    }))
  } catch(e) { return [] }
}

// ─── SERIES BOOKS ───────────────────────────────────────────────────────────

export async function getSeriesBooks() {
  try {
    const res = await notion.databases.query({
      database_id: process.env.NOTION_DB_SERIES_BOOKS,
      filter: { property: 'Published', checkbox: { equals: true } },
    })
    return dedup(res.results.map(mapSeriesBook))
  } catch(e) { return [] }
}

function mapSeriesBook(page) {
  const title = getProp(page, 'Title')
  return {
    id: page.id,
    title,
    author:        getProp(page, 'Author'),
    seriesName:    getProp(page, 'Series name'),
    number:        getProp(page, 'Book number'),
    cover:         getProp(page, 'Cover URL'),
    synopsis:      getProp(page, 'Short synopsis'),
    protagonists:  getProp(page, 'Protagonists'),
    tropes:        getProp(page, 'Book tropes'),
    standalone:    getProp(page, 'Standalone'),
    warnings:      getProp(page, 'Content warnings'),
    rating:        getProp(page, 'Rating'),
    amazonLink:    getProp(page, 'Amazon link'),
    reviewIds:     getProp(page, 'Full review'), // array of IDs
    seriesIds:     getProp(page, 'Series'),       // array of IDs
  }
}

// ─── UNIVERSES ──────────────────────────────────────────────────────────────

export async function getUniverses() {
  try {
    const res = await notion.databases.query({
      database_id: process.env.NOTION_DB_UNIVERSES,
      filter: { property: 'Published', checkbox: { equals: true } },
    })
    return dedup(res.results.map(mapUniverse))
  } catch(e) { return [] }
}

export async function getUniverse(slug) {
  const items = await getUniverses()
  return items.find(u => u.slug === slug) || null
}

function mapUniverse(page) {
  const name = getProp(page, 'Name')
  return {
    id: page.id,
    name,
    author:       getProp(page, 'Author'),
    authorImage:  getProp(page, 'Author image'),
    description:  getProp(page, 'Short description'),
    mainTropes:   getProp(page, 'Main tropes'),
    slug:         getProp(page, 'Slug') || slugify(name),
  }
}

// ─── READING ORDERS ──────────────────────────────────────────────────────────

export async function getOrders() {
  try {
    const res = await notion.databases.query({
      database_id: process.env.NOTION_DB_ORDERS,
      filter: { property: 'Published', checkbox: { equals: true } },
      sorts: [{ property: 'Publication date', direction: 'descending' }],
    })
    return dedup(res.results.map(mapOrder))
  } catch(e) { return [] }
}

export async function getOrder(slug) {
  const orders = await getOrders()
  const order = orders.find(o => o.slug === slug)
  if (!order) return null

  // Resolve universe + series books + connected reviews in one shot
  const [universes, seriesBooks, books] = await Promise.all([
    getUniverses(),
    getSeriesBooks(),
    getBooks(),
  ])

  const universe = order.universeIds?.[0]
    ? universes.find(u => u.id === order.universeIds[0]) || null
    : null

  const seriesBooksResolved = (order.seriesBookIds || [])
    .map(id => seriesBooks.find(sb => sb.id === id))
    .filter(Boolean)
    .map(sb => {
      // Try to find matching review for this book
      const reviewId = sb.reviewIds?.[0]
      const matchedReview = reviewId ? books.find(b => b.id === reviewId) : null
      return {
        ...sb,
        reviewSlug: matchedReview?.slug || null,
      }
    })
    .sort((a, b) => (a.number || 0) - (b.number || 0))

  return { ...order, universe, seriesBooks: seriesBooksResolved }
}

function mapOrder(page) {
  const title = getProp(page, 'Saga title')
  return {
    id: page.id,
    type: 'order',
    title,
    author:        getProp(page, 'Author'),
    category:      getProp(page, 'Category'),
    description:   getProp(page, 'Short description'),
    tropes:        getProp(page, 'Tropes'),
    couple:        getProp(page, 'Main couple'),
    sagaCover:     getProp(page, 'Saga cover image'),
    numBooks:      getProp(page, 'Number of books'),
    orderType:     getProp(page, 'Order type'),
    status:        getProp(page, 'Series status'),
    orderNotes:    getProp(page, 'Order notes'),
    universeIds:   getProp(page, 'Universe'),
    seriesBookIds: getProp(page, 'Series books'),
    tags:          getProp(page, 'Tags'),
    date:          getProp(page, 'Publication date'),
    slug:          getProp(page, 'Slug') || slugify(title),
  }
}

// ─── ALL TOGETHER (home) ─────────────────────────────────────────────────────

export async function getAll() {
  const [books, comics, corner, reading, orders, universes] = await Promise.all([
    getBooks(), getComics(), getCorner(), getCurrentlyReading(), getOrders(), getUniverses()
  ])

  // Enrich orders with their universe for the home feed (quick badge/link access)
  const ordersEnriched = orders.map(o => {
    const universe = o.universeIds?.[0]
      ? universes.find(u => u.id === o.universeIds[0]) || null
      : null
    return { ...o, universe }
  })

  return { books, comics, corner, reading, orders: ordersEnriched, universes }
}
