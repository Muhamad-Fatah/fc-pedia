import Database from 'better-sqlite3'
import path from 'path'
import { fileURLToPath } from 'url'
import type { EAPlayerRaw } from '../src/lib/types.js'

const DB_PATH = path.join(process.cwd(), 'fc-pedia.db')
const EA_API = 'https://drop-api.ea.com/rating/ea-sports-fc'
const PAGE_SIZE = 100
const CONCURRENCY = 5 // parallel requests

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

function mapPlayer(raw: EAPlayerRaw) {
  const abilities = raw.playerAbilities ?? []
  const abilityIds = abilities.map((a) => a.id).join(',')
  return {
    id: raw.id,
    rank: raw.rank,
    overall_rating: raw.overallRating,
    first_name: raw.firstName ?? '',
    last_name: raw.lastName ?? '',
    common_name: raw.commonName ?? '',
    birthdate: raw.birthdate ?? '',
    height: raw.height ?? 0,
    weight: raw.weight ?? 0,
    skill_moves: raw.skillMoves ?? 0,
    weak_foot: raw.weakFootAbility ?? 0,
    preferred_foot: raw.preferredFoot ?? '',
    gender: raw.gender?.label ?? 'Male',
    nationality_id: raw.nationality?.id ?? '',
    nationality_label: raw.nationality?.label ?? '',
    nationality_image: raw.nationality?.imageUrl ?? '',
    team_id: raw.team?.id ?? '',
    team_label: raw.team?.label ?? '',
    team_image: raw.team?.imageUrl ?? '',
    league_name: raw.leagueName ?? '',
    position_id: raw.position?.id ?? '',
    position_label: raw.position?.label ?? '',
    position_short: raw.position?.shortLabel ?? '',
    position_type: raw.position?.positionType?.name ?? '',
    alternate_positions: JSON.stringify(raw.alternatePositions ?? []),
    player_abilities: JSON.stringify(abilities),
    ability_ids: abilityIds ? `,${abilityIds},` : '',
    stats: JSON.stringify(raw.stats ?? {}),
    avatar_url: raw.avatarUrl ?? '',
    shield_url: raw.shieldUrl ?? '',
  }
}

async function main() {
  console.log('Initializing database...')
  const db = new Database(DB_PATH)
  db.pragma('journal_mode = WAL')
  db.exec(`
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

  const insert = db.prepare(`
    INSERT OR REPLACE INTO players VALUES (
      :id, :rank, :overall_rating, :first_name, :last_name, :common_name, :birthdate,
      :height, :weight, :skill_moves, :weak_foot, :preferred_foot, :gender,
      :nationality_id, :nationality_label, :nationality_image, :team_id, :team_label,
      :team_image, :league_name, :position_id, :position_label, :position_short,
      :position_type, :alternate_positions, :player_abilities, :ability_ids, :stats,
      :avatar_url, :shield_url
    )
  `)
  const insertMany = db.transaction((players: ReturnType<typeof mapPlayer>[]) => {
    for (const p of players) insert.run(p)
  })

  console.log('Fetching first page to get total...')
  const first = await fetchPage(0)
  const total = first.totalItems
  const pages = Math.ceil(total / PAGE_SIZE)
  console.log(`Total players: ${total}, pages: ${pages}`)

  insertMany(first.items.map(mapPlayer))
  console.log(`Page 1/${pages} done`)

  let inserted = first.items.length

  // Fetch remaining pages with concurrency
  for (let batch = 1; batch < pages; batch += CONCURRENCY) {
    const offsets = Array.from(
      { length: Math.min(CONCURRENCY, pages - batch) },
      (_, i) => (batch + i) * PAGE_SIZE
    )
    const results = await Promise.all(offsets.map((o) => fetchPage(o)))
    for (const r of results) {
      insertMany(r.items.map(mapPlayer))
      inserted += r.items.length
    }
    const pagesDone = batch + offsets.length
    if (pagesDone % 10 === 0 || pagesDone === pages) {
      console.log(`Page ${pagesDone}/${pages} — ${inserted} players inserted`)
    }
  }

  const count = (db.prepare('SELECT COUNT(*) as c FROM players').get() as { c: number }).c
  console.log(`\nDone! ${count} players in database.`)
  db.close()
}

main().catch((e) => { console.error(e); process.exit(1) })
