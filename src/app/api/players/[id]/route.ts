import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import type { Player } from '@/lib/types'

function rowToPlayer(row: Record<string, unknown>): Player {
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

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const db = getDb()
  const row = db.prepare('SELECT * FROM players WHERE id = ?').get(id) as Record<string, unknown> | undefined
  if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(rowToPlayer(row))
}
