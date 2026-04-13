export default async function handler(req, res) {
  const token = process.env.NOTION_TOKEN
  const dbId = process.env.NOTION_DB_BOOKS
  
  try {
    const response = await fetch(`https://api.notion.com/v1/databases/${dbId}/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ page_size: 1 }),
    })
    const data = await response.json()
    res.json({ 
      status: response.status,
      tokenPrefix: token?.slice(0, 25),
      dbId,
      result: data.object === 'error' ? { code: data.code, message: data.message } : { count: data.results?.length }
    })
  } catch(e) {
    res.json({ error: e.message })
  }
}
