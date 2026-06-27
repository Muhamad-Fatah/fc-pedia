import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function GET() {
  const db = getDb()

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
    const abilities = JSON.parse((row.player_abilities as string) || '[]') as Array<{
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
