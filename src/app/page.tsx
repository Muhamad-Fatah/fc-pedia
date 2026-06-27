import { Suspense } from 'react'
import Link from 'next/link'
import { getDb } from '@/lib/db'
import { PlayerCard } from '@/components/PlayerCard'
import { PlayerFilters } from '@/components/PlayerFilters'
import type { Player } from '@/lib/types'
import type { Row, InValue } from '@libsql/client'

const PAGE_SIZE = 48

function rowToPlayer(row: Row): Player {
  return {
    id: row.id as string,
    rank: row.rank as number,
    overallRating: row.overall_rating as number,
    firstName: row.first_name as string,
    lastName: row.last_name as string,
    commonName: row.common_name as string,
    birthdate: row.birthdate as string,
    height: row.height as number,
    weight: row.weight as number,
    skillMoves: row.skill_moves as number,
    weakFootAbility: row.weak_foot as number,
    preferredFoot: row.preferred_foot as string,
    gender: row.gender as string,
    nationalityId: row.nationality_id as string,
    nationalityLabel: row.nationality_label as string,
    nationalityImage: row.nationality_image as string,
    teamId: row.team_id as string,
    teamLabel: row.team_label as string,
    teamImage: row.team_image as string,
    leagueName: row.league_name as string,
    positionId: row.position_id as string,
    positionLabel: row.position_label as string,
    positionShort: row.position_short as string,
    positionType: row.position_type as string,
    alternatePositions: JSON.parse((row.alternate_positions as string) || '[]'),
    playerAbilities: JSON.parse((row.player_abilities as string) || '[]'),
    stats: JSON.parse((row.stats as string) || '{}'),
    avatarUrl: row.avatar_url as string,
    shieldUrl: row.shield_url as string,
  }
}

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

function getParam(params: Record<string, string | string[] | undefined>, key: string): string {
  const v = params[key]
  return Array.isArray(v) ? (v[0] ?? '') : (v ?? '')
}

