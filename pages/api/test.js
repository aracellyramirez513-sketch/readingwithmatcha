export default async function handler(req, res) {
  const token = process.env.NOTION_TOKEN
  const dbId = process.env.NOTION_DB_BOOKS
  const newDbId = '341c8620-415e-81c8-8f42-000b5738696d'
  
  try {
    // Test with original ID
    const r1 = await fetch(`https://api.notion.com/v1/databases/${dbId}/query`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Notion-Version': '2022-06-28', 'Content-Type': 'application/json' },
      body: JSON.stringify({ page_size: 1 }),
    })
    const d1 = await r1.json()

    // Test with new duplicated ID
    const r2 = await fetch(`https://api.notion.com/v1/databases/${newDbId}/query`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Notion-Version': '2022-06-28', 'Content-Type': 'application/json' },
      body: JSON.stringify({ page_size: 1 }),
    })
    const d2 = await r2.json()

    res.json({ 
      original: { status: r1.status, code: d1.code, count: d1.results?.length },
      duplicated: { status: r2.status, code: d2.code, count: d2.results?.length },
    })
  } catch(e) {
    res.json({ error: e.message })
  }
}
