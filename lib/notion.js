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
  const items = await getOrders()
  return items.find(o => o.slug === slug) || null
}

function mapOrder(page) {
  const title = getProp(page, 'Saga title')
  const parseList = val => (val || '').split('|').map(s => s.trim()).filter(Boolean)
  return {
    id: page.id,
    type: 'order',
    title,
    author:       getProp(page, 'Author'),
    category:     getProp(page, 'Category'),
    description:  getProp(page, 'Short description'),
    tropes:       getProp(page, 'Tropes'),
    couple:       getProp(page, 'Main couple'),
    sagaCover:    getProp(page, 'Saga cover image'),
    bookImages:   parseList(getProp(page, 'Book images')),
    bookTitles:   parseList(getProp(page, 'Book titles')),
    amazonLinks:  parseList(getProp(page, 'Amazon links')),
    numBooks:     getProp(page, 'Number of books'),
    tags:         getProp(page, 'Tags'),
    date:         getProp(page, 'Publication date'),
    slug:         getProp(page, 'Slug') || slugify(title),
  }
}

// ─── ALL TOGETHER (home) ─────────────────────────────────────────────────────

export async function getAll() {
  const [books, comics, corner, reading, orders] = await Promise.all([
    getBooks(), getComics(), getCorner(), getCurrentlyReading(), getOrders()
  ])
  return { books, comics, corner, reading, orders }
}