export default async function HomePage({ searchParams }: PageProps) {
  const sp = await searchParams
  const q = getParam(sp, 'q')
  const position = getParam(sp, 'position')
  const nationality = getParam(sp, 'nationality')
  const league = getParam(sp, 'league')
  const ratingMin = parseInt(getParam(sp, 'ratingMin') || '0') || 0
  const ratingMax = parseInt(getParam(sp, 'ratingMax') || '99') || 99
  const playstyleId = getParam(sp, 'playstyleId')
  const gender = getParam(sp, 'gender')
  const page = Math.max(1, parseInt(getParam(sp, 'page') || '1') || 1)
  const offset = (page - 1) * PAGE_SIZE

  const db = getDb()

  // Check if table exists and has data
  let dbReady = false
  try {
    const result = await db.execute('SELECT COUNT(*) as c FROM players')
    dbReady = (result.rows[0].c as number) > 0
  } catch { dbReady = false }

  if (!dbReady) {
    return (
      <div className="text-center py-24 text-slate-400">
        <p className="text-2xl font-bold text-white mb-3">No data yet</p>
        <p className="text-slate-400 mb-6">Run the ingestion script to fetch all 17,000+ players from EA Sports FC.</p>
        <code className="bg-slate-800 border border-slate-700 px-4 py-2 rounded-lg text-emerald-400 font-mono">
          npm run ingest
        </code>
      </div>
    )
  }

  // Load filter options (in parallel)
  const [posResult, leagueResult, natResult, abilityResult] = await Promise.all([
    db.execute(`SELECT DISTINCT position_id as id, position_label as label, position_short as short, position_type as type
                FROM players WHERE position_id != '' ORDER BY position_type, position_label`),
    db.execute(`SELECT DISTINCT league_name as name FROM players WHERE league_name != '' ORDER BY league_name`),
    db.execute(`SELECT DISTINCT nationality_label as label, nationality_image as imageUrl
                FROM players WHERE nationality_label != '' ORDER BY nationality_label`),
    db.execute(`SELECT player_abilities FROM players WHERE overall_rating >= 75 ORDER BY overall_rating DESC LIMIT 5000`),
  ])

  const positions = posResult.rows as unknown as { id: string; label: string; short: string; type: string }[]
  const leagues = leagueResult.rows as unknown as { name: string }[]
  const nationalities = natResult.rows as unknown as { label: string; imageUrl: string }[]

  const abilityMap = new Map<string, { id: string; label: string; description: string; typeLabel: string }>()
  for (const row of abilityResult.rows) {
    const abilities = JSON.parse((row.player_abilities as string) || '[]') as Array<{ id: string; label: string; description: string; type: { label: string } }>
    for (const a of abilities) {
      if (!abilityMap.has(a.id)) {
        abilityMap.set(a.id, { id: a.id, label: a.label, description: a.description, typeLabel: a.type?.label ?? '' })
      }
    }
  }
  const abilities = Array.from(abilityMap.values()).sort((a, b) => a.label.localeCompare(b.label))

  // Build dynamic query
  const conditions: string[] = ['overall_rating BETWEEN :ratingMin AND :ratingMax']
  const args: Record<string, InValue> = { ratingMin, ratingMax, limit: PAGE_SIZE, offset }
  if (q) { conditions.push('(common_name LIKE :q OR first_name LIKE :q OR last_name LIKE :q)'); args.q = `%${q}%` }
  if (position) { conditions.push('position_id = :position'); args.position = position }
  if (nationality) { conditions.push('nationality_label = :nationality'); args.nationality = nationality }
  if (league) { conditions.push('league_name = :league'); args.league = league }
  if (playstyleId) { conditions.push('ability_ids LIKE :playstylePattern'); args.playstylePattern = `%,${playstyleId},%` }
  if (gender) { conditions.push('gender = :gender'); args.gender = gender }
  const where = conditions.join(' AND ')

  const [countResult, rowsResult] = await Promise.all([
    db.execute({ sql: `SELECT COUNT(*) as c FROM players WHERE ${where}`, args }),
    db.execute({ sql: `SELECT * FROM players WHERE ${where} ORDER BY overall_rating DESC LIMIT :limit OFFSET :offset`, args }),
  ])

  const total = countResult.rows[0].c as number
  const players = rowsResult.rows.map(rowToPlayer)
  const totalPages = Math.ceil(total / PAGE_SIZE)

  function pageUrl(p: number) {
    const urlParams = new URLSearchParams()
    if (q) urlParams.set('q', q)
    if (position) urlParams.set('position', position)
    if (nationality) urlParams.set('nationality', nationality)
    if (league) urlParams.set('league', league)
    if (ratingMin) urlParams.set('ratingMin', String(ratingMin))
    if (ratingMax !== 99) urlParams.set('ratingMax', String(ratingMax))
    if (playstyleId) urlParams.set('playstyleId', playstyleId)
    if (gender) urlParams.set('gender', gender)
    if (p > 1) urlParams.set('page', String(p))
    const qs = urlParams.toString()
    return qs ? `/?${qs}` : '/'
  }

  return (
    <div className="flex gap-6">
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0">
        <div className="sticky top-20 bg-slate-800/50 border border-slate-700 rounded-xl p-4">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Filters</h2>
          <Suspense>
            <PlayerFilters filterData={{ positions, leagues, nationalities, abilities }} />
          </Suspense>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-slate-400">
            Showing <span className="text-white font-semibold">{offset + 1}–{Math.min(offset + PAGE_SIZE, total)}</span> of{' '}
            <span className="text-white font-semibold">{total.toLocaleString()}</span> players
          </p>
          <p className="text-sm text-slate-500">Page {page} of {totalPages}</p>
        </div>

        {players.length === 0 ? (
          <div className="text-center py-20 text-slate-500">
            <p className="text-lg">No players found</p>
            <p className="text-sm mt-1">Try adjusting your filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {players.map((player) => (
              <PlayerCard key={player.id} player={player} />
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            {page > 1 && (
              <Link href={pageUrl(page - 1)} className="px-4 py-2 text-sm bg-slate-800 border border-slate-700 rounded-lg hover:border-slate-500 transition-colors">
                ← Prev
              </Link>
            )}
            {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
              let p: number
              if (totalPages <= 7) p = i + 1
              else if (page <= 4) p = i + 1
              else if (page >= totalPages - 3) p = totalPages - 6 + i
              else p = page - 3 + i
              return (
                <Link
                  key={p}
                  href={pageUrl(p)}
                  className={`w-9 h-9 flex items-center justify-center text-sm rounded-lg border transition-colors ${
                    p === page
                      ? 'bg-emerald-600 border-emerald-500 text-white font-bold'
                      : 'bg-slate-800 border-slate-700 hover:border-slate-500 text-slate-300'
                  }`}
                >
                  {p}
                </Link>
              )
            })}
            {page < totalPages && (
              <Link href={pageUrl(page + 1)} className="px-4 py-2 text-sm bg-slate-800 border border-slate-700 rounded-lg hover:border-slate-500 transition-colors">
                Next →
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
