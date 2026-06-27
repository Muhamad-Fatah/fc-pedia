import { createClient } from '@libsql/client'
import type { EAPlayerRaw } from '../src/lib/types.js'
import { mapPlayer, INSERT_SQL } from './lib/player.js'

const EA_API = 'https://drop-api.ea.com/rating/ea-sports-fc'
const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
}

function parseId(input: string): string {
  // Accept full EA URL (last path segment) or a bare ID
  const match = input.match(/(\d+)\/?$/)
  if (match) return match[1]
  throw new Error(`Cannot parse player ID from: ${input}`)
}

async function fetchPlayerById(id: string): Promise<EAPlayerRaw | null> {
  // Try the filter param first — supported by some EA API versions
  const filterUrl = `${EA_API}?locale=en&limit=25&offset=0&filter[ids][]=${id}`
  const filterRes = await fetch(filterUrl, { headers: HEADERS })
  if (filterRes.ok) {
    const data = await filterRes.json() as { items: EAPlayerRaw[] }
    const found = data.items?.find((p) => String(p.id) === id)
    if (found) return found
  }

  // Fallback: page through the full list
  console.log('Falling back to full page scan...')
  let offset = 0
  while (true) {
    const url = `${EA_API}?locale=en&limit=100&offset=${offset}`
    const res = await fetch(url, { headers: HEADERS })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json() as { items: EAPlayerRaw[]; totalItems: number }
    const found = data.items?.find((p) => String(p.id) === id)
    if (found) return found
    offset += 100
    if (offset >= data.totalItems || !data.items?.length) break
    if (offset % 1000 === 0) console.log(`  Scanned ${offset}/${data.totalItems}...`)
  }
  return null
}

async function main() {
  const input = process.argv[2]
  if (!input) {
    console.error('Usage: npx tsx scripts/fetch-player.ts <player-id-or-ea-url>')
    console.error('  e.g. npx tsx scripts/fetch-player.ts 209331')
    console.error('  e.g. npx tsx scripts/fetch-player.ts https://www.ea.com/games/ea-sports-fc/ratings/player-ratings/mohamed-salah/209331')
    process.exit(1)
  }

  const id = parseId(input)
  console.log(`Fetching player ID: ${id}...`)

  const player = await fetchPlayerById(id)
  if (!player) {
    console.error(`Player ${id} not found in EA API`)
    process.exit(1)
  }

  const name = player.commonName || `${player.firstName} ${player.lastName}`
  console.log(`\nFound: ${name} (${player.overallRating} OVR — ${player.position?.shortLabel})`)
  console.log(`Team:  ${player.team?.label} / ${player.leagueName}`)

  const abilities = player.playerAbilities ?? []
  if (abilities.length) {
    console.log(`\nPlayStyles (${abilities.length}):`)
    for (const a of abilities) {
      console.log(`  [${a.type?.label ?? 'unknown'}] ${a.label}`)
      console.log(`    imageUrl: ${a.imageUrl || '(none)'}`)
    }
  } else {
    console.log('\nNo PlayStyles found for this player.')
  }

  const db = createClient({
    url: process.env.TURSO_DB_URL ?? `file:${process.cwd()}/fc-pedia.db`,
    authToken: process.env.TURSO_AUTH_TOKEN,
  })

  await db.execute({ sql: INSERT_SQL, args: mapPlayer(player) as Record<string, string | number> })
  console.log(`\nPlayer upserted to DB.`)
}

main().catch((e) => { console.error(e); process.exit(1) })
