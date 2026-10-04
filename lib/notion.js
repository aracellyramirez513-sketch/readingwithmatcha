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

// Notion never returns more than 100 rows per call. When there are more,
// it sends has_more and a cursor. This keeps asking until it has them all.
async function queryAll(params) {
  const pages = []
  let cursor = undefined
  let rounds = 0

  do {
    const res = await notion.databases.query({
      ...params,
      page_size: 100,
      ...(cursor ? { start_cursor: cursor } : {}),
    })
    pages.push(...res.results)
    cursor = res.has_more ? res.next_cursor : null
    rounds++
  } while (cursor && rounds < 50)

  return pages
}

// In-memory cache, same length as the pages' revalidate.
// Stops one build from firing the same query dozens of times.
const CACHE_TTL = 60 * 1000
const cache = new Map()

async function cached(key, fn) {
  const saved = cache.get(key)
  if (saved && Date.now() - saved.t < CACHE_TTL) return saved.v
  const v = await fn()
  cache.set(key, { t: Date.now(), v })
  return v
}

// Splits a text property holding several links joined with "|"
function splitImages(str) {
  return String(str || '')
    .split('|')
    .map(s => s.trim())
    .filter(Boolean)
}

// ─── PAGE BODY (blocks) ─────────────────────────────────────────────────────
// Reads what is written INSIDE a Notion page (not its properties) and turns it
// into a simple format the post page can draw.
// Types read: paragraph, headings 1/2/3, lists, quote, callout, image,
// bookmark, link preview and divider. Everything else is ignored.

function mapText(richText) {
  return (richText || []).map(t => ({
    text:      t.plain_text || '',
    link:      t.href || null,
    bold:      !!t.annotations?.bold,
    italic:    !!t.annotations?.italic,
    underline: !!t.annotations?.underline,
    strike:    !!t.annotations?.strikethrough,
    code:      !!t.annotations?.code,
  }))
}

const TEXT_TYPES = [
  'paragraph',
  'heading_1',
  'heading_2',
  'heading_3',
  'bulleted_list_item',
  'numbered_list_item',
  'quote',
  'callout',
]

function mapBlock(b) {
  const type = b.type
  const data = b[type] || {}

  if (TEXT_TYPES.includes(type)) {
    const block = { id: b.id, type, text: mapText(data.rich_text) }
    if (type === 'callout' && data.icon?.type === 'emoji') block.icon = data.icon.emoji
    return block
  }

  if (type === 'image') {
    // "external" = pasted link (ibb.co). "file" = uploaded straight to Notion,
    // whose link expires in an hour. It is flagged so it can be warned about.
    const url = data.type === 'external' ? data.external?.url : data.file?.url
    if (!url) return null
    return {
      id: b.id,
      type: 'image',
      url,
      caption: mapText(data.caption),
      uploaded: data.type === 'file',
    }
  }

  if (type === 'bookmark' || type === 'link_preview') {
    if (!data.url) return null
    return { id: b.id, type: 'bookmark', url: data.url, caption: mapText(data.caption) }
  }

  if (type === 'divider') return { id: b.id, type: 'divider' }

  return null
}

export async function getBlocks(pageId) {
  if (!pageId) return []
  return cached('blocks:' + pageId, async () => {
    try {
      const blocks = []
      let cursor = undefined
      let rounds = 0

      do {
        const res = await notion.blocks.children.list({
          block_id: pageId,
          page_size: 100,
          ...(cursor ? { start_cursor: cursor } : {}),
        })
        blocks.push(...res.results)
        cursor = res.has_more ? res.next_cursor : null
        rounds++
      } while (cursor && rounds < 20)

      return blocks.map(mapBlock).filter(Boolean)
    } catch (e) {
      // If it fails, the post still shows using "Full content"
      return []
    }
  })
}

// ─── BOOKS ──────────────────────────────────────────────────────────────────

export async function getBooks() {
  return cached('books', async () => {
    try {
      const pages = await queryAll({
        database_id: process.env.NOTION_DB_BOOKS,
        filter: { property: 'Published', checkbox: { equals: true } },
        sorts: [{ property: 'Publication date', direction: 'descending' }],
      })
      return dedup(pages.map(mapBook))
    } catch (e) { return [] }
  })
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
    seriesBookIds: getProp(page, 'Series book') || [],
  }
}

// ─── COMICS ─────────────────────────────────────────────────────────────────

export async function getComics() {
  return cached('comics', async () => {
    try {
      const pages = await queryAll({
        database_id: process.env.NOTION_DB_COMICS,
        filter: { property: 'Published', checkbox: { equals: true } },
        sorts: [{ property: 'Publication date', direction: 'descending' }],
      })
      return dedup(pages.map(mapComic))
    } catch (e) { return [] }
  })
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
  return cached('corner', async () => {
    try {
      const pages = await queryAll({
        database_id: process.env.NOTION_DB_CORNER,
        filter: { property: 'Published', checkbox: { equals: true } },
        sorts: [{ property: 'Publication date', direction: 'descending' }],
      })
      return dedup(pages.map(mapPost))
    } catch (e) { return [] }
  })
}

