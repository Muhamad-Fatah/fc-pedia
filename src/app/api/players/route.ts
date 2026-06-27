import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import type { Player } from '@/lib/types'
import type { Row, InValue } from '@libsql/client'

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

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const q = searchParams.get('q')?.trim()
  const position = searchParams.get('position')
  const nationality = searchParams.get('nationality')
  const league = searchParams.get('league')
  const teamId = searchParams.get('teamId')
  const ratingMin = parseInt(searchParams.get('ratingMin') ?? '0') || 0
  const ratingMax = parseInt(searchParams.get('ratingMax') ?? '99') || 99
  const playstyleId = searchParams.get('playstyleId')
  const gender = searchParams.get('gender')
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '30') || 30, 100)
  const offset = parseInt(searchParams.get('offset') ?? '0') || 0

  const conditions: string[] = ['overall_rating BETWEEN :ratingMin AND :ratingMax']
  const args: Record<string, InValue> = { ratingMin, ratingMax, limit, offset }

  if (q) { conditions.push('(common_name LIKE :q OR first_name LIKE :q OR last_name LIKE :q)'); args.q = `%${q}%` }
  if (position) { conditions.push('position_id = :position'); args.position = position }
  if (nationality) { conditions.push('nationality_label = :nationality'); args.nationality = nationality }
  if (league) { conditions.push('league_name = :league'); args.league = league }
  if (teamId) { conditions.push('team_id = :teamId'); args.teamId = teamId }
  if (playstyleId) { conditions.push('ability_ids LIKE :playstylePattern'); args.playstylePattern = `%,${playstyleId},%` }
  if (gender) { conditions.push('gender = :gender'); args.gender = gender }

  const where = conditions.join(' AND ')
  const db = getDb()

  const [countResult, rowsResult] = await Promise.all([
    db.execute({ sql: `SELECT COUNT(*) as c FROM players WHERE ${where}`, args }),
    db.execute({ sql: `SELECT * FROM players WHERE ${where} ORDER BY overall_rating DESC LIMIT :limit OFFSET :offset`, args }),
  ])

  const total = countResult.rows[0].c as number
  return NextResponse.json({ players: rowsResult.rows.map(rowToPlayer), total })
}
