import { createClient } from '@libsql/client'
import type { EAPlayerRaw } from '../src/lib/types.js'
import { mapPlayer, INSERT_SQL } from './lib/player.js'

const EA_API = 'https://drop-api.ea.com/rating/ea-sports-fc'
const PAGE_SIZE = 100
const CONCURRENCY = 5

interface EAApiResponse {
  items: EAPlayerRaw[]
  totalItems: number
}

async function fetchPage(offset: number): Promise<EAApiResponse> {
  const url = `${EA_API}?locale=en&limit=${PAGE_SIZE}&offset=${offset}`
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    },
  })
  if (!res.ok) throw new Error(`HTTP ${res.status} for offset ${offset}`)
  return res.json() as Promise<EAApiResponse>
}

async function main() {
  const db = createClient({
    url: process.env.TURSO_DB_URL ?? `file:${process.cwd()}/fc-pedia.db`,
    authToken: process.env.TURSO_AUTH_TOKEN,
  })

  console.log(`Initializing database (${process.env.TURSO_DB_URL ? 'Turso remote' : 'local file'})...`)

  await db.executeMultiple(`
    CREATE TABLE IF NOT EXISTS players (
      id TEXT PRIMARY KEY, rank INTEGER, overall_rating INTEGER,
      first_name TEXT, last_name TEXT, common_name TEXT, birthdate TEXT,
      height INTEGER, weight INTEGER, skill_moves INTEGER, weak_foot INTEGER,
      preferred_foot TEXT, gender TEXT, nationality_id TEXT, nationality_label TEXT,
      nationality_image TEXT, team_id TEXT, team_label TEXT, team_image TEXT,
      league_name TEXT, position_id TEXT, position_label TEXT, position_short TEXT,
      position_type TEXT, alternate_positions TEXT, player_abilities TEXT,
      ability_ids TEXT, stats TEXT, avatar_url TEXT, shield_url TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_overall     ON players(overall_rating DESC);
    CREATE INDEX IF NOT EXISTS idx_position    ON players(position_id);
    CREATE INDEX IF NOT EXISTS idx_nationality ON players(nationality_id);
    CREATE INDEX IF NOT EXISTS idx_team        ON players(team_id);
    CREATE INDEX IF NOT EXISTS idx_league      ON players(league_name);
    CREATE INDEX IF NOT EXISTS idx_gender      ON players(gender);
  `)

  console.log('Fetching first page to get total...')
  const first = await fetchPage(0)
  const total = first.totalItems
  const pages = Math.ceil(total / PAGE_SIZE)
  console.log(`Total players: ${total}, pages: ${pages}`)

  // Insert first page
  await db.batch(first.items.map((p) => ({ sql: INSERT_SQL, args: mapPlayer(p) })), 'write')
  console.log(`Page 1/${pages} done`)

  let inserted = first.items.length

  for (let batch = 1; batch < pages; batch += CONCURRENCY) {
    const offsets = Array.from(
      { length: Math.min(CONCURRENCY, pages - batch) },
      (_, i) => (batch + i) * PAGE_SIZE
    )
    const results = await Promise.all(offsets.map((o) => fetchPage(o)))
    for (const r of results) {
      await db.batch(r.items.map((p) => ({ sql: INSERT_SQL, args: mapPlayer(p) })), 'write')
      inserted += r.items.length
    }
    const pagesDone = batch + offsets.length
    if (pagesDone % 10 === 0 || pagesDone === pages) {
      console.log(`Page ${pagesDone}/${pages} — ${inserted} players inserted`)
    }
  }

  const countResult = await db.execute('SELECT COUNT(*) as c FROM players')
  const count = countResult.rows[0].c as number
  console.log(`\nDone! ${count} players in database.`)
}

main().catch((e) => { console.error(e); process.exit(1) })