// The home feed does not load page bodies, so it stays fast.
// Only a post's detail page reads its blocks.
export async function getPost(slug) {
  const items = await getCorner()
  const post = items.find(p => p.slug === slug) || null
  if (!post) return null
  const blocks = await getBlocks(post.id)
  return { ...post, blocks }
}

function mapPost(page) {
  const title = getProp(page, 'Title')
  const image = getProp(page, 'Image URL')
  return {
    id: page.id,
    type: 'corner',
    title,
    entryType: getProp(page, 'Entry type')?.toLowerCase() || 'reflection',
    preview:   getProp(page, 'Preview'),
    content:   getProp(page, 'Full content'),
    image,
    images:    splitImages(image),
    tags:      getProp(page, 'Tags'),
    date:      getProp(page, 'Publication date'),
    slug:      getProp(page, 'Slug') || slugify(title),
  }
}

// ─── CURRENTLY READING ───────────────────────────────────────────────────────

export async function getCurrentlyReading() {
  return cached('reading', async () => {
    try {
      const pages = await queryAll({
        database_id: process.env.NOTION_DB_READING,
        filter: { property: 'Active', checkbox: { equals: true } },
      })
      return pages.map(page => ({
        id: page.id,
        title:  getProp(page, 'Title'),
        author: getProp(page, 'Author'),
        cover:  getProp(page, 'Cover URL'),
      }))
    } catch (e) { return [] }
  })
}

// ─── SERIES BOOKS ───────────────────────────────────────────────────────────

export async function getSeriesBooks() {
  return cached('series-books', async () => {
    try {
      const pages = await queryAll({
        database_id: process.env.NOTION_DB_SERIES_BOOKS,
        filter: { property: 'Published', checkbox: { equals: true } },
      })
      return dedup(pages.map(mapSeriesBook))
    } catch (e) { return [] }
  })
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
  return cached('universes', async () => {
    try {
      const pages = await queryAll({
        database_id: process.env.NOTION_DB_UNIVERSES,
        filter: { property: 'Published', checkbox: { equals: true } },
      })
      return dedup(pages.map(mapUniverse))
    } catch (e) { return [] }
  })
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
  return cached('orders', async () => {
    try {
      const pages = await queryAll({
        database_id: process.env.NOTION_DB_ORDERS,
        filter: { property: 'Published', checkbox: { equals: true } },
        sorts: [{ property: 'Publication date', direction: 'descending' }],
      })
      return dedup(pages.map(mapOrder))
    } catch (e) { return [] }
  })
}

// Every order with its universe and its series books resolved, each book
// connected to its review when there is one.
async function getResolvedOrders() {
  return cached('orders-resolved', async () => {
    const [orders, universes, seriesBooks, books] = await Promise.all([
      getOrders(),
      getUniverses(),
      getSeriesBooks(),
      getBooks(),
    ])

    const universesById   = Object.fromEntries(universes.map(u => [u.id, u]))
    const seriesBooksById = Object.fromEntries(seriesBooks.map(sb => [sb.id, sb]))
    const booksById       = Object.fromEntries(books.map(b => [b.id, b]))

    return orders.map(order => {
      const universe = order.universeIds?.[0]
        ? universesById[order.universeIds[0]] || null
        : null

      const seriesBooksResolved = (order.seriesBookIds || [])
        .map(id => seriesBooksById[id])
        .filter(Boolean)
        .map(sb => {
          const reviewId = sb.reviewIds?.[0]
          const matchedReview = reviewId ? booksById[reviewId] : null
          return {
            ...sb,
            reviewSlug: matchedReview?.slug || null,
          }
        })
        .sort((a, b) => (Number(a.number) || 0) - (Number(b.number) || 0))

      return { ...order, universe, seriesBooks: seriesBooksResolved }
    })
  })
}

