import { Suspense } from 'react'
import Link from 'next/link'
import { getDb } from '@/lib/db'
import { PlayerCard } from '@/components/PlayerCard'
import { PlayerTable } from '@/components/PlayerTable'
import { FilterChips } from '@/components/FilterChips'
import { FilterDrawer } from '@/components/FilterDrawer'
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
  const selectedPositions = getParam(sp, 'position').split(',').filter(Boolean)
  const selectedNationalities = getParam(sp, 'nationality').split(',').filter(Boolean)
  const selectedLeagues = getParam(sp, 'league').split(',').filter(Boolean)
  const ratingMin = parseInt(getParam(sp, 'ratingMin') || '0') || 0
  const ratingMax = parseInt(getParam(sp, 'ratingMax') || '99') || 99
  const selectedTeams = getParam(sp, 'teamId').split(',').filter(Boolean)
  const selectedPlaystyles = getParam(sp, 'playstyleId').split(',').filter(Boolean)
  const gender = getParam(sp, 'gender')
  const sort = getParam(sp, 'sort') || 'rank'
  const page = Math.max(1, parseInt(getParam(sp, 'page') || '1') || 1)
  const view = getParam(sp, 'view') === 'table' ? 'table' : 'grid'
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
  const [posResult, leagueResult, natResult, abilityResult, teamResult] = await Promise.all([
    db.execute(`SELECT DISTINCT position_id as id, position_label as label, position_short as short, position_type as type
                FROM players WHERE position_id != '' ORDER BY position_type, position_label`),
    db.execute(`SELECT DISTINCT league_name as name FROM players WHERE league_name != '' ORDER BY league_name`),
    db.execute(`SELECT DISTINCT nationality_label as label, nationality_image as imageUrl
                FROM players WHERE nationality_label != '' ORDER BY nationality_label`),
    db.execute(`SELECT player_abilities FROM players WHERE overall_rating >= 75 ORDER BY overall_rating DESC LIMIT 5000`),
    db.execute(`SELECT DISTINCT team_id as id, team_label as label, team_image as image, league_name as leagueName
                FROM players WHERE team_id != '' ORDER BY league_name, team_label`),
  ])

  const positions = posResult.rows as unknown as { id: string; label: string; short: string; type: string }[]
  const leagues = leagueResult.rows as unknown as { name: string }[]
  const nationalities = natResult.rows as unknown as { label: string; imageUrl: string }[]
  const teams = teamResult.rows as unknown as { id: string; label: string; image: string; leagueName: string }[]

  const abilityMap = new Map<string, { id: string; label: string; description: string; typeLabel: string; imageUrl: string }>()
  for (const row of abilityResult.rows) {
    const abilities = JSON.parse((row.player_abilities as string) || '[]') as Array<{ id: string; label: string; description: string; imageUrl: string; type: { label: string } }>
    for (const a of abilities) {
      if (!abilityMap.has(a.id)) {
        abilityMap.set(a.id, { id: a.id, label: a.label, description: a.description, typeLabel: a.type?.label ?? '', imageUrl: a.imageUrl ?? '' })
      }
    }
  }
  const abilities = Array.from(abilityMap.values()).sort((a, b) => a.label.localeCompare(b.label))

  // Build dynamic query
  const conditions: string[] = ['overall_rating BETWEEN :ratingMin AND :ratingMax']
  const filterArgs: Record<string, InValue> = { ratingMin, ratingMax }
  if (q) { conditions.push('(common_name LIKE :q OR first_name LIKE :q OR last_name LIKE :q)'); filterArgs.q = `%${q}%` }
  if (selectedPositions.length) {
    selectedPositions.forEach((v, i) => { filterArgs[`pos${i}`] = v })
    conditions.push(`position_id IN (${selectedPositions.map((_, i) => `:pos${i}`).join(',')})`)
  }
  if (selectedNationalities.length) {
    selectedNationalities.forEach((v, i) => { filterArgs[`nat${i}`] = v })
    conditions.push(`nationality_label IN (${selectedNationalities.map((_, i) => `:nat${i}`).join(',')})`)
  }
  if (selectedLeagues.length) {
    selectedLeagues.forEach((v, i) => { filterArgs[`lg${i}`] = v })
    conditions.push(`league_name IN (${selectedLeagues.map((_, i) => `:lg${i}`).join(',')})`)
  }
  if (selectedTeams.length) {
    selectedTeams.forEach((v, i) => { filterArgs[`tm${i}`] = v })
    conditions.push(`team_id IN (${selectedTeams.map((_, i) => `:tm${i}`).join(',')})`)
  }
  if (selectedPlaystyles.length) {
    const psConds = selectedPlaystyles.map((_, i) => `ability_ids LIKE :ps${i}`).join(' OR ')
    conditions.push(`(${psConds})`)
    selectedPlaystyles.forEach((id, i) => { filterArgs[`ps${i}`] = `%,${id},%` })
  }
  if (gender) { conditions.push('gender = :gender'); filterArgs.gender = gender }
  const where = conditions.join(' AND ')
  const listArgs = { ...filterArgs, limit: PAGE_SIZE, offset }

  const sortClause: Record<string, string> = {
    rank: 'rank ASC',
    overall: 'overall_rating DESC',
    pace: "CAST(JSON_EXTRACT(stats, '$.pac.value') AS INTEGER) DESC, overall_rating DESC",
    shooting: "CAST(JSON_EXTRACT(stats, '$.sho.value') AS INTEGER) DESC, overall_rating DESC",
    passing: "CAST(JSON_EXTRACT(stats, '$.pas.value') AS INTEGER) DESC, overall_rating DESC",
    dribbling: "CAST(JSON_EXTRACT(stats, '$.dri.value') AS INTEGER) DESC, overall_rating DESC",
    defending: "CAST(JSON_EXTRACT(stats, '$.def.value') AS INTEGER) DESC, overall_rating DESC",
    physicality: "CAST(JSON_EXTRACT(stats, '$.phy.value') AS INTEGER) DESC, overall_rating DESC",
  }
  const orderBy = sortClause[sort] ?? 'rank ASC'

  const [countResult, rowsResult] = await Promise.all([
    db.execute({ sql: `SELECT COUNT(*) as c FROM players WHERE ${where}`, args: filterArgs }),
    db.execute({ sql: `SELECT * FROM players WHERE ${where} ORDER BY ${orderBy} LIMIT :limit OFFSET :offset`, args: listArgs }),
  ])

  const total = countResult.rows[0].c as number
  const players = rowsResult.rows.map(rowToPlayer)
  const totalPages = Math.ceil(total / PAGE_SIZE)

  function buildFilterParams() {
    const p = new URLSearchParams()
    if (q) p.set('q', q)
    if (selectedPositions.length) p.set('position', selectedPositions.join(','))
    if (selectedNationalities.length) p.set('nationality', selectedNationalities.join(','))
    if (selectedLeagues.length) p.set('league', selectedLeagues.join(','))
    if (ratingMin) p.set('ratingMin', String(ratingMin))
    if (ratingMax !== 99) p.set('ratingMax', String(ratingMax))
    if (selectedPlaystyles.length) p.set('playstyleId', selectedPlaystyles.join(','))
    if (gender) p.set('gender', gender)
    return p
  }

  function pageUrl(p: number) {
    const urlParams = buildFilterParams()
    if (view === 'table') urlParams.set('view', 'table')
    if (p > 1) urlParams.set('page', String(p))
    const qs = urlParams.toString()
    return qs ? `/?${qs}` : '/'
  }

  function viewUrl(v: 'grid' | 'table') {
    const urlParams = buildFilterParams()
    if (v === 'table') urlParams.set('view', 'table')
    const qs = urlParams.toString()
    return qs ? `/?${qs}` : '/'
  }

  return (
    <div>
      {/* Main content — full width now that sidebar is a drawer */}
      <div className="min-w-0">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-slate-400">
            Showing <span className="text-white font-semibold">{offset + 1}–{Math.min(offset + PAGE_SIZE, total)}</span> of{' '}
            <span className="text-white font-semibold">{total.toLocaleString()}</span> players
          </p>
          <div className="flex items-center gap-2">
            <Suspense>
              <FilterDrawer filterData={{ positions, leagues, teams, nationalities, abilities }} view={view} />
            </Suspense>
            <p className="text-sm text-slate-500">Page {page} of {totalPages}</p>
            <div className="flex items-center gap-0.5 bg-slate-800 border border-slate-700 rounded-lg p-0.5">
              <Link
                href={viewUrl('grid')}
                title="Grid view"
                className={`p-1.5 rounded-md transition-colors ${view === 'grid' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
                  <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
                </svg>
              </Link>
              <Link
                href={viewUrl('table')}
                title="Table view"
                className={`p-1.5 rounded-md transition-colors ${view === 'table' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="3" y="4" width="18" height="2.5" rx="1" /><rect x="3" y="10.75" width="18" height="2.5" rx="1" />
                  <rect x="3" y="17.5" width="18" height="2.5" rx="1" />
                </svg>
              </Link>
            </div>
          </div>
        </div>

        <Suspense>
          <FilterChips filterData={{ positions, leagues, teams, nationalities, abilities }} />
        </Suspense>

        {players.length === 0 ? (
          <div className="text-center py-20 text-slate-500">
            <p className="text-lg">No players found</p>
            <p className="text-sm mt-1">Try adjusting your filters</p>
          </div>
        ) : view === 'table' ? (
          <PlayerTable players={players} />
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
