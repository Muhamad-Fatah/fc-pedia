import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function GET() {
  const db = getDb()

  const positions = db.prepare(
    `SELECT DISTINCT position_id as id, position_label as label, position_short as short, position_type as type
     FROM players WHERE position_id != '' ORDER BY position_type, position_label`
  ).all() as { id: string; label: string; short: string; type: string }[]

  const leagues = db.prepare(
    `SELECT DISTINCT league_name as name FROM players WHERE league_name != '' ORDER BY league_name`
  ).all() as { name: string }[]

  const nationalities = db.prepare(
    `SELECT DISTINCT nationality_label as label, nationality_image as imageUrl
     FROM players WHERE nationality_label != '' ORDER BY nationality_label`
  ).all() as { label: string; imageUrl: string }[]

  // Deduplicate abilities from a sample of players (top 5000 by rating)
  const abilityRows = db.prepare(
    `SELECT player_abilities FROM players WHERE overall_rating >= 75 ORDER BY overall_rating DESC LIMIT 5000`
  ).all() as { player_abilities: string }[]

  const abilityMap = new Map<string, { id: string; label: string; description: string; typeLabel: string }>()
  for (const row of abilityRows) {
    const abilities = JSON.parse(row.player_abilities || '[]') as Array<{
      id: string; label: string; description: string; type: { label: string }
    }>
    for (const a of abilities) {
      if (!abilityMap.has(a.id)) {
        abilityMap.set(a.id, { id: a.id, label: a.label, description: a.description, typeLabel: a.type?.label ?? '' })
      }
    }
  }

  const abilities = Array.from(abilityMap.values()).sort((a, b) => a.label.localeCompare(b.label))

  return NextResponse.json({ positions, leagues, nationalities, abilities })
}
