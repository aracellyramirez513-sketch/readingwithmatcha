# Reading with Matcha

English book review blog · Next.js + Notion CMS · Deploy on Vercel

## Setup

1. Clone the repository
2. Install dependencies: `npm install`
3. Copy `.env.example` as `.env.local` and fill in your Notion token
4. Run in development: `npm run dev`

## Environment Variables (in Vercel)

- `NOTION_TOKEN` — Notion integration token
- `NOTION_DB_BOOKS` — Books database ID
- `NOTION_DB_COMICS` — Comics database ID
- `NOTION_DB_CORNER` — Corner database ID
- `NOTION_DB_READING` — Currently reading database ID
- `NOTION_DB_ORDERS` — Reading orders database ID

## Routes

- `/` — Home with all content
- `/resena/[slug]` — Book review detail
- `/vineta/[slug]` — Comic detail
- `/rincon/[slug]` — Personal post detail
- `/orden/[slug]` — Reading order detail