export async function getOrder(slug) {
  const orders = await getResolvedOrders()
  return orders.find(o => o.slug === slug) || null
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

// ─── SERIES CONTEXT ──────────────────────────────────────────────────────────
// Connects a review with the other reviews of the same series and with the
// matching reading order, when that order is published.

// Number('') is 0, so an empty book number used to look like book 0.
function toNumber(v) {
  if (v === '' || v === null || v === undefined) return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

function seriesKey(str) {
  return (str || '')
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/^\s*reading\s+order\s*(for|of)?\s*[-–—:]?\s*/, ' ')
    .replace(/^\s*orden\s+(para\s+leer|de\s+lectura)\s*[-–—:]?\s*/, ' ')
    .replace(/\b(the|a|an)\b/g, ' ')
    .replace(/\b(saga|series|serie|trilogy|duology)\b/g, ' ')
    .replace(/[^a-z0-9]+/g, '')
}

// Removes a "Reading order - " style prefix, so the review strip shows only
// the saga name.
function sagaTitle(str) {
  const clean = String(str || '')
    .replace(/^\s*Reading\s+order\s*(for|of)?\s*[-–—:]\s*/i, '')
    .replace(/^\s*Orden\s+(para\s+leer|de\s+lectura)\s*[-–—:]\s*/i, '')
    .trim()
  return clean || String(str || '')
}

const EMPTY_CONTEXT = {
  order: null,
  books: [],
  position: null,
  total: 0,
  previous: null,
  next: null,
}

export async function getSeriesContext(book) {
  if (!book) return EMPTY_CONTEXT

  const key = seriesKey(book.series)
  const relIds = Array.isArray(book.seriesBookIds) ? book.seriesBookIds : []
  if (!key && relIds.length === 0) return EMPTY_CONTEXT

  let orders = []
  let all = []
  try {
    ;[orders, all] = await Promise.all([getResolvedOrders(), getBooks()])
  } catch (e) {
    return EMPTY_CONTEXT
  }

  // 1. Find this series' reading order.
  // First through the "Series book" relation, a hard link that does not
  // depend on how the name is written. Text matching is only plan B.
  let order = null

  if (relIds.length > 0) {
    order = orders.find(o => (o.seriesBooks || []).some(sb => relIds.includes(sb.id))) || null
  }

  if (!order && key) {
    order = orders.find(o =>
      seriesKey(o.title) === key ||
      (o.seriesBooks || []).some(sb => seriesKey(sb.seriesName) === key)
    ) || null
  }

  // 2. Build the list of books in the series
  let books = []

  if (order && Array.isArray(order.seriesBooks) && order.seriesBooks.length > 0) {
    const bySlug = Object.fromEntries(all.map(b => [b.slug, b]))
    books = order.seriesBooks.map(sb => {
      const review = sb.reviewSlug ? bySlug[sb.reviewSlug] || null : null
      return {
        id:     sb.id,
        number: toNumber(sb.number),
        title:  (review && review.title) || sb.title || '',
        cover:  (review && review.cover) || sb.cover || '',
        slug:   review ? review.slug : null,
      }
    })
  } else {
    books = all
      .filter(b => seriesKey(b.series) === key)
      .sort((a, b) => (Number(a.seriesNumber) || 0) - (Number(b.seriesNumber) || 0))
      .map(b => ({
        id:     null,
        number: toNumber(b.seriesNumber),
        title:  b.title || '',
        cover:  b.cover || '',
        slug:   b.slug,
      }))
  }

  // 3. Find the current book in the list
  let idx = relIds.length > 0
    ? books.findIndex(b => b.id && relIds.includes(b.id))
    : -1

  if (idx === -1) {
    idx = books.findIndex(b => b.slug && b.slug === book.slug)
  }
  if (idx === -1 && toNumber(book.seriesNumber) !== null) {
    idx = books.findIndex(b => b.number === toNumber(book.seriesNumber))
  }
  if (idx === -1) {
    idx = books.findIndex(b => seriesKey(b.title) === seriesKey(book.title))
  }

  // If the order does not list this book yet, insert it in its place
  if (idx === -1) {
    const own = {
      id:     relIds.length > 0 ? relIds[0] : null,
      number: toNumber(book.seriesNumber),
      title:  book.title || '',
      cover:  book.cover || '',
      slug:   book.slug,
    }
    if (own.number !== null) {
      const pos = books.findIndex(b => b.number !== null && b.number > own.number)
      idx = pos === -1 ? books.length : pos
      books.splice(idx, 0, own)
    } else {
      idx = books.length
      books.push(own)
    }
  } else {
    // The current book always carries its review's slug and cover
    books[idx] = {
      ...books[idx],
      slug:  book.slug,
      cover: book.cover || books[idx].cover,
    }
  }

  // With a single book there is nothing to link
  if (books.length < 2 && !order) return EMPTY_CONTEXT

  // 4. Previous and next: the closest existing review in each direction
  let previous = null
  for (let i = idx - 1; i >= 0; i--) {
    if (books[i].slug) { previous = books[i]; break }
  }

  let next = null
  for (let i = idx + 1; i < books.length; i++) {
    if (books[i].slug) { next = books[i]; break }
  }

  const currentNumber = idx >= 0 ? books[idx].number : null
  const position = currentNumber !== null ? currentNumber : idx + 1
  const total = Math.max(books.length, position, Number(order?.numBooks) || 0)

  return {
    order: order ? { title: sagaTitle(order.title), slug: order.slug } : null,
    books: books.map((b, i) => ({ ...b, current: i === idx })),
    position,
    total,
    previous,
    next,
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
